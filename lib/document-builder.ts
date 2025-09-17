import { onlyOfficeService } from './onlyoffice'
import path from 'path'
import fs from 'fs'
import { Document as DocxDocument, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'

export interface ImageLayoutConfig {
  rows: number
  cols: number
  cellWidth: number
  cellHeight: number
  spacing: number
}

export interface ReportImage {
  url: string
  description?: string
  originalFilename?: string
  positionIndex?: number
}

export interface TemplateConfig {
  // Prefer fileUrl from DB; fall back to legacy id-based naming
  initial_template_fileUrl?: string
  daily_template_fileUrl?: string
  initial_template_id?: string
  daily_template_id?: string
  initial_pages?: number
  daily_pages?: number
  total_daily_copies: number
}

export interface ReportGenerationConfig {
  reportName: string
  reportDate: string
  weather?: string
  temperature?: string
  templateConfig: TemplateConfig
  imageConfig: {
    template_page: number
    images_per_page: number
    total_images: number
    layout: ImageLayoutConfig
  }
  images: ReportImage[]
}

export class DocumentBuilder {
  private uploadsDir: string

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'uploads')
    this.ensureUploadsDir()
  }

  /**
   * Generate complete construction report
   */
  async generateReport(config: ReportGenerationConfig): Promise<string> {
    try {
      console.log('🏗️ Starting report generation:', config.reportName)

      // Step 1: Process initial template
      const initialDocPath = await this.processInitialTemplate(config)
      
      // Step 2: Process daily templates
      const dailyDocPaths = await this.processDailyTemplates(config)
      
      // Step 3: Generate image pages
      const imagePagePaths = await this.generateImagePages(config)
      
      // Step 4: Combine all documents
      const finalReportPath = await this.combineDocuments(
        config.reportName,
        [initialDocPath, ...dailyDocPaths, ...imagePagePaths]
      )

      console.log('✅ Report generation completed:', finalReportPath)
      return finalReportPath

    } catch (error) {
      console.error('❌ Error generating report:', error)
      throw error
    }
  }

  /**
   * Process initial template with report data
   */
  private async processInitialTemplate(config: ReportGenerationConfig): Promise<string> {
    const templatePath = this.resolveTemplatePath(config.templateConfig.initial_template_fileUrl, config.templateConfig.initial_template_id)
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Initial template not found: ${templatePath}`)
    }

    const builderScript = this.generateInitialTemplateScript(config, templatePath)
    const outputFileName = `initial_${config.reportName.replace(/\s+/g, '_')}.docx`
    const outputPath = path.join(this.uploadsDir, outputFileName)

    await this.executeBuilderScript(builderScript, outputPath)
    return outputPath
  }

  /**
   * Process daily templates
   */
  private async processDailyTemplates(config: ReportGenerationConfig): Promise<string[]> {
    const templatePath = this.resolveTemplatePath(config.templateConfig.daily_template_fileUrl, config.templateConfig.daily_template_id)
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Daily template not found: ${templatePath}`)
    }

    const dailyPaths: string[] = []
    for (let i = 0; i < config.templateConfig.total_daily_copies; i++) {
      const builderScript = this.generateDailyTemplateScript(config, templatePath, i + 1)
      const outputFileName = `daily_${i + 1}_${config.reportName.replace(/\s+/g, '_')}.docx`
      const outputPath = path.join(this.uploadsDir, outputFileName)
      await this.executeBuilderScript(builderScript, outputPath)
      dailyPaths.push(outputPath)
    }
    return dailyPaths
  }

  /**
   * Generate image pages with grid layout
   */
  private async generateImagePages(config: ReportGenerationConfig): Promise<string[]> {
    const { images, imageConfig } = config
    const { layout, images_per_page } = imageConfig
    
    if (!images || images.length === 0) {
      return []
    }

    const imagePagePaths: string[] = []
    const totalPages = Math.ceil(images.length / images_per_page)

    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const startIndex = pageIndex * images_per_page
      const endIndex = Math.min(startIndex + images_per_page, images.length)
      const pageImages = images.slice(startIndex, endIndex)

      const builderScript = this.generateImagePageScript(
        config.reportName,
        pageImages,
        layout,
        pageIndex + 1,
        totalPages
      )

      const outputFileName = `images_page_${pageIndex + 1}_${config.reportName.replace(/\s+/g, '_')}.docx`
      const outputPath = path.join(this.uploadsDir, outputFileName)

      await this.executeBuilderScript(builderScript, outputPath)
      imagePagePaths.push(outputPath)
    }

    return imagePagePaths
  }

  /**
   * Combine multiple documents into one
   */
  private async combineDocuments(reportName: string, documentPaths: string[]): Promise<string> {
    if (documentPaths.length === 0) {
      throw new Error('No documents to combine')
    }

    if (documentPaths.length === 1) {
      return documentPaths[0]
    }

    const builderScript = this.generateCombineDocumentsScript(documentPaths)
    
    const outputFileName = `final_${reportName.replace(/\s+/g, '_')}_${Date.now()}.docx`
    const outputPath = path.join(this.uploadsDir, outputFileName)

    await this.executeBuilderScript(builderScript, outputPath)
    
    // Clean up temporary files
    documentPaths.forEach(docPath => {
      try {
        if (fs.existsSync(docPath)) {
          fs.unlinkSync(docPath)
        }
      } catch (error) {
        console.warn('Warning: Could not delete temporary file:', docPath)
      }
    })

    return outputPath
  }

  /**
   * Generate Document Builder script for initial template
   */
  private generateInitialTemplateScript(config: ReportGenerationConfig, templatePath: string): string {
    return `
      builder.OpenFile("${templatePath}");
      var oDocument = Api.GetDocument();
      
      // Replace placeholders in template
      var aSearch = oDocument.Search("{{REPORT_NAME}}");
      for (var i = 0; i < aSearch.length; i++) {
        aSearch[i].GetParent().ReplaceByText("${config.reportName}");
      }
      
      aSearch = oDocument.Search("{{REPORT_DATE}}");
      for (var i = 0; i < aSearch.length; i++) {
        aSearch[i].GetParent().ReplaceByText("${config.reportDate}");
      }
      
      aSearch = oDocument.Search("{{WEATHER}}");
      for (var i = 0; i < aSearch.length; i++) {
        aSearch[i].GetParent().ReplaceByText("${config.weather || 'N/A'}");
      }
      
      aSearch = oDocument.Search("{{TEMPERATURE}}");
      for (var i = 0; i < aSearch.length; i++) {
        aSearch[i].GetParent().ReplaceByText("${config.temperature || 'N/A'}");
      }
      
      builder.SaveFile("docx", "output.docx");
      builder.CloseFile();
    `
  }

  /**
   * Generate Document Builder script for daily template
   */
  private generateDailyTemplateScript(
    config: ReportGenerationConfig, 
    templatePath: string, 
    copyNumber: number
  ): string {
    return `
      builder.OpenFile("${templatePath}");
      var oDocument = Api.GetDocument();
      
      // Replace placeholders
      var aSearch = oDocument.Search("{{REPORT_NAME}}");
      for (var i = 0; i < aSearch.length; i++) {
        aSearch[i].GetParent().ReplaceByText("${config.reportName} - Phần ${copyNumber}");
      }
      
      aSearch = oDocument.Search("{{REPORT_DATE}}");
      for (var i = 0; i < aSearch.length; i++) {
        aSearch[i].GetParent().ReplaceByText("${config.reportDate}");
      }
      
      aSearch = oDocument.Search("{{COPY_NUMBER}}");
      for (var i = 0; i < aSearch.length; i++) {
        aSearch[i].GetParent().ReplaceByText("${copyNumber}");
      }
      
      builder.SaveFile("docx", "output.docx");
      builder.CloseFile();
    `
  }

  /**
   * Generate Document Builder script for image page
   */
  private generateImagePageScript(
    reportName: string,
    images: ReportImage[],
    layout: ImageLayoutConfig,
    pageNumber: number,
    totalPages: number
  ): string {
    const { rows, cols, cellWidth, cellHeight } = layout
    
    return `
      builder.CreateFile("docx");
      var oDocument = Api.GetDocument();
      
      // Add page header
      var oTitle = oDocument.GetElement(0);
      oTitle.AddText("${reportName} - Hình ảnh thi công (Trang ${pageNumber}/${totalPages})");
      oTitle.SetBold(true);
      oTitle.SetFontSize(14);
      oTitle.SetJc("center");
      
      // Add spacing
      var oSpacing = Api.CreateParagraph();
      oSpacing.AddLineBreak();
      oDocument.Push(oSpacing);
      
      // Create table for images
      var actualRows = Math.ceil(${images.length} / ${cols});
      var oTable = Api.CreateTable(${cols}, actualRows);
      oTable.SetWidth("percent", 100);
      
      var imageIndex = 0;
      
      // Fill table with images
      for (var row = 0; row < actualRows && imageIndex < ${images.length}; row++) {
        for (var col = 0; col < ${cols} && imageIndex < ${images.length}; col++) {
          var oCell = oTable.GetCell(row, col);
          var oCellParagraph = oCell.GetContent().GetElement(0);
          oCellParagraph.SetJc("center");
          
          try {
            // Add image placeholder (actual image loading would need file access)
            oCellParagraph.AddText("Hình ảnh " + (imageIndex + 1));
            oCellParagraph.SetBold(true);
            
            // Add description if available
            ${images.map((img, idx) => `
            if (imageIndex === ${idx}) {
              oCellParagraph.AddLineBreak();
              oCellParagraph.AddText("${img.description || `Hình ảnh ${idx + 1}`}");
            }
            `).join('')}
            
          } catch (e) {
            oCellParagraph.AddText("Lỗi tải hình ảnh " + (imageIndex + 1));
          }
          
          imageIndex++;
        }
      }
      
      // Add table to document
      oDocument.Push(oTable);
      
      // Add footer
      var oFooter = Api.CreateParagraph();
      oFooter.AddLineBreak();
      oFooter.AddText("Tổng số hình ảnh: ${images.length}");
      oFooter.SetJc("center");
      oFooter.SetFontSize(10);
      oDocument.Push(oFooter);
      
      builder.SaveFile("docx", "output.docx");
      builder.CloseFile();
    `
  }

  /**
   * Generate Document Builder script to combine documents
   */
  private generateCombineDocumentsScript(documentPaths: string[]): string {
    return `
      // Open first document as base
      builder.OpenFile("${documentPaths[0]}");
      var oDocument = Api.GetDocument();
      
      ${documentPaths.slice(1).map((docPath, index) => `
      // Add page break and append document ${index + 2}
      var oPageBreak = Api.CreateParagraph();
      oPageBreak.AddPageBreak();
      oDocument.Push(oPageBreak);
      
      // Note: Actual document merging would require more complex logic
      var oAppendParagraph = Api.CreateParagraph();
      oAppendParagraph.AddText("--- Nội dung từ tài liệu ${index + 2} ---");
      oAppendParagraph.SetBold(true);
      oDocument.Push(oAppendParagraph);
      `).join('')}
      
      builder.SaveFile("docx", "output.docx");
      builder.CloseFile();
    `
  }

  /**
   * Execute Document Builder script
   */
  private async executeBuilderScript(script: string, outputPath: string): Promise<void> {
    try {
      // Minimal valid DOCX using docx package as a stopgap until ONLYOFFICE Builder is wired
      const doc = new DocxDocument({
        sections: [
          {
            children: [
              new Paragraph({
                text: 'Nhật ký thi công',
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph(''),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Generated at: ' }),
                  new TextRun({ text: new Date().toISOString(), bold: true }),
                ],
              }),
              new Paragraph(''),
              new Paragraph({ text: 'Tài liệu này được tạo tạm thời bằng thư viện docx.' }),
            ],
          },
        ],
      })

      const dir = path.dirname(outputPath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

      const buffer = await Packer.toBuffer(doc)
      fs.writeFileSync(outputPath, buffer)
      console.log('📄 Generated DOCX:', path.basename(outputPath))
    } catch (error) {
      console.error('Error executing builder script:', error)
      throw error
    }
  }

  /**
   * Resolve template file path from DB fileUrl or legacy id
   */
  private resolveTemplatePath(fileUrl?: string, legacyId?: string): string {
    if (fileUrl) {
      const p1 = path.join(process.cwd(), 'public', fileUrl)
      const p2 = path.join(process.cwd(), 'templates', path.basename(fileUrl))
      if (fs.existsSync(p1)) return p1
      if (fs.existsSync(p2)) return p2
    }
    if (legacyId) {
      const p3 = path.join(process.cwd(), 'templates', `${legacyId}.docx`)
      if (fs.existsSync(p3)) return p3
    }
    // final fallback to templates directory if legacy id looks like a filename
    if (legacyId && legacyId.endsWith('.docx')) {
      const p4 = path.join(process.cwd(), 'templates', path.basename(legacyId))
      if (fs.existsSync(p4)) return p4
    }
    // return a path that will fail upstream with clear message
    return path.join(process.cwd(), 'templates', path.basename(fileUrl || legacyId || 'missing.docx'))
  }

  private ensureUploadsDir(): void {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true })
    }
  }

  /**
   * Get document page count
   */
  async getDocumentPageCount(filePath: string): Promise<number> {
    try {
      const info = await onlyOfficeService.getDocumentInfo(filePath)
      return info.pageCount || 1
    } catch (error) {
      console.error('Error getting page count:', error)
      return 1
    }
  }

  /**
   * Convert document to PDF
   */
  async convertToPdf(docxPath: string): Promise<string> {
    try {
      const pdfPath = docxPath.replace('.docx', '.pdf')
      await onlyOfficeService.convertDocument(docxPath, 'pdf', pdfPath)
      return pdfPath
    } catch (error) {
      console.error('Error converting to PDF:', error)
      throw error
    }
  }
}

// Export singleton instance
export const documentBuilder = new DocumentBuilder()