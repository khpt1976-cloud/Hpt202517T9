"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Upload,
  FileText,
  CheckCircle,
  Trash2,
} from "lucide-react"

interface TemplateFile {
  id: string
  name: string
  file: File
  uploadDate: string
  isDefault: boolean
  pageCount?: number
  size: number
  type: 'initial' | 'daily'
}

interface ImageConfig {
  templatePage: number
  imagesPerPage: number
}

interface TemplateUploadSectionProps {
  templateFiles: TemplateFile[]
  templateErrors: { initial: string; daily: string }
  imageConfig: ImageConfig
  selectedTemplate: TemplateFile | null
  onTemplateUpload: (e: React.ChangeEvent<HTMLInputElement>, templateType: 'initial' | 'daily') => void
  onTemplateDrop: (e: React.DragEvent<HTMLDivElement>, templateType: 'initial' | 'daily') => void
  onSetDefaultTemplate: (templateId: string) => void
  onRemoveTemplate: (templateId: string) => void
  onTemplatePageChange: (value: string) => void
  onImagesPerPageChange: (value: string) => void
  onSelectTemplate: (template: TemplateFile) => void
}

export default function TemplateUploadSection({
  templateFiles,
  templateErrors,
  imageConfig,
  selectedTemplate,
  onTemplateUpload,
  onTemplateDrop,
  onSetDefaultTemplate,
  onRemoveTemplate,
  onTemplatePageChange,
  onImagesPerPageChange,
  onSelectTemplate,
}: TemplateUploadSectionProps) {
  return (
    <div className="space-y-8">
      {/* Mẫu nhật ký đầu */}
      <div className="bg-slate-700/30 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <FileText className="h-6 w-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-blue-400">Mẫu nhật ký đầu</h3>
          <span className="text-sm text-slate-400">(Những trang đầu tiên của nhật ký)</span>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Area for Initial Template */}
          <div>
            <div
              className="border-2 border-dashed border-blue-500/50 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer mb-4"
              onClick={() => document.getElementById("initial-template-upload")?.click()}
              onDrop={(e) => onTemplateDrop(e, 'initial')}
              onDragOver={(e) => e.preventDefault()}
            >
              <Upload className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload file Word mẫu (Bắt buộc)</h3>
              <p className="text-blue-400 text-sm mb-2">Chỉ chấp nhận file Word (.docx)</p>
              <div className="bg-yellow-900/20 border border-yellow-600 rounded-md p-3 mb-4">
                <p className="text-yellow-400 text-sm font-medium">LƯU Ý QUAN TRỌNG:</p>
                <p className="text-yellow-300 text-sm">Trang cuối của file mẫu luôn phải là trang trắng</p>
              </div>
              <p className="text-slate-400 text-sm mb-4">Kéo thả file .docx vào đây hoặc click để chọn file</p>
              <Button className="bg-blue-600 hover:bg-blue-700">Chọn file Word (Bắt buộc)</Button>
              <input
                id="initial-template-upload"
                type="file"
                accept=".docx"
                className="hidden"
                onChange={(e) => onTemplateUpload(e, 'initial')}
              />
            </div>

            {templateErrors.initial && (
              <div className="bg-red-900/20 border border-red-600 rounded-md p-3 mt-4">
                <p className="text-red-400 text-sm">{templateErrors.initial}</p>
              </div>
            )}

            {/* Initial Templates List */}
            {templateFiles.filter(t => t.type === 'initial').length > 0 && (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-slate-300">Chọn file mẫu mặc định:</Label>
                  <Select
                    value={templateFiles.filter(t => t.type === 'initial').find(t => t.isDefault)?.id || ""}
                    onValueChange={onSetDefaultTemplate}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Chọn file mẫu làm mặc định" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {templateFiles.filter(t => t.type === 'initial').map((template) => (
                        <SelectItem key={template.id} value={template.id} className="text-white">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4" />
                            <span>{template.name}</span>
                            {template.isDefault && <span className="text-green-400">(Mặc định)</span>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-300">Danh sách file mẫu nhật ký đầu:</h4>
                  {templateFiles.filter(t => t.type === 'initial').map((template) => (
                    <div
                      key={template.id}
                      className={`bg-slate-700 rounded-lg p-4 flex items-center justify-between cursor-pointer transition-colors ${
                        selectedTemplate?.id === template.id ? 'ring-2 ring-blue-400' : 'hover:bg-slate-600'
                      }`}
                      onClick={() => onSelectTemplate(template)}
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-blue-400" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">{template.name}</p>
                            {template.isDefault && (
                              <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">Mặc định</span>
                            )}
                          </div>
                          <p className="text-sm text-slate-400">
                            {(template.size / (1024 * 1024)).toFixed(2)} MB • {template.uploadDate} • Word
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!template.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onSetDefaultTemplate(template.id)
                            }}
                            className="text-green-400 hover:text-green-300"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRemoveTemplate(template.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Info Panel for Initial Template */}
          <div className="bg-slate-700/50 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="h-6 w-6 text-blue-400" />
              <h3 className="text-lg font-medium">Mẫu nhật ký đầu</h3>
            </div>
            <p className="text-slate-300 mb-4">File Word mẫu sẽ được sử dụng làm template cho những trang đầu tiên của nhật ký thi công</p>
            <div className="bg-yellow-900/20 border border-yellow-600 rounded-md p-3 mb-6">
              <p className="text-yellow-300 text-sm font-medium">Đảm bảo trang cuối là trang trắng</p>
            </div>

            {/* Cấu hình trang ảnh */}
            <div className="border-t border-slate-600 pt-6">
              <div className="flex items-center space-x-3 mb-4">
                <Upload className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-medium text-blue-400">Cấu hình trang ảnh</h3>
              </div>

              {/* Option 1: Chọn số trang để làm file chứa ảnh mẫu */}
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-4 h-4 rounded-full bg-blue-400 flex items-center justify-center">
                    <span className="text-slate-900 text-xs font-bold">1</span>
                  </div>
                  <span className="text-blue-400 font-medium">Chọn số trang để làm file chứa ảnh mẫu</span>
                </div>
                <p className="text-slate-400 text-sm mb-3">Đây là số trang dùng để chứa các ảnh thực tế của công trình đang thi công</p>
                <div className="flex items-center space-x-3">
                  <span className="text-slate-400 text-sm">Trang số:</span>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={imageConfig.templatePage}
                    onChange={(e) => onTemplatePageChange(e.target.value)}
                    className="w-20 bg-slate-600 border-slate-500 text-white text-center"
                  />
                </div>
              </div>

              {/* Option 2: Chọn số ảnh chứa trên 1 trang */}
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-4 h-4 rounded-full bg-blue-400 flex items-center justify-center">
                    <span className="text-slate-900 text-xs font-bold">2</span>
                  </div>
                  <span className="text-blue-400 font-medium">Chọn số ảnh chứa trên 1 trang</span>
                </div>
                <p className="text-slate-400 text-sm mb-3">Số ảnh này được chèn tối đa vào 1 trang</p>
                <div className="flex items-center space-x-3">
                  <span className="text-slate-400 text-sm">Số ảnh:</span>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={imageConfig.imagesPerPage}
                    onChange={(e) => onImagesPerPageChange(e.target.value)}
                    className="w-20 bg-slate-600 border-slate-500 text-white text-center"
                  />
                </div>
              </div>

              {/* Current Configuration Display */}
              <div className="bg-green-900/20 border border-green-600 rounded-md p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-green-400 text-sm font-medium">Cấu hình hiện tại:</span>
                </div>
                <div className="text-green-300 text-sm space-y-1">
                  <div>• Trang ảnh mẫu: <span className="text-blue-400 font-medium">Trang {imageConfig.templatePage}</span></div>
                  <div>• Số ảnh trên 1 trang: <span className="text-blue-400 font-medium">{imageConfig.imagesPerPage} ảnh</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mẫu nhật ký thêm */}
      <div className="bg-slate-700/30 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <FileText className="h-6 w-6 text-green-400" />
          <h3 className="text-xl font-semibold text-green-400">Mẫu nhật ký thêm</h3>
          <span className="text-sm text-slate-400">(Báo cáo hàng ngày)</span>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Area for Daily Template */}
          <div>
            <div
              className="border-2 border-dashed border-green-500/50 rounded-lg p-8 text-center hover:border-green-400 transition-colors cursor-pointer mb-4"
              onClick={() => document.getElementById("daily-template-upload")?.click()}
              onDrop={(e) => onTemplateDrop(e, 'daily')}
              onDragOver={(e) => e.preventDefault()}
            >
              <Upload className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload file Word mẫu (Tùy chọn)</h3>
              <p className="text-green-400 text-sm mb-2">Chỉ chấp nhận file Word (.docx)</p>
              <div className="bg-blue-900/20 border border-blue-600 rounded-md p-3 mb-4">
                <p className="text-blue-400 text-sm font-medium">THÔNG TIN:</p>
                <p className="text-blue-300 text-sm">Mẫu này dùng cho báo cáo hàng ngày trong quá trình thi công</p>
              </div>
              <p className="text-slate-400 text-sm mb-4">Kéo thả file .docx vào đây hoặc click để chọn file</p>
              <Button className="bg-green-600 hover:bg-green-700">Chọn file Word (Tùy chọn)</Button>
              <input
                id="daily-template-upload"
                type="file"
                accept=".docx"
                className="hidden"
                onChange={(e) => onTemplateUpload(e, 'daily')}
              />
            </div>

            {templateErrors.daily && (
              <div className="bg-red-900/20 border border-red-600 rounded-md p-3 mt-4">
                <p className="text-red-400 text-sm">{templateErrors.daily}</p>
              </div>
            )}

            {/* Daily Templates List */}
            {templateFiles.filter(t => t.type === 'daily').length > 0 && (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-slate-300">Chọn file mẫu mặc định:</Label>
                  <Select
                    value={templateFiles.filter(t => t.type === 'daily').find(t => t.isDefault)?.id || ""}
                    onValueChange={onSetDefaultTemplate}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Chọn file mẫu làm mặc định" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {templateFiles.filter(t => t.type === 'daily').map((template) => (
                        <SelectItem key={template.id} value={template.id} className="text-white">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4" />
                            <span>{template.name}</span>
                            {template.isDefault && <span className="text-green-400">(Mặc định)</span>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-300">Danh sách file mẫu nhật ký thêm:</h4>
                  {templateFiles.filter(t => t.type === 'daily').map((template) => (
                    <div
                      key={template.id}
                      className={`bg-slate-700 rounded-lg p-4 flex items-center justify-between cursor-pointer transition-colors ${
                        selectedTemplate?.id === template.id ? 'ring-2 ring-green-400' : 'hover:bg-slate-600'
                      }`}
                      onClick={() => onSelectTemplate(template)}
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-green-400" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">{template.name}</p>
                            {template.isDefault && (
                              <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">Mặc định</span>
                            )}
                          </div>
                          <p className="text-sm text-slate-400">
                            {(template.size / (1024 * 1024)).toFixed(2)} MB • {template.uploadDate} • Word
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!template.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onSetDefaultTemplate(template.id)
                            }}
                            className="text-green-400 hover:text-green-300"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRemoveTemplate(template.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Info Panel for Daily Template */}
          <div className="bg-slate-700/50 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="h-6 w-6 text-green-400" />
              <h3 className="text-lg font-medium">Mẫu nhật ký thêm</h3>
            </div>
            <p className="text-slate-300 mb-4">File Word mẫu sẽ được sử dụng làm template cho báo cáo hàng ngày trong quá trình thi công</p>
            <div className="bg-blue-900/20 border border-blue-600 rounded-md p-3 mb-6">
              <p className="text-blue-300 text-sm font-medium">Mẫu này là tùy chọn và có thể bỏ trống</p>
            </div>

            <div className="space-y-4">
              <div className="bg-green-900/20 border border-green-600 rounded-md p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-green-400 text-sm font-medium">Tính năng:</span>
                </div>
                <div className="text-green-300 text-sm space-y-1">
                  <div>• Dùng cho báo cáo hàng ngày</div>
                  <div>• Có thể upload nhiều mẫu khác nhau</div>
                  <div>• Tùy chọn, không bắt buộc</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}