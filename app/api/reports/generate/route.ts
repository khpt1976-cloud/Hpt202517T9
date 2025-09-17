import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { documentProcessor } from '@/lib/document-processor';
import path from 'path';

export interface ReportGenerationRequest {
  categoryId: string;
  name: string;
  reportDate: string;
  weather?: string;
  temperature?: string;
  templateConfig: {
    initialTemplateId?: string;
    dailyTemplateId?: string;
    initialPages: number;
    dailyPages: number;
    imagePages: number;
    imagesPerPage: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ReportGenerationRequest = await request.json();
    
    const {
      categoryId,
      name,
      reportDate,
      weather,
      temperature,
      templateConfig
    } = body;

    // Validate required fields
    if (!categoryId || !name || !reportDate || !templateConfig) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: categoryId, name, reportDate, templateConfig'
      }, { status: 400 });
    }

    // Validate category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        construction: {
          include: {
            project: true
          }
        }
      }
    });

    if (!category) {
      return NextResponse.json({
        success: false,
        error: 'Category not found'
      }, { status: 404 });
    }

    // Get template files if specified
    let initialTemplatePath: string | undefined;
    let dailyTemplatePath: string | undefined;

    if (templateConfig.initialTemplateId) {
      const initialTemplate = await prisma.templateFile.findUnique({
        where: { id: templateConfig.initialTemplateId }
      });
      
      if (initialTemplate) {
        initialTemplatePath = path.join(process.cwd(), 'templates', path.basename(initialTemplate.fileUrl));
      }
    }

    if (templateConfig.dailyTemplateId) {
      const dailyTemplate = await prisma.templateFile.findUnique({
        where: { id: templateConfig.dailyTemplateId }
      });
      
      if (dailyTemplate) {
        dailyTemplatePath = path.join(process.cwd(), 'templates', path.basename(dailyTemplate.fileUrl));
      }
    }

    // Create report record in database
    const report = await prisma.report.create({
      data: {
        categoryId,
        name,
        reportDate: new Date(reportDate),
        weather,
        temperature,
        templateConfig: templateConfig as any,
        imageConfig: {
          imagePages: templateConfig.imagePages,
          imagesPerPage: templateConfig.imagesPerPage,
          layout: documentProcessor.calculateImageLayout(templateConfig.imagesPerPage)
        },
        status: 'DRAFT',
        createdBy: 'system' // Will be replaced with actual user ID from auth
      }
    });

    // Generate the document
    const generationResult = await documentProcessor.generateReport({
      initialTemplate: initialTemplatePath,
      dailyTemplate: dailyTemplatePath,
      initialPages: templateConfig.initialPages,
      dailyPages: templateConfig.dailyPages,
      imagePages: templateConfig.imagePages,
      imagesPerPage: templateConfig.imagesPerPage
    }, report.id);

    if (!generationResult.success) {
      // Update report status to indicate failure
      await prisma.report.update({
        where: { id: report.id },
        data: { 
          status: 'DRAFT',
          content: { error: generationResult.error }
        }
      });

      return NextResponse.json({
        success: false,
        error: generationResult.error,
        reportId: report.id
      }, { status: 500 });
    }

    // Update report with generated document info
    const updatedReport = await prisma.report.update({
      where: { id: report.id },
      data: {
        documentUrl: generationResult.reportPath,
        pdfUrl: generationResult.pdfPath,
        content: {
          pageCount: generationResult.pageCount,
          generatedAt: new Date().toISOString(),
          details: generationResult.details
        },
        status: 'COMPLETED'
      },
      include: {
        category: {
          include: {
            construction: {
              include: {
                project: true
              }
            }
          }
        }
      }
    });

    // Create report pages records
    const pages = [];
    let pageNumber = 1;

    // Initial template pages
    if (templateConfig.initialPages > 0) {
      for (let i = 0; i < templateConfig.initialPages; i++) {
        pages.push({
          reportId: report.id,
          pageNumber: pageNumber++,
          pageType: 'TEMPLATE_INITIAL' as const,
          content: { templateType: 'initial', originalPage: i + 1 }
        });
      }
    }

    // Daily template pages
    if (templateConfig.dailyPages > 0) {
      for (let i = 0; i < templateConfig.dailyPages; i++) {
        pages.push({
          reportId: report.id,
          pageNumber: pageNumber++,
          pageType: 'TEMPLATE_DAILY' as const,
          content: { templateType: 'daily', originalPage: i + 1 }
        });
      }
    }

    // Image pages
    if (templateConfig.imagePages > 0) {
      for (let i = 0; i < templateConfig.imagePages; i++) {
        pages.push({
          reportId: report.id,
          pageNumber: pageNumber++,
          pageType: 'IMAGE_PAGE' as const,
          content: { 
            imageSlots: templateConfig.imagesPerPage,
            layout: documentProcessor.calculateImageLayout(templateConfig.imagesPerPage)
          }
        });
      }
    }

    // Create all pages
    if (pages.length > 0) {
      await prisma.reportPage.createMany({
        data: pages
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        report: updatedReport,
        generation: {
          pageCount: generationResult.pageCount,
          documentPath: generationResult.reportPath,
          pdfPath: generationResult.pdfPath
        }
      },
      message: 'Report generated successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to check generation status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');

    if (!reportId) {
      return NextResponse.json({
        success: false,
        error: 'reportId parameter is required'
      }, { status: 400 });
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
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
        pages: {
          orderBy: { pageNumber: 'asc' }
        },
        images: true
      }
    });

    if (!report) {
      return NextResponse.json({
        success: false,
        error: 'Report not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Error fetching report status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch report status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}