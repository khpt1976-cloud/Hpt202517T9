import { GET, POST } from '@/app/api/templates/save-content/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs'

// Mock dependencies
jest.mock('@/lib/prisma')
jest.mock('fs')

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockFs = fs as jest.Mocked<typeof fs>

describe('/api/templates/save-content', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST', () => {
    it('should save content successfully with all parameters', async () => {
      const mockTemplate = {
        id: 'template-1',
        name: 'Test Template',
        fileUrl: '/templates/test.docx',
        pageCount: 3
      }
      
      mockPrisma.templateFile.findUnique.mockResolvedValue(mockTemplate)
      mockFs.existsSync.mockReturnValue(true)
      mockFs.mkdirSync.mockReturnValue(undefined)
      mockFs.writeFileSync.mockReturnValue(undefined)
      
      const requestBody = {
        templateId: 'template-1',
        reportId: 'report-123',
        pageNumber: 2,
        content: '<p>Edited content for page 2</p>'
      }
      
      const request = new NextRequest('http://localhost:3000/api/templates/save-content', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.templateId).toBe('template-1')
      expect(data.data.reportId).toBe('report-123')
      expect(data.data.pageNumber).toBe(2)
      expect(data.data.savedAt).toBeDefined()
      expect(data.data.filePath).toBe('report-123_template-1_2.json')
      
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('report-123_template-1_2.json'),
        expect.stringContaining('"content":"<p>Edited content for page 2</p>"')
      )
    })

    it('should save content with default values when optional parameters are missing', async () => {
      const mockTemplate = {
        id: 'template-2',
        name: 'Another Template',
        fileUrl: '/templates/another.docx',
        pageCount: 1
      }
      
      mockPrisma.templateFile.findUnique.mockResolvedValue(mockTemplate)
      mockFs.existsSync.mockReturnValue(true)
      mockFs.writeFileSync.mockReturnValue(undefined)
      
      const requestBody = {
        templateId: 'template-2',
        content: '<p>Basic content</p>'
      }
      
      const request = new NextRequest('http://localhost:3000/api/templates/save-content', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.filePath).toBe('default_template-2_all.json')
    })

    it('should create directory if it does not exist', async () => {
      const mockTemplate = {
        id: 'template-3',
        name: 'Test Template',
        fileUrl: '/templates/test.docx',
        pageCount: 1
      }
      
      mockPrisma.templateFile.findUnique.mockResolvedValue(mockTemplate)
      mockFs.existsSync.mockReturnValue(false)
      mockFs.mkdirSync.mockReturnValue(undefined)
      mockFs.writeFileSync.mockReturnValue(undefined)
      
      const requestBody = {
        templateId: 'template-3',
        content: '<p>Test content</p>'
      }
      
      const request = new NextRequest('http://localhost:3000/api/templates/save-content', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      await POST(request)
      
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('edited-content'),
        { recursive: true }
      )
    })

    it('should return error when templateId is missing', async () => {
      const requestBody = {
        content: '<p>Content without template ID</p>'
      }
      
      const request = new NextRequest('http://localhost:3000/api/templates/save-content', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('templateId and content are required')
    })

    it('should return error when content is missing', async () => {
      const requestBody = {
        templateId: 'template-4'
      }
      
      const request = new NextRequest('http://localhost:3000/api/templates/save-content', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('templateId and content are required')
    })

    it('should return error when template is not found', async () => {
      mockPrisma.templateFile.findUnique.mockResolvedValue(null)
      
      const requestBody = {
        templateId: 'nonexistent-template',
        content: '<p>Content for nonexistent template</p>'
      }
      
      const request = new NextRequest('http://localhost:3000/api/templates/save-content', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Template not found')
    })

    it('should handle file system errors', async () => {
      const mockTemplate = {
        id: 'template-5',
        name: 'Error Template',
        fileUrl: '/templates/error.docx',
        pageCount: 1
      }
      
      mockPrisma.templateFile.findUnique.mockResolvedValue(mockTemplate)
      mockFs.existsSync.mockReturnValue(true)
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('File system error')
      })
      
      const requestBody = {
        templateId: 'template-5',
        content: '<p>Content that will fail to save</p>'
      }
      
      const request = new NextRequest('http://localhost:3000/api/templates/save-content', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to save template content')
    })
  })

  describe('GET', () => {
    it('should return saved content successfully', async () => {
      const mockSavedData = {
        templateId: 'template-1',
        reportId: 'report-123',
        pageNumber: 2,
        content: '<p>Previously saved content</p>',
        timestamp: '2025-08-31T10:00:00.000Z'
      }
      
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockSavedData))
      
      const request = new NextRequest('http://localhost:3000/api/templates/save-content?templateId=template-1&reportId=report-123&pageNumber=2')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockSavedData)
    })

    it('should use default values for optional parameters', async () => {
      const mockSavedData = {
        templateId: 'template-2',
        content: '<p>Default saved content</p>'
      }
      
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockSavedData))
      
      const request = new NextRequest('http://localhost:3000/api/templates/save-content?templateId=template-2')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockFs.existsSync).toHaveBeenCalledWith(
        expect.stringContaining('default_template-2_all.json')
      )
    })

    it('should return error when templateId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates/save-content')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('templateId parameter is required')
    })

    it('should return error when saved content file does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false)
      
      const request = new NextRequest('http://localhost:3000/api/templates/save-content?templateId=template-3')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('No edited content found')
    })

    it('should handle JSON parsing errors', async () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValue('invalid-json')
      
      const request = new NextRequest('http://localhost:3000/api/templates/save-content?templateId=template-4')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to load saved content')
    })
  })
})