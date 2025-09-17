// Advanced export system with multiple formats and custom options
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'

// Export configuration interfaces
export interface ExportOptions {
  format: 'pdf' | 'docx' | 'xlsx' | 'png' | 'jpg' | 'html' | 'zip'
  quality?: number
  pageSize?: 'A4' | 'A3' | 'Letter' | 'Legal'
  orientation?: 'portrait' | 'landscape'
  margins?: {
    top: number
    right: number
    bottom: number
    left: number
  }
  watermark?: {
    text: string
    opacity: number
    position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    fontSize: number
    color: string
  }
  header?: {
    text: string
    fontSize: number
    alignment: 'left' | 'center' | 'right'
  }
  footer?: {
    text: string
    fontSize: number
    alignment: 'left' | 'center' | 'right'
    includePageNumbers: boolean
  }
  customCSS?: string
  includeMetadata?: boolean
  compression?: boolean
}

export interface BatchExportOptions extends ExportOptions {
  reportIds: string[]
  templateId: string
  combineIntoSingle?: boolean
  separateByReport?: boolean
  includeIndex?: boolean
}

export interface ExportResult {
  success: boolean
  filename: string
  size: number
  downloadUrl?: string
  error?: string
  metadata?: {
    pages: number
    format: string
    createdAt: string
    reportId?: string
    templateId?: string
  }
}

// Advanced export manager
export class AdvancedExportManager {
  private static instance: AdvancedExportManager

  static getInstance(): AdvancedExportManager {
    if (!AdvancedExportManager.instance) {
      AdvancedExportManager.instance = new AdvancedExportManager()
    }
    return AdvancedExportManager.instance
  }

