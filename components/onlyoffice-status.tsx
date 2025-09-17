'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Server,
  ExternalLink,
  Clock
} from 'lucide-react'

interface OnlyOfficeStatus {
  success: boolean
  status: 'healthy' | 'unhealthy' | 'error'
  message: string
  data?: {
    url: string
    version?: string
    timestamp: string
    error?: string
    fallback?: string
  }
  error?: string
}

export function OnlyOfficeStatus() {
  const [status, setStatus] = useState<OnlyOfficeStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/onlyoffice/health')
      const data: OnlyOfficeStatus = await response.json()
      setStatus(data)
      setLastChecked(new Date())
    } catch (error) {
      setStatus({
        success: false,
        status: 'error',
        message: 'Failed to check ONLYOFFICE status',
        error: error instanceof Error ? error.message : 'Network error'
      })
      setLastChecked(new Date())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(checkStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = () => {
    if (loading) return <RefreshCw className="h-5 w-5 animate-spin" />
    
    switch (status?.status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <Server className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = () => {
    if (loading) return <Badge variant="secondary">Checking...</Badge>
    
    switch (status?.status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-500">Online</Badge>
      case 'unhealthy':
        return <Badge variant="destructive">Offline</Badge>
      case 'error':
        return <Badge variant="secondary">Error</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('vi-VN')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            ONLYOFFICE Document Server
          </div>
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>
          Document processing and conversion service status
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Message */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <span className="text-sm">{status?.message || 'Checking...'}</span>
        </div>

        {/* Server URL */}
        {status?.data?.url && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Server URL:</span>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                {status.data.url}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(status.data!.url, '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Version */}
        {status?.data?.version && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Version:</span>
            <span className="text-sm font-mono">{status.data.version}</span>
          </div>
        )}

        {/* Last Checked */}
        {lastChecked && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Last Checked:</span>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="h-3 w-3" />
              {lastChecked.toLocaleString('vi-VN')}
            </div>
          </div>
        )}

        {/* Error Details */}
        {status?.data?.error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error:</strong> {status.data.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Fallback Notice */}
        {status?.data?.fallback && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Fallback Mode:</strong> {status.data.fallback}
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={checkStatus}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
          
          {status?.status === 'unhealthy' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // In a real implementation, this would trigger Docker container restart
                alert('Docker restart functionality would be implemented here')
              }}
            >
              <Server className="h-4 w-4 mr-2" />
              Restart Service
            </Button>
          )}
        </div>

        {/* Setup Instructions */}
        {status?.status !== 'healthy' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Setup Instructions:</strong>
              <br />
              1. Make sure Docker is running
              <br />
              2. Run: <code className="bg-gray-100 px-1 rounded">docker compose up -d onlyoffice</code>
              <br />
              3. Wait for the service to start (may take 2-3 minutes)
              <br />
              4. Check if port 8080 is accessible
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}