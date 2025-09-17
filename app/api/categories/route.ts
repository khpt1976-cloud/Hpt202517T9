import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateCategoryRequest, CategoryFilters } from '@/types/database'

// GET /api/categories - List categories with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    
    // Filters
    const filters: CategoryFilters = {
      construction_id: searchParams.get('construction_id') || undefined,
      status: searchParams.get('status') as any,
      contractor: searchParams.get('contractor') || undefined,
      search: searchParams.get('search') || undefined,
    }
    
    // Build where clause
    const where: any = {}
    
    if (filters.construction_id) {
      where.constructionId = filters.construction_id
    }
    
    if (filters.status) {
      where.status = filters.status.toUpperCase()
    }
    
    if (filters.contractor) {
      where.contractor = {
        contains: filters.contractor,
        mode: 'insensitive'
      }
    }
    
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { contractor: { contains: filters.search, mode: 'insensitive' } }
      ]
    }
    
    // Get categories with relations
    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take: limit,
        include: {
          construction: {
            select: { 
              id: true, 
              name: true,
              project: {
                select: { id: true, name: true }
              }
            }
          },
          _count: {
            select: { reports: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.category.count({ where })
    ])
    
    const totalPages = Math.ceil(total / limit)
    
    return NextResponse.json({
      success: true,
      data: categories,
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
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const body: CreateCategoryRequest = await request.json()
    
    // Validate required fields
    if (!body.name || !body.construction_id) {
      return NextResponse.json(
        { success: false, error: 'Category name and construction ID are required' },
        { status: 400 }
      )
    }
    
    // Check if construction exists
    const construction = await prisma.construction.findUnique({
      where: { id: body.construction_id },
      include: {
        project: {
          select: { id: true, name: true }
        }
      }
    })
    
    if (!construction) {
      return NextResponse.json(
        { success: false, error: 'Construction not found' },
        { status: 404 }
      )
    }
    
    const category = await prisma.category.create({
      data: {
        constructionId: body.construction_id,
        name: body.name,
        description: body.description,
        contractor: body.contractor,
        contractValue: body.contract_value,
        startDate: body.start_date,
        endDate: body.end_date,
      },
      include: {
        construction: {
          select: { 
            id: true, 
            name: true,
            project: {
              select: { id: true, name: true }
            }
          }
        },
        _count: {
          select: { reports: true }
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: category,
      message: 'Category created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    )
  }
}