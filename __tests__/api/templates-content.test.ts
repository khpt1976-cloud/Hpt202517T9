import { GET } from '@/app/api/templates/content/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs'

// Mock dependencies
jest.mock('@/lib/prisma')
jest.mock('fs')
jest.mock('mammoth', () => ({
  convertToHtml: jest.fn().mockResolvedValue({
    value: '<p>Mock HTML content</p>',
    messages: []
  })
}))
jest.mock('@/lib/docx-page-split', () => ({
  splitDocxIntoPagesHtml: jest.fn().mockResolvedValue([
    '<p>Page 1 content</p>',
    '<p>Page 2 content</p>'
  ])
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockFs = fs as jest.Mocked<typeof fs>

describe('/api/templates/content', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return error when templateId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates/content')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('templateId parameter is required')
    })

    it('should return error when template is not found', async () => {
      mockPrisma.templateFile.findUnique.mockResolvedValue(null)
      
      const request = new NextRequest('http://localhost:3000/api/templates/content?templateId=nonexistent')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Template not found')
    })

    it('should return HTML content for HTML template', async () => {
      const mockTemplate = {
        id: 'template-1',
        name: 'Test Template',
        fileUrl: '/templates/test.html',
        pageCount: 1
      }
      
      mockPrisma.templateFile.findUnique.mockResolvedValue(mockTemplate)
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValue('<html><body>Test HTML</body></html>')
      
      const request = new NextRequest('http://localhost:3000/api/templates/content?templateId=template-1')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.templateId).toBe('template-1')
      expect(data.data.name).toBe('Test Template')
      expect(data.data.content).toBe('<html><body>Test HTML</body></html>')
      expect(data.data.contentType).toBe('html')
    })

    it('should return full DOCX content when no pageNumber specified', async () => {
      const mockTemplate = {
        id: 'template-2',
        name: 'DOCX Template',
        fileUrl: '/templates/test.docx',
        pageCount: 3
      }
      
      mockPrisma.templateFile.findUnique.mockResolvedValue(mockTemplate)
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValue(Buffer.from('mock docx content'))
      
      const request = new NextRequest('http://localhost:3000/api/templates/content?templateId=template-2')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.templateId).toBe('template-2')
      expect(data.data.content).toBe('<p>Mock HTML content</p>')
      expect(data.data.contentType).toBe('html')
      expect(data.data.pageCount).toBe(3)
    })

    it('should return specific page content when pageNumber is specified', async () => {
      const mockTemplate = {
        id: 'template-3',
        name: 'Multi-page DOCX',
        fileUrl: '/templates/multipage.docx',
        pageCount: 2
      }
      
      mockPrisma.templateFile.findUnique.mockResolvedValue(mockTemplate)
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValue(Buffer.from('mock docx content'))
      
      const request = new NextRequest('http://localhost:3000/api/templates/content?templateId=template-3&pageNumber=2')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.content).toBe('<p>Page 2 content</p>')
      expect(data.data.currentPage).toBe(2)
      expect(data.data.totalPagesInSplit).toBe(2)
    })

    it('should return error for unsupported file type', async () => {
      const mockTemplate = {
        id: 'template-4',
        name: 'Unsupported Template',
        fileUrl: '/templates/test.pdf',
        pageCount: 1
      }
      
      mockPrisma.templateFile.findUnique.mockResolvedValue(mockTemplate)
      mockFs.existsSync.mockReturnValue(true)
      
      const request = new NextRequest('http://localhost:3000/api/templates/content?templateId=template-4')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Unsupported file type')
    })

    it('should handle file system errors gracefully', async () => {
      const mockTemplate = {
        id: 'template-5',
        name: 'Error Template',
        fileUrl: '/templates/error.html',
        pageCount: 1
      }
      
      mockPrisma.templateFile.findUnique.mockResolvedValue(mockTemplate)
      mockFs.existsSync.mockReturnValue(false)
      
      const request = new NextRequest('http://localhost:3000/api/templates/content?templateId=template-5')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Template file not found on disk')
    })

    it('should handle database errors', async () => {
      mockPrisma.templateFile.findUnique.mockRejectedValue(new Error('Database connection failed'))
      
      const request = new NextRequest('http://localhost:3000/api/templates/content?templateId=template-6')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to load template content')
    })
  })
})