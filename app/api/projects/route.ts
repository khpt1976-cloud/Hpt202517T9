import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateProjectRequest, ProjectFilters } from '@/types/database'

// GET /api/projects - List all projects with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    
    // Filters
    const filters: ProjectFilters = {
      status: searchParams.get('status') as any,
      manager: searchParams.get('manager') || undefined,
      search: searchParams.get('search') || undefined,
    }
    
    // Build where clause
    const where: any = {}
    
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
    
    // Get projects with counts
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        include: {
          constructions: {
            select: { id: true }
          },
          _count: {
            select: { constructions: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.project.count({ where })
    ])
    
    const totalPages = Math.ceil(total / limit)
    
    return NextResponse.json({
      success: true,
      data: projects,
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
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const body: CreateProjectRequest = await request.json()
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Project name is required' },
        { status: 400 }
      )
    }
    
    const project = await prisma.project.create({
      data: {
        name: body.name,
        description: body.description,
        manager: body.manager,
        startDate: body.start_date,
        endDate: body.end_date,
        budget: body.budget,
        location: body.location,
      },
      include: {
        _count: {
          select: { constructions: true }
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: project,
      message: 'Project created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create project' },
      { status: 500 }
    )
  }
}