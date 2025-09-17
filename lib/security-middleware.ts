// Security middleware for API routes
import { NextRequest, NextResponse } from 'next/server'
import { InputValidator, ValidationSchemas, XSSProtection } from './security-utils'

// Rate limiting storage (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Security middleware configuration
interface SecurityConfig {
  rateLimit?: {
    windowMs: number
    maxRequests: number
  }
  validateCSRF?: boolean
  sanitizeInput?: boolean
  requireAuth?: boolean
}

// Default security configuration
const defaultConfig: SecurityConfig = {
  rateLimit: {
    windowMs: 60000, // 1 minute
    maxRequests: 100
  },
  validateCSRF: true,
  sanitizeInput: true,
  requireAuth: false
}

// Rate limiting middleware
export function rateLimit(config: SecurityConfig['rateLimit'] = defaultConfig.rateLimit!) {
  return (req: NextRequest): NextResponse | null => {
    const clientIP = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
    const key = `rate_limit:${clientIP}`
    const now = Date.now()

    // Get current rate limit data
    const current = rateLimitStore.get(key)

    if (!current || now > current.resetTime) {
      // Reset or initialize
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      })
      return null // Allow request
    }

    if (current.count >= config.maxRequests) {
      // Rate limit exceeded
      return NextResponse.json(
        { 
          error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
          retryAfter: Math.ceil((current.resetTime - now) / 1000)
        },
        { status: 429 }
      )
    }

    // Increment counter
    current.count++
    rateLimitStore.set(key, current)

    return null // Allow request
  }
}

// CSRF validation middleware
export function validateCSRF(req: NextRequest): NextResponse | null {
  // Skip CSRF for GET requests
  if (req.method === 'GET') {
    return null
  }

  const token = req.headers.get('x-csrf-token')
  const sessionToken = req.headers.get('x-session-csrf-token')

  if (!token || !sessionToken || token !== sessionToken) {
    return NextResponse.json(
      { error: 'CSRF token không hợp lệ' },
      { status: 403 }
    )
  }

  return null // Allow request
}

// Input sanitization middleware
export function sanitizeInput(req: NextRequest): NextRequest {
  // Only sanitize for POST/PUT/PATCH requests
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return req
  }

  // Note: In a real implementation, you would need to parse and sanitize the request body
  // This is a simplified version for demonstration
  return req
}

// Security headers middleware
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:;"
  )

  return response
}

// Main security middleware wrapper
export function withSecurity(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: SecurityConfig = {}
) {
  const finalConfig = { ...defaultConfig, ...config }

  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Rate limiting
      if (finalConfig.rateLimit) {
        const rateLimitResponse = rateLimit(finalConfig.rateLimit)(req)
        if (rateLimitResponse) {
          return addSecurityHeaders(rateLimitResponse)
        }
      }

      // CSRF validation
      if (finalConfig.validateCSRF) {
        const csrfResponse = validateCSRF(req)
        if (csrfResponse) {
          return addSecurityHeaders(csrfResponse)
        }
      }

      // Input sanitization
      if (finalConfig.sanitizeInput) {
        req = sanitizeInput(req)
      }

      // Call the actual handler
      const response = await handler(req)

      // Add security headers to response
      return addSecurityHeaders(response)

    } catch (error) {
      console.error('Security middleware error:', error)
      
      const errorResponse = NextResponse.json(
        { error: 'Lỗi bảo mật' },
        { status: 500 }
      )
      
      return addSecurityHeaders(errorResponse)
    }
  }
}

// Validation middleware for specific endpoints
export function withValidation(
  handler: (req: NextRequest, validatedData: any) => Promise<NextResponse>,
  schemaName: keyof typeof ValidationSchemas
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      let data: any = {}

      // Parse request data based on method
      if (req.method === 'GET') {
        const url = new URL(req.url)
        data = Object.fromEntries(url.searchParams.entries())
      } else {
        const contentType = req.headers.get('content-type')
        
        if (contentType?.includes('application/json')) {
          data = await req.json()
        } else if (contentType?.includes('multipart/form-data')) {
          const formData = await req.formData()
          data = Object.fromEntries(formData.entries())
        }
      }

      // Validate data
      const schema = ValidationSchemas[schemaName]
      const validation = InputValidator.validateObject(data, schema)

      if (!validation.isValid) {
        return NextResponse.json(
          { 
            error: 'Dữ liệu không hợp lệ',
            details: validation.errors
          },
          { status: 400 }
        )
      }

      // Sanitize string fields
      const sanitizedData = { ...data }
      Object.keys(sanitizedData).forEach(key => {
        if (typeof sanitizedData[key] === 'string') {
          // Sanitize based on field type
          if (key === 'content') {
            sanitizedData[key] = XSSProtection.sanitizeRichText(sanitizedData[key])
          } else {
            sanitizedData[key] = XSSProtection.sanitizeText(sanitizedData[key])
          }
        }
      })

      return handler(req, sanitizedData)

    } catch (error) {
      console.error('Validation middleware error:', error)
      
      return NextResponse.json(
        { error: 'Lỗi xử lý dữ liệu' },
        { status: 400 }
      )
    }
  }
}

// File upload security middleware
export function validateFileUpload(
  allowedTypes: string[] = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/html'],
  maxSize: number = 50 * 1024 * 1024 // 50MB
) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    if (req.method !== 'POST') {
      return null
    }

    try {
      const formData = await req.formData()
      const file = formData.get('file') as File

      if (!file) {
        return NextResponse.json(
          { error: 'Không tìm thấy file' },
          { status: 400 }
        )
      }

      // Check file type
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Loại file không được hỗ trợ. Chỉ chấp nhận: ${allowedTypes.join(', ')}` },
          { status: 400 }
        )
      }

      // Check file size
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File quá lớn. Kích thước tối đa: ${Math.round(maxSize / (1024 * 1024))}MB` },
          { status: 400 }
        )
      }

      // Check file name
      const fileName = file.name
      if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) {
        return NextResponse.json(
          { error: 'Tên file chứa ký tự không hợp lệ' },
          { status: 400 }
        )
      }

      return null // Allow upload

    } catch (error) {
      console.error('File validation error:', error)
      return NextResponse.json(
        { error: 'Lỗi kiểm tra file' },
        { status: 400 }
      )
    }
  }
}

// Cleanup rate limit store periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, data] of rateLimitStore.entries()) {
      if (now > data.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  }, 60000) // Clean up every minute
}

export {
  defaultConfig,
  rateLimitStore
}