import fs from 'fs'
import path from 'path'

// ONLYOFFICE Document Server configuration
const ONLYOFFICE_URL = process.env.ONLYOFFICE_URL || 'http://localhost:8080'
const ONLYOFFICE_JWT_SECRET = process.env.ONLYOFFICE_JWT_SECRET || ''
const APP_BASE_URL = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_BASE_URL || ''

export interface DocumentInfo {
  title: string
  url: string
  fileType: string
  key: string
}

export interface ConversionRequest {
  async: boolean
  filetype: string
  key: string
  outputtype: string
  title: string
  url: string
}

export interface ConversionResponse {
  endConvert: boolean
  fileUrl?: string
  percent: number
  error?: string
}

export interface DocumentBuilderRequest {
  async: boolean
  key: string
  url: string
  outputtype: string
  title: string
  builder: string // JavaScript code for Document Builder
}

export class OnlyOfficeService {
  private baseUrl: string
  private jwtSecret: string

  constructor() {
    this.baseUrl = ONLYOFFICE_URL
    this.jwtSecret = ONLYOFFICE_JWT_SECRET
  }

  /**
   * Convert document from one format to another
   */
  async convertDocument(
    inputFilePath: string,
    outputFormat: string,
    outputFilePath?: string
  ): Promise<string> {
    try {
      // Upload file to ONLYOFFICE
      const uploadedUrl = await this.uploadFile(inputFilePath)
      
      // Get file info
      const fileName = path.basename(inputFilePath)
      const fileExtension = path.extname(fileName).substring(1)
      const key = this.generateKey(fileName)

      // Conversion request
      const conversionRequest: ConversionRequest = {
        async: false,
        filetype: fileExtension,
        key: key,
        outputtype: outputFormat,
        title: fileName,
        url: uploadedUrl
      }

      // Send conversion request
      const response = await fetch(`${this.baseUrl}/ConvertService.ashx`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(conversionRequest),
        signal: AbortSignal.timeout(30000) // 30 seconds
      })

      const responseData = await response.json()

      if (responseData.error) {
        throw new Error(`Conversion error: ${responseData.error}`)
      }

      if (!responseData.endConvert) {
        throw new Error('Conversion not completed')
      }

      // Download converted file
      if (responseData.fileUrl) {
        const convertedFilePath = outputFilePath || 
          inputFilePath.replace(path.extname(inputFilePath), `.${outputFormat}`)
        
        await this.downloadFile(responseData.fileUrl, convertedFilePath)
        return convertedFilePath
      }

      throw new Error('No converted file URL returned')
    } catch (error) {
      console.error('Document conversion error:', error)
      throw error
    }
  }

  /**
   * Get document information (page count, etc.)
   */
  async getDocumentInfo(filePath: string): Promise<any> {
    try {
      // Convert to PDF to get page count
      const pdfPath = await this.convertDocument(filePath, 'pdf')
      
      // Use Document Builder to analyze PDF
      const builderScript = `
        builder.OpenFile("${pdfPath}");
        var oDocument = Api.GetDocument();
        var pageCount = oDocument.GetPagesCount();
        
        // Create result document
        var oNewDocument = Api.CreateDocument();
        var oParagraph = oNewDocument.GetElement(0);
        oParagraph.AddText("Page Count: " + pageCount);
        
        builder.SaveFile("json", "result.json");
        builder.CloseFile();
      `

      const result = await this.executeDocumentBuilder(builderScript, 'result.json')
      
      return {
        pageCount: this.extractPageCount(result),
        filePath: filePath,
        pdfPath: pdfPath
      }
    } catch (error) {
      console.error('Error getting document info:', error)
      throw error
    }
  }

  /**
   * Create document with images using Document Builder
   */
  async createDocumentWithImages(
    templatePath: string,
    images: Array<{ url: string; description?: string }>,
    outputPath: string,
    layout: { rows: number; cols: number; cellWidth: number; cellHeight: number }
  ): Promise<string> {
    try {
      const builderScript = this.generateImageLayoutScript(templatePath, images, layout)
      
      return await this.executeDocumentBuilder(builderScript, outputPath)
    } catch (error) {
      console.error('Error creating document with images:', error)
      throw error
    }
  }

  /**
   * Execute Document Builder script
   */
  private async executeDocumentBuilder(script: string, outputFileName: string): Promise<string> {
    try {
      const key = this.generateKey(outputFileName)
      
      const builderRequest: DocumentBuilderRequest = {
        async: false,
        key: key,
        url: '', // Empty for builder scripts
        outputtype: 'docx',
        title: outputFileName,
        builder: script
      }

      const response = await fetch(`${this.baseUrl}/docbuilder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(builderRequest),
        signal: AbortSignal.timeout(60000) // 60 seconds for complex operations
      })

      const responseData = await response.json()

      if (responseData.error) {
        throw new Error(`Document Builder error: ${responseData.error}`)
      }

      if (responseData.fileUrl) {
        const outputPath = path.join(process.cwd(), 'uploads', outputFileName)
        await this.downloadFile(responseData.fileUrl, outputPath)
        return outputPath
      }

      throw new Error('No output file URL returned from Document Builder')
    } catch (error) {
      console.error('Document Builder execution error:', error)
      throw error
    }
  }

  /**
   * Generate Document Builder script for image layout
   */
  private generateImageLayoutScript(
    templatePath: string,
    images: Array<{ url: string; description?: string }>,
    layout: { rows: number; cols: number; cellWidth: number; cellHeight: number }
  ): string {
    const { rows, cols, cellWidth, cellHeight } = layout
    
    return `
      builder.CreateFile("docx");
      var oDocument = Api.GetDocument();
      
      // Add title
      var oTitle = oDocument.GetElement(0);
      oTitle.AddText("Construction Report Images");
      oTitle.SetBold(true);
      oTitle.SetFontSize(16);
      
      // Create table for images
      var oTable = Api.CreateTable(${cols}, ${rows});
      oTable.SetWidth("percent", 100);
      
      var imageIndex = 0;
      
      // Fill table with images
      for (var row = 0; row < ${rows}; row++) {
        for (var col = 0; col < ${cols}; col++) {
          if (imageIndex < ${images.length}) {
            var oCell = oTable.GetCell(row, col);
            var oCellParagraph = oCell.GetContent().GetElement(0);
            
            try {
              // Add image
              var oDrawing = Api.CreateImage("${images[0]?.url || ''}", ${cellWidth * 635}, ${cellHeight * 635});
              oCellParagraph.AddDrawing(oDrawing);
              
              // Add description if available
              ${images[0]?.description ? `
              oCellParagraph.AddLineBreak();
              oCellParagraph.AddText("${images[0].description}");
              ` : ''}
            } catch (e) {
              oCellParagraph.AddText("Image " + (imageIndex + 1) + " - Error loading");
            }
            
            imageIndex++;
          }
        }
      }
      
      // Add table to document
      oDocument.Push(oTable);
      
      builder.SaveFile("docx", "output.docx");
      builder.CloseFile();
    `
  }

  /**
   * Upload file to ONLYOFFICE server
   */
  private async uploadFile(filePath: string): Promise<string> {
    // ONLYOFFICE ConvertService expects a URL it can pull from. We will serve the file from our app.
    // Ensure the file is under uploads; if not, copy it there.
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads')
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
      const fileName = path.basename(filePath)
      const target = path.join(uploadsDir, fileName)
      if (!fs.existsSync(target)) {
        fs.copyFileSync(filePath, target)
      }
      if (!APP_BASE_URL) throw new Error('APP_BASE_URL is not configured')
      // Our route to serve files: /uploads/<file>
      return `${APP_BASE_URL}/uploads/${encodeURIComponent(fileName)}`
    } catch (error) {
      console.error('File upload error:', error)
      throw error
    }
  }

  /**
   * Download file from URL
   */
  private async downloadFile(url: string, outputPath: string): Promise<void> {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(30000)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Ensure directory exists
      const dir = path.dirname(outputPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      const buffer = await response.arrayBuffer()
      fs.writeFileSync(outputPath, Buffer.from(buffer))
    } catch (error) {
      console.error('File download error:', error)
      throw error
    }
  }

  /**
   * Generate unique key for document
   */
  private generateKey(fileName: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2)
    return `${fileName}_${timestamp}_${random}`
  }

  /**
   * Extract page count from Document Builder result
   */
  private extractPageCount(result: string): number {
    try {
      // Parse result to extract page count
      // This is a simplified implementation
      const match = result.match(/Page Count: (\d+)/)
      return match ? parseInt(match[1]) : 1
    } catch (error) {
      console.error('Error extracting page count:', error)
      return 1
    }
  }

  /**
   * Check if ONLYOFFICE server is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try multiple endpoints to check ONLYOFFICE availability
      const endpoints = [
        `${this.baseUrl}/healthcheck`,
        `${this.baseUrl}/`,
        `${this.baseUrl}/welcome`
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'GET',
            signal: AbortSignal.timeout(3000)
          });
          
          if (response.ok || response.status === 404) {
            // 404 is also acceptable as it means server is responding
            console.log(`ONLYOFFICE server responding at: ${endpoint}`);
            return true;
          }
        } catch (endpointError) {
          // Continue to next endpoint
          continue;
        }
      }
      
      return false;
    } catch (error) {
      console.error('ONLYOFFICE health check failed:', error);
      return false;
    }
  }

  /**
   * Get server status with detailed information
   */
  async getServerStatus(): Promise<{
    available: boolean;
    url: string;
    version?: string;
    error?: string;
  }> {
    try {
      const isAvailable = await this.healthCheck();
      
      if (!isAvailable) {
        return {
          available: false,
          url: this.baseUrl,
          error: 'Server not responding'
        };
      }

      // Try to get version info
      try {
        const response = await fetch(`${this.baseUrl}/info`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        });
        
        if (response.ok) {
          const info = await response.json();
          return {
            available: true,
            url: this.baseUrl,
            version: info.version || 'Unknown'
          };
        }
      } catch (versionError) {
        // Version info not available, but server is responding
      }

      return {
        available: true,
        url: this.baseUrl
      };
      
    } catch (error) {
      return {
        available: false,
        url: this.baseUrl,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const onlyOfficeService = new OnlyOfficeService()