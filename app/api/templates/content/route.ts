import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'
import mammoth from 'mammoth'

// GET /api/templates/content?templateId=xxx[&pageNumber=1] - Get template content as HTML (optionally per-page)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('templateId')
    const pageNumberParam = searchParams.get('pageNumber')
    const pageNumber = pageNumberParam ? parseInt(pageNumberParam, 10) : undefined

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'templateId parameter is required' },
        { status: 400 }
      )
    }

    // Get template from database
    const template = await prisma.templateFile.findUnique({
      where: { id: templateId }
    })

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      )
    }


    // If default template missing file, try fallback to latest available of same type

    // Check if template file exists
    const templatePath = path.join(process.cwd(), 'public', template.fileUrl)
    console.log('Looking for template at:', templatePath)

    if (!fs.existsSync(templatePath)) {
      console.error('Template file not found at:', templatePath)
      
      // Try alternative paths
      const altPath1 = path.join(process.cwd(), 'templates', path.basename(template.fileUrl))
      const altPath2 = path.join(process.cwd(), 'public/templates', path.basename(template.fileUrl))
      
      console.log('Trying alternative paths:', { altPath1, altPath2 })
      
      if (fs.existsSync(altPath1)) {
        console.log('Found template at alternative path 1:', altPath1)
        return await processTemplateFile(altPath1, template, pageNumber)
      } else if (fs.existsSync(altPath2)) {
        console.log('Found template at alternative path 2:', altPath2)
        return await processTemplateFile(altPath2, template, pageNumber)
      }

      // Fallback: find latest template of same type that actually exists on disk
      try {
        const sameType = await prisma.templateFile.findMany({
          where: { fileType: (template as any).fileType },
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
          take: 5
        })
        for (const cand of sameType) {
          const candPath1 = path.join(process.cwd(), 'templates', path.basename(cand.fileUrl))
          const candPath2 = path.join(process.cwd(), 'public', cand.fileUrl)
          if (fs.existsSync(candPath1)) {
            console.warn('Fallback to existing template:', cand.name)
            return await processTemplateFile(candPath1, cand)
          }
          if (fs.existsSync(candPath2)) {
            console.warn('Fallback to existing template:', cand.name)
            return await processTemplateFile(candPath2, cand)
          }
        }
      } catch (e) {
        console.warn('Fallback search failed:', e)
      }
      
      // If it's an HTML file, try to read it directly
      if (template.fileUrl.endsWith('.html')) {
        try {
          const htmlContent = fs.readFileSync(templatePath, 'utf8')
          return NextResponse.json({
            success: true,
            data: {
              templateId,
              name: template.name,
              content: htmlContent,
              contentType: 'html',
              pageCount: template.pageCount
            }
          })
        } catch (htmlError) {
          console.error('Error reading HTML template:', htmlError)
        }
      }
      
      // Try to find a fallback template of the same type
      console.log('Attempting to find fallback template...')
      const fallbackTemplate = await prisma.templateFile.findFirst({
        where: { 
          fileType: template.fileType,
          id: { not: templateId } // Exclude current template
        },
        orderBy: { createdAt: 'desc' }
      })

      if (fallbackTemplate) {
        console.log('Found fallback template:', fallbackTemplate.name)
        
        // Check if fallback template file exists
        const fallbackPaths = [
          path.join(process.cwd(), 'public', fallbackTemplate.fileUrl),
          path.join(process.cwd(), 'templates', path.basename(fallbackTemplate.fileUrl)),
          path.join(process.cwd(), 'public/templates', path.basename(fallbackTemplate.fileUrl))
        ]

        for (const fallbackPath of fallbackPaths) {
          if (fs.existsSync(fallbackPath)) {
            console.log('Using fallback template at:', fallbackPath)
            const result = await processTemplateFile(fallbackPath, fallbackTemplate)
            
            // Add warning to response
            if (result instanceof NextResponse) {
              const data = await result.json()
              if (data.success) {
                data.warning = `Template mặc định "${template.name}" không tìm thấy file, đã sử dụng template "${fallbackTemplate.name}" thay thế`
                data.fallbackUsed = true
                data.originalTemplateId = templateId
                return NextResponse.json(data)
              }
            }
            return result
          }
        }
      }

      return NextResponse.json(
        { 
          success: false, 
          error: 'Template file not found on disk',
          details: {
            expectedPath: templatePath,
            fileUrl: template.fileUrl,
            templateName: template.name,
            fallbackAttempted: !!fallbackTemplate
          }
        },
        { status: 404 }
      )
    }

    return await processTemplateFile(templatePath, template, pageNumber)

  } catch (error) {
    console.error('Error loading template content:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load template content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

import { splitDocxIntoPagesHtml } from '@/lib/docx-page-split'
import { processDocxWithTables } from '@/lib/docx-table-processor'

async function processTemplateFile(filePath: string, template: any, pageNumber?: number) {
  try {
    const fileExtension = path.extname(filePath).toLowerCase()
    
    if (fileExtension === '.html') {
      // Read HTML file directly
      const htmlContent = fs.readFileSync(filePath, 'utf8')
      return NextResponse.json({
        success: true,
        data: {
          templateId: template.id,
          name: template.name,
          content: htmlContent,
          contentType: 'html',
          pageCount: template.pageCount
        }
      })
    } else if (fileExtension === '.docx') {
      const bytes = fs.readFileSync(filePath)
      // If pageNumber specified, split DOCX roughly by page breaks, else full content
      if (pageNumber && Number.isFinite(pageNumber) && pageNumber > 0) {
        try {
          const pages = await splitDocxIntoPagesHtml(bytes)
          const total = Math.max(1, pages.length)
          const idx = Math.min(total, Math.max(1, pageNumber)) - 1

          return NextResponse.json({
            success: true,
            data: {
              templateId: template.id,
              name: template.name,
              content: pages[idx] ?? '',
              contentType: 'html',
              pageCount: template.pageCount,
              currentPage: idx + 1,
              totalPagesInSplit: total
            }
          })
        } catch (splitErr) {
          console.warn('Split DOCX into pages failed, fallback to mammoth full HTML:', splitErr)
        }
      }

      // FIXED: Use enhanced table processing for better DOCX conversion
      try {
        const bytes = fs.readFileSync(filePath)
        const { content: enhancedContent, tables } = await processDocxWithTables(bytes)
        
        if (enhancedContent && tables.length > 0) {
          return NextResponse.json({
            success: true,
            data: {
              templateId: template.id,
              name: template.name,
              content: enhancedContent,
              contentType: 'html',
              pageCount: template.pageCount,
              tablesFound: tables.length,
              enhancedProcessing: true
            }
          })
        }
      } catch (enhancedError) {
        console.warn('Enhanced table processing failed, falling back to mammoth:', enhancedError)
      }

      // Fallback to mammoth for standard conversion
      const result = await mammoth.convertToHtml({ path: filePath })
      return NextResponse.json({
        success: true,
        data: {
          templateId: template.id,
          name: template.name,
          content: result.value,
          contentType: 'html',
          pageCount: template.pageCount,
          warnings: result.messages,
          enhancedProcessing: false
        }
      })
    } else {
      // Unsupported file type
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unsupported file type',
          details: `File extension ${fileExtension} is not supported`
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error processing template file:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process template file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}