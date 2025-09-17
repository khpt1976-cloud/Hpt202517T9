"use client"

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { 
  Download, 
  FileText, 
  Image, 
  Printer, 
  Mail, 
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface PageData {
  id: string
  content: string
  pageNumber: number
}

interface ExportManagerProps {
  reportId: string
  pages: PageData[]
  currentPage: number
  totalPages: number
}

type ExportFormat = 'pdf' | 'png' | 'print'
type ExportScope = 'current' | 'all' | 'selected' | 'range'

export default function ExportManager({ 
  reportId, 
  pages, 
  currentPage, 
  totalPages 
}: ExportManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf')
  const [exportScope, setExportScope] = useState<ExportScope>('current')
  const [selectedPages, setSelectedPages] = useState<number[]>([])
  const [pageRange, setPageRange] = useState({ from: 1, to: totalPages })
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportStatus, setExportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  
  const { toast } = useToast()
  const printRef = useRef<HTMLDivElement>(null)

  // Handle page selection for 'selected' scope
  const handlePageSelection = (pageNumber: number, checked: boolean) => {
    if (checked) {
      setSelectedPages(prev => [...prev, pageNumber].sort((a, b) => a - b))
    } else {
      setSelectedPages(prev => prev.filter(p => p !== pageNumber))
    }
  }

  // Get pages to export based on scope
  const getPagesToExport = (): PageData[] => {
    switch (exportScope) {
      case 'current':
        return pages.filter(p => p.pageNumber === currentPage + 1)
      case 'all':
        return pages
      case 'selected':
        return pages.filter(p => selectedPages.includes(p.pageNumber))
      case 'range':
        return pages.filter(p => p.pageNumber >= pageRange.from && p.pageNumber <= pageRange.to)
      default:
        return []
    }
  }

  // Export to PDF using jsPDF
  const exportToPDF = async (pagesToExport: PageData[]) => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      let isFirstPage = true

      for (let i = 0; i < pagesToExport.length; i++) {
        const pageData = pagesToExport[i]
        setExportProgress(((i + 1) / pagesToExport.length) * 100)

        if (!isFirstPage) {
          pdf.addPage()
        }

        // Create temporary div for rendering - UNIFIED CSS with web display
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = pageData.content || `<h2>Page ${pageData.pageNumber}</h2><p>Content for page ${pageData.pageNumber}</p>`
        tempDiv.className = 'construction-report-page'
        tempDiv.style.cssText = `
          position: absolute;
          top: -9999px;
          left: -9999px;
        `
        
        document.body.appendChild(tempDiv)

        try {
          // CREATE CUSTOM CANVAS WITH FIXED SQUARE IMAGES
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')!
          
          // A4 size in pixels (at 150 DPI)
          canvas.width = 1240  // 210mm
          canvas.height = 1754 // 297mm
          
          // Fill white background
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          
          // Draw title
          ctx.fillStyle = '#1d4ed8'
          ctx.font = 'bold 24px Arial'
          ctx.textAlign = 'center'
          ctx.fillText('Báo cáo thi công', canvas.width / 2, 100)
          
          ctx.fillStyle = '#000000'
          ctx.font = '16px Arial'
          ctx.fillText(`Trang ${pageData.pageNumber}`, canvas.width / 2, 130)
          ctx.fillText('Hình ảnh thi công', canvas.width / 2, 160)
          
          // Get all images from the page
          const images = tempDiv.querySelectorAll('.image-slot img') as NodeListOf<HTMLImageElement>
          
          // Fixed square size (70mm = ~260px at 150 DPI)
          const squareSize = 260
          const gap = 20
          const startX = (canvas.width - (squareSize * 2 + gap)) / 2
          const startY = 200
          
          // Draw 4 perfect squares
          const positions = [
            { x: startX, y: startY },                    // Top left
            { x: startX + squareSize + gap, y: startY }, // Top right
            { x: startX, y: startY + squareSize + gap }, // Bottom left
            { x: startX + squareSize + gap, y: startY + squareSize + gap } // Bottom right
          ]
          
          // WAIT FOR ALL IMAGES TO LOAD THEN DRAW PERFECT SQUARES
          const imagePromises = Array.from(images).map((img, i) => {
            return new Promise<void>((resolve) => {
              if (img && img.src) {
                if (img.complete) {
                  resolve()
                } else {
                  img.onload = () => resolve()
                  img.onerror = () => resolve()
                  // Timeout after 5 seconds
                  setTimeout(() => resolve(), 5000)
                }
              } else {
                resolve()
              }
            })
          })
          
          // Wait for all images to load
          await Promise.all(imagePromises)
          
          // Now draw each image as PERFECT SQUARE
          for (let i = 0; i < Math.min(images.length, 4); i++) {
            const img = images[i]
            const pos = positions[i]
            
            // ALWAYS draw perfect square background first
            ctx.fillStyle = '#f8fafc'
            ctx.fillRect(pos.x, pos.y, squareSize, squareSize)
            
            if (img && img.src && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
              // FORCE DRAW IMAGE AS EXACT SQUARE - NO SCALING CALCULATION
              ctx.drawImage(img, pos.x, pos.y, squareSize, squareSize)
            } else {
              // Add placeholder text for empty slots
              ctx.fillStyle = '#9ca3af'
              ctx.font = '14px Arial'
              ctx.textAlign = 'center'
              ctx.fillText(`Ảnh ${i + 1}`, pos.x + squareSize/2, pos.y + squareSize/2)
            }
            
            // ALWAYS draw border for PERFECT square
            ctx.strokeStyle = '#e5e7eb'
            ctx.lineWidth = 2
            ctx.strokeRect(pos.x, pos.y, squareSize, squareSize)
          }

          // Add to PDF
          const imgData = canvas.toDataURL('image/png')
          const imgWidth = 170 // A4 width minus margins
          const imgHeight = (canvas.height * imgWidth) / canvas.width

          // Add page header
          pdf.setFontSize(10)
          pdf.text(`${reportId} - Page ${pageData.pageNumber}`, 20, 15)
          
          // Add image
          pdf.addImage(imgData, 'PNG', 20, 25, imgWidth, Math.min(imgHeight, 250))
        } finally {
          document.body.removeChild(tempDiv)
        }

        isFirstPage = false
        
        // Small delay to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Download PDF
      const fileName = `${reportId}_export_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)

      return { success: true, fileName }
    } catch (error) {
      console.error('PDF export error:', error)
      throw error
    }
  }

  // Export to PNG
  const exportToPNG = async (pagesToExport: PageData[]) => {
    try {
      for (let i = 0; i < pagesToExport.length; i++) {
        const pageData = pagesToExport[i]
        setExportProgress(((i + 1) / pagesToExport.length) * 100)

        // Create temporary div - UNIFIED CSS with web display
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = pageData.content || `<h2>Page ${pageData.pageNumber}</h2><p>Content for page ${pageData.pageNumber}</p>`
        tempDiv.className = 'construction-report-page'
        tempDiv.style.cssText = `
          position: absolute;
          top: -9999px;
          left: -9999px;
        `
        
        document.body.appendChild(tempDiv)

        try {
          const canvas = await html2canvas(tempDiv, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            imageTimeout: 15000,
            removeContainer: true,
            foreignObjectRendering: true,
            onclone: (clonedDoc) => {
              // Ensure all images are visible in cloned document
              const images = clonedDoc.querySelectorAll('img')
              images.forEach(img => {
                img.style.display = 'block'
                img.style.visibility = 'visible'
                img.style.opacity = '1'
                img.style.maxWidth = '100%'
                img.style.height = 'auto'
              })
            }
          })

          // Download PNG
          const link = document.createElement('a')
          link.download = `${reportId}_page_${pageData.pageNumber}.png`
          link.href = canvas.toDataURL('image/png')
          link.click()
        } finally {
          document.body.removeChild(tempDiv)
        }

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      return { success: true, count: pagesToExport.length }
    } catch (error) {
      console.error('PNG export error:', error)
      throw error
    }
  }

  // Print functionality
  const handlePrint = () => {
    const pagesToPrint = getPagesToExport()
    
    // Create print content
    const printContent = pagesToPrint.map(page => `
      <div style="page-break-after: always; padding: 20mm; font-family: Arial, sans-serif;">
        <h3 style="margin-bottom: 20px;">${reportId} - Page ${page.pageNumber}</h3>
        ${page.content || `<p>Content for page ${page.pageNumber}</p>`}
      </div>
    `).join('')

    // Open print window
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${reportId} - Print</title>
            <style>
              @media print {
                body { margin: 0; }
                .page-break { page-break-after: always; }
              }
              body { font-family: Arial, sans-serif; }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  // Main export handler
  const handleExport = async () => {
    const pagesToExport = getPagesToExport()
    
    if (pagesToExport.length === 0) {
      toast({
        title: "No pages selected",
        description: "Please select at least one page to export.",
        variant: "destructive"
      })
      return
    }

    setIsExporting(true)
    setExportStatus('processing')
    setExportProgress(0)

    try {
      let result

      switch (exportFormat) {
        case 'pdf':
          result = await exportToPDF(pagesToExport)
          break
        case 'png':
          result = await exportToPNG(pagesToExport)
          break
        case 'print':
          handlePrint()
          result = { success: true }
          break
        default:
          throw new Error('Unsupported export format')
      }

      if (result.success) {
        setExportStatus('success')
        toast({
          title: "Export successful",
          description: `Successfully exported ${pagesToExport.length} page(s) as ${exportFormat.toUpperCase()}.`
        })
        
        // Auto close dialog after success
        setTimeout(() => {
          setIsOpen(false)
          setExportStatus('idle')
          setExportProgress(0)
        }, 2000)
      }
    } catch (error) {
      setExportStatus('error')
      toast({
        title: "Export failed",
        description: "An error occurred during export. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Report</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Export Format */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Export Format</label>
            <Select value={exportFormat} onValueChange={(value: ExportFormat) => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    PDF Document
                  </div>
                </SelectItem>
                <SelectItem value="png">
                  <div className="flex items-center">
                    <Image className="h-4 w-4 mr-2" />
                    PNG Images
                  </div>
                </SelectItem>
                <SelectItem value="print">
                  <div className="flex items-center">
                    <Printer className="h-4 w-4 mr-2" />
                    Print Preview
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export Scope */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Pages to Export</label>
            <Select value={exportScope} onValueChange={(value: ExportScope) => setExportScope(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Page ({currentPage + 1})</SelectItem>
                <SelectItem value="all">All Pages (1-{totalPages})</SelectItem>
                <SelectItem value="selected">Selected Pages</SelectItem>
                <SelectItem value="range">Page Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Page Selection */}
          {exportScope === 'selected' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Pages</label>
              <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <div key={pageNum} className="flex items-center space-x-2">
                    <Checkbox
                      id={`page-${pageNum}`}
                      checked={selectedPages.includes(pageNum)}
                      onCheckedChange={(checked) => handlePageSelection(pageNum, checked as boolean)}
                    />
                    <label htmlFor={`page-${pageNum}`} className="text-sm">
                      {pageNum}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Page Range */}
          {exportScope === 'range' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Page Range</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={pageRange.from}
                  onChange={(e) => setPageRange(prev => ({ ...prev, from: parseInt(e.target.value) || 1 }))}
                  className="w-20 px-2 py-1 border rounded text-sm"
                />
                <span className="text-sm">to</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={pageRange.to}
                  onChange={(e) => setPageRange(prev => ({ ...prev, to: parseInt(e.target.value) || totalPages }))}
                  className="w-20 px-2 py-1 border rounded text-sm"
                />
              </div>
            </div>
          )}

          {/* Export Progress */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Exporting...</span>
                <span className="text-sm text-muted-foreground">{Math.round(exportProgress)}%</span>
              </div>
              <Progress value={exportProgress} className="w-full" />
            </div>
          )}

          {/* Export Status */}
          {exportStatus === 'success' && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Export completed successfully!</span>
            </div>
          )}

          {exportStatus === 'error' && (
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Export failed. Please try again.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isExporting}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}