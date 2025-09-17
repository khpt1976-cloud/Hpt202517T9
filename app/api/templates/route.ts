import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { onlyOfficeService } from '@/lib/onlyoffice'
import mammoth from 'mammoth'
import { getDocxPageCountFromAppXml } from '@/lib/docx-utils'
import path from 'path'
import fs from 'fs'

// GET /api/templates - List all template files
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileType = searchParams.get('file_type') as 'INITIAL' | 'DAILY' | null

    const where: any = {}
    if (fileType) {
      where.fileType = fileType
    }

    const templates = await prisma.templateFile.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: templates
    })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

// POST /api/templates - Upload new template file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string
    const fileType = formData.get('file_type') as 'INITIAL' | 'DAILY'
    const isDefault = formData.get('is_default') === 'true'

    if (!file || !name || !fileType) {
      return NextResponse.json(
        { success: false, error: 'File, name, and file_type are required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.name.endsWith('.docx')) {
      return NextResponse.json(
        { success: false, error: 'Only .docx files are allowed' },
        { status: 400 }
      )
    }

    // Create templates directory if it doesn't exist
    const templatesDir = path.join(process.cwd(), 'templates')
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileName = `${fileType.toLowerCase()}_${timestamp}_${file.name}`
    const filePath = path.join(templatesDir, fileName)

    // Save file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    fs.writeFileSync(filePath, buffer)

    // Determine document page count
    let pageCount = 1
    try {
      // Preferred: read Pages from docProps/app.xml inside DOCX
      const pagesFromAppXml = await getDocxPageCountFromAppXml(buffer)
      if (pagesFromAppXml && pagesFromAppXml > 0) {
        pageCount = pagesFromAppXml
      } else {
        // Fallback 1: mammoth-based estimation
        const result = await mammoth.extractRawText({ path: filePath })

        const pageBreaks = (result.value.match(/\x0C/g) || []).length
        if (pageBreaks > 0) {
          pageCount = pageBreaks + 1
        } else {
          const paragraphs = result.value.split('\n').filter(p => p.trim().length > 0)
          const charCount = result.value.length

          const estimatedFromParagraphs = Math.max(1, Math.ceil(paragraphs.length / 25))
          const estimatedFromChars = Math.max(1, Math.ceil(charCount / 2500))
          const fileSizePages = Math.max(1, Math.ceil(buffer.length / 50000))

          pageCount = Math.round(
            estimatedFromParagraphs * 0.4 +
            estimatedFromChars * 0.4 +
            fileSizePages * 0.2
          )
        }
      }

      pageCount = Math.max(1, pageCount)
      console.log(`Template page count for ${file.name}: ${pageCount} pages`)

    } catch (error) {
      console.warn('Could not get document page count with app.xml/mammoth:', error)

      // Fallback 2: ONLYOFFICE if available
      try {
        const docInfo = await onlyOfficeService.getDocumentInfo(filePath)
        pageCount = docInfo.pageCount || 1
      } catch (onlyOfficeError) {
        console.warn('ONLYOFFICE also failed, using file size estimation:', onlyOfficeError)
        // Final fallback: estimate from file size
        pageCount = Math.max(1, Math.ceil(buffer.length / 50000))
      }
    }

    // If this is set as default, unset other defaults of the same type
    if (isDefault) {
      await prisma.templateFile.updateMany({
        where: { 
          fileType: fileType,
          isDefault: true 
        },
        data: { isDefault: false }
      })
    }

    // Save to database
    const template = await prisma.templateFile.create({
      data: {
        name,
        fileUrl: `/templates/${fileName}`,
        fileType,
        pageCount,
        fileSize: buffer.length,
        isDefault,
        // uploadedBy: 'current_user_id', // Will be set from auth context later
      }
    })

    return NextResponse.json({
      success: true,
      data: template,
      message: 'Template uploaded successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Template upload error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to upload template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/templates - Delete template file
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Find template in database
    const template = await prisma.templateFile.findUnique({
      where: { id: templateId }
    })

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      )
    }

    // Delete physical file
    const filePath = path.join(process.cwd(), template.fileUrl.replace('/', ''))
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log(`🗑️ Deleted file: ${filePath}`)
    }

    // Delete from database
    await prisma.templateFile.delete({
      where: { id: templateId }
    })

    console.log(`✅ Template deleted successfully: ${template.name}`)

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    })

  } catch (error) {
    console.error('Template deletion error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}