  // Export single report with advanced options
  async exportReport(
    reportId: string,
    templateId: string,
    content: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      const startTime = Date.now()
      
      switch (options.format) {
        case 'pdf':
          return await this.exportToPDF(content, options, { reportId, templateId })
        case 'docx':
          return await this.exportToDocx(content, options, { reportId, templateId })
        case 'xlsx':
          return await this.exportToExcel(content, options, { reportId, templateId })
        case 'png':
        case 'jpg':
          return await this.exportToImage(content, options, { reportId, templateId })
        case 'html':
          return await this.exportToHTML(content, options, { reportId, templateId })
        case 'zip':
          return await this.exportToZip(reportId, templateId, content, options)
        default:
          throw new Error(`Unsupported export format: ${options.format}`)
      }
    } catch (error) {
      console.error('Export error:', error)
      return {
        success: false,
        filename: '',
        size: 0,
        error: error.message
      }
    }
  }

  // Batch export multiple reports
  async batchExport(batchOptions: BatchExportOptions): Promise<ExportResult[]> {
    const results: ExportResult[] = []
    
    if (batchOptions.combineIntoSingle) {
      // Combine all reports into single file
      return [await this.exportCombinedReports(batchOptions)]
    }

    // Export each report separately
    for (const reportId of batchOptions.reportIds) {
      try {
        // Get report content
        const content = await this.getReportContent(reportId, batchOptions.templateId)
        
        const result = await this.exportReport(
          reportId,
          batchOptions.templateId,
          content,
          batchOptions
        )
        
        results.push(result)
      } catch (error) {
        results.push({
          success: false,
          filename: `${reportId}_error`,
          size: 0,
          error: error.message,
          metadata: { reportId, templateId: batchOptions.templateId }
        })
      }
    }

    return results
  }

  // Export to PDF with advanced options
  private async exportToPDF(
    content: string,
    options: ExportOptions,
    metadata: { reportId: string; templateId: string }
  ): Promise<ExportResult> {
    const pdf = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: options.pageSize || 'A4'
    })

    // Create temporary container for rendering
    const container = document.createElement('div')
    container.innerHTML = content
    container.style.width = '210mm' // A4 width
    container.style.padding = `${options.margins?.top || 20}mm ${options.margins?.right || 20}mm ${options.margins?.bottom || 20}mm ${options.margins?.left || 20}mm`
    
    // Apply custom CSS
    if (options.customCSS) {
      const style = document.createElement('style')
      style.textContent = options.customCSS
      container.appendChild(style)
    }

    document.body.appendChild(container)

    try {
      // Convert to canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/jpeg', options.quality || 0.95)
      const imgWidth = pdf.internal.pageSize.getWidth() - (options.margins?.left || 20) - (options.margins?.right || 20)
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // Add header
      if (options.header) {
        pdf.setFontSize(options.header.fontSize || 12)
        const headerY = options.margins?.top || 20
        
        switch (options.header.alignment) {
          case 'center':
            pdf.text(options.header.text, pdf.internal.pageSize.getWidth() / 2, headerY, { align: 'center' })
            break
          case 'right':
            pdf.text(options.header.text, pdf.internal.pageSize.getWidth() - (options.margins?.right || 20), headerY, { align: 'right' })
            break
          default:
            pdf.text(options.header.text, options.margins?.left || 20, headerY)
        }
      }

      // Add main content
      const contentY = (options.header ? 30 : 0) + (options.margins?.top || 20)
      pdf.addImage(imgData, 'JPEG', options.margins?.left || 20, contentY, imgWidth, imgHeight)

      // Add watermark
      if (options.watermark) {
        this.addWatermarkToPDF(pdf, options.watermark)
      }

      // Add footer
      if (options.footer) {
        const footerY = pdf.internal.pageSize.getHeight() - (options.margins?.bottom || 20)
        pdf.setFontSize(options.footer.fontSize || 10)
        
        let footerText = options.footer.text
        if (options.footer.includePageNumbers) {
          footerText += ` - Trang ${pdf.internal.getCurrentPageInfo().pageNumber}`
        }

        switch (options.footer.alignment) {
          case 'center':
            pdf.text(footerText, pdf.internal.pageSize.getWidth() / 2, footerY, { align: 'center' })
            break
          case 'right':
            pdf.text(footerText, pdf.internal.pageSize.getWidth() - (options.margins?.right || 20), footerY, { align: 'right' })
            break
          default:
            pdf.text(footerText, options.margins?.left || 20, footerY)
        }
      }

      // Add metadata
      if (options.includeMetadata) {
        pdf.setProperties({
          title: `Báo cáo ${metadata.reportId}`,
          subject: 'Construction Report',
          author: 'Construction Report Editor',
          creator: 'Advanced Export System',
          creationDate: new Date()
        })
      }

      const filename = `report_${metadata.reportId}_${Date.now()}.pdf`
      const pdfBlob = pdf.output('blob')
      
      // Save file
      saveAs(pdfBlob, filename)

      return {
        success: true,
        filename,
        size: pdfBlob.size,
        metadata: {
          pages: pdf.internal.pages.length - 1,
          format: 'pdf',
          createdAt: new Date().toISOString(),
          reportId: metadata.reportId,
          templateId: metadata.templateId
        }
      }
    } finally {
      document.body.removeChild(container)
    }
  }

  // Export to DOCX
  private async exportToDocx(
    content: string,
    options: ExportOptions,
    metadata: { reportId: string; templateId: string }
  ): Promise<ExportResult> {
    // For DOCX export, we'll create an HTML file that can be opened in Word
    // In a real implementation, you'd use a library like docx or mammoth
    
    let docxContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Báo cáo ${metadata.reportId}</title>
        <style>
          body { 
            font-family: 'Times New Roman', serif; 
            margin: ${options.margins?.top || 20}mm ${options.margins?.right || 20}mm ${options.margins?.bottom || 20}mm ${options.margins?.left || 20}mm;
            line-height: 1.6;
          }
          @page { 
            size: ${options.pageSize || 'A4'} ${options.orientation || 'portrait'};
            margin: 0;
          }
          ${options.customCSS || ''}
        </style>
      </head>
      <body>
    `

    // Add header
    if (options.header) {
      docxContent += `<div style="text-align: ${options.header.alignment || 'left'}; font-size: ${options.header.fontSize || 12}pt; margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px;">${options.header.text}</div>`
    }

    // Add main content
    docxContent += content

    // Add footer
    if (options.footer) {
      docxContent += `<div style="text-align: ${options.footer.alignment || 'left'}; font-size: ${options.footer.fontSize || 10}pt; margin-top: 20px; border-top: 1px solid #ccc; padding-top: 10px;">${options.footer.text}</div>`
    }

    docxContent += `
      </body>
      </html>
    `

    const blob = new Blob([docxContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
    const filename = `report_${metadata.reportId}_${Date.now()}.docx`
    
    saveAs(blob, filename)

    return {
      success: true,
      filename,
      size: blob.size,
      metadata: {
        pages: 1,
        format: 'docx',
        createdAt: new Date().toISOString(),
        reportId: metadata.reportId,
        templateId: metadata.templateId
      }
    }
  }

  // Export to Excel
  private async exportToExcel(
    content: string,
    options: ExportOptions,
    metadata: { reportId: string; templateId: string }
  ): Promise<ExportResult> {
    // Parse HTML content to extract data for Excel
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, 'text/html')
    
    const workbook = XLSX.utils.book_new()
    
    // Extract tables
    const tables = doc.querySelectorAll('table')
    tables.forEach((table, index) => {
      const worksheet = XLSX.utils.table_to_sheet(table)
      XLSX.utils.book_append_sheet(workbook, worksheet, `Bảng ${index + 1}`)
    })

    // If no tables, create a sheet with text content
    if (tables.length === 0) {
      const textContent = doc.body.textContent || content
      const lines = textContent.split('\n').filter(line => line.trim())
      const data = lines.map(line => [line])
      const worksheet = XLSX.utils.aoa_to_sheet(data)
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Nội dung')
    }

    // Add metadata sheet
    if (options.includeMetadata) {
      const metadataData = [
        ['Thuộc tính', 'Giá trị'],
        ['Report ID', metadata.reportId],
        ['Template ID', metadata.templateId],
        ['Ngày tạo', new Date().toLocaleString('vi-VN')],
        ['Định dạng', 'Excel'],
        ['Người tạo', 'Construction Report Editor']
      ]
      const metadataSheet = XLSX.utils.aoa_to_sheet(metadataData)
      XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata')
    }

    const filename = `report_${metadata.reportId}_${Date.now()}.xlsx`
    XLSX.writeFile(workbook, filename)

    // Calculate approximate file size
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    
    return {
      success: true,
      filename,
      size: excelBuffer.length,
      metadata: {
        pages: workbook.SheetNames.length,
        format: 'xlsx',
        createdAt: new Date().toISOString(),
        reportId: metadata.reportId,
        templateId: metadata.templateId
      }
    }
  }

  // Export to Image (PNG/JPG)
  private async exportToImage(
    content: string,
    options: ExportOptions,
    metadata: { reportId: string; templateId: string }
  ): Promise<ExportResult> {
    const container = document.createElement('div')
    container.innerHTML = content
    container.style.width = '1200px'
    container.style.padding = '40px'
    container.style.backgroundColor = '#ffffff'
    
    if (options.customCSS) {
      const style = document.createElement('style')
      style.textContent = options.customCSS
      container.appendChild(style)
    }

    document.body.appendChild(container)

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })

      // Add watermark to canvas if specified
      if (options.watermark) {
        this.addWatermarkToCanvas(canvas, options.watermark)
      }

      const format = options.format === 'jpg' ? 'image/jpeg' : 'image/png'
      const quality = options.quality || (options.format === 'jpg' ? 0.9 : 1.0)
      
      canvas.toBlob((blob) => {
        if (blob) {
          const filename = `report_${metadata.reportId}_${Date.now()}.${options.format}`
          saveAs(blob, filename)
        }
      }, format, quality)

      const dataUrl = canvas.toDataURL(format, quality)
      const blob = await (await fetch(dataUrl)).blob()

      return {
        success: true,
        filename: `report_${metadata.reportId}_${Date.now()}.${options.format}`,
        size: blob.size,
        metadata: {
          pages: 1,
          format: options.format,
          createdAt: new Date().toISOString(),
          reportId: metadata.reportId,
          templateId: metadata.templateId
        }
      }
    } finally {
      document.body.removeChild(container)
    }
  }

  // Export to HTML
  private async exportToHTML(
    content: string,
    options: ExportOptions,
    metadata: { reportId: string; templateId: string }
  ): Promise<ExportResult> {
    let htmlContent = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Báo cáo ${metadata.reportId}</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 40px;
            line-height: 1.6;
            color: #333;
          }
          .header { 
            text-align: ${options.header?.alignment || 'center'}; 
            font-size: ${options.header?.fontSize || 18}px; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #007bff;
            padding-bottom: 15px;
          }
          .footer { 
            text-align: ${options.footer?.alignment || 'center'}; 
            font-size: ${options.footer?.fontSize || 12}px; 
            margin-top: 30px; 
            border-top: 1px solid #ccc;
            padding-top: 15px;
            color: #666;
          }
          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 48px;
            color: rgba(0,0,0,0.1);
            z-index: -1;
            pointer-events: none;
          }
          ${options.customCSS || ''}
        </style>
      </head>
      <body>
    `

    // Add watermark
    if (options.watermark) {
      htmlContent += `<div class="watermark">${options.watermark.text}</div>`
    }

    // Add header
    if (options.header) {
      htmlContent += `<div class="header">${options.header.text}</div>`
    }

    // Add main content
    htmlContent += `<div class="content">${content}</div>`

    // Add footer
    if (options.footer) {
      htmlContent += `<div class="footer">${options.footer.text}</div>`
    }

    // Add metadata
    if (options.includeMetadata) {
      htmlContent += `
        <div class="metadata" style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 5px;">
          <h3>Thông tin báo cáo</h3>
          <p><strong>Report ID:</strong> ${metadata.reportId}</p>
          <p><strong>Template ID:</strong> ${metadata.templateId}</p>
          <p><strong>Ngày tạo:</strong> ${new Date().toLocaleString('vi-VN')}</p>
          <p><strong>Định dạng:</strong> HTML</p>
        </div>
      `
    }

    htmlContent += `
      </body>
      </html>
    `

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    const filename = `report_${metadata.reportId}_${Date.now()}.html`
    
    saveAs(blob, filename)

    return {
      success: true,
      filename,
      size: blob.size,
      metadata: {
        pages: 1,
        format: 'html',
        createdAt: new Date().toISOString(),
        reportId: metadata.reportId,
        templateId: metadata.templateId
      }
    }
  }

  // Export to ZIP with multiple formats
  private async exportToZip(
    reportId: string,
    templateId: string,
    content: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    const zip = new JSZip()
    const metadata = { reportId, templateId }

    // Export to multiple formats and add to ZIP
    const formats: Array<ExportOptions['format']> = ['pdf', 'html', 'docx']
    
    for (const format of formats) {
      try {
        const formatOptions = { ...options, format }
        const result = await this.exportReport(reportId, templateId, content, formatOptions)
        
        if (result.success && result.downloadUrl) {
          // In a real implementation, you'd fetch the file content
          // For now, we'll add the HTML content
          if (format === 'html') {
            zip.file(`${reportId}.html`, content)
          }
        }
      } catch (error) {
        console.warn(`Failed to export ${format}:`, error)
      }
    }

    // Add metadata file
    const metadataContent = JSON.stringify({
      reportId,
      templateId,
      createdAt: new Date().toISOString(),
      formats: formats,
      exportOptions: options
    }, null, 2)
    
    zip.file('metadata.json', metadataContent)

    // Generate ZIP
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const filename = `report_${reportId}_complete_${Date.now()}.zip`
    
    saveAs(zipBlob, filename)

    return {
      success: true,
      filename,
      size: zipBlob.size,
      metadata: {
        pages: formats.length,
        format: 'zip',
        createdAt: new Date().toISOString(),
        reportId,
        templateId
      }
    }
  }

  // Helper methods
  private addWatermarkToPDF(pdf: jsPDF, watermark: ExportOptions['watermark']) {
    if (!watermark) return

    pdf.setTextColor(watermark.color || '#cccccc')
    pdf.setFontSize(watermark.fontSize || 48)
    
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    
    let x = pageWidth / 2
    let y = pageHeight / 2
    
    switch (watermark.position) {
      case 'top-left':
        x = 50; y = 50
        break
      case 'top-right':
        x = pageWidth - 50; y = 50
        break
      case 'bottom-left':
        x = 50; y = pageHeight - 50
        break
      case 'bottom-right':
        x = pageWidth - 50; y = pageHeight - 50
        break
    }
    
    pdf.text(watermark.text, x, y, { 
      align: 'center',
      angle: -45
    })
  }

  private addWatermarkToCanvas(canvas: HTMLCanvasElement, watermark: ExportOptions['watermark']) {
    if (!watermark) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.save()
    ctx.globalAlpha = watermark.opacity || 0.1
    ctx.font = `${watermark.fontSize || 48}px Arial`
    ctx.fillStyle = watermark.color || '#cccccc'
    ctx.textAlign = 'center'
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate(-Math.PI / 4)
    ctx.fillText(watermark.text, 0, 0)
    ctx.restore()
  }

  private async getReportContent(reportId: string, templateId: string): Promise<string> {
    // In a real implementation, this would fetch from API
    const response = await fetch(`/api/reports/${reportId}/content?templateId=${templateId}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch report content: ${response.statusText}`)
    }
    const data = await response.json()
    return data.content
  }

  private async exportCombinedReports(batchOptions: BatchExportOptions): Promise<ExportResult> {
    let combinedContent = ''
    
    // Add index if requested
    if (batchOptions.includeIndex) {
      combinedContent += '<div class="index"><h1>Mục lục</h1><ul>'
      batchOptions.reportIds.forEach((reportId, index) => {
        combinedContent += `<li><a href="#report-${reportId}">Báo cáo ${index + 1}: ${reportId}</a></li>`
      })
      combinedContent += '</ul></div><div style="page-break-after: always;"></div>'
    }

    // Combine all reports
    for (let i = 0; i < batchOptions.reportIds.length; i++) {
      const reportId = batchOptions.reportIds[i]
      try {
        const content = await this.getReportContent(reportId, batchOptions.templateId)
        combinedContent += `<div id="report-${reportId}" class="report-section">`
        combinedContent += `<h1>Báo cáo ${i + 1}: ${reportId}</h1>`
        combinedContent += content
        combinedContent += '</div>'
        
        if (i < batchOptions.reportIds.length - 1) {
          combinedContent += '<div style="page-break-after: always;"></div>'
        }
      } catch (error) {
        combinedContent += `<div class="error">Lỗi tải báo cáo ${reportId}: ${error.message}</div>`
      }
    }

    return this.exportReport(
      `combined_${batchOptions.reportIds.join('_')}`,
      batchOptions.templateId,
      combinedContent,
      batchOptions
    )
  }
}

// Export singleton instance
export const advancedExportManager = AdvancedExportManager.getInstance()

// Export utility functions
export const exportPresets = {
  highQualityPDF: {
    format: 'pdf' as const,
    quality: 0.95,
    pageSize: 'A4' as const,
    orientation: 'portrait' as const,
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    includeMetadata: true,
    compression: false
  },
  
  webOptimizedPDF: {
    format: 'pdf' as const,
    quality: 0.8,
    pageSize: 'A4' as const,
    orientation: 'portrait' as const,
    margins: { top: 15, right: 15, bottom: 15, left: 15 },
    compression: true
  },
  
  presentationImage: {
    format: 'png' as const,
    quality: 1.0,
    customCSS: `
      body { font-size: 16px; }
      h1 { font-size: 28px; }
      h2 { font-size: 24px; }
    `
  },
  
  emailFriendly: {
    format: 'html' as const,
    customCSS: `
      body { max-width: 600px; margin: 0 auto; }
      img { max-width: 100%; height: auto; }
    `,
    includeMetadata: false
  }
}

export default AdvancedExportManager