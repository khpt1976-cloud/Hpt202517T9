// Simple template content API
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// GET: Retrieve template content
export async function GET(request: NextRequest) {
  try {
    // Extract and validate parameters
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('templateId')
    const format = searchParams.get('format') || 'html'
    
    // Validate required parameters
    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Security validation
    if (!/^[a-zA-Z0-9_-]+$/.test(templateId)) {
      return NextResponse.json(
        { error: 'Invalid template ID format' },
        { status: 400 }
      )
    }

    // Load template from file system
    const templatePath = path.join(process.cwd(), 'templates', `${templateId}.${format}`)
    
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Check file size
    const stats = fs.statSync(templatePath)
    if (stats.size > 50 * 1024 * 1024) { // 50MB limit
      return NextResponse.json(
        { error: 'Template file too large' },
        { status: 413 }
      )
    }

    // Read template content
    const content = fs.readFileSync(templatePath, 'utf-8')
    
    // Prepare metadata
    const metadata = {
      templateId,
      format,
      size: stats.size,
      lastModified: stats.mtime,
      encoding: 'utf-8'
    }

    return NextResponse.json({
      success: true,
      content,
      metadata,
      cached: false
    })

  } catch (error) {
    console.error('Template content API error:', error)

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}