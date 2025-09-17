'use client'

import React, { useState, useEffect } from 'react'
import { advancedExportManager, ExportOptions, BatchExportOptions, exportPresets } from '@/lib/advanced-export'

interface AdvancedExportDialogProps {
  isOpen: boolean
  onClose: () => void
  reportId?: string
  templateId: string
  content?: string
  reportIds?: string[] // For batch export
}

export default function AdvancedExportDialog({
  isOpen,
  onClose,
  reportId,
  templateId,
  content,
  reportIds
}: AdvancedExportDialogProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    quality: 0.9,
    pageSize: 'A4',
    orientation: 'portrait',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    includeMetadata: true
  })

  const [batchOptions, setBatchOptions] = useState<Partial<BatchExportOptions>>({
    combineIntoSingle: false,
    separateByReport: true,
    includeIndex: true
  })

  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportResults, setExportResults] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'single' | 'batch' | 'advanced'>('single')

  const isBatchMode = reportIds && reportIds.length > 1

  useEffect(() => {
    if (isBatchMode) {
      setActiveTab('batch')
    }
  }, [isBatchMode])

  const handleExport = async () => {
    if (!reportId && !reportIds?.length) return

    setIsExporting(true)
    setExportProgress(0)
    setExportResults([])

    try {
      if (isBatchMode && reportIds) {
        // Batch export
        const fullBatchOptions: BatchExportOptions = {
          ...exportOptions,
          ...batchOptions,
          reportIds,
          templateId
        }

        const results = await advancedExportManager.batchExport(fullBatchOptions)
        setExportResults(results)
      } else if (reportId && content) {
        // Single export
        const result = await advancedExportManager.exportReport(
          reportId,
          templateId,
          content,
          exportOptions
        )
        setExportResults([result])
      }
    } catch (error) {
      console.error('Export error:', error)
      setExportResults([{
        success: false,
        filename: '',
        size: 0,
        error: error.message
      }])
    } finally {
      setIsExporting(false)
      setExportProgress(100)
    }
  }

  const applyPreset = (presetName: keyof typeof exportPresets) => {
    setExportOptions({ ...exportOptions, ...exportPresets[presetName] })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isBatchMode ? 'Xuất Hàng Loạt' : 'Xuất Báo Cáo Nâng Cao'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b mb-6">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'single' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('single')}
            disabled={isBatchMode}
          >
            Xuất Đơn
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'batch' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('batch')}
          >
            Xuất Hàng Loạt
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'advanced' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('advanced')}
          >
            Tùy Chọn Nâng Cao
          </button>
        </div>

        {/* Export Presets */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Preset Xuất File</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => applyPreset('highQualityPDF')}
              className="p-3 border rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="font-medium">PDF Chất Lượng Cao</div>
              <div className="text-sm text-gray-500">A4, 95% quality</div>
            </button>
            <button
              onClick={() => applyPreset('webOptimizedPDF')}
              className="p-3 border rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="font-medium">PDF Web</div>
              <div className="text-sm text-gray-500">Tối ưu kích thước</div>
            </button>
            <button
              onClick={() => applyPreset('presentationImage')}
              className="p-3 border rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="font-medium">Hình Ảnh Trình Bày</div>
              <div className="text-sm text-gray-500">PNG chất lượng cao</div>
            </button>
            <button
              onClick={() => applyPreset('emailFriendly')}
              className="p-3 border rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="font-medium">Email HTML</div>
              <div className="text-sm text-gray-500">Tối ưu email</div>
            </button>
          </div>
        </div>

        {/* Single Export Tab */}
        {activeTab === 'single' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Định Dạng
                </label>
                <select
                  value={exportOptions.format}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    format: e.target.value as ExportOptions['format']
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="pdf">PDF</option>
                  <option value="docx">Word (DOCX)</option>
                  <option value="xlsx">Excel (XLSX)</option>
                  <option value="png">PNG Image</option>
                  <option value="jpg">JPG Image</option>
                  <option value="html">HTML</option>
                  <option value="zip">ZIP (Tất cả định dạng)</option>
                </select>
              </div>

              {/* Page Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kích Thước Trang
                </label>
                <select
                  value={exportOptions.pageSize}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    pageSize: e.target.value as ExportOptions['pageSize']
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="A4">A4</option>
                  <option value="A3">A3</option>
                  <option value="Letter">Letter</option>
                  <option value="Legal">Legal</option>
                </select>
              </div>

              {/* Orientation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hướng Trang
                </label>
                <select
                  value={exportOptions.orientation}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    orientation: e.target.value as ExportOptions['orientation']
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="portrait">Dọc</option>
                  <option value="landscape">Ngang</option>
                </select>
              </div>

              {/* Quality */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chất Lượng: {Math.round((exportOptions.quality || 0.9) * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={exportOptions.quality || 0.9}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    quality: parseFloat(e.target.value)
                  })}
                  className="w-full"
                />
              </div>
            </div>

            {/* Margins */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lề Trang (mm)
              </label>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Trên</label>
                  <input
                    type="number"
                    value={exportOptions.margins?.top || 20}
                    onChange={(e) => setExportOptions({
                      ...exportOptions,
                      margins: {
                        ...exportOptions.margins,
                        top: parseInt(e.target.value)
                      }
                    })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Phải</label>
                  <input
                    type="number"
                    value={exportOptions.margins?.right || 20}
                    onChange={(e) => setExportOptions({
                      ...exportOptions,
                      margins: {
                        ...exportOptions.margins,
                        right: parseInt(e.target.value)
                      }
                    })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Dưới</label>
                  <input
                    type="number"
                    value={exportOptions.margins?.bottom || 20}
                    onChange={(e) => setExportOptions({
                      ...exportOptions,
                      margins: {
                        ...exportOptions.margins,
                        bottom: parseInt(e.target.value)
                      }
                    })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Trái</label>
                  <input
                    type="number"
                    value={exportOptions.margins?.left || 20}
                    onChange={(e) => setExportOptions({
                      ...exportOptions,
                      margins: {
                        ...exportOptions.margins,
                        left: parseInt(e.target.value)
                      }
                    })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Batch Export Tab */}
        {activeTab === 'batch' && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                Xuất Hàng Loạt: {reportIds?.length || 0} báo cáo
              </h4>
              <div className="text-sm text-blue-700">
                {reportIds?.map((id, index) => (
                  <span key={id}>
                    {id}{index < (reportIds.length - 1) ? ', ' : ''}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={batchOptions.combineIntoSingle}
                    onChange={(e) => setBatchOptions({
                      ...batchOptions,
                      combineIntoSingle: e.target.checked
                    })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Gộp thành 1 file</span>
                </label>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={batchOptions.includeIndex}
                    onChange={(e) => setBatchOptions({
                      ...batchOptions,
                      includeIndex: e.target.checked
                    })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Bao gồm mục lục</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Tab */}
        {activeTab === 'advanced' && (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h4 className="font-medium mb-3">Header</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Nội dung header"
                  value={exportOptions.header?.text || ''}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    header: {
                      ...exportOptions.header,
                      text: e.target.value,
                      fontSize: exportOptions.header?.fontSize || 12,
                      alignment: exportOptions.header?.alignment || 'center'
                    }
                  })}
                  className="p-2 border border-gray-300 rounded-md"
                />
                <select
                  value={exportOptions.header?.alignment || 'center'}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    header: {
                      ...exportOptions.header,
                      text: exportOptions.header?.text || '',
                      fontSize: exportOptions.header?.fontSize || 12,
                      alignment: e.target.value as 'left' | 'center' | 'right'
                    }
                  })}
                  className="p-2 border border-gray-300 rounded-md"
                >
                  <option value="left">Trái</option>
                  <option value="center">Giữa</option>
                  <option value="right">Phải</option>
                </select>
                <input
                  type="number"
                  placeholder="Font size"
                  value={exportOptions.header?.fontSize || 12}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    header: {
                      ...exportOptions.header,
                      text: exportOptions.header?.text || '',
                      alignment: exportOptions.header?.alignment || 'center',
                      fontSize: parseInt(e.target.value)
                    }
                  })}
                  className="p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Footer */}
            <div>
              <h4 className="font-medium mb-3">Footer</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Nội dung footer"
                  value={exportOptions.footer?.text || ''}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    footer: {
                      ...exportOptions.footer,
                      text: e.target.value,
                      fontSize: exportOptions.footer?.fontSize || 10,
                      alignment: exportOptions.footer?.alignment || 'center',
                      includePageNumbers: exportOptions.footer?.includePageNumbers || false
                    }
                  })}
                  className="p-2 border border-gray-300 rounded-md"
                />
                <select
                  value={exportOptions.footer?.alignment || 'center'}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    footer: {
                      ...exportOptions.footer,
                      text: exportOptions.footer?.text || '',
                      fontSize: exportOptions.footer?.fontSize || 10,
                      includePageNumbers: exportOptions.footer?.includePageNumbers || false,
                      alignment: e.target.value as 'left' | 'center' | 'right'
                    }
                  })}
                  className="p-2 border border-gray-300 rounded-md"
                >
                  <option value="left">Trái</option>
                  <option value="center">Giữa</option>
                  <option value="right">Phải</option>
                </select>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.footer?.includePageNumbers || false}
                    onChange={(e) => setExportOptions({
                      ...exportOptions,
                      footer: {
                        ...exportOptions.footer,
                        text: exportOptions.footer?.text || '',
                        fontSize: exportOptions.footer?.fontSize || 10,
                        alignment: exportOptions.footer?.alignment || 'center',
                        includePageNumbers: e.target.checked
                      }
                    })}
                    className="rounded"
                  />
                  <span className="text-sm">Số trang</span>
                </label>
              </div>
            </div>

            {/* Watermark */}
            <div>
              <h4 className="font-medium mb-3">Watermark</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nội dung watermark"
                  value={exportOptions.watermark?.text || ''}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    watermark: {
                      ...exportOptions.watermark,
                      text: e.target.value,
                      opacity: exportOptions.watermark?.opacity || 0.1,
                      position: exportOptions.watermark?.position || 'center',
                      fontSize: exportOptions.watermark?.fontSize || 48,
                      color: exportOptions.watermark?.color || '#cccccc'
                    }
                  })}
                  className="p-2 border border-gray-300 rounded-md"
                />
                <select
                  value={exportOptions.watermark?.position || 'center'}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    watermark: {
                      ...exportOptions.watermark,
                      text: exportOptions.watermark?.text || '',
                      opacity: exportOptions.watermark?.opacity || 0.1,
                      fontSize: exportOptions.watermark?.fontSize || 48,
                      color: exportOptions.watermark?.color || '#cccccc',
                      position: e.target.value as any
                    }
                  })}
                  className="p-2 border border-gray-300 rounded-md"
                >
                  <option value="center">Giữa</option>
                  <option value="top-left">Trên trái</option>
                  <option value="top-right">Trên phải</option>
                  <option value="bottom-left">Dưới trái</option>
                  <option value="bottom-right">Dưới phải</option>
                </select>
              </div>
            </div>

            {/* Custom CSS */}
            <div>
              <h4 className="font-medium mb-3">Custom CSS</h4>
              <textarea
                placeholder="Nhập CSS tùy chỉnh..."
                value={exportOptions.customCSS || ''}
                onChange={(e) => setExportOptions({
                  ...exportOptions,
                  customCSS: e.target.value
                })}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm"
              />
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeMetadata || false}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    includeMetadata: e.target.checked
                  })}
                  className="rounded"
                />
                <span className="text-sm">Bao gồm metadata</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={exportOptions.compression || false}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    compression: e.target.checked
                  })}
                  className="rounded"
                />
                <span className="text-sm">Nén file</span>
              </label>
            </div>
          </div>
        )}

        {/* Export Progress */}
        {isExporting && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Đang xuất...</span>
              <span className="text-sm text-gray-500">{exportProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Export Results */}
        {exportResults.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium mb-3">Kết Quả Xuất File</h4>
            <div className="space-y-2">
              {exportResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {result.success ? '✅' : '❌'} {result.filename || 'Export failed'}
                      </div>
                      {result.success && (
                        <div className="text-sm text-gray-600">
                          Kích thước: {(result.size / 1024).toFixed(1)} KB
                          {result.metadata && (
                            <span> • {result.metadata.pages} trang • {result.metadata.format.toUpperCase()}</span>
                          )}
                        </div>
                      )}
                      {result.error && (
                        <div className="text-sm text-red-600">{result.error}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Đóng
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || (!reportId && !reportIds?.length)}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? 'Đang xuất...' : 'Xuất File'}
          </button>
        </div>
      </div>
    </div>
  )
}