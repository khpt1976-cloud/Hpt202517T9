'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { FileText, Download, Eye, Loader2, CheckCircle, AlertCircle, Settings } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Report {
  id: string
  name: string
  reportDate: string
  weather?: string
  temperature?: string
  status: string
  documentUrl?: string
  pdfUrl?: string
  category: {
    name: string
    construction: {
      name: string
      project: {
        name: string
      }
    }
  }
  images: Array<{
    id: string
    imageUrl: string
    description?: string
  }>
}

interface ReportGeneratorProps {
  reportId?: string
}

export function ReportGenerator({ reportId }: ReportGeneratorProps) {
  const [reports, setReports] = useState<Report[]>([])
  const [selectedReportId, setSelectedReportId] = useState(reportId || '')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string>('')
  const [generatedUrls, setGeneratedUrls] = useState<{ documentUrl?: string, pdfUrl?: string }>({})

  // Template configuration
  const [templateConfig, setTemplateConfig] = useState({
    initial_template_id: 'default_initial',
    daily_template_id: 'default_daily',
    initial_pages: 3,
    daily_pages: 2,
    total_daily_copies: 1
  })

  // Image configuration
  const [imageConfig, setImageConfig] = useState({
    template_page: 4,
    images_per_page: 6,
    layout: {
      rows: 3,
      cols: 2,
      cellWidth: 200,
      cellHeight: 150,
      spacing: 10
    }
  })

  // Fetch reports
  useEffect(() => {
    fetchReports()
    loadTemplates()
  }, [])

  // Load available templates and set default ones
  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/templates')
      const result = await response.json()
      
      if (result.success && result.data.length > 0) {
        // Find default templates by type
        const initialTemplate = result.data.find((t: any) => t.fileType === 'INITIAL' && t.isDefault) || 
                               result.data.find((t: any) => t.fileType === 'INITIAL')
        const dailyTemplate = result.data.find((t: any) => t.fileType === 'DAILY' && t.isDefault) || 
                             result.data.find((t: any) => t.fileType === 'DAILY')

        // Update template config with actual template IDs
        setTemplateConfig(prev => ({
          ...prev,
          initial_template_id: initialTemplate?.id || 'default_initial',
          daily_template_id: dailyTemplate?.id || 'default_daily',
          initial_pages: initialTemplate?.pageCount || 3,
          daily_pages: dailyTemplate?.pageCount || 2
        }))

        console.log('✅ Templates loaded:', {
          initial: initialTemplate?.name || 'None',
          daily: dailyTemplate?.name || 'None'
        })
      }
    } catch (error) {
      console.error('❌ Error loading templates:', error)
    }
  }

  // Update selected report when reportId changes
  useEffect(() => {
    if (selectedReportId && reports.length > 0) {
      const report = reports.find(r => r.id === selectedReportId)
      setSelectedReport(report || null)
    }
  }, [selectedReportId, reports])

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports')
      const result = await response.json()
      if (result.success) {
        setReports(result.data)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    }
  }

  const generateReport = async () => {
    if (!selectedReport) {
      setMessage('Vui lòng chọn báo cáo')
      setStatus('error')
      return
    }

    setGenerating(true)
    setStatus('generating')
    setProgress(0)
    setMessage('Đang khởi tạo...')

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev
          return prev + Math.random() * 10
        })
      }, 500)

      setMessage('Đang xử lý template...')
      
      const response = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          report_id: selectedReport.id,
          template_config: templateConfig,
          image_config: imageConfig
        })
      })

      const result = await response.json()
      clearInterval(progressInterval)

      if (result.success) {
        setProgress(100)
        setStatus('success')
        setMessage('Tạo báo cáo thành công!')
        setGeneratedUrls({
          documentUrl: result.data.documentUrl,
          pdfUrl: result.data.pdfUrl
        })
        
        // Update the selected report with new URLs
        setSelectedReport(prev => prev ? {
          ...prev,
          documentUrl: result.data.documentUrl,
          pdfUrl: result.data.pdfUrl,
          status: 'COMPLETED'
        } : null)
      } else {
        setStatus('error')
        setMessage(result.error || 'Có lỗi xảy ra khi tạo báo cáo')
        setProgress(0)
      }
    } catch (error) {
      console.error('Generation error:', error)
      setStatus('error')
      setMessage('Có lỗi xảy ra khi tạo báo cáo')
      setProgress(0)
    } finally {
      setGenerating(false)
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'generating':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      case 'generating':
        return 'border-blue-200 bg-blue-50'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Report Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Chọn Báo cáo</CardTitle>
          <CardDescription>
            Chọn báo cáo để tạo tài liệu Word và PDF
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="report-select">Báo cáo</Label>
              <Select value={selectedReportId} onValueChange={setSelectedReportId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn báo cáo..." />
                </SelectTrigger>
                <SelectContent>
                  {reports.map((report) => (
                    <SelectItem key={report.id} value={report.id}>
                      <div className="flex flex-col">
                        <span>{report.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {report.category.construction.project.name} → {report.category.construction.name} → {report.category.name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedReport && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Ngày báo cáo:</span>
                      <p>{new Date(selectedReport.reportDate).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div>
                      <span className="font-medium">Trạng thái:</span>
                      <p>
                        <Badge variant={selectedReport.status === 'COMPLETED' ? 'default' : 'secondary'}>
                          {selectedReport.status}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Thời tiết:</span>
                      <p>{selectedReport.weather || 'Chưa có thông tin'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Số hình ảnh:</span>
                      <p>{selectedReport.images.length} ảnh</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Cấu hình Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="initial-pages">Số trang nhật ký đầu</Label>
              <Input
                id="initial-pages"
                type="number"
                value={templateConfig.initial_pages}
                onChange={(e) => setTemplateConfig(prev => ({
                  ...prev,
                  initial_pages: parseInt(e.target.value) || 3
                }))}
                min="1"
                max="10"
              />
            </div>
            <div>
              <Label htmlFor="daily-pages">Số trang nhật ký thêm</Label>
              <Input
                id="daily-pages"
                type="number"
                value={templateConfig.daily_pages}
                onChange={(e) => setTemplateConfig(prev => ({
                  ...prev,
                  daily_pages: parseInt(e.target.value) || 2
                }))}
                min="1"
                max="5"
              />
            </div>
            <div>
              <Label htmlFor="daily-copies">Số bản sao nhật ký thêm</Label>
              <Input
                id="daily-copies"
                type="number"
                value={templateConfig.total_daily_copies}
                onChange={(e) => setTemplateConfig(prev => ({
                  ...prev,
                  total_daily_copies: parseInt(e.target.value) || 1
                }))}
                min="0"
                max="5"
              />
            </div>
            <div>
              <Label htmlFor="images-per-page">Số ảnh mỗi trang</Label>
              <Input
                id="images-per-page"
                type="number"
                value={imageConfig.images_per_page}
                onChange={(e) => setImageConfig(prev => ({
                  ...prev,
                  images_per_page: parseInt(e.target.value) || 6
                }))}
                min="1"
                max="12"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generation */}
      <Card className={getStatusColor()}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Tạo Tài liệu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {message && (
              <Alert variant={status === 'error' ? 'destructive' : 'default'}>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            {generating && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tiến độ</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={generateReport}
                disabled={!selectedReport || generating}
                className="flex-1"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Tạo Tài liệu
                  </>
                )}
              </Button>
            </div>

            {/* Generated Files */}
            {(generatedUrls.documentUrl || generatedUrls.pdfUrl || selectedReport?.documentUrl || selectedReport?.pdfUrl) && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Tài liệu đã tạo:</h4>
                <div className="flex gap-2">
                  {(generatedUrls.documentUrl || selectedReport?.documentUrl) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(generatedUrls.documentUrl || selectedReport?.documentUrl, '_blank')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Tải Word
                    </Button>
                  )}
                  {(generatedUrls.pdfUrl || selectedReport?.pdfUrl) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(generatedUrls.pdfUrl || selectedReport?.pdfUrl, '_blank')}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Xem PDF
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}