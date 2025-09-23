import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UpdateProjectRequest } from '@/types/database'

// GET /api/projects/[id] - Get single project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        constructions: {
          include: {
            _count: {
              select: { categories: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { constructions: true }
        }
      }
    })
    
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: project
    })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: UpdateProjectRequest = await request.json()
    
    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: params.id }
    })
    
    if (!existingProject) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }
    
    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description,
        manager: body.manager,
        status: body.status?.toUpperCase() as any,
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
      message: 'Project updated successfully'
    })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: params.id }
    })
    
    if (!existingProject) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }
    
    // Delete project - Prisma will handle cascade deletion of related records
    // (constructions, categories, reports, report pages, report images, permissions)
    await prisma.project.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Project and all related data deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}