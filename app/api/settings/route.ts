import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/settings?key=imageConfig
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json({ error: 'Key parameter is required' }, { status: 400 })
    }

    const setting = await prisma.globalSettings.findUnique({
      where: { key }
    })

    if (!setting) {
      // Return default values if not found
      if (key === 'imageConfig') {
        return NextResponse.json({
          templatePage: 1,
          imagesPerPage: 4
        })
      }
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 })
    }

    return NextResponse.json(setting.value)
  } catch (error) {
    console.error('Error fetching setting:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, value, description } = body

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 })
    }

    // Parse value if it's a string that looks like JSON
    let parsedValue = value
    if (typeof value === 'string') {
      try {
        parsedValue = JSON.parse(value)
      } catch {
        // Keep as string if not valid JSON
        parsedValue = value
      }
    }

    const setting = await prisma.globalSettings.upsert({
      where: { key },
      update: { 
        value: parsedValue,
        description,
        updatedAt: new Date()
      },
      create: { 
        key, 
        value: parsedValue,
        description
      }
    })

    return NextResponse.json({ success: true, setting })
  } catch (error) {
    console.error('Error saving setting:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/settings?key=xxx or DELETE /api/settings (clear all)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (key) {
      // Delete specific key
      await prisma.globalSettings.delete({
        where: { key }
      })
      return NextResponse.json({ success: true, message: `Setting ${key} deleted` })
    } else {
      // Clear all settings (use with caution)
      await prisma.globalSettings.deleteMany({})
      return NextResponse.json({ success: true, message: 'All settings cleared' })
    }
  } catch (error) {
    console.error('Error deleting setting:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}