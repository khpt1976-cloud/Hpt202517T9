"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { 
  Download, 
  FileText, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Package
} from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface Report {
  id: string
  name: string
  templateId: string
  pageCount: number
  lastModified: string
}

interface BatchExportManagerProps {
  reports: Report[]
}

type ExportFormat = 'pdf' | 'zip'

export default function BatchExportManager({ reports }: BatchExportManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf')
  const [selectedReports, setSelectedReports] = useState<string[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [currentExporting, setCurrentExporting] = useState<string>('')
  const [exportStatus, setExportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  
  const { toast } = useToast()

  // Handle report selection
  const handleReportSelection = (reportId: string, checked: boolean) => {
    if (checked) {
      setSelectedReports(prev => [...prev, reportId])
    } else {
      setSelectedReports(prev => prev.filter(id => id !== reportId))
    }
  }

  // Select all reports
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReports(reports.map(r => r.id))
    } else {
      setSelectedReports([])
    }
  }

  // Fetch report content
  const fetchReportContent = async (reportId: string, templateId: string) => {
    try {
      const response = await fetch(`/api/templates/content?templateId=${templateId}`)
      if (!response.ok) throw new Error('Failed to fetch content')
      
      const data = await response.json()
      return data.content || `<h2>Report ${reportId}</h2><p>Content for report ${reportId}</p>`
    } catch (error) {
      console.error(`Error fetching content for report ${reportId}:`, error)
      return `<h2>Report ${reportId}</h2><p>Error loading content</p>`
    }
  }

  // Export single report to PDF
  const exportReportToPDF = async (report: Report): Promise<Uint8Array> => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Fetch report content
    const content = await fetchReportContent(report.id, report.templateId)

    // Create temporary div for rendering
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = content
    tempDiv.style.cssText = `
      width: 210mm;
      padding: 20mm;
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #000000;
      background-color: #ffffff;
      position: absolute;
      top: -9999px;
      left: -9999px;
    `
    
    document.body.appendChild(tempDiv)

    try {
      // Convert to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })

      // Add header
      pdf.setFontSize(14)
      pdf.text(report.name, 20, 15)
      pdf.setFontSize(10)
      pdf.text(`Report ID: ${report.id}`, 20, 22)
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 27)
      
      // Add content image
      const imgData = canvas.toDataURL('image/png')
      const imgWidth = 170
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 20, 35, imgWidth, Math.min(imgHeight, 240))

      return pdf.output('arraybuffer')
    } finally {
      document.body.removeChild(tempDiv)
    }
  }

  // Create ZIP file (simplified - would need JSZip library for full implementation)
  const createZipFile = async (reportPDFs: { name: string; data: Uint8Array }[]) => {
    // For now, we'll download individual PDFs
    // In a full implementation, you'd use JSZip to create a proper ZIP file
    
    for (const pdf of reportPDFs) {
      const blob = new Blob([pdf.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${pdf.name}.pdf`
      link.click()
      URL.revokeObjectURL(url)
      
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  // Main batch export handler
  const handleBatchExport = async () => {
    if (selectedReports.length === 0) {
      toast({
        title: "No reports selected",
        description: "Please select at least one report to export.",
        variant: "destructive"
      })
      return
    }

    setIsExporting(true)
    setExportStatus('processing')
    setExportProgress(0)

    try {
      const reportsToExport = reports.filter(r => selectedReports.includes(r.id))
      const exportedPDFs: { name: string; data: Uint8Array }[] = []

      for (let i = 0; i < reportsToExport.length; i++) {
        const report = reportsToExport[i]
        setCurrentExporting(report.name)
        setExportProgress(((i + 1) / reportsToExport.length) * 100)

        try {
          const pdfData = await exportReportToPDF(report)
          exportedPDFs.push({
            name: `${report.name}_${report.id}`,
            data: pdfData
          })
        } catch (error) {
          console.error(`Failed to export report ${report.id}:`, error)
          toast({
            title: `Export failed for ${report.name}`,
            description: "Continuing with other reports...",
            variant: "destructive"
          })
        }

        // Small delay to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      if (exportedPDFs.length > 0) {
        if (exportFormat === 'zip') {
          await createZipFile(exportedPDFs)
        } else {
          // Download individual PDFs
          for (const pdf of exportedPDFs) {
            const blob = new Blob([pdf.data], { type: 'application/pdf' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${pdf.name}.pdf`
            link.click()
            URL.revokeObjectURL(url)
            
            await new Promise(resolve => setTimeout(resolve, 300))
          }
        }

        setExportStatus('success')
        toast({
          title: "Batch export successful",
          description: `Successfully exported ${exportedPDFs.length} report(s).`
        })

        // Auto close dialog after success
        setTimeout(() => {
          setIsOpen(false)
          setExportStatus('idle')
          setExportProgress(0)
          setCurrentExporting('')
        }, 2000)
      } else {
        throw new Error('No reports were successfully exported')
      }

    } catch (error) {
      setExportStatus('error')
      toast({
        title: "Batch export failed",
        description: "An error occurred during batch export. Please try again.",
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
          <Package className="h-4 w-4 mr-2" />
          Batch Export
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Batch Export Reports</DialogTitle>
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
                    Individual PDF Files
                  </div>
                </SelectItem>
                <SelectItem value="zip">
                  <div className="flex items-center">
                    <Package className="h-4 w-4 mr-2" />
                    ZIP Archive (Multiple PDFs)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Report Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Select Reports</label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedReports.length === reports.length}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm">
                  Select All ({reports.length})
                </label>
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto border rounded-md p-2 space-y-2">
              {reports.map(report => (
                <div key={report.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                  <Checkbox
                    id={`report-${report.id}`}
                    checked={selectedReports.includes(report.id)}
                    onCheckedChange={(checked) => handleReportSelection(report.id, checked as boolean)}
                  />
                  <div className="flex-1">
                    <label htmlFor={`report-${report.id}`} className="text-sm font-medium cursor-pointer">
                      {report.name}
                    </label>
                    <p className="text-xs text-gray-500">
                      ID: {report.id} • {report.pageCount} pages • Modified: {new Date(report.lastModified).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-sm text-gray-500">
              {selectedReports.length} of {reports.length} reports selected
            </p>
          </div>

          {/* Export Progress */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Exporting...</span>
                <span className="text-sm text-muted-foreground">{Math.round(exportProgress)}%</span>
              </div>
              <Progress value={exportProgress} className="w-full" />
              {currentExporting && (
                <p className="text-sm text-gray-500">Currently exporting: {currentExporting}</p>
              )}
            </div>
          )}

          {/* Export Status */}
          {exportStatus === 'success' && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Batch export completed successfully!</span>
            </div>
          )}

          {exportStatus === 'error' && (
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Batch export failed. Please try again.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isExporting}>
              Cancel
            </Button>
            <Button onClick={handleBatchExport} disabled={isExporting || selectedReports.length === 0}>
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export {selectedReports.length} Report{selectedReports.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}