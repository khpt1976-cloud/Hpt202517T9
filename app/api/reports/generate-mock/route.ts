import { NextRequest, NextResponse } from 'next/server';
import { documentProcessor } from '@/lib/document-processor';

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

    // Mock category data (since we don't have database)
    const mockCategory = {
      id: categoryId,
      name: 'Móng và kết cấu',
      construction: {
        id: 'const-1',
        name: 'Tòa nhà văn phòng ABC',
        project: {
          id: 'proj-1',
          name: 'Dự án Khu đô thị mới'
        }
      }
    };

    // Generate mock report ID
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Generate the document using document processor
    const generationResult = await documentProcessor.generateReport({
      initialPages: templateConfig.initialPages,
      dailyPages: templateConfig.dailyPages,
      imagePages: templateConfig.imagePages,
      imagesPerPage: templateConfig.imagesPerPage
    }, reportId);

    if (!generationResult.success) {
      return NextResponse.json({
        success: false,
        error: generationResult.error,
        reportId
      }, { status: 500 });
    }

    // Mock report data
    const mockReport = {
      id: reportId,
      name,
      reportDate: new Date(reportDate),
      weather,
      temperature,
      categoryId,
      templateConfig,
      imageConfig: {
        imagePages: templateConfig.imagePages,
        imagesPerPage: templateConfig.imagesPerPage,
        layout: documentProcessor.calculateImageLayout(templateConfig.imagesPerPage)
      },
      status: 'COMPLETED',
      createdBy: 'test-user',
      createdAt: new Date(),
      updatedAt: new Date(),
      documentUrl: generationResult.reportPath,
      pdfUrl: generationResult.pdfPath,
      content: {
        pageCount: generationResult.pageCount,
        generatedAt: new Date().toISOString(),
        details: generationResult.details
      },
      category: mockCategory
    };

    // Mock report pages
    const mockPages = [];
    let pageNumber = 1;

    // Initial template pages
    if (templateConfig.initialPages > 0) {
      for (let i = 0; i < templateConfig.initialPages; i++) {
        mockPages.push({
          id: `page_${pageNumber}`,
          reportId,
          pageNumber: pageNumber++,
          pageType: 'TEMPLATE_INITIAL',
          content: { templateType: 'initial', originalPage: i + 1 },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    // Daily template pages
    if (templateConfig.dailyPages > 0) {
      for (let i = 0; i < templateConfig.dailyPages; i++) {
        mockPages.push({
          id: `page_${pageNumber}`,
          reportId,
          pageNumber: pageNumber++,
          pageType: 'TEMPLATE_DAILY',
          content: { templateType: 'daily', originalPage: i + 1 },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    // Image pages
    if (templateConfig.imagePages > 0) {
      for (let i = 0; i < templateConfig.imagePages; i++) {
        mockPages.push({
          id: `page_${pageNumber}`,
          reportId,
          pageNumber: pageNumber++,
          pageType: 'IMAGE_PAGE',
          content: { 
            imageSlots: templateConfig.imagesPerPage,
            layout: documentProcessor.calculateImageLayout(templateConfig.imagesPerPage),
            pageIndex: i + 1
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    // Add pages to mock report
    const reportWithPages = {
      ...mockReport,
      pages: mockPages,
      images: [] // Mock empty images array
    };

    return NextResponse.json({
      success: true,
      data: {
        report: reportWithPages,
        generation: {
          pageCount: generationResult.pageCount,
          documentPath: generationResult.reportPath,
          pdfPath: generationResult.pdfPath
        }
      },
      message: 'Mock report generated successfully',
      mock: true
    }, { status: 201 });

  } catch (error) {
    console.error('Mock report generation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate mock report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}