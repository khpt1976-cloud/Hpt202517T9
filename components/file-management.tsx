"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  FileText,
  FolderOpen,
  Trash2,
  Edit3,
  Calendar,
  Archive,
  Download,
  X,
  Check,
  AlertTriangle
} from "lucide-react"

interface FileItem {
  id: string
  name: string
  type: 'library' | 'named'
  reportId?: string
  totalPages?: number
  editorContent?: string
  createdAt: string
  lastModified?: string
}

interface FileManagementProps {
  isOpen: boolean
  onClose: () => void
}

export default function FileManagement({ isOpen, onClose }: FileManagementProps) {
  const { toast } = useToast()
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [editingFile, setEditingFile] = useState<string | null>(null)
  const [newFileName, setNewFileName] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'library' | 'named'>('all')

  // Load all files when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadAllFiles()
    }
  }, [isOpen])

  const loadAllFiles = async () => {
    setLoading(true)
    try {
      // Load both library and named files
      const [libraryResponse, namedResponse] = await Promise.all([
        fetch('/api/construction-files?type=library'),
        fetch('/api/construction-files?type=named')
      ])

      const libraryData = libraryResponse.ok ? await libraryResponse.json() : { files: [] }
      const namedData = namedResponse.ok ? await namedResponse.json() : { files: [] }

      const allFiles = [
        ...(libraryData.files || []).map((f: any) => ({ ...f, type: 'library' as const })),
        ...(namedData.files || []).map((f: any) => ({ ...f, type: 'named' as const }))
      ]

      // Sort by creation date (newest first)
      allFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      
      setFiles(allFiles)
    } catch (error) {
      console.error("Error loading files:", error)
      toast({
        title: "Lỗi tải file",
        description: "Không thể tải danh sách file. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/construction-files/${fileId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setFiles(prev => prev.filter(f => f.id !== fileId))
        toast({
          title: "Xóa thành công",
          description: "File đã được xóa khỏi hệ thống.",
          variant: "default",
        })
      } else {
        throw new Error('Failed to delete file')
      }
    } catch (error) {
      console.error("Error deleting file:", error)
      toast({
        title: "Lỗi xóa file",
        description: "Không thể xóa file. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setDeleteConfirm(null)
    }
  }

  const handleRenameFile = async (fileId: string) => {
    if (!newFileName.trim()) {
      toast({
        title: "Lỗi",
        description: "Tên file không được để trống.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/construction-files/${fileId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newFileName.trim()
        })
      })

      if (response.ok) {
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, name: newFileName.trim(), lastModified: new Date().toISOString() }
            : f
        ))
        toast({
          title: "Đổi tên thành công",
          description: `File đã được đổi tên thành "${newFileName.trim()}".`,
          variant: "default",
        })
        setEditingFile(null)
        setNewFileName("")
      } else {
        throw new Error('Failed to rename file')
      }
    } catch (error) {
      console.error("Error renaming file:", error)
      toast({
        title: "Lỗi đổi tên",
        description: "Không thể đổi tên file. Vui lòng thử lại.",
        variant: "destructive",
      })
    }
  }

  const startEditing = (file: FileItem) => {
    setEditingFile(file.id)
    setNewFileName(file.name)
  }

  const cancelEditing = () => {
    setEditingFile(null)
    setNewFileName("")
  }

  const filteredFiles = files.filter(file => {
    if (filter === 'all') return true
    return file.type === filter
  })

  const getFileIcon = (type: string) => {
    return type === 'library' ? (
      <Archive className="w-5 h-5 text-blue-500" />
    ) : (
      <FileText className="w-5 h-5 text-green-500" />
    )
  }

  const getFileTypeLabel = (type: string) => {
    return type === 'library' ? 'Thư viện' : 'File đã lưu'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Quản lý file
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Filter tabs */}
          <div className="flex gap-2 mb-4 border-b pb-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Tất cả ({files.length})
            </Button>
            <Button
              variant={filter === 'library' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('library')}
            >
              <Archive className="w-4 h-4 mr-1" />
              Thư viện ({files.filter(f => f.type === 'library').length})
            </Button>
            <Button
              variant={filter === 'named' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('named')}
            >
              <Download className="w-4 h-4 mr-1" />
              File đã lưu ({files.filter(f => f.type === 'named').length})
            </Button>
          </div>

          {/* File list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Đang tải...</div>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>
                  {filter === 'all' 
                    ? 'Chưa có file nào được lưu' 
                    : filter === 'library'
                    ? 'Thư viện trống'
                    : 'Chưa có file nào được lưu với tên'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {getFileIcon(file.type)}
                        <div className="flex-1">
                          {editingFile === file.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={newFileName}
                                onChange={(e) => setNewFileName(e.target.value)}
                                className="flex-1"
                                placeholder="Nhập tên file mới..."
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleRenameFile(file.id)
                                  } else if (e.key === 'Escape') {
                                    cancelEditing()
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                size="sm"
                                onClick={() => handleRenameFile(file.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEditing}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <h4 className="font-medium text-gray-900">{file.name}</h4>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                <span className="flex items-center gap-1">
                                  <span className={`inline-block w-2 h-2 rounded-full ${
                                    file.type === 'library' ? 'bg-blue-500' : 'bg-green-500'
                                  }`} />
                                  {getFileTypeLabel(file.type)}
                                </span>
                                {file.totalPages && (
                                  <span>{file.totalPages} trang</span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(file.createdAt).toLocaleDateString('vi-VN')}
                                </span>
                                {file.lastModified && file.lastModified !== file.createdAt && (
                                  <span className="text-orange-600">
                                    (Sửa: {new Date(file.lastModified).toLocaleDateString('vi-VN')})
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {editingFile !== file.id && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditing(file)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteConfirm(file.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              Tổng cộng: {filteredFiles.length} file
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadAllFiles} disabled={loading}>
                Làm mới
              </Button>
              <Button onClick={onClose}>
                Đóng
              </Button>
            </div>
          </div>
        </div>

        {/* Delete confirmation dialog */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <h3 className="text-lg font-semibold">Xác nhận xóa</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Bạn có chắc chắn muốn xóa file này? Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 text-black font-semibold hover:text-black"
                >
                  Hủy
                </Button>
                <Button
                  onClick={() => handleDeleteFile(deleteConfirm)}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}