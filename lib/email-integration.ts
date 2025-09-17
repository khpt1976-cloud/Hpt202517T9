// Email integration system for sharing reports
import nodemailer from 'nodemailer'
import { advancedExportManager, ExportOptions } from './advanced-export'

// Email configuration interfaces
export interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  htmlContent: string
  textContent: string
  variables: string[] // Available template variables
}

export interface EmailRecipient {
  email: string
  name?: string
  role?: 'viewer' | 'editor' | 'admin'
}

export interface EmailAttachment {
  filename: string
  content: Buffer | string
  contentType: string
  size: number
}

export interface SendEmailOptions {
  templateId?: string
  recipients: EmailRecipient[]
  subject?: string
  customMessage?: string
  attachments?: EmailAttachment[]
  reportId?: string
  templateVariables?: Record<string, string>
  priority?: 'high' | 'normal' | 'low'
  requestReadReceipt?: boolean
  scheduleTime?: Date
}

export interface EmailResult {
  success: boolean
  messageId?: string
  recipients: {
    email: string
    status: 'sent' | 'failed'
    error?: string
  }[]
  error?: string
  sentAt: Date
}

// Email templates
const defaultEmailTemplates: EmailTemplate[] = [
  {
    id: 'report-share',
    name: 'Chia sẻ báo cáo',
    subject: 'Báo cáo xây dựng: {{reportTitle}}',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0;">Báo cáo xây dựng mới</h2>
        </div>
        
        <div style="padding: 20px; background: white; border: 1px solid #e9ecef; border-radius: 8px;">
          <p>Xin chào {{recipientName}},</p>
          
          <p>Bạn đã nhận được báo cáo xây dựng mới:</p>
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1976d2;">{{reportTitle}}</h3>
            <p style="margin: 0; color: #666;">
              <strong>Mã báo cáo:</strong> {{reportId}}<br>
              <strong>Ngày tạo:</strong> {{createdDate}}<br>
              <strong>Người gửi:</strong> {{senderName}}
            </p>
          </div>
          
          {{#if customMessage}}
          <div style="border-left: 4px solid #2196f3; padding-left: 15px; margin: 20px 0;">
            <p style="font-style: italic; color: #555;">{{customMessage}}</p>
          </div>
          {{/if}}
          
          {{#if hasAttachments}}
          <p><strong>File đính kèm:</strong></p>
          <ul>
            {{#each attachments}}
            <li>{{filename}} ({{size}})</li>
            {{/each}}
          </ul>
          {{/if}}
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="{{viewUrl}}" 
               style="background: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Xem báo cáo online
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với người gửi.
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>Email này được gửi từ Construction Report Editor</p>
          <p>© 2025 Construction Report System</p>
        </div>
      </div>
    `,
    textContent: `
Xin chào {{recipientName}},

Bạn đã nhận được báo cáo xây dựng mới:

Tiêu đề: {{reportTitle}}
Mã báo cáo: {{reportId}}
Ngày tạo: {{createdDate}}
Người gửi: {{senderName}}

{{#if customMessage}}
Tin nhắn: {{customMessage}}
{{/if}}

Xem báo cáo tại: {{viewUrl}}

Trân trọng,
Construction Report System
    `,
    variables: ['recipientName', 'reportTitle', 'reportId', 'createdDate', 'senderName', 'customMessage', 'viewUrl', 'hasAttachments', 'attachments']
  },
  
  {
    id: 'collaboration-invite',
    name: 'Mời cộng tác',
    subject: 'Mời cộng tác chỉnh sửa báo cáo: {{reportTitle}}',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #2e7d32; margin: 0;">Lời mời cộng tác</h2>
        </div>
        
        <div style="padding: 20px; background: white; border: 1px solid #e9ecef; border-radius: 8px;">
          <p>Xin chào {{recipientName}},</p>
          
          <p>{{senderName}} đã mời bạn cộng tác chỉnh sửa báo cáo:</p>
          
          <div style="background: #f3e5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #7b1fa2;">{{reportTitle}}</h3>
            <p style="margin: 0; color: #666;">
              <strong>Quyền truy cập:</strong> {{accessLevel}}<br>
              <strong>Hạn chế thời gian:</strong> {{expiryDate}}
            </p>
          </div>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="{{collaborationUrl}}" 
               style="background: #7b1fa2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Bắt đầu cộng tác
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Lưu ý: Link này sẽ hết hạn sau {{expiryHours}} giờ.
          </p>
        </div>
      </div>
    `,
    textContent: `
Xin chào {{recipientName}},

{{senderName}} đã mời bạn cộng tác chỉnh sửa báo cáo:

Tiêu đề: {{reportTitle}}
Quyền truy cập: {{accessLevel}}
Hạn chế thời gian: {{expiryDate}}

Bắt đầu cộng tác tại: {{collaborationUrl}}

Lưu ý: Link này sẽ hết hạn sau {{expiryHours}} giờ.

Trân trọng,
Construction Report System
    `,
    variables: ['recipientName', 'senderName', 'reportTitle', 'accessLevel', 'expiryDate', 'collaborationUrl', 'expiryHours']
  },

  {
    id: 'report-notification',
    name: 'Thông báo cập nhật',
    subject: 'Báo cáo đã được cập nhật: {{reportTitle}}',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #f57c00; margin: 0;">Cập nhật báo cáo</h2>
        </div>
        
        <div style="padding: 20px; background: white; border: 1px solid #e9ecef; border-radius: 8px;">
          <p>Xin chào {{recipientName}},</p>
          
          <p>Báo cáo "{{reportTitle}}" đã được cập nhật bởi {{updatedBy}}.</p>
          
          <div style="background: #fafafa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0;">Thay đổi:</h4>
            <ul style="margin: 0; padding-left: 20px;">
              {{#each changes}}
              <li>{{this}}</li>
              {{/each}}
            </ul>
          </div>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="{{viewUrl}}" 
               style="background: #f57c00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Xem thay đổi
            </a>
          </div>
        </div>
      </div>
    `,
    textContent: `
Xin chào {{recipientName}},

Báo cáo "{{reportTitle}}" đã được cập nhật bởi {{updatedBy}}.

Thay đổi:
{{#each changes}}
- {{this}}
{{/each}}

Xem thay đổi tại: {{viewUrl}}

Trân trọng,
Construction Report System
    `,
    variables: ['recipientName', 'reportTitle', 'updatedBy', 'changes', 'viewUrl']
  }
]

// Email manager class
export class EmailManager {
  private static instance: EmailManager
  private transporter: nodemailer.Transporter | null = null
  private templates: Map<string, EmailTemplate> = new Map()
  private config: EmailConfig | null = null

  constructor() {
    // Load default templates
    defaultEmailTemplates.forEach(template => {
      this.templates.set(template.id, template)
    })
  }

  static getInstance(): EmailManager {
    if (!EmailManager.instance) {
      EmailManager.instance = new EmailManager()
    }
    return EmailManager.instance
  }

  // Configure email settings
  configure(config: EmailConfig): void {
    this.config = config
    this.transporter = nodemailer.createTransporter({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      tls: {
        rejectUnauthorized: false
      }
    })
  }

  // Test email configuration
  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      throw new Error('Email not configured')
    }

    try {
      await this.transporter.verify()
      return true
    } catch (error) {
      console.error('Email connection test failed:', error)
      return false
    }
  }

  // Send email with report attachment
  async sendReportEmail(
    reportId: string,
    templateId: string,
    content: string,
    options: SendEmailOptions
  ): Promise<EmailResult> {
    if (!this.transporter) {
      throw new Error('Email not configured')
    }

    try {
      const attachments: EmailAttachment[] = [...(options.attachments || [])]

      // Generate report attachment if requested
      if (options.reportId) {
        const exportResult = await advancedExportManager.exportReport(
          reportId,
          templateId,
          content,
          {
            format: 'pdf',
            quality: 0.9,
            includeMetadata: true
          }
        )

        if (exportResult.success) {
          // In a real implementation, you'd get the actual file content
          attachments.push({
            filename: exportResult.filename,
            content: 'PDF content would be here',
            contentType: 'application/pdf',
            size: exportResult.size
          })
        }
      }

      return await this.sendEmail({
        ...options,
        attachments
      })
    } catch (error) {
      console.error('Send report email error:', error)
      return {
        success: false,
        error: error.message,
        recipients: options.recipients.map(r => ({
          email: r.email,
          status: 'failed',
          error: error.message
        })),
        sentAt: new Date()
      }
    }
  }

  // Send email
  async sendEmail(options: SendEmailOptions): Promise<EmailResult> {
    if (!this.transporter) {
      throw new Error('Email not configured')
    }

    const results: EmailResult['recipients'] = []
    let messageId: string | undefined

    try {
      // Get email template
      const template = options.templateId ? this.templates.get(options.templateId) : null
      
      // Process each recipient
      for (const recipient of options.recipients) {
        try {
          // Prepare template variables
          const variables = {
            recipientName: recipient.name || recipient.email,
            recipientEmail: recipient.email,
            ...options.templateVariables
          }

          // Render email content
          const subject = options.subject || (template ? this.renderTemplate(template.subject, variables) : 'Báo cáo xây dựng')
          const htmlContent = template ? this.renderTemplate(template.htmlContent, variables) : options.customMessage || ''
          const textContent = template ? this.renderTemplate(template.textContent, variables) : options.customMessage || ''

          // Prepare attachments
          const attachments = options.attachments?.map(att => ({
            filename: att.filename,
            content: att.content,
            contentType: att.contentType
          }))

          // Send email
          const info = await this.transporter.sendMail({
            from: this.config?.auth.user,
            to: `${recipient.name || ''} <${recipient.email}>`,
            subject,
            text: textContent,
            html: htmlContent,
            attachments,
            priority: options.priority || 'normal',
            dsn: options.requestReadReceipt ? {
              id: `report-${Date.now()}`,
              return: 'headers',
              notify: ['success', 'failure', 'delay'],
              recipient: this.config?.auth.user
            } : undefined
          })

          messageId = info.messageId
          results.push({
            email: recipient.email,
            status: 'sent'
          })

        } catch (error) {
          results.push({
            email: recipient.email,
            status: 'failed',
            error: error.message
          })
        }
      }

      const success = results.some(r => r.status === 'sent')

      return {
        success,
        messageId,
        recipients: results,
        sentAt: new Date()
      }

    } catch (error) {
      console.error('Send email error:', error)
      return {
        success: false,
        error: error.message,
        recipients: options.recipients.map(r => ({
          email: r.email,
          status: 'failed',
          error: error.message
        })),
        sentAt: new Date()
      }
    }
  }

  // Batch send emails
  async batchSendEmails(
    emailBatch: Array<{
      reportId: string
      templateId: string
      content: string
      options: SendEmailOptions
    }>
  ): Promise<EmailResult[]> {
    const results: EmailResult[] = []

    for (const email of emailBatch) {
      try {
        const result = await this.sendReportEmail(
          email.reportId,
          email.templateId,
          email.content,
          email.options
        )
        results.push(result)
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          recipients: email.options.recipients.map(r => ({
            email: r.email,
            status: 'failed',
            error: error.message
          })),
          sentAt: new Date()
        })
      }

      // Add delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return results
  }

  // Template management
  addTemplate(template: EmailTemplate): void {
    this.templates.set(template.id, template)
  }

  getTemplate(id: string): EmailTemplate | undefined {
    return this.templates.get(id)
  }

  getAllTemplates(): EmailTemplate[] {
    return Array.from(this.templates.values())
  }

  // Render template with variables
  private renderTemplate(template: string, variables: Record<string, any>): string {
    let rendered = template

    // Simple template rendering (in production, use a proper template engine)
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      rendered = rendered.replace(regex, String(value || ''))
    })

    // Handle conditionals (basic implementation)
    rendered = rendered.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, condition, content) => {
      return variables[condition] ? content : ''
    })

    // Handle loops (basic implementation)
    rendered = rendered.replace(/{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g, (match, arrayName, content) => {
      const array = variables[arrayName]
      if (Array.isArray(array)) {
        return array.map(item => {
          let itemContent = content
          if (typeof item === 'object') {
            Object.entries(item).forEach(([key, value]) => {
              itemContent = itemContent.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
            })
          } else {
            itemContent = itemContent.replace(/{{this}}/g, String(item))
          }
          return itemContent
        }).join('')
      }
      return ''
    })

    return rendered
  }

  // Email validation
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Get email statistics
  getEmailStats(): {
    templatesCount: number
    configuredTransporter: boolean
  } {
    return {
      templatesCount: this.templates.size,
      configuredTransporter: this.transporter !== null
    }
  }
}

// Recipient management
export class RecipientManager {
  private static instance: RecipientManager
  private recipients: Map<string, EmailRecipient[]> = new Map()

  static getInstance(): RecipientManager {
    if (!RecipientManager.instance) {
      RecipientManager.instance = new RecipientManager()
    }
    return RecipientManager.instance
  }

  // Add recipient group
  addRecipientGroup(groupName: string, recipients: EmailRecipient[]): void {
    this.recipients.set(groupName, recipients)
  }

  // Get recipient group
  getRecipientGroup(groupName: string): EmailRecipient[] {
    return this.recipients.get(groupName) || []
  }

  // Get all groups
  getAllGroups(): string[] {
    return Array.from(this.recipients.keys())
  }

  // Add recipient to group
  addRecipientToGroup(groupName: string, recipient: EmailRecipient): void {
    const group = this.recipients.get(groupName) || []
    if (!group.find(r => r.email === recipient.email)) {
      group.push(recipient)
      this.recipients.set(groupName, group)
    }
  }

  // Remove recipient from group
  removeRecipientFromGroup(groupName: string, email: string): void {
    const group = this.recipients.get(groupName) || []
    const filtered = group.filter(r => r.email !== email)
    this.recipients.set(groupName, filtered)
  }

  // Validate recipients
  validateRecipients(recipients: EmailRecipient[]): {
    valid: EmailRecipient[]
    invalid: { recipient: EmailRecipient; reason: string }[]
  } {
    const emailManager = EmailManager.getInstance()
    const valid: EmailRecipient[] = []
    const invalid: { recipient: EmailRecipient; reason: string }[] = []

    recipients.forEach(recipient => {
      if (!emailManager.validateEmail(recipient.email)) {
        invalid.push({ recipient, reason: 'Invalid email format' })
      } else {
        valid.push(recipient)
      }
    })

    return { valid, invalid }
  }
}

// Export singleton instances
export const emailManager = EmailManager.getInstance()
export const recipientManager = RecipientManager.getInstance()

// Export default email configurations
export const defaultEmailConfigs = {
  gmail: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false
  },
  outlook: {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false
  },
  yahoo: {
    host: 'smtp.mail.yahoo.com',
    port: 587,
    secure: false
  }
}

export default EmailManager