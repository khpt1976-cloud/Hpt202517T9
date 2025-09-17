import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateReportRequest, ReportFilters } from '@/types/database'

// GET /api/reports - List reports with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    
    // Filters
    const filters: ReportFilters = {
      category_id: searchParams.get('category_id') || undefined,
      status: searchParams.get('status') as any,
      is_shared: searchParams.get('is_shared') === 'true' ? true : undefined,
      shared_type: searchParams.get('shared_type') as any,
      created_by: searchParams.get('created_by') || undefined,
      search: searchParams.get('search') || undefined,
    }
    
    // Build where clause
    const where: any = {}
    
    if (filters.category_id) {
      where.categoryId = filters.category_id
    }
    
    if (filters.status) {
      where.status = filters.status.toUpperCase()
    }
    
    if (filters.is_shared !== undefined) {
      where.isShared = filters.is_shared
    }
    
    if (filters.shared_type) {
      where.sharedType = filters.shared_type.toUpperCase()
    }
    
    if (filters.created_by) {
      where.createdBy = filters.created_by
    }
    
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { weather: { contains: filters.search, mode: 'insensitive' } }
      ]
    }
    
    // Get reports with full relations
    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              construction: {
                select: {
                  id: true,
                  name: true,
                  project: {
                    select: { id: true, name: true }
                  }
                }
              }
            }
          },
          _count: {
            select: { 
              pages: true,
              images: true 
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.report.count({ where })
    ])
    
    const totalPages = Math.ceil(total / limit)
    
    return NextResponse.json({
      success: true,
      data: reports,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}

// POST /api/reports - Create new report
export async function POST(request: NextRequest) {
  try {
    const body: CreateReportRequest = await request.json()
    
    // Validate required fields
    if (!body.name || !body.category_id || !body.report_date) {
      return NextResponse.json(
        { success: false, error: 'Report name, category ID, and report date are required' },
        { status: 400 }
      )
    }
    
    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: body.category_id },
      include: {
        construction: {
          include: {
            project: {
              select: { id: true, name: true }
            }
          }
        }
      }
    })
    
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }
    
    const report = await prisma.report.create({
      data: {
        categoryId: body.category_id,
        name: body.name,
        reportDate: new Date(body.report_date),
        weather: body.weather,
        temperature: body.temperature,
        templateConfig: body.template_config,
        imageConfig: body.image_config,
        // createdBy: body.created_by, // Will be set from auth context later
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            construction: {
              select: {
                id: true,
                name: true,
                project: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        },
        _count: {
          select: { 
            pages: true,
            images: true 
          }
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: report,
      message: 'Report created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create report' },
      { status: 500 }
    )
  }
}