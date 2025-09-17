'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, Download, Star, Calendar, HardDrive, Loader2, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Template {
  id: string
  name: string
  fileUrl: string
  fileType: 'INITIAL' | 'DAILY'
  pageCount: number
  fileSize: number
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

interface TemplateListProps {
  onTemplateSelect?: (template: Template) => void
  refreshTrigger?: number
}

export function TemplateList({ onTemplateSelect, refreshTrigger }: TemplateListProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<'ALL' | 'INITIAL' | 'DAILY'>('ALL')

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError(null)

      const url = filterType === 'ALL' 
        ? '/api/templates' 
        : `/api/templates?file_type=${filterType}`

      const response = await fetch(url)
      const result = await response.json()

      if (result.success) {
        setTemplates(result.data)
      } else {
        setError(result.error || 'Không thể tải danh sách template')
      }
    } catch (err) {
      console.error('Error fetching templates:', err)
      setError('Có lỗi xảy ra khi tải template')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [filterType, refreshTrigger])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTypeColor = (type: string) => {
    return type === 'INITIAL' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
  }

  const getTypeName = (type: string) => {
    return type === 'INITIAL' ? 'Nhật ký đầu' : 'Nhật ký thêm'
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Đang tải template...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Danh sách Template
              </CardTitle>
              <CardDescription>
                Quản lý các template Word cho nhật ký thi công
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterType} onValueChange={(value: 'ALL' | 'INITIAL' | 'DAILY') => setFilterType(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  <SelectItem value="INITIAL">Nhật ký đầu</SelectItem>
                  <SelectItem value="DAILY">Nhật ký thêm</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={fetchTemplates}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có template nào</p>
              <p className="text-sm">Upload template đầu tiên để bắt đầu</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{template.name}</h3>
                          {template.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Mặc định
                            </Badge>
                          )}
                          <Badge className={getTypeColor(template.fileType)}>
                            {getTypeName(template.fileType)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span>{template.pageCount} trang</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <HardDrive className="h-4 w-4" />
                            <span>{formatFileSize(template.fileSize)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(template.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(template.fileUrl, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Tải về
                        </Button>
                        {onTemplateSelect && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => onTemplateSelect(template)}
                          >
                            Chọn
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}