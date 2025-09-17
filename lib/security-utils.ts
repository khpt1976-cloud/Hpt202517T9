// Security utilities for input validation and XSS protection
import DOMPurify from 'isomorphic-dompurify'

// Input validation schemas
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  customValidator?: (value: any) => boolean | string
}

export interface ValidationSchema {
  [key: string]: ValidationRule
}

// XSS Protection utilities
export class XSSProtection {
  // Sanitize HTML content
  static sanitizeHTML(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'table', 'thead', 'tbody',
        'tr', 'td', 'th', 'div', 'span', 'pre', 'code'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'class', 'id', 'style',
        'target', 'rel', 'width', 'height'
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
    })
  }

  // Sanitize text content (remove all HTML)
  static sanitizeText(text: string): string {
    return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] })
  }

  // Escape HTML entities
  static escapeHTML(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  // Validate and sanitize rich text editor content
  static sanitizeRichText(content: string): string {
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3',
        'ul', 'ol', 'li', 'blockquote', 'a', 'img'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel'],
      FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
    })
  }
}

// Input validation utilities
export class InputValidator {
  // Validate single field
  static validateField(value: any, rule: ValidationRule): { isValid: boolean; error?: string } {
    // Required validation
    if (rule.required && (value === null || value === undefined || value === '')) {
      return { isValid: false, error: 'Trường này là bắt buộc' }
    }

    // Skip other validations if value is empty and not required
    if (!rule.required && (value === null || value === undefined || value === '')) {
      return { isValid: true }
    }

    const stringValue = String(value)

    // Length validations
    if (rule.minLength && stringValue.length < rule.minLength) {
      return { isValid: false, error: `Tối thiểu ${rule.minLength} ký tự` }
    }

    if (rule.maxLength && stringValue.length > rule.maxLength) {
      return { isValid: false, error: `Tối đa ${rule.maxLength} ký tự` }
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(stringValue)) {
      return { isValid: false, error: 'Định dạng không hợp lệ' }
    }

    // Custom validation
    if (rule.customValidator) {
      const result = rule.customValidator(value)
      if (result !== true) {
        return { isValid: false, error: typeof result === 'string' ? result : 'Giá trị không hợp lệ' }
      }
    }

    return { isValid: true }
  }

  // Validate entire object against schema
  static validateObject(data: Record<string, any>, schema: ValidationSchema): {
    isValid: boolean
    errors: Record<string, string>
  } {
    const errors: Record<string, string> = {}

    Object.keys(schema).forEach(key => {
      const result = this.validateField(data[key], schema[key])
      if (!result.isValid && result.error) {
        errors[key] = result.error
      }
    })

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }
}

// Common validation patterns
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[0-9\s\-\(\)]{10,}$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  filename: /^[a-zA-Z0-9._-]+$/,
  templateId: /^[a-zA-Z0-9_-]{1,50}$/,
  reportId: /^[a-zA-Z0-9_-]{1,50}$/,
  pageNumber: /^[1-9]\d*$/
}

// Predefined validation schemas
export const ValidationSchemas = {
  templateUpload: {
    name: {
      required: true,
      minLength: 1,
      maxLength: 100,
      pattern: ValidationPatterns.filename
    },
    file: {
      required: true,
      customValidator: (file: File) => {
        if (!file) return 'File là bắt buộc'
        if (file.size > 50 * 1024 * 1024) return 'File không được vượt quá 50MB'
        if (!['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/html'].includes(file.type)) {
          return 'Chỉ hỗ trợ file DOCX và HTML'
        }
        return true
      }
    }
  },

  contentSave: {
    templateId: {
      required: true,
      pattern: ValidationPatterns.templateId
    },
    content: {
      required: true,
      maxLength: 1000000, // 1MB text limit
      customValidator: (content: string) => {
        // Check for potentially dangerous content
        const dangerousPatterns = [
          /<script/i,
          /javascript:/i,
          /on\w+\s*=/i,
          /<iframe/i,
          /<object/i,
          /<embed/i
        ]
        
        for (const pattern of dangerousPatterns) {
          if (pattern.test(content)) {
            return 'Nội dung chứa mã không an toàn'
          }
        }
        return true
      }
    },
    reportId: {
      required: false,
      pattern: ValidationPatterns.reportId
    },
    pageNumber: {
      required: false,
      pattern: ValidationPatterns.pageNumber,
      customValidator: (value: number) => {
        if (value && (value < 1 || value > 10000)) {
          return 'Số trang phải từ 1 đến 10000'
        }
        return true
      }
    }
  },

  exportRequest: {
    reportId: {
      required: true,
      pattern: ValidationPatterns.reportId
    },
    pages: {
      required: true,
      customValidator: (pages: any) => {
        if (!Array.isArray(pages)) return 'Pages phải là mảng'
        if (pages.length === 0) return 'Phải chọn ít nhất 1 trang'
        if (pages.length > 1000) return 'Không thể xuất quá 1000 trang'
        
        for (const page of pages) {
          if (typeof page !== 'number' || page < 1 || page > 10000) {
            return 'Số trang không hợp lệ'
          }
        }
        return true
      }
    },
    format: {
      required: true,
      customValidator: (format: string) => {
        if (!['pdf', 'png'].includes(format)) {
          return 'Format phải là pdf hoặc png'
        }
        return true
      }
    }
  }
}

