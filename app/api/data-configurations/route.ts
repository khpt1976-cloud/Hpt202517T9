import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Lấy tất cả cấu hình dữ liệu
export async function GET() {
  try {
    const configurations = await prisma.dataConfiguration.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(configurations)
  } catch (error) {
    console.error('Error fetching data configurations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data configurations' },
      { status: 500 }
    )
  }
}

// POST - Tạo cấu hình dữ liệu mới
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, region, country, league, startDate, endDate, userId } = body

    // Validate required fields
    if (!name || !region) {
      return NextResponse.json(
        { error: 'Name and region are required' },
        { status: 400 }
      )
    }

    const configuration = await prisma.dataConfiguration.create({
      data: {
        name,
        region,
        country: country || '',
        league: league || '',
        startDate: startDate || null,
        endDate: endDate || null,
        userId: userId || null
      }
    })

    return NextResponse.json(configuration, { status: 201 })
  } catch (error) {
    console.error('Error creating data configuration:', error)
    return NextResponse.json(
      { error: 'Failed to create data configuration' },
      { status: 500 }
    )
  }
}