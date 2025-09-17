'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface TemplateUploadProps {
  onUploadSuccess?: (template: any) => void
}

export function TemplateUpload({ onUploadSuccess }: TemplateUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [fileType, setFileType] = useState<'INITIAL' | 'DAILY'>('INITIAL')
  const [isDefault, setIsDefault] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.docx')) {
        setMessage({ type: 'error', text: 'Chỉ chấp nhận file .docx' })
        return
      }
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB
        setMessage({ type: 'error', text: 'File không được vượt quá 10MB' })
        return
      }
      setFile(selectedFile)
      if (!name) {
        setName(selectedFile.name.replace('.docx', ''))
      }
      setMessage(null)
    }
  }

  const handleUpload = async () => {
    if (!file || !name || !fileType) {
      setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ thông tin' })
      return
    }

    setUploading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', name)
      formData.append('file_type', fileType)
      formData.append('is_default', isDefault.toString())

      const response = await fetch('/api/templates', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: 'success', text: 'Upload template thành công!' })
        setFile(null)
        setName('')
        setIsDefault(false)
        
        // Reset file input
        const fileInput = document.getElementById('template-file') as HTMLInputElement
        if (fileInput) fileInput.value = ''

        if (onUploadSuccess) {
          onUploadSuccess(result.data)
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Upload thất bại' })
      }
    } catch (error) {
      console.error('Upload error:', error)
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi upload' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Template
        </CardTitle>
        <CardDescription>
          Upload file Word (.docx) để làm template cho nhật ký thi công
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="template-file">File Template (.docx)</Label>
          <Input
            id="template-file"
            type="file"
            accept=".docx"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {file && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{file.name}</span>
              <span>({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="template-name">Tên Template</Label>
          <Input
            id="template-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Mẫu nhật ký đầu - Cơ bản"
            disabled={uploading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="template-type">Loại Template</Label>
          <Select value={fileType} onValueChange={(value: 'INITIAL' | 'DAILY') => setFileType(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn loại template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INITIAL">
                <div className="flex flex-col">
                  <span>Initial Template</span>
                  <span className="text-xs text-muted-foreground">Mẫu nhật ký đầu (3-5 trang)</span>
                </div>
              </SelectItem>
              <SelectItem value="DAILY">
                <div className="flex flex-col">
                  <span>Daily Template</span>
                  <span className="text-xs text-muted-foreground">Mẫu nhật ký thêm (2 trang)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is-default"
            checked={isDefault}
            onCheckedChange={(checked) => setIsDefault(checked as boolean)}
            disabled={uploading}
          />
          <Label htmlFor="is-default" className="text-sm">
            Đặt làm template mặc định
          </Label>
        </div>

        <Button 
          onClick={handleUpload} 
          disabled={!file || !name || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang upload...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Template
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}