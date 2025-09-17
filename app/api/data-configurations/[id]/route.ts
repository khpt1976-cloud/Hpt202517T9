import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Lấy cấu hình dữ liệu theo ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const configuration = await prisma.dataConfiguration.findUnique({
      where: {
        id: params.id
      }
    })

    if (!configuration) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(configuration)
  } catch (error) {
    console.error('Error fetching data configuration:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data configuration' },
      { status: 500 }
    )
  }
}

// PUT - Cập nhật cấu hình dữ liệu
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, region, country, league, startDate, endDate } = body

    // Validate required fields
    if (!name || !region) {
      return NextResponse.json(
        { error: 'Name and region are required' },
        { status: 400 }
      )
    }

    const configuration = await prisma.dataConfiguration.update({
      where: {
        id: params.id
      },
      data: {
        name,
        region,
        country: country || '',
        league: league || '',
        startDate: startDate || null,
        endDate: endDate || null
      }
    })

    return NextResponse.json(configuration)
  } catch (error) {
    console.error('Error updating data configuration:', error)
    return NextResponse.json(
      { error: 'Failed to update data configuration' },
      { status: 500 }
    )
  }
}

// DELETE - Xóa cấu hình dữ liệu
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.dataConfiguration.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json({ message: 'Configuration deleted successfully' })
  } catch (error) {
    console.error('Error deleting data configuration:', error)
    return NextResponse.json(
      { error: 'Failed to delete data configuration' },
      { status: 500 }
    )
  }
}