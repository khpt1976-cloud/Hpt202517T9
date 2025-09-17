'use client'

import React, { useState, useEffect } from 'react'
import { advancedExportManager } from '@/lib/advanced-export'
import { emailManager, recipientManager } from '@/lib/email-integration'
import { collaborationManager, presenceManager } from '@/lib/collaborative-editing'
import { versionHistoryManager, versionUtils } from '@/lib/version-history'
import AdvancedExportDialog from './advanced-export-dialog'

interface AdvancedFeaturesPanelProps {
  reportId: string
  templateId: string
  content: string
  currentUser: {
    id: string
    name: string
    email: string
    role: 'viewer' | 'editor' | 'admin'
  }
}

export default function AdvancedFeaturesPanel({
  reportId,
  templateId,
  content,
  currentUser
}: AdvancedFeaturesPanelProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'email' | 'collaborate' | 'versions'>('export')
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [collaborationSession, setCollaborationSession] = useState<any>(null)
  const [versions, setVersions] = useState<any[]>([])
  const [emailRecipients, setEmailRecipients] = useState<string>('')
  const [emailMessage, setEmailMessage] = useState('')

  useEffect(() => {
    // Load versions
    const reportVersions = versionHistoryManager.getVersions(reportId, { limit: 10 })
    setVersions(reportVersions)
  }, [reportId])

  // Export functions
  const handleQuickExport = async (format: 'pdf' | 'docx' | 'png') => {
    try {
      const result = await advancedExportManager.exportReport(
        reportId,
        templateId,
        content,
        { format, quality: 0.9, includeMetadata: true }
      )
      
      if (result.success) {
        alert(`Xuất ${format.toUpperCase()} thành công: ${result.filename}`)
      } else {
        alert(`Lỗi xuất file: ${result.error}`)
      }
    } catch (error) {
      alert(`Lỗi xuất file: ${error.message}`)
    }
  }

  // Email functions
  const handleSendEmail = async () => {
    if (!emailRecipients.trim()) {
      alert('Vui lòng nhập email người nhận')
      return
    }

    const recipients = emailRecipients.split(',').map(email => ({
      email: email.trim(),
      name: email.trim(),
      role: 'viewer' as const
    }))

    try {
      const result = await emailManager.sendReportEmail(
        reportId,
        templateId,
        content,
        {
          templateId: 'report-share',
          recipients,
          customMessage: emailMessage,
          reportId,
          templateVariables: {
            reportTitle: `Báo cáo ${reportId}`,
            reportId,
            createdDate: new Date().toLocaleDateString('vi-VN'),
            senderName: currentUser.name,
            viewUrl: `${window.location.origin}/reports/${reportId}`
          }
        }
      )

      if (result.success) {
        alert(`Gửi email thành công đến ${result.recipients.filter(r => r.status === 'sent').length} người`)
        setEmailRecipients('')
        setEmailMessage('')
      } else {
        alert(`Lỗi gửi email: ${result.error}`)
      }
    } catch (error) {
      alert(`Lỗi gửi email: ${error.message}`)
    }
  }

  // Collaboration functions
  const handleStartCollaboration = () => {
    const session = collaborationManager.createSession(
      reportId,
      templateId,
      {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        color: '#3B82F6',
        role: currentUser.role,
        isOnline: true,
        lastSeen: new Date()
      }
    )
    
    setCollaborationSession(session)
    alert(`Phiên cộng tác đã được tạo: ${session.id}`)
  }

  const handleJoinCollaboration = (sessionId: string) => {
    const success = collaborationManager.joinSession(sessionId, {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      color: '#10B981',
      role: currentUser.role,
      isOnline: true,
      lastSeen: new Date()
    })

    if (success) {
      const session = collaborationManager.getSession(sessionId)
      setCollaborationSession(session)
      alert('Đã tham gia phiên cộng tác')
    } else {
      alert('Không thể tham gia phiên cộng tác')
    }
  }

  // Version functions
  const handleCreateVersion = () => {
    const title = prompt('Nhập tiêu đề version:')
    if (!title) return

    const description = prompt('Nhập mô tả (tùy chọn):')
    
    const version = versionHistoryManager.createVersion(
      reportId,
      templateId,
      content,
      currentUser.id,
      currentUser.name,
      {
        title,
        description: description || undefined,
        isMajor: true
      }
    )

    setVersions([version, ...versions])
    alert(`Đã tạo version: ${version.title}`)
  }

  const handleRestoreVersion = async (versionId: string) => {
    if (!confirm('Bạn có chắc muốn khôi phục version này?')) return

    const restoredVersion = await versionHistoryManager.restoreVersion(
      reportId,
      versionId,
      currentUser.id,
      currentUser.name,
      {
        createNewVersion: true,
        preserveCurrentAsBackup: true,
        notifyCollaborators: true,
        reason: 'Manual restore from advanced features panel'
      }
    )

    if (restoredVersion) {
      setVersions([restoredVersion, ...versions])
      alert('Đã khôi phục version thành công')
      // In a real app, you'd reload the content
    } else {
      alert('Lỗi khôi phục version')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Tính Năng Nâng Cao</h2>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        {[
          { id: 'export', label: 'Xuất File', icon: '📄' },
          { id: 'email', label: 'Chia Sẻ Email', icon: '📧' },
          { id: 'collaborate', label: 'Cộng Tác', icon: '👥' },
          { id: 'versions', label: 'Lịch Sử', icon: '🕒' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`px-4 py-2 font-medium flex items-center space-x-2 ${
              activeTab === tab.id 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Xuất Nhanh</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => handleQuickExport('pdf')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">📄</div>
                  <div className="font-medium">PDF</div>
                  <div className="text-sm text-gray-500">Chất lượng cao</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickExport('docx')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">📝</div>
                  <div className="font-medium">Word</div>
                  <div className="text-sm text-gray-500">Có thể chỉnh sửa</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickExport('png')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🖼️</div>
                  <div className="font-medium">PNG</div>
                  <div className="text-sm text-gray-500">Hình ảnh</div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Xuất Nâng Cao</h3>
            <button
              onClick={() => setShowExportDialog(true)}
              className="w-full p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <div className="flex items-center justify-center space-x-2">
                <span>⚙️</span>
                <span>Tùy Chọn Xuất Nâng Cao</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Email Tab */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Chia Sẻ Qua Email</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email người nhận (cách nhau bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                  placeholder="email1@example.com, email2@example.com"
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tin nhắn kèm theo (tùy chọn)
                </label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="Nhập tin nhắn muốn gửi kèm..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
              </div>

              <button
                onClick={handleSendEmail}
                disabled={!emailRecipients.trim()}
                className="w-full p-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📧 Gửi Email
              </button>
            </div>
          </div>

          <div className="border-t pt-6">
            <h4 className="font-medium mb-3">Template Email Có Sẵn</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium">Chia sẻ báo cáo</div>
                <div className="text-sm text-gray-600">Template chuẩn cho việc chia sẻ</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium">Mời cộng tác</div>
                <div className="text-sm text-gray-600">Mời người khác cùng chỉnh sửa</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collaboration Tab */}
      {activeTab === 'collaborate' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Cộng Tác Thời Gian Thực</h3>
            
            {!collaborationSession ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">👥</div>
                <p className="text-gray-600 mb-4">Chưa có phiên cộng tác nào</p>
                <button
                  onClick={handleStartCollaboration}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Bắt Đầu Cộng Tác
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900">Phiên Cộng Tác Đang Hoạt Động</h4>
                  <p className="text-sm text-purple-700">ID: {collaborationSession.id}</p>
                  <p className="text-sm text-purple-700">
                    Người tham gia: {collaborationSession.participants?.length || 0}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Người tham gia</h4>
                  <div className="space-y-2">
                    {collaborationSession.participants?.map((participant: any) => (
                      <div key={participant.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: participant.color }}
                        ></div>
                        <span className="font-medium">{participant.name}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          participant.isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {participant.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      const link = `${window.location.origin}/collaborate/${collaborationSession.id}`
                      navigator.clipboard.writeText(link)
                      alert('Đã copy link mời cộng tác')
                    }}
                    className="flex-1 p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    📋 Copy Link Mời
                  </button>
                  
                  <button
                    onClick={() => {
                      collaborationManager.closeSession(collaborationSession.id)
                      setCollaborationSession(null)
                    }}
                    className="flex-1 p-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    🚪 Kết Thúc Phiên
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <h4 className="font-medium mb-3">Tính Năng Cộng Tác</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium">✏️ Chỉnh sửa đồng thời</div>
                <div className="text-sm text-gray-600">Nhiều người cùng chỉnh sửa</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium">💬 Bình luận</div>
                <div className="text-sm text-gray-600">Thảo luận trực tiếp</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium">👀 Theo dõi con trỏ</div>
                <div className="text-sm text-gray-600">Xem vị trí người khác</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium">🔄 Đồng bộ tự động</div>
                <div className="text-sm text-gray-600">Cập nhật thời gian thực</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Versions Tab */}
      {activeTab === 'versions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Lịch Sử Phiên Bản</h3>
            <button
              onClick={handleCreateVersion}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              ➕ Tạo Version
            </button>
          </div>

          <div className="space-y-3">
            {versions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📚</div>
                <p>Chưa có phiên bản nào</p>
              </div>
            ) : (
              versions.map((version) => (
                <div key={version.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium">{version.title}</span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {versionUtils.formatVersionNumber(version)}
                        </span>
                        {version.metadata.isMajor && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Major
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <span>👤 {version.authorName}</span>
                        <span className="mx-2">•</span>
                        <span>📅 {versionUtils.getVersionAge(version)}</span>
                        <span className="mx-2">•</span>
                        <span>📊 {version.metadata.wordCount} từ</span>
                      </div>
                      
                      {version.description && (
                        <p className="text-sm text-gray-700 mb-2">{version.description}</p>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        {versionUtils.generateVersionSummary(version)}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => {
                          // In a real app, you'd show version content
                          alert(`Xem version: ${version.title}`)
                        }}
                        className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        👁️ Xem
                      </button>
                      
                      <button
                        onClick={() => handleRestoreVersion(version.id)}
                        className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        🔄 Khôi phục
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t pt-6">
            <h4 className="font-medium mb-3">Thống Kê</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-2xl font-bold text-blue-600">{versions.length}</div>
                <div className="text-sm text-gray-600">Versions</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-2xl font-bold text-green-600">
                  {versions.filter(v => v.metadata.isMajor).length}
                </div>
                <div className="text-sm text-gray-600">Major</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-2xl font-bold text-purple-600">
                  {new Set(versions.map(v => v.authorName)).size}
                </div>
                <div className="text-sm text-gray-600">Tác giả</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-2xl font-bold text-orange-600">1</div>
                <div className="text-sm text-gray-600">Branches</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Export Dialog */}
      <AdvancedExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        reportId={reportId}
        templateId={templateId}
        content={content}
      />
    </div>
  )
}