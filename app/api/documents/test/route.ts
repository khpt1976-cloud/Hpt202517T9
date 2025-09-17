import { NextRequest, NextResponse } from 'next/server'

// GET /api/documents/test - Simple API test
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Document API is running',
      timestamp: new Date().toISOString(),
      services: {
        api: 'healthy',
        nextjs: 'running',
        server: 'active'
      },
      features: {
        templateUpload: true,
        reportGeneration: true,
        documentConversion: true,
        imageProcessing: true
      },
      phase3_status: {
        templateManagement: 'completed',
        reportGenerator: 'completed',
        uiComponents: 'completed',
        navigation: 'completed'
      }
    })
  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}