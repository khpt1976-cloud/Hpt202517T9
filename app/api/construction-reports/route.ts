import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');
    
    if (reportId) {
      // Get specific report with pages and images
      const report = await prisma.report.findUnique({
        where: { id: reportId },
        include: {
          pages: {
            orderBy: { pageNumber: 'asc' },
            include: {
              images: {
                orderBy: { positionIndex: 'asc' }
              }
            }
          },
          images: {
            orderBy: { positionIndex: 'asc' }
          }
        }
      });
      
      if (report) {
        // Transform database data to match frontend format
        const pages: { [key: number]: string } = {};
        let imagePagesConfig: { [key: number]: any } = {};
        
        // First, try to get imagePagesConfig from report.imageConfig
        if (report.imageConfig && typeof report.imageConfig === 'object') {
          imagePagesConfig = report.imageConfig as { [key: number]: any };
        }
        
        // Process pages
        report.pages.forEach(page => {
          if (page.content && typeof page.content === 'object' && 'html' in page.content) {
            pages[page.pageNumber] = (page.content as any).html || '';
          }
          
          // Process image pages - supplement imagePagesConfig if needed
          if (page.pageType === 'IMAGE_PAGE' && page.images.length > 0) {
            const images = page.images.map(img => img.imageUrl);
            imagePagesConfig[page.pageNumber] = {
              imagesPerPage: page.images.length,
              imagesPerRow: Math.ceil(Math.sqrt(page.images.length)), // Estimate grid
              images: images
            };
          }
        });
        
        const responseData = {
          id: report.id,
          title: report.name,
          pages: pages,
          totalPages: Math.max(report.pages.length, 1),
          imagePagesConfig: imagePagesConfig,
          lastModified: report.updatedAt.toISOString(),
          createdAt: report.createdAt.toISOString()
        };
        
        console.log(`📖 [DB GET] Loaded report ${reportId}:`, {
          totalPages: responseData.totalPages,
          pagesCount: Object.keys(pages).length,
          imagePagesCount: Object.keys(imagePagesConfig).length
        });
        
        return NextResponse.json(responseData);
      } else {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }
    } else {
      // Get all reports
      const allReports = await prisma.report.findMany({
        include: {
          pages: true,
          _count: {
            select: { pages: true, images: true }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });
      
      const transformedReports = allReports.map(report => ({
        id: report.id,
        title: report.name,
        totalPages: report._count.pages,
        imageCount: report._count.images,
        lastModified: report.updatedAt.toISOString(),
        createdAt: report.createdAt.toISOString()
      }));
      
      return NextResponse.json(transformedReports);
    }
  } catch (error) {
    console.error('Error in GET /api/construction-reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportId, data } = body;
    
    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }
    
    console.log(`💾 [DB POST] Saving report ${reportId}:`, {
      title: data.title,
      totalPages: data.totalPages,
      pagesCount: Object.keys(data.pages || {}).length,
      imagePagesCount: Object.keys(data.imagePagesConfig || {}).length
    });
    
    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // First, find or create the report
      let report = await tx.report.findUnique({
        where: { id: reportId }
      });
      
      if (!report) {
        // Create new report - need to associate with a category
        // For now, we'll use the first available category or create a default one
        let category = await tx.category.findFirst();
        if (!category) {
          // Create a default project and construction if none exist
          let project = await tx.project.findFirst();
          if (!project) {
            project = await tx.project.create({
              data: {
                name: 'Default Project',
                description: 'Auto-created project for construction reports'
              }
            });
          }
          
          let construction = await tx.construction.findFirst({
            where: { projectId: project.id }
          });
          if (!construction) {
            construction = await tx.construction.create({
              data: {
                projectId: project.id,
                name: 'Default Construction',
                description: 'Auto-created construction for reports'
              }
            });
          }
          
          category = await tx.category.create({
            data: {
              constructionId: construction.id,
              name: 'Construction Diary',
              description: 'Daily construction reports'
            }
          });
        }
        
        report = await tx.report.create({
          data: {
            id: reportId,
            categoryId: category.id,
            name: data.title || 'Construction Report',
            reportDate: new Date(),
            content: data,
            templateConfig: data.imagePagesConfig || {},
            imageConfig: data.imagePagesConfig || {}
          }
        });
      } else {
        // Update existing report
        report = await tx.report.update({
          where: { id: reportId },
          data: {
            name: data.title || report.name,
            content: data,
            templateConfig: data.imagePagesConfig || {},
            imageConfig: data.imagePagesConfig || {},
            updatedAt: new Date()
          }
        });
      }
      
      // Delete existing pages for this report
      await tx.reportPage.deleteMany({
        where: { reportId: reportId }
      });
      
      // Delete existing images for this report
      await tx.reportImage.deleteMany({
        where: { reportId: reportId }
      });
      
      // Create pages
      const pages = data.pages || {};
      const imagePagesConfig = data.imagePagesConfig || {};
      
      for (const [pageNumStr, content] of Object.entries(pages)) {
        const pageNumber = parseInt(pageNumStr);
        const isImagePage = imagePagesConfig[pageNumber];
        
        const page = await tx.reportPage.create({
          data: {
            reportId: reportId,
            pageNumber: pageNumber,
            pageType: isImagePage ? 'IMAGE_PAGE' : 'CUSTOM',
            content: { html: content },
            isLocked: false
          }
        });
        
        // If this is an image page, create image records
        if (isImagePage && isImagePage.images) {
          for (let i = 0; i < isImagePage.images.length; i++) {
            const imageUrl = isImagePage.images[i];
            if (imageUrl && imageUrl.trim()) {
              await tx.reportImage.create({
                data: {
                  reportId: reportId,
                  pageId: page.id,
                  imageUrl: imageUrl,
                  positionIndex: i,
                  originalFilename: `image_${i + 1}.jpg`
                }
              });
            }
          }
        }
      }
      
      return report;
    });
    
    console.log(`✅ [DB POST] Successfully saved report ${reportId} to database`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Report saved successfully to database',
      reportId: result.id
    });
  } catch (error) {
    console.error('❌ [DB POST] Error saving report:', error);
    return NextResponse.json({ 
      error: 'Failed to save report to database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportId, data } = body;
    
    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }
    
    // Check if report exists
    const existingReport = await prisma.report.findUnique({
      where: { id: reportId }
    });
    
    if (!existingReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    
    // Update using the same logic as POST
    const result = await prisma.$transaction(async (tx) => {
      // Update report
      const report = await tx.report.update({
        where: { id: reportId },
        data: {
          name: data.title || existingReport.name,
          content: data,
          templateConfig: data.imagePagesConfig || {},
          imageConfig: data.imagePagesConfig || {},
          updatedAt: new Date()
        }
      });
      
      // Delete and recreate pages and images
      await tx.reportPage.deleteMany({
        where: { reportId: reportId }
      });
      
      await tx.reportImage.deleteMany({
        where: { reportId: reportId }
      });
      
      // Create pages
      const pages = data.pages || {};
      const imagePagesConfig = data.imagePagesConfig || {};
      
      for (const [pageNumStr, content] of Object.entries(pages)) {
        const pageNumber = parseInt(pageNumStr);
        const isImagePage = imagePagesConfig[pageNumber];
        
        const page = await tx.reportPage.create({
          data: {
            reportId: reportId,
            pageNumber: pageNumber,
            pageType: isImagePage ? 'IMAGE_PAGE' : 'CUSTOM',
            content: { html: content },
            isLocked: false
          }
        });
        
        // If this is an image page, create image records
        if (isImagePage && isImagePage.images) {
          for (let i = 0; i < isImagePage.images.length; i++) {
            const imageUrl = isImagePage.images[i];
            if (imageUrl && imageUrl.trim()) {
              await tx.reportImage.create({
                data: {
                  reportId: reportId,
                  pageId: page.id,
                  imageUrl: imageUrl,
                  positionIndex: i,
                  originalFilename: `image_${i + 1}.jpg`
                }
              });
            }
          }
        }
      }
      
      return report;
    });
    
    console.log(`✅ [DB PUT] Successfully updated report ${reportId}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Report updated successfully',
      reportId: result.id
    });
  } catch (error) {
    console.error('❌ [DB PUT] Error updating report:', error);
    return NextResponse.json({ 
      error: 'Failed to update report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');
    
    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }
    
    // Check if report exists
    const existingReport = await prisma.report.findUnique({
      where: { id: reportId }
    });
    
    if (!existingReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    
    // Delete report (cascade will handle pages and images)
    await prisma.report.delete({
      where: { id: reportId }
    });
    
    console.log(`🗑️ [DB DELETE] Successfully deleted report ${reportId}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Report deleted successfully' 
    });
  } catch (error) {
    console.error('❌ [DB DELETE] Error deleting report:', error);
    return NextResponse.json({ 
      error: 'Failed to delete report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}