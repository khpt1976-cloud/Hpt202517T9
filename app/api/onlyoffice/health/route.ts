import { NextRequest, NextResponse } from 'next/server';
import { onlyOfficeService } from '@/lib/onlyoffice';

export async function GET(request: NextRequest) {
  try {
    const serverStatus = await onlyOfficeService.getServerStatus();
    
    if (serverStatus.available) {
      return NextResponse.json({
        success: true,
        status: 'healthy',
        message: 'ONLYOFFICE Document Server is running',
        data: {
          url: serverStatus.url,
          version: serverStatus.version,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        status: 'unhealthy',
        message: 'ONLYOFFICE Document Server is not responding',
        data: {
          url: serverStatus.url,
          error: serverStatus.error,
          timestamp: new Date().toISOString(),
          fallback: 'Document processing will use fallback methods'
        }
      }, { status: 503 });
    }
  } catch (error) {
    console.error('ONLYOFFICE health check error:', error);
    return NextResponse.json({
      success: false,
      status: 'error',
      message: 'Failed to check ONLYOFFICE health',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}