/**
 * Document Processor - Enhanced document processing capabilities
 * Handles template merging, image insertion, and document generation
 */

import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

export interface DocumentInfo {
  pageCount: number;
  wordCount: number;
  paragraphCount: number;
  hasPageBreaks: boolean;
  fileSize: number;
  fileName: string;
}

export interface ImageLayout {
  rows: number;
  cols: number;
  cellWidth: number;
  cellHeight: number;
  totalCells: number;
}

export interface TemplateConfig {
  initialTemplate?: string; // File path to initial template
  dailyTemplate?: string;   // File path to daily template
  initialPages: number;     // Number of pages from initial template
  dailyPages: number;       // Number of pages from daily template
  imagePages: number;       // Number of image pages to generate
  imagesPerPage: number;    // Number of images per page
}

export interface ReportGenerationResult {
  success: boolean;
  reportPath?: string;
  pdfPath?: string;
  pageCount: number;
  error?: string;
  details?: any;
}

export class DocumentProcessor {
  private uploadsDir: string;
  private templatesDir: string;
  private reportsDir: string;

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    this.templatesDir = path.join(process.cwd(), 'templates');
    this.reportsDir = path.join(process.cwd(), 'reports');
    
    // Ensure directories exist
    [this.uploadsDir, this.templatesDir, this.reportsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Get detailed document information
   */
  async getDocumentInfo(filePath: string): Promise<DocumentInfo> {
    try {
      const stats = fs.statSync(filePath);
      const result = await mammoth.extractRawText({ path: filePath });
      
      // Count page breaks
      const pageBreaks = (result.value.match(/\x0C/g) || []).length;
      const hasPageBreaks = pageBreaks > 0;
      
      // Count paragraphs
      const paragraphs = result.value.split('\n').filter(p => p.trim().length > 0);
      
      // Count words
      const words = result.value.split(/\s+/).filter(word => word.length > 0);
      
      // Calculate page count
      let pageCount = 1;
      if (hasPageBreaks) {
        pageCount = pageBreaks + 1;
      } else {
        // Estimate based on content
        const estimatedFromParagraphs = Math.max(1, Math.ceil(paragraphs.length / 25));
        const estimatedFromChars = Math.max(1, Math.ceil(result.value.length / 2500));
        const estimatedFromFileSize = Math.max(1, Math.ceil(stats.size / 50000));
        
        pageCount = Math.round(
          estimatedFromParagraphs * 0.4 +
          estimatedFromChars * 0.4 +
          estimatedFromFileSize * 0.2
        );
      }

      return {
        pageCount: Math.max(1, pageCount),
        wordCount: words.length,
        paragraphCount: paragraphs.length,
        hasPageBreaks,
        fileSize: stats.size,
        fileName: path.basename(filePath)
      };
    } catch (error) {
      console.error('Error getting document info:', error);
      throw new Error(`Failed to analyze document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate optimal image layout for a page
   * FIXED: Always create 2x2 grid for 4 images per page as required
   */
  calculateImageLayout(imageCount: number): ImageLayout {
    if (imageCount <= 0) {
      return { rows: 0, cols: 0, cellWidth: 0, cellHeight: 0, totalCells: 0 };
    }

    // FIXED: For construction reports, always use 2x2 grid for 4 images per page
    const rows = 2;
    const cols = 2;
    const totalCells = 4; // Always 4 cells per page
    
    // Calculate cell dimensions (in points, 1 inch = 72 points)
    // A4 page: 595 x 842 points, with margins ~50 points each side
    const pageWidth = 495; // 595 - 100 (margins)
    const pageHeight = 742; // 842 - 100 (margins)
    
    // Reserve space for title and spacing
    const titleHeight = 50;
    const spacingHeight = 20;
    const availableHeight = pageHeight - titleHeight - spacingHeight;
    
    const cellWidth = Math.floor(pageWidth / cols) - 10; // 10px spacing between cells
    const cellHeight = Math.floor(availableHeight / rows) - 10; // 10px spacing between cells

    return {
      rows,
      cols,
      cellWidth,
      cellHeight,
      totalCells
    };
  }

  /**
   * Generate a complete report from templates and configuration
   */
  async generateReport(config: TemplateConfig, reportId: string): Promise<ReportGenerationResult> {
    try {
      console.log('Starting report generation with config:', config);
      
      const reportFileName = `report_${reportId}_${Date.now()}.docx`;
      const reportPath = path.join(this.reportsDir, reportFileName);
      
      // For now, we'll create a simple merged document
      // In a full implementation, this would use ONLYOFFICE Document Builder
      
      let totalPages = 0;
      const documentParts: string[] = [];
      
      // Process initial template
      if (config.initialTemplate && fs.existsSync(config.initialTemplate)) {
        const initialInfo = await this.getDocumentInfo(config.initialTemplate);
        totalPages += initialInfo.pageCount;
        documentParts.push(`Initial Template: ${initialInfo.fileName} (${initialInfo.pageCount} pages)`);
      }
      
      // Process daily template
      if (config.dailyTemplate && fs.existsSync(config.dailyTemplate)) {
        const dailyInfo = await this.getDocumentInfo(config.dailyTemplate);
        totalPages += dailyInfo.pageCount;
        documentParts.push(`Daily Template: ${dailyInfo.fileName} (${dailyInfo.pageCount} pages)`);
      }
      
      // Add image pages - FIXED: Ensure we create exactly the requested number of image pages
      if (config.imagePages > 0) {
        totalPages += config.imagePages;
        const layout = this.calculateImageLayout(config.imagesPerPage);
        documentParts.push(`Image Pages: ${config.imagePages} pages (${layout.rows}x${layout.cols} layout, ${config.imagesPerPage} images per page)`);
        
        // Generate image page content for each page
        for (let i = 1; i <= config.imagePages; i++) {
          const imagePageContent = await this.createImagePage(layout, i);
          documentParts.push(`Image Page ${i} Content Generated`);
        }
      }
      
      // Create a simple text report for now (in production, this would be a proper DOCX)
      const reportContent = [
        'CONSTRUCTION REPORT',
        '==================',
        '',
        `Generated on: ${new Date().toLocaleString('vi-VN')}`,
        `Report ID: ${reportId}`,
        `Total Pages: ${totalPages}`,
        '',
        'Document Structure:',
        ...documentParts.map(part => `- ${part}`),
        '',
        'Configuration:',
        `- Initial Pages: ${config.initialPages}`,
        `- Daily Pages: ${config.dailyPages}`,
        `- Image Pages: ${config.imagePages}`,
        `- Images Per Page: ${config.imagesPerPage}`,
        '',
        'Note: This is a mock report. In production, this would be generated using ONLYOFFICE Document Server.',
      ].join('\n');
      
      // Write the report file
      fs.writeFileSync(reportPath, reportContent, 'utf8');
      
      console.log(`Report generated successfully: ${reportPath}`);
      
      return {
        success: true,
        reportPath,
        pageCount: totalPages,
        details: {
          documentParts,
          config
        }
      };
      
    } catch (error) {
      console.error('Error generating report:', error);
      return {
        success: false,
        pageCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create image page template
   * FIXED: Create proper HTML structure for image pages with 4 cells (2x2 grid)
   */
  async createImagePage(layout: ImageLayout, pageNumber: number): Promise<string> {
    const { rows, cols, cellWidth, cellHeight } = layout;
    
    // Create a proper HTML template for image page with better styling
    const imagePageContent = [
      `<div class="image-page" style="page-break-before: always; padding: 20px;">`,
      `<h2 style="text-align: center; margin-bottom: 20px; font-family: 'Times New Roman', serif; font-size: 16px; font-weight: bold;">`,
      `TRANG ẢNH ${pageNumber}`,
      `</h2>`,
      `<table style="width: 100%; border-collapse: collapse; margin: 0 auto; table-layout: fixed;">`,
    ];
    
    // Create exactly 4 cells in 2x2 grid
    for (let row = 0; row < rows; row++) {
      imagePageContent.push('<tr>');
      for (let col = 0; col < cols; col++) {
        const cellIndex = row * cols + col + 1;
        const globalImageIndex = (pageNumber - 1) * 4 + cellIndex; // Global image numbering across pages
        
        imagePageContent.push(
          `<td style="border: 2px solid #333; width: ${cellWidth}px; height: ${cellHeight}px; text-align: center; vertical-align: middle; padding: 10px; position: relative;">`,
          `<div class="image-placeholder" style="width: 100%; height: 100%; border: 1px dashed #999; display: flex; flex-direction: column; justify-content: center; align-items: center; background-color: #f9f9f9;">`,
          `<div style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 5px;">Ảnh ${globalImageIndex}</div>`,
          `<div style="font-size: 12px; color: #666;">Kích thước: ${cellWidth}x${cellHeight}px</div>`,
          `<div style="font-size: 10px; color: #999; margin-top: 5px;">Nhấp để chèn ảnh</div>`,
          `</div>`,
          `</td>`
        );
      }
      imagePageContent.push('</tr>');
    }
    
    imagePageContent.push('</table>');
    imagePageContent.push('</div>');
    
    return imagePageContent.join('\n');
  }

  /**
   * Validate template file
   */
  async validateTemplate(filePath: string): Promise<{ valid: boolean; error?: string; info?: DocumentInfo }> {
    try {
      if (!fs.existsSync(filePath)) {
        return { valid: false, error: 'Template file not found' };
      }
      
      if (!filePath.toLowerCase().endsWith('.docx')) {
        return { valid: false, error: 'Only DOCX files are supported' };
      }
      
      const info = await this.getDocumentInfo(filePath);
      
      if (info.pageCount === 0) {
        return { valid: false, error: 'Template appears to be empty' };
      }
      
      return { valid: true, info };
      
    } catch (error) {
      return { 
        valid: false, 
        error: `Template validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Clean up old report files
   */
  async cleanupOldReports(maxAgeHours: number = 24): Promise<number> {
    try {
      const files = fs.readdirSync(this.reportsDir);
      const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
      let deletedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(this.reportsDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
      
      console.log(`Cleaned up ${deletedCount} old report files`);
      return deletedCount;
      
    } catch (error) {
      console.error('Error cleaning up old reports:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const documentProcessor = new DocumentProcessor();