// CSRF Protection utilities
export class CSRFProtection {
  private static tokenKey = 'csrf-token'

  // Generate CSRF token
  static generateToken(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  // Store token in session storage
  static storeToken(token: string): void {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(this.tokenKey, token)
    }
  }

  // Get stored token
  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(this.tokenKey)
    }
    return null
  }

  // Validate token
  static validateToken(token: string): boolean {
    const storedToken = this.getToken()
    return storedToken !== null && storedToken === token
  }

  // Add token to request headers
  static addTokenToHeaders(headers: Record<string, string> = {}): Record<string, string> {
    const token = this.getToken()
    if (token) {
      headers['X-CSRF-Token'] = token
    }
    return headers
  }
}

// Rate limiting utilities (client-side)
export class RateLimiter {
  private static requests = new Map<string, number[]>()

  // Check if request is allowed
  static isAllowed(key: string, maxRequests = 10, windowMs = 60000): boolean {
    const now = Date.now()
    const windowStart = now - windowMs

    // Get existing requests for this key
    const requests = this.requests.get(key) || []
    
    // Filter out old requests
    const recentRequests = requests.filter(time => time > windowStart)
    
    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      return false
    }

    // Add current request
    recentRequests.push(now)
    this.requests.set(key, recentRequests)

    return true
  }

  // Clear old entries periodically
  static cleanup(): void {
    const now = Date.now()
    const maxAge = 300000 // 5 minutes

    this.requests.forEach((requests, key) => {
      const recentRequests = requests.filter(time => now - time < maxAge)
      if (recentRequests.length === 0) {
        this.requests.delete(key)
      } else {
        this.requests.set(key, recentRequests)
      }
    })
  }
}

// Secure API client
export class SecureAPIClient {
  private baseURL: string

  constructor(baseURL = '/api') {
    this.baseURL = baseURL
  }

  // Make secure request
  async request(
    endpoint: string,
    options: RequestInit = {},
    rateLimitKey?: string
  ): Promise<Response> {
    // Rate limiting check
    if (rateLimitKey && !RateLimiter.isAllowed(rateLimitKey)) {
      throw new Error('Quá nhiều yêu cầu. Vui lòng thử lại sau.')
    }

    // Add CSRF token
    const headers = CSRFProtection.addTokenToHeaders(
      options.headers as Record<string, string> || {}
    )

    // Add security headers
    headers['Content-Type'] = headers['Content-Type'] || 'application/json'
    headers['X-Requested-With'] = 'XMLHttpRequest'

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers
    })

    // Handle security errors
    if (response.status === 403) {
      throw new Error('Không có quyền truy cập')
    }

    if (response.status === 429) {
      throw new Error('Quá nhiều yêu cầu. Vui lòng thử lại sau.')
    }

    return response
  }

  // Secure GET request
  async get(endpoint: string, rateLimitKey?: string): Promise<Response> {
    return this.request(endpoint, { method: 'GET' }, rateLimitKey)
  }

  // Secure POST request
  async post(
    endpoint: string,
    data: any,
    rateLimitKey?: string
  ): Promise<Response> {
    return this.request(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(data)
      },
      rateLimitKey
    )
  }
}

// Initialize CSRF protection
export function initializeCSRFProtection(): void {
  if (typeof window !== 'undefined') {
    // Generate and store token on page load
    const token = CSRFProtection.generateToken()
    CSRFProtection.storeToken(token)

    // Cleanup rate limiter periodically
    setInterval(() => {
      RateLimiter.cleanup()
    }, 60000) // Every minute
  }
}

// All utilities are already exported above