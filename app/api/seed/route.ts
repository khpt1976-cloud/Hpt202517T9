import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    // Check if sample template file exists
    const templatePath = path.join(process.cwd(), 'templates', 'sample-construction-report.html')
    
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { success: false, error: 'Sample template file not found' },
        { status: 404 }
      )
    }

    // Get file stats
    const stats = fs.statSync(templatePath)

    // Check if template already exists in database
    const existingTemplate = await prisma.templateFile.findFirst({
      where: { name: 'Sample Construction Report' }
    })

    if (existingTemplate) {
      return NextResponse.json({
        success: true,
        message: 'Sample template already exists',
        data: existingTemplate
      })
    }

    // Create sample template in database
    const template = await prisma.templateFile.create({
      data: {
        name: 'Sample Construction Report',
        fileUrl: '/templates/sample-construction-report.html',
        fileType: 'INITIAL',
        pageCount: 4, // Based on our sample template
        fileSize: stats.size,
        isDefault: true,
        uploadedBy: 'system'
      }
    })

    // Create a sample project
    const existingProject = await prisma.project.findFirst({
      where: { name: 'Sample Construction Project' }
    })

    let project = existingProject
    if (!existingProject) {
      project = await prisma.project.create({
        data: {
          name: 'Sample Construction Project',
          description: 'A sample construction project for demonstration',
          location: 'Ho Chi Minh City, Vietnam',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2026-12-31'),
          budget: 250000000000, // 250 billion VND
          status: 'ACTIVE'
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Sample data created successfully',
      data: {
        template,
        project
      }
    })

  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to seed data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}