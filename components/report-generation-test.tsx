'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Calendar,
  Thermometer,
  Cloud,
  Settings
} from 'lucide-react'

interface ReportConfig {
  categoryId: string
  name: string
  reportDate: string
  weather?: string
  temperature?: string
  templateConfig: {
    initialTemplateId?: string
    dailyTemplateId?: string
    initialPages: number
    dailyPages: number
    imagePages: number
    imagesPerPage: number
  }
}

interface GenerationResult {
  success: boolean
  data?: {
    report: any
    generation: {
      pageCount: number
      documentPath?: string
      pdfPath?: string
    }
  }
  error?: string
  message?: string
}

export function ReportGenerationTest() {
  const [config, setConfig] = useState<ReportConfig>({
    categoryId: 'cat-1',
    name: 'Test Report - ' + new Date().toLocaleDateString('vi-VN'),
    reportDate: new Date().toISOString().split('T')[0],
    weather: 'sunny',
    temperature: '28',
    templateConfig: {
      initialPages: 2,
      dailyPages: 3,
      imagePages: 2,
      imagesPerPage: 4
    }
  })

  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [progress, setProgress] = useState(0)

  const handleGenerate = async () => {
    setGenerating(true)
    setProgress(0)
    setResult(null)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 15, 90))
      }, 300)

      console.log('Sending request with config:', config)

      const response = await fetch('/api/reports/generate-mock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      })

      clearInterval(progressInterval)
      setProgress(100)

      const data: GenerationResult = await response.json()
      console.log('Response received:', data)
      setResult(data)

    } catch (error) {
      console.error('Generation error:', error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      })
    } finally {
      setGenerating(false)
    }
  }

  const updateTemplateConfig = (key: keyof ReportConfig['templateConfig'], value: number) => {
    setConfig(prev => ({
      ...prev,
      templateConfig: {
        ...prev.templateConfig,
        [key]: value
      }
    }))
  }

  const getTotalPages = () => {
    const { initialPages, dailyPages, imagePages } = config.templateConfig
    return initialPages + dailyPages + imagePages
  }

  const getImageLayout = () => {
    const { imagesPerPage } = config.templateConfig
    if (imagesPerPage <= 2) return '1x2'
    if (imagesPerPage <= 4) return '2x2'
    if (imagesPerPage <= 6) return '2x3'
    if (imagesPerPage <= 9) return '3x3'
    return '4x4'
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Report Generation Test
          </CardTitle>
          <CardDescription>
            Test the report generation workflow with mock data
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reportName">Report Name</Label>
              <Input
                id="reportName"
                value={config.name}
                onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reportDate">Report Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="reportDate"
                  type="date"
                  className="pl-10"
                  value={config.reportDate}
                  onChange={(e) => setConfig(prev => ({ ...prev, reportDate: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Weather Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weather">Weather</Label>
              <div className="relative">
                <Cloud className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Select value={config.weather} onValueChange={(value) => setConfig(prev => ({ ...prev, weather: value }))}>
                  <SelectTrigger className="pl-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sunny">☀️ Nắng</SelectItem>
                    <SelectItem value="cloudy">☁️ Nhiều mây</SelectItem>
                    <SelectItem value="rainy">🌧️ Mưa</SelectItem>
                    <SelectItem value="stormy">⛈️ Bão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature (°C)</Label>
              <div className="relative">
                <Thermometer className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="temperature"
                  type="number"
                  className="pl-10"
                  value={config.temperature}
                  onChange={(e) => setConfig(prev => ({ ...prev, temperature: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Template Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Template Configuration</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="initialPages">Initial Pages</Label>
                <Input
                  id="initialPages"
                  type="number"
                  min="0"
                  max="10"
                  value={config.templateConfig.initialPages}
                  onChange={(e) => updateTemplateConfig('initialPages', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dailyPages">Daily Pages</Label>
                <Input
                  id="dailyPages"
                  type="number"
                  min="0"
                  max="10"
                  value={config.templateConfig.dailyPages}
                  onChange={(e) => updateTemplateConfig('dailyPages', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="imagePages">Image Pages</Label>
                <Input
                  id="imagePages"
                  type="number"
                  min="0"
                  max="10"
                  value={config.templateConfig.imagePages}
                  onChange={(e) => updateTemplateConfig('imagePages', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="imagesPerPage">Images/Page</Label>
                <Select 
                  value={config.templateConfig.imagesPerPage.toString()} 
                  onValueChange={(value) => updateTemplateConfig('imagesPerPage', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 image</SelectItem>
                    <SelectItem value="2">2 images</SelectItem>
                    <SelectItem value="4">4 images</SelectItem>
                    <SelectItem value="6">6 images</SelectItem>
                    <SelectItem value="9">9 images</SelectItem>
                    <SelectItem value="16">16 images</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Configuration Summary */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium mb-3 text-blue-900">Report Preview</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-600">Total Pages:</span>
                  <Badge variant="secondary">{getTotalPages()}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-600">Layout:</span>
                  <Badge variant="secondary">{getImageLayout()}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-600">Templates:</span>
                  <Badge variant="secondary">
                    {config.templateConfig.initialPages + config.templateConfig.dailyPages}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-600">Images:</span>
                  <Badge variant="secondary">{config.templateConfig.imagePages}</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Generation Progress */}
          {generating && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Generating report...</span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              <div className="text-xs text-gray-500 text-center">
                Processing templates and generating document structure
              </div>
            </div>
          )}

          {/* Generation Result */}
          {result && (
            <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                {result.success ? (
                  <div className="space-y-3">
                    <p className="font-medium text-green-800">✅ Report generated successfully!</p>
                    <div className="text-sm text-green-700 space-y-1">
                      <p><strong>Pages:</strong> {result.data?.generation.pageCount}</p>
                      <p><strong>Report ID:</strong> {result.data?.report.id}</p>
                      <p><strong>Status:</strong> {result.data?.report.status}</p>
                      {result.data?.generation.documentPath && (
                        <p><strong>Document:</strong> {result.data.generation.documentPath}</p>
                      )}
                    </div>
                    {result.data?.report && (
                      <div className="mt-3 p-3 bg-green-100 rounded text-xs">
                        <strong>Full Response:</strong>
                        <pre className="mt-1 overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="font-medium text-red-800">❌ Generation failed</p>
                    <p className="text-sm text-red-700">{result.error}</p>
                    {result.message && (
                      <p className="text-sm text-red-600">{result.message}</p>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              onClick={handleGenerate} 
              disabled={generating}
              className="flex-1"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Test Generate Report
                </>
              )}
            </Button>
            
            {result?.success && (
              <Button variant="outline" disabled>
                <Download className="h-4 w-4 mr-2" />
                Download (Mock)
              </Button>
            )}
          </div>

          {/* Debug Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2 text-gray-700">Debug Information</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>API Endpoint:</strong> /api/reports/generate-mock</p>
              <p><strong>Method:</strong> POST</p>
              <p><strong>Category ID:</strong> {config.categoryId} (mock)</p>
              <p><strong>Current Config:</strong></p>
              <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-x-auto">
                {JSON.stringify(config, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}