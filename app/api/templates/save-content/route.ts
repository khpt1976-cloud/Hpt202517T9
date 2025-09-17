import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

// POST /api/templates/save-content - Save edited content with format preservation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { templateId, pageNumber, content, reportId } = body

    if (!templateId || !content) {
      return NextResponse.json(
        { success: false, error: 'templateId and content are required' },
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

    // Save edited content to database or file system
    // For now, we'll save to a JSON file for persistence
    const editedContentDir = path.join(process.cwd(), 'edited-content')
    if (!fs.existsSync(editedContentDir)) {
      fs.mkdirSync(editedContentDir, { recursive: true })
    }

    const contentFileName = `${reportId || 'default'}_${templateId}_${pageNumber || 'all'}.json`
    const contentFilePath = path.join(editedContentDir, contentFileName)

    const saveData = {
      templateId,
      reportId,
      pageNumber,
      content,
      originalTemplate: template.name,
      timestamp: new Date().toISOString(),
      metadata: {
        contentType: 'html',
        editedBy: 'user', // In real app, get from auth
        version: 1
      }
    }

    fs.writeFileSync(contentFilePath, JSON.stringify(saveData, null, 2))

    // Also save to database if you have a table for edited content
    // This is optional - you could create a new table for this
    try {
      // Example: Save to a hypothetical EditedContent table
      // await prisma.editedContent.upsert({
      //   where: {
      //     templateId_reportId_pageNumber: {
      //       templateId,
      //       reportId: reportId || 'default',
      //       pageNumber: pageNumber || 0
      //     }
      //   },
      //   update: {
      //     content,
      //     updatedAt: new Date()
      //   },
      //   create: {
      //     templateId,
      //     reportId: reportId || 'default',
      //     pageNumber: pageNumber || 0,
      //     content,
      //     createdAt: new Date(),
      //     updatedAt: new Date()
      //   }
      // })
    } catch (dbError) {
      console.warn('Database save failed, but file save succeeded:', dbError)
    }

    return NextResponse.json({
      success: true,
      data: {
        templateId,
        reportId,
        pageNumber,
        savedAt: saveData.timestamp,
        filePath: contentFileName
      }
    })

  } catch (error) {
    console.error('Error saving template content:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save template content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET /api/templates/save-content?templateId=xxx&reportId=xxx&pageNumber=1 - Get saved edited content
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('templateId')
    const reportId = searchParams.get('reportId') || 'default'
    const pageNumber = searchParams.get('pageNumber') || 'all'

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'templateId parameter is required' },
        { status: 400 }
      )
    }

    const editedContentDir = path.join(process.cwd(), 'edited-content')
    const contentFileName = `${reportId}_${templateId}_${pageNumber}.json`
    const contentFilePath = path.join(editedContentDir, contentFileName)

    if (!fs.existsSync(contentFilePath)) {
      return NextResponse.json(
        { success: false, error: 'No edited content found' },
        { status: 404 }
      )
    }

    const savedData = JSON.parse(fs.readFileSync(contentFilePath, 'utf8'))

    return NextResponse.json({
      success: true,
      data: savedData
    })

  } catch (error) {
    console.error('Error loading saved content:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load saved content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}