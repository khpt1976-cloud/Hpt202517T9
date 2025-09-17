import { NextRequest, NextResponse } from 'next/server'
import { documentBuilder, ReportGenerationConfig } from '@/lib/document-builder'
import { onlyOfficeService } from '@/lib/onlyoffice'
import { prisma } from '@/lib/prisma'

// POST /api/documents/generate - Generate construction report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.report_id) {
      return NextResponse.json(
        { success: false, error: 'Report ID is required' },
        { status: 400 }
      )
    }

    // Get report data from database
    const report = await prisma.report.findUnique({
      where: { id: body.report_id },
      include: {
        category: {
          include: {
            construction: {
              include: {
                project: true
              }
            }
          }
        },
        images: {
          orderBy: { positionIndex: 'asc' }
        }
      }
    })

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      )
    }

    // Check ONLYOFFICE server availability
    const isOnlyOfficeAvailable = await onlyOfficeService.healthCheck()
    if (!isOnlyOfficeAvailable) {
      return NextResponse.json(
        { success: false, error: 'ONLYOFFICE Document Server is not available' },
        { status: 503 }
      )
    }

    // Prepare generation config
    const config: ReportGenerationConfig = {
      reportName: report.name,
      reportDate: report.reportDate.toISOString().split('T')[0],
      weather: report.weather || undefined,
      temperature: report.temperature || undefined,
      templateConfig: (report.templateConfig as any) || {
        initial_template_id: undefined,
        daily_template_id: undefined,
        total_daily_copies: 1,
      },
      imageConfig: (report.imageConfig as any) || {
        template_page: 4,
        images_per_page: 6,
        total_images: report.images.length,
        layout: {
          rows: 3,
          cols: 2,
          cellWidth: 200,
          cellHeight: 150,
          spacing: 10
        }
      },
      images: report.images.map(img => ({
        url: img.imageUrl,
        description: img.description || undefined,
        originalFilename: img.originalFilename || undefined,
        positionIndex: img.positionIndex || undefined
      }))
    }

    // Compute total pages from templates and images
    let initialPages = 1
    let dailyPages = 1

    try {
      const tc: any = config.templateConfig || {}
      let initialTemplate = null as any
      let dailyTemplate = null as any

      if (tc.initial_template_id) {
        initialTemplate = await prisma.templateFile.findUnique({ where: { id: tc.initial_template_id } })
      } else {
        initialTemplate = await prisma.templateFile.findFirst({ where: { fileType: 'INITIAL', isDefault: true } })
          || await prisma.templateFile.findFirst({ where: { fileType: 'INITIAL' }, orderBy: { createdAt: 'desc' } })
      }
      if (tc.daily_template_id) {
        dailyTemplate = await prisma.templateFile.findUnique({ where: { id: tc.daily_template_id } })
      } else {
        dailyTemplate = await prisma.templateFile.findFirst({ where: { fileType: 'DAILY', isDefault: true } })
          || await prisma.templateFile.findFirst({ where: { fileType: 'DAILY' }, orderBy: { createdAt: 'desc' } })
      }
      initialPages = initialTemplate?.pageCount || 1
      dailyPages = dailyTemplate?.pageCount || 1
      // Ensure builder can resolve actual files
      config.templateConfig = {
        ...(config.templateConfig as any),
        initial_template_id: initialTemplate?.id || (config.templateConfig as any).initial_template_id,
        daily_template_id: dailyTemplate?.id || (config.templateConfig as any).daily_template_id,
        initial_template_fileUrl: initialTemplate?.fileUrl,
        daily_template_fileUrl: dailyTemplate?.fileUrl,
      } as any
    } catch (e) {
      console.warn('Page count compute fallback, error:', e)
    }


    // Attach computed page count in response later if needed

    const totalDailyCopies = (config.templateConfig.total_daily_copies as number) || 1
    const imagesPerPage = (config.imageConfig.images_per_page as number) || 1
    const totalImages = config.images.length
    const imagePages = Math.ceil(totalImages / Math.max(1, imagesPerPage))
    const computedPageCount = initialPages + dailyPages * totalDailyCopies + imagePages

    // Generate document
    console.log('🚀 Starting document generation for report:', report.name)
    const documentPath = await documentBuilder.generateReport(config)

    // Convert to PDF
    const pdfPath = await documentBuilder.convertToPdf(documentPath)

    // Update report with document URLs
    const updatedReport = await prisma.report.update({
      where: { id: report.id },
      data: {
        documentUrl: `/uploads/${documentPath.split('/').pop()}`,
        pdfUrl: pdfPath ? `/uploads/${pdfPath.split('/').pop()}` : null,
        status: 'COMPLETED'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        report: updatedReport,
        documentUrl: updatedReport.documentUrl,
        pdfUrl: updatedReport.pdfUrl,
        computedPageCount,
        generatedAt: new Date().toISOString()
      },
      message: 'Document generated successfully'
    })

  } catch (error) {
    console.error('Document generation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET /api/documents/generate - Get generation status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('report_id')

    if (!reportId) {
      return NextResponse.json(
        { success: false, error: 'Report ID is required' },
        { status: 400 }
      )
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        name: true,
        status: true,
        documentUrl: true,
        pdfUrl: true,
        updatedAt: true
      }
    })

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        report_id: report.id,
        name: report.name,
        status: report.status,
        document_url: report.documentUrl,
        pdf_url: report.pdfUrl,
        last_updated: report.updatedAt,
        is_generated: !!(report.documentUrl && report.pdfUrl)
      }
    })

  } catch (error) {
    console.error('Error getting generation status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get generation status' },
      { status: 500 }
    )
  }
}