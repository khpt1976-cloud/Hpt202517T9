import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateConstructionRequest, ConstructionFilters } from '@/types/database'

// GET /api/constructions - List constructions with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    
    // Filters
    const filters: ConstructionFilters = {
      project_id: searchParams.get('project_id') || undefined,
      status: searchParams.get('status') as any,
      manager: searchParams.get('manager') || undefined,
      search: searchParams.get('search') || undefined,
    }
    
    // Build where clause
    const where: any = {}
    
    if (filters.project_id) {
      where.projectId = filters.project_id
    }
    
    if (filters.status) {
      where.status = filters.status.toUpperCase()
    }
    
    if (filters.manager) {
      where.manager = {
        contains: filters.manager,
        mode: 'insensitive'
      }
    }
    
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } }
      ]
    }
    
    // Get constructions with relations
    const [constructions, total] = await Promise.all([
      prisma.construction.findMany({
        where,
        skip,
        take: limit,
        include: {
          project: {
            select: { id: true, name: true }
          },
          _count: {
            select: { categories: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.construction.count({ where })
    ])
    
    const totalPages = Math.ceil(total / limit)
    
    return NextResponse.json({
      success: true,
      data: constructions,
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
    console.error('Error fetching constructions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch constructions' },
      { status: 500 }
    )
  }
}

// POST /api/constructions - Create new construction
export async function POST(request: NextRequest) {
  try {
    const body: CreateConstructionRequest = await request.json()
    
    // Validate required fields
    if (!body.name || !body.project_id) {
      return NextResponse.json(
        { success: false, error: 'Construction name and project ID are required' },
        { status: 400 }
      )
    }
    
    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: body.project_id }
    })
    
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }
    
    const construction = await prisma.construction.create({
      data: {
        projectId: body.project_id,
        name: body.name,
        description: body.description,
        location: body.location,
        manager: body.manager,
        startDate: body.start_date,
        endDate: body.end_date,
      },
      include: {
        project: {
          select: { id: true, name: true }
        },
        _count: {
          select: { categories: true }
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: construction,
      message: 'Construction created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating construction:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create construction' },
      { status: 500 }
    )
  }
}