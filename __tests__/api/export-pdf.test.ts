import { GET, POST } from '@/app/api/export/pdf/route'
import { NextRequest } from 'next/server'

describe('/api/export/pdf', () => {
  describe('POST', () => {
    it('should return success with valid parameters', async () => {
      const requestBody = {
        reportId: 'report-123',
        pages: ['page1', 'page2', 'page3'],
        format: 'pdf'
      }
      
      const request = new NextRequest('http://localhost:3000/api/export/pdf', {
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
      expect(data.message).toBe('PDF export data prepared')
      expect(data.data.reportId).toBe('report-123')
      expect(data.data.pages).toEqual(['page1', 'page2', 'page3'])
      expect(data.data.format).toBe('pdf')
      expect(data.data.timestamp).toBeDefined()
    })

    it('should use default format when not specified', async () => {
      const requestBody = {
        reportId: 'report-456',
        pages: ['page1']
      }
      
      const request = new NextRequest('http://localhost:3000/api/export/pdf', {
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
      expect(data.data.format).toBe('pdf')
    })

    it('should return error when reportId is missing', async () => {
      const requestBody = {
        pages: ['page1', 'page2']
      }
      
      const request = new NextRequest('http://localhost:3000/api/export/pdf', {
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
      expect(data.error).toBe('Missing required parameters: reportId, pages')
    })

    it('should return error when pages is missing', async () => {
      const requestBody = {
        reportId: 'report-789'
      }
      
      const request = new NextRequest('http://localhost:3000/api/export/pdf', {
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
      expect(data.error).toBe('Missing required parameters: reportId, pages')
    })

    it('should return error when pages is not an array', async () => {
      const requestBody = {
        reportId: 'report-101',
        pages: 'not-an-array'
      }
      
      const request = new NextRequest('http://localhost:3000/api/export/pdf', {
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
      expect(data.error).toBe('Missing required parameters: reportId, pages')
    })

    it('should handle JSON parsing errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/export/pdf', {
        method: 'POST',
        body: 'invalid-json',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to prepare PDF export')
    })
  })

  describe('GET', () => {
    it('should return success with valid parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/export/pdf?reportId=report-123&templateId=template-456')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Server-side PDF generation endpoint ready')
      expect(data.reportId).toBe('report-123')
      expect(data.templateId).toBe('template-456')
      expect(data.note).toContain('Puppeteer')
    })

    it('should return error when reportId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/export/pdf?templateId=template-456')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Missing reportId or templateId')
    })

    it('should return error when templateId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/export/pdf?reportId=report-123')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Missing reportId or templateId')
    })

    it('should return error when both parameters are missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/export/pdf')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Missing reportId or templateId')
    })
  })
})