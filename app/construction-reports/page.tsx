"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Building,
  FileText,
  Users,
  Calendar,
  Upload,
  FolderOpen,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"
import TemplateUploadSection from "@/components/template-upload-section"
import { getWordPageCount } from "@/lib/word-page-counter"
import { DatabaseStorage } from "@/lib/storage"
import { ASPECT_RATIOS, getRecommendedAspectRatios } from "@/utils/aspect-ratio-constants"

import { useRouter } from "next/navigation"

interface ProjectGroup {
  id: string
  name: string
  description: string
  status: "active" | "completed" | "paused"
  startDate: string
  endDate?: string
  manager: string
}

interface Construction {
  id: string
  name: string
  location: string
  status: "active" | "completed" | "paused"
  startDate: string
  endDate?: string
  manager: string
  projectGroupId: string
}

interface Category {
  id: string
  name: string
  description: string
  constructionId: string // Changed from projectId to constructionId
  status: "pending" | "in-progress" | "completed"
  createdDate: string
}

interface Diary {
  id: string
  title: string
  categoryId: string
  status: "draft" | "completed" | "approved"
  createdDate: string
  lastModified: string
}

interface TemplateFile {
  id: string
  name: string
  file: File
  uploadDate: string
  isDefault: boolean
  pageCount?: number
  size: number // Store actual file size
  type: 'initial' | 'daily' // 'initial' for Mẫu nhật ký đầu, 'daily' for Mẫu nhật ký thêm
}

interface ImageConfig {
  templatePage: number
  imagesPerPage: number
}

export default function ConstructionDiarysPage() {
  const router = useRouter()
  const { t } = useLanguage()

  const [selectedProjectGroup, setSelectedProjectGroup] = useState<ProjectGroup | null>(null)
  const [selectedConstruction, setSelectedConstruction] = useState<Construction | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  // const [searchTerm, setSearchTerm] = useState("")

  const [showCreateProjectGroup, setShowCreateProjectGroup] = useState(false)
  const [showCreateConstruction, setShowCreateConstruction] = useState(false)
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [showCreateDiary, setShowCreateDiary] = useState(false)


  const [showEditProjectGroup, setShowEditProjectGroup] = useState(false)
  const [showEditConstructionDialog, setShowEditConstructionDialog] = useState(false)
  const [showEditCategory, setShowEditCategory] = useState(false)
  const [editingProjectGroup, setEditingProjectGroup] = useState<ProjectGroup | null>(null)
  const [editingConstruction, setEditingConstruction] = useState<Construction | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const [newProjectGroup, setNewProjectGroup] = useState({
    name: "",
    description: "",
    manager: "",
    status: "active" as const,
  })

  const [newConstruction, setNewConstruction] = useState({
    name: "",
    location: "",
    manager: "",
    status: "active" as const,
    templateFile: null,
  })

  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    status: "pending" as const,
  })

  const [newDiary, setNewDiary] = useState({
    title: "",
    status: "draft" as const,
  })

  const [templateFiles, setTemplateFiles] = useState<TemplateFile[]>([])
  const [templateErrors, setTemplateErrors] = useState({ initial: "", daily: "" })
  const [existingDiaries, setExistingDiaries] = useState<Diary[]>([]) // Danh sách nhật ký đã tạo để làm mẫu
  
  // Image configuration state
  const [imageConfig, setImageConfig] = useState<ImageConfig>({
    templatePage: 1,
    imagesPerPage: 4
  })
  const [isConfigLoaded, setIsConfigLoaded] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Initialize with empty arrays to avoid hydration mismatch
  const [projectGroups, setProjectGroups] = useState<ProjectGroup[]>([])
  const [constructions, setConstructions] = useState<Construction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [diaries, setDiaries] = useState<Diary[]>([])

  const [projectGroupErrors, setProjectGroupErrors] = useState<{ [key: string]: string }>({})
  const [constructionErrors, setConstructionErrors] = useState<{ [key: string]: string }>({})
  const [categoryErrors, setCategoryErrors] = useState<{ [key: string]: string }>({})
  const [diaryErrors, setDiaryErrors] = useState<{ [key: string]: string }>({})

  const [showEditDiary, setShowEditDiary] = useState(false)
  const [editingDiary, setEditingDiary] = useState<Diary | null>(null)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [diaryToDelete, setDiaryToDelete] = useState<string | null>(null)
  const [showDeleteProjectGroupConfirm, setShowDeleteProjectGroupConfirm] = useState(false)
  const [projectGroupToDelete, setProjectGroupToDelete] = useState<string | null>(null)
  const [showDeleteConstructionConfirm, setShowDeleteConstructionConfirm] = useState(false)
  const [constructionToDelete, setConstructionToDelete] = useState<string | null>(null)
  const [showDeleteCategoryConfirm, setShowDeleteCategoryConfirm] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)
  const [showDeleteTemplateConfirm, setShowDeleteTemplateConfirm] = useState(false)
  const [showDeleteTemplateDialog, setShowDeleteTemplateDialog] = useState(false)
  const [showDeleteProjectGroupDialog, setShowDeleteProjectGroupDialog] = useState(false)
  const [showDeleteConstructionDialog, setShowDeleteConstructionDialog] = useState(false)
  const [showDeleteCategoryDialog, setShowDeleteCategoryDialog] = useState(false)
  const [showDeleteDiaryDialog, setShowDeleteDiaryDialog] = useState(false)
  const [showEditProject, setShowEditProject] = useState(false)
  const [editingProject, setEditingProject] = useState<Construction | null>(null)
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null)

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateFile | null>(null)
  
  // Add Diary Dialog states
  const [showAddDiaryDialog, setShowAddDiaryDialog] = useState(false)
  const [selectedDiaryTemplate, setSelectedDiaryTemplate] = useState<string>("")
  const [imagePages, setImagePages] = useState<number>(2)
  const [imagesPerPage, setImagesPerPage] = useState<number>(4)
  const [framesPerRow, setFramesPerRow] = useState<number>(2)
  const [saveAsDefault, setSaveAsDefault] = useState<boolean>(false)
  const [useTemplate, setUseTemplate] = useState<boolean>(true)
  // NEW: Aspect ratio state
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>("4:3")

  // Function to refresh diaries from database
  const refreshDiariesFromDatabase = async () => {
    try {
      const response = await fetch('/api/construction-reports')
      if (response.ok) {
        const reports = await response.json()
        console.log('🔄 Refreshing diaries from database:', reports)
        
        // Get first available category as default
        let defaultCategoryId = 'default-category'
        try {
          const categoriesResponse = await fetch('/api/categories')
          if (categoriesResponse.ok) {
            const categoriesData = await categoriesResponse.json()
            if (categoriesData.success && Array.isArray(categoriesData.data) && categoriesData.data.length > 0) {
              defaultCategoryId = categoriesData.data[0].id
            }
          }
        } catch (e) {
          console.warn('Could not load categories for default categoryId')
        }
        
        // Transform database reports to diary format
        const diariesFromDB = reports.map((report: any) => ({
          id: report.id,
          title: report.title,
          categoryId: defaultCategoryId, // Use first available category
          status: 'completed' as const,
          createdDate: new Date(report.createdAt).toISOString().split('T')[0],
          lastModified: new Date(report.lastModified).toISOString().split('T')[0]
        }))
        
        setDiaries(diariesFromDB)
        localStorage.setItem('diaries', JSON.stringify(diariesFromDB))
      }
    } catch (error) {
      console.error('Error refreshing diaries from database:', error)
    }
  }

  // Persist dialog values to localStorage to avoid accidental resets
  useEffect(() => {
    try {
      const settings = {
        useTemplate,
        template: selectedDiaryTemplate,
        imagePages: Math.max(1, Math.min(100, Number(imagePages) || 1)),
        imagesPerPage: Math.max(1, Math.min(20, Number(imagesPerPage) || 1)),
        framesPerRow: Math.max(1, Math.min(4, Number(framesPerRow) || 2)),
        aspectRatio: selectedAspectRatio
      }
      localStorage.setItem('diary-default-settings.temp', JSON.stringify(settings))
    } catch {}
  }, [useTemplate, selectedDiaryTemplate, imagePages, imagesPerPage, framesPerRow, selectedAspectRatio])

  // Sync imageConfig with dialog values for real-time display update (but don't trigger auto-save)
  useEffect(() => {
    if (isMounted) {
      setImageConfig(prev => ({
        ...prev,
        templatePage: Math.max(1, Math.min(100, Number(imagePages) || 1)),
        imagesPerPage: Math.max(1, Math.min(20, Number(imagesPerPage) || 1))
      }))
    }
  }, [imagePages, imagesPerPage, isMounted])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "in-progress":
      case "approved":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "completed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
      case "paused":
      case "pending":
      case "draft":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/50"
    }
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      active: "Đang thực hiện",
      completed: "Hoàn thành",
      paused: "Tạm dừng",
      pending: "Chờ thực hiện",
      "in-progress": "Đang tiến hành",
      draft: "Bản nháp",
      approved: "Đã duyệt",
    }
    return statusMap[status] || status
  }

  // const filteredProjects = projects.filter((project) => project.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const filteredConstructions = constructions.filter(
    (construction) => construction.projectGroupId === selectedProjectGroup?.id,
  )
  const filteredCategories = categories.filter((category) => category.constructionId === selectedConstruction?.id)
  const filteredDiarys = diaries.filter((diary) => diary.categoryId === selectedCategory?.id)

  const handleCreateProjectGroup = () => {
    const errors: { [key: string]: string } = {}

    if (!newProjectGroup.name.trim()) errors.name = "Tên dự án là bắt buộc"
    if (!newProjectGroup.manager.trim()) errors.manager = "Quản lý là bắt buộc"

    if (Object.keys(errors).length > 0) {
      setProjectGroupErrors(errors)
      return
    }

    setProjectGroupErrors({})
    const projectGroup: ProjectGroup = {
      id: `pg-${Date.now()}`,
      name: newProjectGroup.name,
      description: newProjectGroup.description,
      manager: newProjectGroup.manager,
      status: newProjectGroup.status,
      startDate: new Date().toISOString().split("T")[0],
    }

    setProjectGroups((prev) => {
      const newProjectGroups = [...prev, projectGroup]
      localStorage.setItem("projectGroups", JSON.stringify(newProjectGroups))
      return newProjectGroups
    })
    setNewProjectGroup({ name: "", description: "", manager: "", status: "active" })
    setShowCreateProjectGroup(false)
  }

  const handleCreateConstruction = () => {
    const errors: { [key: string]: string } = {}

    if (!newConstruction.name.trim()) errors.name = "Tên hạng mục là bắt buộc"
    if (!newConstruction.location.trim()) errors.location = "Địa điểm là bắt buộc"
    if (!newConstruction.manager.trim()) errors.manager = "Quản lý là bắt buộc"
    if (!selectedProjectGroup) errors.projectGroup = "Vui lòng chọn dự án trước"

    if (Object.keys(errors).length > 0) {
      setConstructionErrors(errors)
      return
    }

    setConstructionErrors({})
    const construction: Construction = {
      id: `const-${Date.now()}`,
      name: newConstruction.name,
      location: newConstruction.location,
      manager: newConstruction.manager,
      status: newConstruction.status,
      startDate: new Date().toISOString().split("T")[0],
      projectGroupId: selectedProjectGroup!.id,
    }

    setConstructions((prev) => {
      const newConstructions = [...prev, construction]
      localStorage.setItem("constructions", JSON.stringify(newConstructions))
      return newConstructions
    })
    setNewConstruction({ name: "", location: "", manager: "", status: "active", templateFile: null })
    setShowCreateConstruction(false)
  }

  const handleCreateCategory = () => {
    const errors: { [key: string]: string } = {}

    if (!newCategory.name.trim()) errors.name = "Tên gói thầu là bắt buộc"
    if (!selectedConstruction) errors.construction = "Vui lòng chọn hạng mục trước"

    if (Object.keys(errors).length > 0) {
      setCategoryErrors(errors)
      return
    }

    setCategoryErrors({})
    const category: Category = {
      id: `cat-${Date.now()}`,
      name: newCategory.name,
      description: newCategory.description,
      constructionId: selectedConstruction!.id, // Updated to constructionId
      status: newCategory.status,
      createdDate: new Date().toISOString().split("T")[0],
    }

    setCategories((prev) => {
      const newCategories = [...prev, category]
      localStorage.setItem("categories", JSON.stringify(newCategories))
      return newCategories
    })
    setNewCategory({ name: "", description: "", status: "pending" })
    setShowCreateCategory(false)
  }

  const handleCreateDiary = async () => {
    const errors: { [key: string]: string } = {}

    if (!newDiary.title.trim()) errors.title = "Tiêu đề nhật ký là bắt buộc"
    if (!selectedCategory) errors.category = "Vui lòng chọn gói thầu trước"

    if (Object.keys(errors).length > 0) {
      setDiaryErrors(errors)
      return
    }

    setDiaryErrors({})
    const diaryId = `rep-${Date.now()}`

    // Tải template từ server nếu state chưa có
    let templates = templateFiles
    if (!templates || templates.length === 0) {
      try {
        const res = await fetch('/api/templates')
        const data = await res.json()
        if (data.success && Array.isArray(data.data)) {
          templates = data.data.map((t: any) => ({
            id: t.id,
            name: t.name,
            file: new File([], t.name + '.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
            uploadDate: new Date(t.createdAt).toLocaleDateString('vi-VN'),
            isDefault: !!t.isDefault,
            pageCount: t.pageCount || 0,
            size: t.fileSize || 0,
            type: (t.fileType || 'INITIAL').toLowerCase() as 'initial' | 'daily',
          }))
          setTemplateFiles(templates)
        }
      } catch (e) {
        console.warn('Không thể tải templates từ server, sẽ dùng cấu hình mặc định 8 trang.', e)
      }
    }

    // Chọn template mặc định theo loại
    const defaultInitial = templates.find(t => t.type === 'initial' && t.isDefault) || templates.find(t => t.type === 'initial')
    const defaultDaily = templates.find(t => t.type === 'daily' && t.isDefault) || templates.find(t => t.type === 'daily')

    // Tính số trang theo template (fallback: 2 + 3) và trang ảnh từ imageConfig
    const soTrangDau = defaultInitial?.pageCount || 2
    const soTrangThem = defaultDaily?.pageCount || 3
    const soTrangAnh = imageConfig.templatePage || 1
    const tongSoTrang = soTrangDau + soTrangThem + soTrangAnh

    const diary: Diary = {
      id: diaryId,
      title: newDiary.title,
      categoryId: selectedCategory!.id,
      status: newDiary.status,
      createdDate: new Date().toISOString().split("T")[0],
      lastModified: new Date().toISOString().split("T")[0],
    }

    // Save to database first
    try {
      const reportData = {
        title: newDiary.title,
        pages: { 1: "" }, // Start with one empty page
        totalPages: 1,
        imagePagesConfig: {}
      }
      
      const response = await fetch('/api/construction-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId: diaryId,
          data: reportData
        })
      })
      
      if (response.ok) {
        console.log('✅ Successfully saved diary to database')
        
        // Refresh diaries list from database
        await refreshDiariesFromDatabase()
        
        // Lưu thông tin báo cáo với template (ưu tiên template mặc định nếu có)
        const reportConfig = {
          diaryId,
          title: newDiary.title,
          mauNhatKyDau: defaultInitial?.id || null,
          mauNhatKyThem: defaultDaily?.id || null,
          soTrangDau,
          soTrangThem,
          soTrangAnh,
          soAnhTrenTrang: imageConfig.imagesPerPage || 4,
          tongSoTrang,
          templateFiles: {
            mauNhatKyDau: defaultInitial?.id || null,
            mauNhatKyThem: defaultDaily?.id || null
          },
          isSimpleReport: false
        }
        localStorage.setItem(`report-config-${diaryId}`, JSON.stringify(reportConfig))

        setNewDiary({ title: "", status: "draft" })
        setShowCreateDiary(false)

        // Điều hướng sang trang editor, mặc định mở trang 1
        router.push(`/construction-reports/editor/${diaryId}?pages=1`)
      } else {
        console.error('❌ Failed to save diary to database')
        alert('Không thể lưu nhật ký vào database. Vui lòng thử lại.')
      }
    } catch (error) {
      console.error('❌ Error saving diary to database:', error)
      alert('Có lỗi xảy ra khi lưu nhật ký. Vui lòng thử lại.')
    }
  }

  // Add Diary Dialog functions
  const handleAddDiary = () => {
    // Load default settings
    loadDefaultSettings()
    setShowAddDiaryDialog(true)
  }

  const loadDefaultSettings = () => {
    // Prefer unified key, fallback to legacy
    const savedDefault = localStorage.getItem("diary-default-settings")
    const savedLegacy = localStorage.getItem("addDiarySettings")
    const raw = savedDefault || savedLegacy
    if (raw) {
      try {
        const s = JSON.parse(raw)
        setUseTemplate(s.useTemplate !== undefined ? !!s.useTemplate : true)
        const tpl = typeof s.template === 'string' ? s.template : ""
        setSelectedDiaryTemplate(tpl)
        const ip = parseInt(s.imagePages)
        setImagePages(Number.isFinite(ip) && ip > 0 ? Math.min(ip, 100) : 2)
        const ipp = parseInt(s.imagesPerPage)
        setImagesPerPage(Number.isFinite(ipp) && ipp > 0 ? Math.min(ipp, 20) : imageConfig.imagesPerPage)
      } catch (e) {
        console.warn('[v0] Failed to parse saved add-diary settings:', e)
        // Use imageConfig as fallback
        setImagePages(2)
        setImagesPerPage(imageConfig.imagesPerPage)
      }
    } else {
      // Use imageConfig as default
      setImagePages(2)
      setImagesPerPage(imageConfig.imagesPerPage)
    }
  }

  const handleCreateAddDiary = () => {
    if (useTemplate && !selectedDiaryTemplate) {
      alert("Vui lòng chọn mẫu nhật ký")
      return
    }

    if (useTemplate && selectedDiaryTemplate !== "none" && existingDiaries.length === 0) {
      alert("Chưa có nhật ký nào để làm mẫu. Hãy tạo và hoàn thành một số nhật ký trước.")
      return
    }

    if (!selectedCategory) {
      alert("Vui lòng chọn gói thầu trước")
      return
    }

    // Tính toán số trang theo quy trình mới
    const selectedDiary = useTemplate && selectedDiaryTemplate !== "none" ? 
      existingDiaries.find(d => d.id === selectedDiaryTemplate) : null
    
    // Số trang từ các nguồn
    const soTrangMau = selectedDiary ? (selectedDiary.pageCount || 0) : 0
    const soTrangAnh = Math.max(1, Math.min(100, Number(imagePages) || 1))
    
    // Tổng số trang = Trang từ mẫu + Trang ảnh mới
    const tongSoTrang = soTrangMau + soTrangAnh

    // Save as default if checked
    if (saveAsDefault) {
      const settings = {
        useTemplate: !!useTemplate,
        template: selectedDiaryTemplate,
        imagePages: soTrangAnh,
        imagesPerPage: Math.max(1, Math.min(20, Number(imagesPerPage) || 1)),
        framesPerRow: Math.max(1, Math.min(4, Number(framesPerRow) || 2)),
        aspectRatio: selectedAspectRatio,
        // Thông tin về nhật ký mẫu
        selectedDiaryId: selectedDiary?.id || "",
        soTrangMau,
        tongSoTrang
      }
      // Write to unified key and keep legacy for compatibility
      localStorage.setItem("diary-default-settings", JSON.stringify(settings))
      localStorage.setItem("addDiarySettings", JSON.stringify(settings))
    }

    // Create diary with template information
    const diaryId = `rep-${Date.now()}`
    const templateName = useTemplate && selectedDiary ? 
      selectedDiary.title : 
      "tự do"
    
    const diary: Diary = {
      id: diaryId,
      title: `Nhật ký ${templateName}`,
      categoryId: selectedCategory!.id,
      status: "draft",
      createdDate: new Date().toISOString().split("T")[0],
      lastModified: new Date().toISOString().split("T")[0],
    }

    setDiaries((prev) => {
      const newDiaries = [...prev, diary]
      localStorage.setItem("diaries", JSON.stringify(newDiaries))
      return newDiaries
    })

    // Lưu thông tin báo cáo để editor đọc
    const reportConfig = {
      diaryId,
      selectedDiaryId: selectedDiary?.id || "",
      selectedDiaryTitle: selectedDiary?.title || "",
      soTrangMau,
      soTrangAnh,
      soAnhTrenTrang: Math.max(1, Math.min(20, Number(imagesPerPage) || 1)),
      soKhungTrenHang: Math.max(1, Math.min(4, Number(framesPerRow) || 2)),
      aspectRatio: selectedAspectRatio,
      tongSoTrang,
      useTemplate: useTemplate && selectedDiaryTemplate !== "none",
      existingDiaries: existingDiaries.map(d => ({
        id: d.id,
        title: d.title,
        pageCount: d.pageCount || 0,
        createdAt: d.createdAt
      }))
    }
    localStorage.setItem(`report-config-${diaryId}`, JSON.stringify(reportConfig))

    // Reset form
    setSelectedDiaryTemplate("")
    setImagePages(2)
    setImagesPerPage(4)
    setFramesPerRow(2)
    setSelectedAspectRatio("4:3")
    setSaveAsDefault(false)
    setShowAddDiaryDialog(false)

    // Navigate to editor page: open at page 1, total pages comes from config
    router.push(`/construction-reports/editor/${diaryId}?pages=1`)
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setNewCategory({
      name: category.name,
      description: category.description,
      status: category.status,
    })
    setShowEditCategory(true)
  }

  const handleUpdateCategory = () => {
    if (!editingCategory) return

    const errors: { [key: string]: string } = {}
    if (!editingCategory.name.trim()) errors.name = "Tên gói thầu là bắt buộc"

    if (Object.keys(errors).length > 0) {
      setCategoryErrors(errors)
      return
    }

    setCategoryErrors({})
    const updatedCategories = categories.map((c) =>
      c.id === editingCategory.id
        ? { ...c, name: editingCategory.name, description: editingCategory.description, status: editingCategory.status }
        : c,
    )
    setCategories(updatedCategories)
    localStorage.setItem("categories", JSON.stringify(updatedCategories))

    // Update selected category if it's the one being edited
    if (selectedCategory?.id === editingCategory.id) {
      setSelectedCategory({
        ...editingCategory,
        name: editingCategory.name,
        description: editingCategory.description,
        status: editingCategory.status,
      })
    }

    setNewCategory({ name: "", description: "", status: "pending" })
    setEditingCategory(null)
    setShowEditCategory(false)
  }

  const handleDeleteCategory = (categoryId: string) => {
    setCategoryToDelete(categoryId)
    setShowDeleteCategoryDialog(true)
  }

  const confirmDeleteCategory = () => {
    console.log("[v0] confirmDeleteCategory called, categoryToDelete:", categoryToDelete)
    if (categoryToDelete) {
      setCategories((prev) => {
        const newCategories = prev.filter((c) => c.id !== categoryToDelete)
        localStorage.setItem("categories", JSON.stringify(newCategories))
        console.log("[v0] Categories after delete:", newCategories.length)
        return newCategories
      })
      setDiaries((prev) => {
        const newDiaries = prev.filter((r) => r.categoryId !== categoryToDelete)
        localStorage.setItem("diaries", JSON.stringify(newDiaries))
        return newDiaries
      })
      if (selectedCategory?.id === categoryToDelete) {
        setSelectedCategory(null)
      }
      setCategoryToDelete(null)
    }
    console.log("[v0] Closing delete category dialog")
    setShowDeleteCategoryDialog(false)
  }

  const handleDeleteDiary = (diaryId: string) => {
    setDiaryToDelete(diaryId)
    setShowDeleteDiaryDialog(true)
  }

  const confirmDeleteDiary = () => {
    if (diaryToDelete) {
      setDiaries((prev) => {
        const newDiaries = prev.filter((r) => r.id !== diaryToDelete)
        localStorage.setItem("diaries", JSON.stringify(newDiaries))
        return newDiaries
      })
      setDiaryToDelete(null)
    }
    setShowDeleteDiaryDialog(false)
  }

  useEffect(() => {
    setIsMounted(true)
    
    // Load data from database and localStorage after component mounts
    const loadData = async () => {
      try {
        // Load diaries from database first
        const response = await fetch('/api/construction-reports')
        if (response.ok) {
          const reports = await response.json()
          console.log('📋 Loading diaries from database:', reports)
          
          // Get first available category as default
          let defaultCategoryId = 'default-category'
          try {
            const categoriesResponse = await fetch('/api/categories')
            if (categoriesResponse.ok) {
              const categoriesData = await categoriesResponse.json()
              if (categoriesData.success && Array.isArray(categoriesData.data) && categoriesData.data.length > 0) {
                defaultCategoryId = categoriesData.data[0].id
              }
            }
          } catch (e) {
            console.warn('Could not load categories for default categoryId')
          }
          
          // Transform database reports to diary format
          const diariesFromDB = reports.map((report: any) => ({
            id: report.id,
            title: report.title,
            categoryId: defaultCategoryId, // Use first available category
            status: 'completed' as const,
            createdDate: new Date(report.createdAt).toISOString().split('T')[0],
            lastModified: new Date(report.lastModified).toISOString().split('T')[0]
          }))
          
          setDiaries(diariesFromDB)
          
          // Also save to localStorage for backup
          localStorage.setItem('diaries', JSON.stringify(diariesFromDB))
        } else {
          // Fallback to localStorage if database fails
          const savedDiaries = localStorage.getItem('diaries')
          if (savedDiaries) {
            setDiaries(JSON.parse(savedDiaries))
          }
        }
      } catch (error) {
        console.error('Error loading diaries from database, falling back to localStorage:', error)
        // Fallback to localStorage
        const savedDiaries = localStorage.getItem('diaries')
        if (savedDiaries) {
          setDiaries(JSON.parse(savedDiaries))
        }
      }
      
      // Load other data from database APIs
      try {
        // Load projects from database
        const projectsResponse = await fetch('/api/projects')
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json()
          if (projectsData.success && Array.isArray(projectsData.data)) {
            const projectsFromDB = projectsData.data.map((project: any) => ({
              id: project.id,
              name: project.name,
              description: project.description || '',
              status: project.status.toLowerCase() as 'active' | 'completed' | 'paused',
              startDate: new Date(project.startDate).toISOString().split('T')[0],
              endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : undefined,
              manager: project.manager || 'N/A'
            }))
            setProjectGroups(projectsFromDB)
            localStorage.setItem('projectGroups', JSON.stringify(projectsFromDB))
          }
        }
        
        // Load constructions from database
        const constructionsResponse = await fetch('/api/constructions')
        if (constructionsResponse.ok) {
          const constructionsData = await constructionsResponse.json()
          if (constructionsData.success && Array.isArray(constructionsData.data)) {
            const constructionsFromDB = constructionsData.data.map((construction: any) => ({
              id: construction.id,
              name: construction.name,
              location: construction.location || '',
              status: construction.status.toLowerCase() as 'active' | 'completed' | 'paused',
              startDate: new Date(construction.startDate).toISOString().split('T')[0],
              endDate: construction.endDate ? new Date(construction.endDate).toISOString().split('T')[0] : undefined,
              manager: construction.manager || 'N/A',
              projectGroupId: construction.projectId
            }))
            setConstructions(constructionsFromDB)
            localStorage.setItem('constructions', JSON.stringify(constructionsFromDB))
          }
        }
        
        // Load categories from database
        const categoriesResponse = await fetch('/api/categories')
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          if (categoriesData.success && Array.isArray(categoriesData.data)) {
            const categoriesFromDB = categoriesData.data.map((category: any) => ({
              id: category.id,
              name: category.name,
              description: category.description || '',
              constructionId: category.constructionId,
              status: category.status.toLowerCase() as 'pending' | 'in-progress' | 'completed',
              createdDate: new Date(category.createdAt).toISOString().split('T')[0]
            }))
            setCategories(categoriesFromDB)
            localStorage.setItem('categories', JSON.stringify(categoriesFromDB))
          }
        }
      } catch (error) {
        console.error('Error loading data from database APIs, falling back to localStorage:', error)
        // Fallback to localStorage
        try {
          const savedProjectGroups = localStorage.getItem('projectGroups')
          if (savedProjectGroups) {
            setProjectGroups(JSON.parse(savedProjectGroups))
          }
          
          const savedConstructions = localStorage.getItem('constructions')
          if (savedConstructions) {
            setConstructions(JSON.parse(savedConstructions))
          }
          
          const savedCategories = localStorage.getItem('categories')
          if (savedCategories) {
            setCategories(JSON.parse(savedCategories))
          }
        } catch (localStorageError) {
          console.error('Error loading data from localStorage:', localStorageError)
        }
      }
    }
    
    loadData()
  }, [])

  useEffect(() => {
    if (!isMounted) return

    // Load image configuration from database first, fallback to localStorage
    const loadImageConfig = async () => {
      try {
        // Try to load from database first
        const response = await fetch('/api/settings?key=imageConfig')
        if (response.ok) {
          const config = await response.json()
          console.log('📋 Loading image config from database:', config)
          setImageConfig(config)
          setIsConfigLoaded(true)
          return
        }
      } catch (error) {
        console.error("Error loading image config from database:", error)
      }

      // Fallback to localStorage
      try {
        const savedImageConfig = localStorage.getItem("imageConfig")
        if (savedImageConfig) {
          const config = JSON.parse(savedImageConfig)
          console.log('📋 Loading image config from localStorage (fallback):', config)
          setImageConfig(config)
          // Save to database for future use
          await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key: 'imageConfig',
              value: config,
              description: 'Image configuration settings'
            })
          })
        } else {
          // Set default values if no saved config
          const defaultConfig = { templatePage: 1, imagesPerPage: 4 }
          console.log('📋 Using default image config:', defaultConfig)
          setImageConfig(defaultConfig)
          // Save default to database
          await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key: 'imageConfig',
              value: defaultConfig,
              description: 'Image configuration settings'
            })
          })
          localStorage.setItem("imageConfig", JSON.stringify(defaultConfig))
        }
      } catch (error) {
        console.error("Error loading image config:", error)
        // Fallback to default values
        const defaultConfig = { templatePage: 1, imagesPerPage: 4 }
        setImageConfig(defaultConfig)
        localStorage.setItem("imageConfig", JSON.stringify(defaultConfig))
      }
      setIsConfigLoaded(true)
    }

    // Load templates from server API (always sync with server)
    const loadTemplatesFromServer = async () => {
      try {
        console.log('📁 Loading templates from API server...')
        const response = await fetch('/api/templates')
        const result = await response.json()
        
        if (result.success && result.data.length > 0) {
          // Convert server data to local template format
          const templates = result.data.map((serverTemplate: any) => ({
            id: serverTemplate.id,
            name: serverTemplate.name,
            file: new File([], serverTemplate.name + '.docx', { 
              type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
            }),
            uploadDate: new Date(serverTemplate.createdAt).toLocaleDateString('vi-VN'),
            isDefault: serverTemplate.isDefault,
            pageCount: serverTemplate.pageCount,
            size: serverTemplate.fileSize,
            type: serverTemplate.fileType.toLowerCase() as 'initial' | 'daily',
          }))
          setTemplateFiles(templates)
          console.log('✅ Loaded', templates.length, 'templates from API server')
          
          // Save to database for future use
          const templatesData = templates.map((template) => ({
            id: template.id,
            name: template.name,
            uploadDate: template.uploadDate,
            isDefault: template.isDefault,
            pageCount: template.pageCount,
            size: template.size,
            type: template.type,
            content: '', // Will be populated when file is read
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          }))
          await DatabaseStorage.setItem("templateFiles", templatesData, "Template files configuration")
          console.log('💾 Templates saved to database for future use')
        } else {
          console.log('📁 No templates found in API server')
        }
      } catch (error) {
        console.error('❌ Error loading templates:', error)
        console.log('📁 No templates available')
      }
    }

    // Load existing diaries to use as templates
    const loadExistingDiaries = async () => {
      try {
        console.log('📖 Loading existing diaries for template selection...')
        const response = await fetch('/api/construction-reports')
        const result = await response.json()
        
        if (Array.isArray(result) && result.length > 0) {
          // All reports can be used as templates, add status and pageCount properties
          const availableDiaries = result.map((diary: any) => ({
            ...diary,
            status: 'completed', // Mark all as completed for template use
            pageCount: diary.totalPages || 1,
            createdAt: diary.createdAt || diary.lastModified
          }))
          setExistingDiaries(availableDiaries)
          console.log('✅ Loaded', availableDiaries.length, 'existing diaries for template selection')
        } else {
          console.log('📖 No existing diaries found')
          setExistingDiaries([])
        }
      } catch (error) {
        console.error('❌ Error loading existing diaries:', error)
        console.log('📖 No existing diaries available')
        setExistingDiaries([])
      }
    }

    // Load image config first, then templates and existing diaries
    loadImageConfig()
    loadTemplatesFromServer()
    loadExistingDiaries()
  }, [isMounted])

  // Auto-save image configuration when it changes (but not on initial load) - debounced
  useEffect(() => {
    if (isConfigLoaded && isMounted) {
      const timeoutId = setTimeout(() => {
        console.log('💾 Saving image config to database:', imageConfig)
        
        const saveImageConfig = async () => {
          try {
            await fetch('/api/settings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                key: 'imageConfig',
                value: imageConfig,
                description: 'Image configuration settings'
              })
            })
            console.log('✅ Image config saved to database successfully')
          } catch (error) {
            console.error('Error saving image config to database:', error)
            // Fallback to localStorage
            try {
              localStorage.setItem("imageConfig", JSON.stringify(imageConfig))
              console.log('💾 Fallback: Image config saved to localStorage')
            } catch (localError) {
              console.error('Error saving image config to localStorage:', localError)
            }
          }
        }
        
        saveImageConfig()
      }, 1000) // Debounce for 1 second
      
      return () => clearTimeout(timeoutId)
    }
  }, [imageConfig, isConfigLoaded, isMounted])

  // Functions to handle image configuration changes
  const handleTemplatePageChange = (value: string) => {
    const page = Math.max(1, Math.min(100, parseInt(value) || 1))
    console.log('🔄 Template page changed to:', page)
    setImageConfig(prev => ({ ...prev, templatePage: page }))
  }

  const handleImagesPerPageChange = (value: string) => {
    const count = Math.max(1, Math.min(20, parseInt(value) || 1))
    console.log('🔄 Images per page changed to:', count)
    setImageConfig(prev => ({ ...prev, imagesPerPage: count }))
  }

// Word page counting is now handled by the imported utility function

  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>, templateType: 'initial' | 'daily') => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        setTemplateErrors(prev => ({ ...prev, [templateType]: "Chỉ chấp nhận file Word (.docx)" }))
        return
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setTemplateErrors(prev => ({ ...prev, [templateType]: "File không được vượt quá 10MB" }))
        return
      }

      setTemplateErrors(prev => ({ ...prev, [templateType]: "" }))

      try {
        // Upload to server via API
        const formData = new FormData()
        formData.append('file', file)
        formData.append('name', file.name.replace('.docx', ''))
        formData.append('file_type', templateType.toUpperCase() as 'INITIAL' | 'DAILY')
        
        // Check if there's already a template of this type to set as default
        const existingTemplateOfType = templateFiles.find(t => t.type === templateType)
        const isDefaultForType = !existingTemplateOfType
        formData.append('is_default', isDefaultForType.toString())

        const response = await fetch('/api/templates', {
          method: 'POST',
          body: formData
        })

        const result = await response.json()

        if (result.success) {
          // Get page count for local display
          const pageCount = await getWordPageCount(file)

          // Create local template object for immediate UI update
          const newTemplate: TemplateFile = {
            id: result.data.id,
            name: result.data.name,
            file: file,
            uploadDate: new Date().toLocaleDateString('vi-VN'),
            isDefault: result.data.isDefault,
            pageCount: pageCount,
            size: file.size,
            type: templateType,
          }

          const updatedTemplates = [...templateFiles, newTemplate]
          setTemplateFiles(updatedTemplates)

          // Save to database for persistence
          const reader = new FileReader()
          reader.onload = async () => {
            const templatesData = updatedTemplates.map((template) => ({
              id: template.id,
              name: template.name,
              fileType: template.file.type,
              size: template.size,
              content: reader.result,
              uploadDate: template.uploadDate,
              isDefault: template.isDefault,
              pageCount: template.pageCount,
              type: template.type,
            }))
            try {
              await DatabaseStorage.setItem("templateFiles", templatesData, "Template files configuration")
              console.log('💾 Templates saved to database successfully')
            } catch (error) {
              console.error('❌ Error saving templates to database:', error)
            }
          }
          reader.readAsDataURL(file)

          // Show success message
          console.log('✅ Template uploaded successfully:', result.data.name)
        } else {
          setTemplateErrors(prev => ({ ...prev, [templateType]: result.error || 'Upload thất bại' }))
        }
      } catch (error) {
        console.error('❌ Upload error:', error)
        setTemplateErrors(prev => ({ ...prev, [templateType]: 'Có lỗi xảy ra khi upload file' }))
      }
    }
  }

  const handleSetDefaultTemplate = (templateId: string) => {
    const selectedTemplate = templateFiles.find(t => t.id === templateId)
    if (!selectedTemplate) return

    const updatedTemplates = templateFiles.map((template) => ({
      ...template,
      isDefault: template.type === selectedTemplate.type ? template.id === templateId : template.isDefault,
    }))
    setTemplateFiles(updatedTemplates)

    const templatesData = updatedTemplates.map((template) => ({
      id: template.id,
      name: template.name,
      fileType: template.file.type,
      size: template.size,
      content: template.file,
      uploadDate: template.uploadDate,
      isDefault: template.isDefault,
      pageCount: template.pageCount,
      type: template.type,
    }))
    
    // Save to database
    DatabaseStorage.setItem("templateFiles", templatesData, "Template files configuration")
      .then(() => console.log('💾 Default template setting saved to database'))
      .catch(error => console.error('❌ Error saving default template to database:', error))
  }

  const handleRemoveTemplate = (templateId: string) => {
    setTemplateToDelete(templateId)
    setShowDeleteTemplateConfirm(true)
  }

  const confirmDeleteTemplate = async () => {
    if (templateToDelete) {
      try {
        // Call API to delete template from server
        const response = await fetch(`/api/templates?id=${templateToDelete}`, {
          method: 'DELETE',
        })

        const result = await response.json()

        if (result.success) {
          // Remove from local state only after successful API call
          const updatedTemplates = templateFiles.filter((template) => template.id !== templateToDelete)

          // If deleted template was default and there are other templates, make first one default
          if (updatedTemplates.length > 0) {
            const deletedTemplate = templateFiles.find((t) => t.id === templateToDelete)
            if (deletedTemplate?.isDefault) {
              updatedTemplates[0].isDefault = true
            }
          }

          setTemplateFiles(updatedTemplates)
          
          // Save to local database
          DatabaseStorage.setItem("templateFiles", updatedTemplates, "Template files configuration")
            .then(() => console.log('💾 Template deletion saved to local database'))
            .catch(error => console.error('❌ Error saving template deletion to local database:', error))

          console.log('✅ Template deleted successfully from server and local state')
          
          // Refresh templates from server to ensure sync
          await refreshTemplatesFromServer()
        } else {
          console.error('❌ Failed to delete template from server:', result.error)
          alert(`Lỗi xóa template: ${result.error}`)
        }
      } catch (error) {
        console.error('❌ Error calling delete API:', error)
        alert('Có lỗi xảy ra khi xóa template. Vui lòng thử lại.')
      }
    }
    setShowDeleteTemplateConfirm(false)
    setTemplateToDelete(null)
  }

  // Helper function to refresh templates from server
  const refreshTemplatesFromServer = async () => {
    try {
      console.log('🔄 Refreshing templates from server...')
      const response = await fetch('/api/templates')
      const result = await response.json()
      
      if (result.success) {
        const templates = result.data.map((serverTemplate: any) => ({
          id: serverTemplate.id,
          name: serverTemplate.name,
          file: new File([], serverTemplate.name + '.docx', { 
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
          }),
          uploadDate: new Date(serverTemplate.createdAt).toLocaleDateString('vi-VN'),
          isDefault: serverTemplate.isDefault,
          pageCount: serverTemplate.pageCount,
          size: serverTemplate.fileSize,
          type: serverTemplate.fileType.toLowerCase() as 'initial' | 'daily',
        }))
        setTemplateFiles(templates)
        console.log('✅ Templates refreshed:', templates.length, 'templates loaded')
      }
    } catch (error) {
      console.error('❌ Error refreshing templates:', error)
    }
  }

  const handleEditDiary = (diary: Diary) => {
    setEditingDiary(diary)
    setNewDiary({
      title: diary.title,
      status: diary.status,
    })
    setShowEditDiary(true)
  }

  const handleUpdateDiary = () => {
    if (!editingDiary) return

    const errors: { [key: string]: string } = {}
    if (!editingDiary.title.trim()) errors.title = "Tiêu đề nhật ký là bắt buộc"

    if (Object.keys(errors).length > 0) {
      setDiaryErrors(errors)
      return
    }

    setDiaryErrors({})
    const updatedDiaries = diaries.map((r) =>
      r.id === editingDiary.id ? { ...r, title: editingDiary.title, status: editingDiary.status } : r,
    )
    setDiaries(updatedDiaries)
    localStorage.setItem("diaries", JSON.stringify(updatedDiaries))

    setNewDiary({ title: "", status: "draft" })
    setEditingDiary(null)
    setShowEditDiary(false)
  }

  const handleSelectProjectGroup = (projectGroup: ProjectGroup) => {
    setSelectedProjectGroup(projectGroup)
    setSelectedConstruction(null)
    setSelectedCategory(null)
  }

  const handleSelectConstruction = (construction: Construction) => {
    setSelectedConstruction(construction)
    setSelectedCategory(null)
  }

  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category)
  }

  const handleDiaryClick = (diary: Diary) => {
    router.push(`/construction-reports/editor/${diary.id}`)
  }

  const handleTemplateDrop = (e: React.DragEvent<HTMLDivElement>, templateType: 'initial' | 'daily') => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      handleTemplateUpload({ target: { files: [file] } } as any, templateType)
    }
  }

  const handleEditProjectGroup = (projectGroup: ProjectGroup) => {
    console.log("[v0] handleEditProjectGroup called with:", projectGroup)
    setEditingProjectGroup(projectGroup)
    console.log("[v0] Setting showEditProjectGroup to true")
    setShowEditProjectGroup(true)
  }

  const handleDeleteProjectGroup = (projectGroupId: string) => {
    setProjectGroupToDelete(projectGroupId)
    setShowDeleteProjectGroupDialog(true)
  }

  const confirmDeleteProjectGroup = () => {
    if (projectGroupToDelete) {
      setProjectGroups((prev) => {
        const newProjectGroups = prev.filter((pg) => pg.id !== projectGroupToDelete)
        localStorage.setItem("projectGroups", JSON.stringify(newProjectGroups))
        return newProjectGroups
      })
      // Delete all related constructions, categories, and diaries
      setConstructions((prev) => {
        const newConstructions = prev.filter((c) => c.projectGroupId !== projectGroupToDelete)
        localStorage.setItem("constructions", JSON.stringify(newConstructions))
        return newConstructions
      })
      setCategories((prev) => {
        const newCategories = prev.filter((cat) => {
          const construction = constructions.find((c) => c.id === cat.constructionId)
          return construction?.projectGroupId !== projectGroupToDelete
        })
        localStorage.setItem("categories", JSON.stringify(newCategories))
        return newCategories
      })
      setDiaries((prev) => {
        const newDiaries = prev.filter((r) => {
          const category = categories.find((cat) => cat.id === r.categoryId)
          const construction = constructions.find((c) => c.id === category?.constructionId)
          return construction?.projectGroupId !== projectGroupToDelete
        })
        localStorage.setItem("diaries", JSON.stringify(newDiaries))
        return newDiaries
      })
      if (selectedProjectGroup?.id === projectGroupToDelete) {
        setSelectedProjectGroup(null)
        setSelectedConstruction(null)
        setSelectedCategory(null)
      }
      setProjectGroupToDelete(null)
    }
    setShowDeleteProjectGroupDialog(false)
  }

  const handleEditConstruction = (construction: Construction) => {
    console.log("[v0] handleEditConstruction called with:", construction)
    setEditingConstruction(construction)
    console.log("[v0] Setting showEditConstructionDialog to true")
    setShowEditConstructionDialog(true)
  }

  const handleDeleteConstruction = (constructionId: string) => {
    setConstructionToDelete(constructionId)
    setShowDeleteConstructionDialog(true)
  }

  const confirmDeleteConstruction = () => {
    if (constructionToDelete) {
      setConstructions((prev) => {
        const newConstructions = prev.filter((c) => c.id !== constructionToDelete)
        localStorage.setItem("constructions", JSON.stringify(newConstructions))
        return newConstructions
      })

      // Also delete related categories and diaries
      setCategories((prev) => {
        const newCategories = prev.filter((cat) => cat.constructionId !== constructionToDelete)
        localStorage.setItem("categories", JSON.stringify(newCategories))
        return newCategories
      })

      setDiaries((prev) => {
        const categoriesToDelete = categories.filter((cat) => cat.constructionId === constructionToDelete)
        const categoryIdsToDelete = categoriesToDelete.map((cat) => cat.id)
        const newDiaries = prev.filter((diary) => !categoryIdsToDelete.includes(diary.categoryId))
        localStorage.setItem("diaries", JSON.stringify(newDiaries))
        return newDiaries
      })
    }
    setConstructionToDelete(null)
    setShowDeleteConstructionDialog(false)
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-slate-300 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
                <span>{t("construction_diaries.back_home")}</span>
              </Link>
              <div className="h-6 w-px bg-slate-600" />
              <h1 className="text-xl font-semibold text-cyan-400">{t("construction_diaries.title")}</h1>
            </div>
            <span className="text-sm text-slate-400">{t("construction_diaries.title")}</span>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-cyan-400" />
              <h1 className="text-3xl font-bold">{t("construction_diaries.title")}</h1>
            </div>

          </div>
          <p className="text-slate-400">{t("construction_diaries.subtitle")}</p>
        </div>

        {/* Template Upload Section - HIDDEN as requested by user */}
        {false && (
        <Card className="mb-8 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-cyan-400">
              <FileText className="h-5 w-5" />
              <span>Quản lý Mẫu Nhật ký Thi công</span>
              <span className="text-red-400">*</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TemplateUploadSection
              templateFiles={templateFiles}
              templateErrors={templateErrors}
              imageConfig={imageConfig}
              selectedTemplate={selectedTemplate}
              onTemplateUpload={handleTemplateUpload}
              onTemplateDrop={handleTemplateDrop}
              onSetDefaultTemplate={handleSetDefaultTemplate}
              onRemoveTemplate={handleRemoveTemplate}
              onTemplatePageChange={handleTemplatePageChange}
              onImagesPerPageChange={handleImagesPerPageChange}
              onSelectTemplate={setSelectedTemplate}
            />
          </CardContent>
        </Card>
        )}

        {/* Main Content Grid - Updated to 4 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Project Groups Column */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="flex items-center space-x-2 text-blue-400">
                <FolderOpen className="h-5 w-5" />
                <span>Dự án</span>
              </CardTitle>
              <Dialog open={showCreateProjectGroup} onOpenChange={setShowCreateProjectGroup}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-1" />
                    Tạo
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700 text-white">
                  <DialogHeader>
                    <DialogTitle>Tạo dự án mới</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="projectgroup-name">Tên dự án *</Label>
                      <Input
                        id="projectgroup-name"
                        value={newProjectGroup.name}
                        onChange={(e) => setNewProjectGroup({ ...newProjectGroup, name: e.target.value })}
                        className="bg-slate-700 border-slate-600"
                        placeholder="Tên dự án"
                      />
                    </div>
                    <div>
                      <Label htmlFor="projectgroup-description">Mô tả</Label>
                      <Textarea
                        id="projectgroup-description"
                        value={newProjectGroup.description}
                        onChange={(e) => setNewProjectGroup({ ...newProjectGroup, description: e.target.value })}
                        className="bg-slate-700 border-slate-600"
                        placeholder="Mô tả dự án"
                      />
                    </div>
                    <div>
                      <Label htmlFor="projectgroup-manager">Quản lý *</Label>
                      <Input
                        id="projectgroup-manager"
                        value={newProjectGroup.manager}
                        onChange={(e) => setNewProjectGroup({ ...newProjectGroup, manager: e.target.value })}
                        className="bg-slate-700 border-slate-600"
                        placeholder="Quản lý dự án"
                      />
                    </div>
                    <div>
                      <Label htmlFor="projectgroup-status">Trạng thái</Label>
                      <Select
                        value={newProjectGroup.status}
                        onValueChange={(value: any) => setNewProjectGroup({ ...newProjectGroup, status: value })}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="active">Đang thực hiện</SelectItem>
                          <SelectItem value="completed">Hoàn thành</SelectItem>
                          <SelectItem value="paused">Tạm dừng</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateProjectGroup(false)}
                        className="text-black font-semibold hover:text-black"
                      >
                        Hủy
                      </Button>
                      <Button onClick={handleCreateProjectGroup} className="bg-blue-600 hover:bg-blue-700">
                        Tạo dự án
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-3">
              {projectGroups.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Chọn dự án để xem hạng mục</p>
              ) : (
                projectGroups.map((projectGroup) => (
                  <div
                    key={projectGroup.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedProjectGroup?.id === projectGroup.id
                        ? "bg-blue-900/30 border-blue-600"
                        : "bg-slate-700 border-slate-600 hover:border-slate-500"
                    }`}
                    onClick={() => handleSelectProjectGroup(projectGroup)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{projectGroup.name}</h3>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditProjectGroup(projectGroup)
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteProjectGroup(projectGroup.id)
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-red-400" />
                        </Button>
                      </div>
                    </div>
                    {projectGroup.description && (
                      <p className="text-sm text-slate-400 mb-2">{projectGroup.description}</p>
                    )}
                    <p className="text-sm text-slate-400 mb-2">Quản lý: {projectGroup.manager}</p>
                    <Badge
                      variant={
                        projectGroup.status === "completed"
                          ? "default"
                          : projectGroup.status === "active"
                            ? "secondary"
                            : "outline"
                      }
                      className={
                        projectGroup.status === "completed"
                          ? "bg-blue-600"
                          : projectGroup.status === "active"
                            ? "bg-green-600"
                            : "bg-yellow-600"
                      }
                    >
                      {projectGroup.status === "active"
                        ? "Đang thực hiện"
                        : projectGroup.status === "completed"
                          ? "Hoàn thành"
                          : "Tạm dừng"}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Constructions Column */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="flex items-center space-x-2 text-cyan-400">
                <Building className="h-5 w-5" />
                <span>Hạng mục</span>
              </CardTitle>
              <Dialog open={showCreateConstruction} onOpenChange={setShowCreateConstruction}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700" disabled={!selectedProjectGroup}>
                    <Plus className="h-4 w-4 mr-1" />
                    Tạo
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700 text-white">
                  <DialogHeader>
                    <DialogTitle>Tạo hạng mục mới</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="construction-name">Tên hạng mục *</Label>
                      <Input
                        id="construction-name"
                        value={newConstruction.name}
                        onChange={(e) => setNewConstruction({ ...newConstruction, name: e.target.value })}
                        className="bg-slate-700 border-slate-600"
                        placeholder="Tên hạng mục"
                      />
                    </div>
                    <div>
                      <Label htmlFor="construction-location">Địa điểm *</Label>
                      <Input
                        id="construction-location"
                        value={newConstruction.location}
                        onChange={(e) => setNewConstruction({ ...newConstruction, location: e.target.value })}
                        className="bg-slate-700 border-slate-600"
                        placeholder="Địa điểm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="construction-manager">Quản lý *</Label>
                      <Input
                        id="construction-manager"
                        value={newConstruction.manager}
                        onChange={(e) => setNewConstruction({ ...newConstruction, manager: e.target.value })}
                        className="bg-slate-700 border-slate-600"
                        placeholder="Quản lý hạng mục"
                      />
                    </div>
                    <div>
                      <Label htmlFor="construction-status">Trạng thái</Label>
                      <Select
                        value={newConstruction.status}
                        onChange={(value: any) => setNewConstruction({ ...newConstruction, status: value })}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="active">Đang thực hiện</SelectItem>
                          <SelectItem value="completed">Hoàn thành</SelectItem>
                          <SelectItem value="paused">Tạm dừng</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateConstruction(false)}
                        className="text-black font-semibold hover:text-black"
                      >
                        Hủy
                      </Button>
                      <Button onClick={handleCreateConstruction} className="bg-cyan-600 hover:bg-cyan-700">
                        Tạo hạng mục
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-3">
              {!selectedProjectGroup ? (
                <p className="text-slate-400 text-center py-8">Chọn dự án để xem hạng mục</p>
              ) : filteredConstructions.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Chọn hạng mục để xem gói thầu</p>
              ) : (
                filteredConstructions.map((construction) => (
                  <div
                    key={construction.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedConstruction?.id === construction.id
                        ? "bg-cyan-900/30 border-cyan-600"
                        : "bg-slate-700 border-slate-600 hover:border-slate-500"
                    }`}
                    onClick={() => handleSelectConstruction(construction)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{construction.name}</h3>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditConstruction(construction)
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteConstruction(construction.id)
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-red-400" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">{construction.location}</p>
                    <p className="text-sm text-slate-400 mb-2">Quản lý: {construction.manager}</p>
                    <Badge
                      variant={
                        construction.status === "completed"
                          ? "default"
                          : construction.status === "active"
                            ? "secondary"
                            : "outline"
                      }
                      className={
                        construction.status === "completed"
                          ? "bg-blue-600"
                          : construction.status === "active"
                            ? "bg-green-600"
                            : "bg-yellow-600"
                      }
                    >
                      {construction.status === "active"
                        ? "Đang thực hiện"
                        : construction.status === "completed"
                          ? "Hoàn thành"
                          : "Tạm dừng"}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Categories Column */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="flex items-center space-x-2 text-purple-400">
                <Users className="h-5 w-5" />
                <span>{t("construction_diaries.categories")}</span>
              </CardTitle>
              <Dialog open={showCreateCategory} onOpenChange={setShowCreateCategory}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700" disabled={!selectedConstruction}>
                    <Plus className="h-4 w-4 mr-1" />
                    {t("construction_diaries.create_category")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700 text-white">
                  <DialogHeader>
                    <DialogTitle>{t("construction_diaries.modal.create_category")}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="category-name">{t("construction_diaries.category_name")} *</Label>
                      <Input
                        id="category-name"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        className="bg-slate-700 border-slate-600"
                        placeholder={t("construction_diaries.category_name")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="category-description">{t("construction_diaries.category_description")}</Label>
                      <Textarea
                        id="category-description"
                        value={newCategory.description}
                        onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                        className="bg-slate-700 border-slate-600"
                        placeholder={t("construction_diaries.category_description")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="category-status">{t("construction_diaries.project_status")}</Label>
                      <Select
                        value={newCategory.status}
                        onValueChange={(value: any) => setNewCategory({ ...newCategory, status: value })}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="pending">{t("construction_diaries.status.pending")}</SelectItem>
                          <SelectItem value="in-progress">{t("construction_diaries.status.in_progress")}</SelectItem>
                          <SelectItem value="completed">{t("construction_diaries.status.completed")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowCreateCategory(false)} className="text-slate-900">
                        {t("construction_diaries.actions.cancel")}
                      </Button>
                      <Button onClick={handleCreateCategory} className="bg-purple-600 hover:bg-purple-700">
                        {t("construction_diaries.actions.create")}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-3">
              {!selectedConstruction ? (
                <p className="text-slate-400 text-center py-8">Chọn hạng mục để xem gói thầu</p>
              ) : filteredCategories.length === 0 ? (
                <p className="text-slate-400 text-center py-8">{t("construction_diaries.select_category")}</p>
              ) : (
                filteredCategories.map((category) => (
                  <div
                    key={category.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedCategory?.id === category.id
                        ? "bg-purple-900/30 border-purple-600"
                        : "bg-slate-700 border-slate-600 hover:border-slate-500"
                    }`}
                    onClick={() => handleSelectCategory(category)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{category.name}</h3>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditCategory(category)
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setCategoryToDelete(category.id)
                            setShowDeleteCategoryDialog(true)
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-red-400" />
                        </Button>
                      </div>
                    </div>
                    {category.description && <p className="text-sm text-slate-400 mb-2">{category.description}</p>}
                    <Badge
                      variant={
                        category.status === "completed"
                          ? "default"
                          : category.status === "in-progress"
                            ? "secondary"
                            : "outline"
                      }
                      className={
                        category.status === "completed"
                          ? "bg-blue-600"
                          : category.status === "in-progress"
                            ? "bg-green-600"
                            : "bg-yellow-600"
                      }
                    >
                      {t(`construction_diaries.status.${category.status.replace("-", "_")}`)}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Diarys Column */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="flex items-center space-x-2 text-green-400">
                <FileText className="h-5 w-5" />
                <span>{t("construction_diaries.diaries")}</span>
              </CardTitle>
              <div className="flex space-x-2">
                <Dialog open={showCreateDiary} onOpenChange={setShowCreateDiary}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-1" />
                      Tạo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-slate-700 text-white">
                    <DialogHeader>
                      <DialogTitle>{t("construction_diaries.modal.create_diary")}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="diary-title">{t("construction_diaries.diary_title")} *</Label>
                        <Input
                          id="diary-title"
                          value={newDiary.title}
                          onChange={(e) => setNewDiary({ ...newDiary, title: e.target.value })}
                          className="bg-slate-700 border-slate-600"
                          placeholder={t("construction_diaries.diary_title")}
                        />
                        {diaryErrors.title && (
                          <p className="text-red-400 text-sm mt-1">{diaryErrors.title}</p>
                        )}
                        {diaryErrors.category && (
                          <p className="text-red-400 text-sm mt-1">{diaryErrors.category}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="diary-status">{t("construction_diaries.project_status")}</Label>
                        <Select
                          value={newDiary.status}
                          onValueChange={(value: any) => setNewDiary({ ...newDiary, status: value })}
                        >
                          <SelectTrigger className="bg-slate-700 border-slate-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            <SelectItem value="draft">{t("construction_diaries.status.draft")}</SelectItem>
                            <SelectItem value="completed">{t("construction_diaries.status.completed")}</SelectItem>
                            <SelectItem value="approved">{t("construction_diaries.status.approved")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowCreateDiary(false)} className="text-white border-slate-600 hover:bg-slate-700">
                          {t("construction_diaries.actions.cancel")}
                        </Button>
                        <Button onClick={handleCreateDiary} className="bg-green-600 hover:bg-green-700">
                          {t("construction_diaries.actions.create")}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

            </CardHeader>
            <CardContent className="space-y-3">
              {!selectedCategory ? (
                <p className="text-slate-400 text-center py-8">{t("construction_diaries.select_diary")}</p>
              ) : filteredDiarys.length === 0 ? (
                <p className="text-slate-400 text-center py-8">{t("construction_diaries.select_diary")}</p>
              ) : (
                filteredDiarys.map((diary) => (
                  <div
                    key={diary.id}
                    className="p-3 rounded-lg border bg-slate-700 border-slate-600 hover:border-slate-500 transition-colors cursor-pointer"
                    onClick={() => handleDiaryClick(diary)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{diary.title}</h3>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditDiary(diary)
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDiaryToDelete(diary.id)
                            setShowDeleteDiaryDialog(true)
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-red-400" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">
                      {t("construction_diaries.project_status")}: {new Date(diary.createdDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-slate-400 mb-2">
                      Sửa: {new Date(diary.lastModified).toLocaleDateString()}
                    </p>
                    <Badge
                      variant={
                        diary.status === "approved"
                          ? "default"
                          : diary.status === "completed"
                            ? "secondary"
                            : "outline"
                      }
                      className={
                        diary.status === "approved"
                          ? "bg-green-600"
                          : diary.status === "completed"
                            ? "bg-blue-600"
                            : "bg-yellow-600"
                      }
                    >
                      {t(`construction_diaries.status.${diary.status}`)}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Statistics - Updated to include project groups */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <FolderOpen className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold">{projectGroups.length}</p>
                  <p className="text-sm text-slate-400">Tổng dự án</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Building className="h-8 w-8 text-cyan-400" />
                <div>
                  <p className="text-2xl font-bold">{constructions.length}</p>
                  <p className="text-sm text-slate-400">Tổng hạng mục</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-purple-400" />
                <div>
                  <p className="text-2xl font-bold">{categories.length}</p>
                  <p className="text-sm text-slate-400">{t("construction_diaries.stats.total_categories")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold">{diaries.length}</p>
                  <p className="text-sm text-slate-400">{t("construction_diaries.stats.total_diaries")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Calendar className="h-8 w-8 text-yellow-400" />
                <div>
                  <p className="text-2xl font-bold">{projectGroups.filter((pg) => pg.status === "active").length}</p>
                  <p className="text-sm text-slate-400">Đang thực hiện</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Delete Confirmation Dialogs */}
        <Dialog open={showDeleteProjectGroupDialog} onOpenChange={setShowDeleteProjectGroupDialog}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-red-400">Xác nhận xóa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Bạn có chắc chắn muốn xóa dự án này không?</p>
              <p className="text-sm text-slate-400">
                Tất cả hạng mục, gói thầu và nhật ký liên quan sẽ bị xóa. Hành động này không thể hoàn tác.
              </p>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteProjectGroupDialog(false)}
                  className="text-black font-semibold hover:text-black"
                >
                  Hủy
                </Button>
                <Button onClick={confirmDeleteProjectGroup} className="bg-red-600 hover:bg-red-700">
                  Xóa
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteConstructionDialog} onOpenChange={setShowDeleteConstructionDialog}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-red-400">{t("construction_diaries.confirm_delete")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-slate-300">{t("construction_diaries.confirm_delete_construction")}</p>
              <p className="text-sm text-slate-400">{t("construction_diaries.delete_construction_warning")}</p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConstructionDialog(false)}
                className="border-slate-600 text-slate-900 hover:bg-slate-700 hover:text-white"
              >
                {t("construction_diaries.cancel")}
              </Button>
              <Button variant="destructive" onClick={confirmDeleteConstruction} className="bg-red-600 hover:bg-red-700">
                {t("construction_diaries.delete")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteCategoryDialog} onOpenChange={setShowDeleteCategoryDialog}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-red-400">{t("construction_diaries.delete.confirm_title")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>{t("construction_diaries.delete.category_message")}</p>
              <p className="text-sm text-slate-400">{t("construction_diaries.delete.category_warning")}</p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowDeleteCategoryDialog(false)} className="text-slate-900">
                  {t("construction_diaries.actions.cancel")}
                </Button>
                <Button onClick={confirmDeleteCategory} className="bg-red-600 hover:bg-red-700">
                  {t("construction_diaries.actions.delete")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteDiaryDialog} onOpenChange={setShowDeleteDiaryDialog}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-red-400">{t("construction_diaries.delete.confirm_title")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>{t("construction_diaries.delete.diary_message")}</p>
              <p className="text-sm text-slate-400">{t("construction_diaries.delete.diary_warning")}</p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowDeleteDiaryDialog(false)} className="text-slate-900">
                  {t("construction_diaries.actions.cancel")}
                </Button>
                <Button onClick={confirmDeleteDiary} className="bg-red-600 hover:bg-red-700">
                  {t("construction_diaries.actions.delete")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteTemplateConfirm} onOpenChange={setShowDeleteTemplateConfirm}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-red-400">{t("construction_diaries.confirm_delete")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>{t("construction_diaries.confirm_delete_template")}</p>
              <p className="text-slate-400 text-sm">{t("construction_diaries.delete_template_warning")}</p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteTemplateConfirm(false)}
                className="border-slate-600 text-slate-900 hover:bg-slate-700 hover:text-white"
              >
                {t("construction_diaries.cancel")}
              </Button>
              <Button onClick={confirmDeleteTemplate} className="bg-red-600 hover:bg-red-700">
                {t("construction_diaries.delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Project Dialog */}
        <Dialog open={showEditProject} onOpenChange={setShowEditProject}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>{t("construction_diaries.modal.edit_project")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-project-name">{t("construction_diaries.project_name")} *</Label>
                <Input
                  id="edit-project-name"
                  value={editingProject?.name || ""}
                  onChange={(e) =>
                    setEditingProject(editingProject ? { ...editingProject, name: e.target.value } : null)
                  }
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div>
                <Label htmlFor="edit-project-location">{t("construction_diaries.project_location")} *</Label>
                <Input
                  id="edit-project-location"
                  value={editingProject?.location || ""}
                  onChange={(e) =>
                    setEditingProject(editingProject ? { ...editingProject, location: e.target.value } : null)
                  }
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div>
                <Label htmlFor="edit-project-manager">{t("construction_diaries.project_manager")} *</Label>
                <Input
                  id="edit-project-manager"
                  value={editingProject?.manager || ""}
                  onChange={(e) =>
                    setEditingProject(editingProject ? { ...editingProject, manager: e.target.value } : null)
                  }
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div>
                <Label htmlFor="edit-project-status">{t("construction_diaries.project_status")}</Label>
                <Select
                  value={editingProject?.status}
                  onValueChange={(value: any) =>
                    setEditingProject(editingProject ? { ...editingProject, status: value } : null)
                  }
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="active">{t("construction_diaries.status.active")}</SelectItem>
                    <SelectItem value="completed">{t("construction_diaries.status.completed")}</SelectItem>
                    <SelectItem value="paused">{t("construction_diaries.status.paused")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEditProject(false)} className="text-slate-900">
                  {t("construction_diaries.actions.cancel")}
                </Button>
                <Button onClick={() => {}} className="bg-cyan-600 hover:bg-cyan-700">
                  {t("construction_diaries.actions.update")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Category Dialog */}
        <Dialog open={showEditCategory} onOpenChange={setShowEditCategory}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>{t("construction_diaries.modal.edit_category")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-category-name">{t("construction_diaries.category_name")} *</Label>
                <Input
                  id="edit-category-name"
                  value={editingCategory?.name || ""}
                  onChange={(e) =>
                    setEditingCategory(editingCategory ? { ...editingCategory, name: e.target.value } : null)
                  }
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div>
                <Label htmlFor="edit-category-description">{t("construction_diaries.category_description")}</Label>
                <Textarea
                  id="edit-category-description"
                  value={editingCategory?.description || ""}
                  onChange={(e) =>
                    setEditingCategory(editingCategory ? { ...editingCategory, description: e.target.value } : null)
                  }
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div>
                <Label htmlFor="edit-category-status">{t("construction_diaries.project_status")}</Label>
                <Select
                  value={editingCategory?.status}
                  onChange={(value: any) =>
                    setEditingCategory(editingCategory ? { ...editingCategory, status: value } : null)
                  }
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="pending">{t("construction_diaries.status.pending")}</SelectItem>
                    <SelectItem value="in-progress">{t("construction_diaries.status.in_progress")}</SelectItem>
                    <SelectItem value="completed">{t("construction_diaries.status.completed")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEditCategory(false)} className="text-slate-900">
                  {t("construction_diaries.actions.cancel")}
                </Button>
                <Button onClick={handleUpdateCategory} className="bg-purple-600 hover:bg-purple-700">
                  {t("construction_diaries.actions.update")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Diary Dialog */}
        <Dialog open={showEditDiary} onOpenChange={setShowEditDiary}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>{t("construction_diaries.modal.edit_diary")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-diary-title">{t("construction_diaries.diary_title")} *</Label>
                <Input
                  id="edit-diary-title"
                  value={editingDiary?.title || ""}
                  onChange={(e) => setEditingDiary(editingDiary ? { ...editingDiary, title: e.target.value } : null)}
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div>
                <Label htmlFor="edit-diary-status">{t("construction_diaries.project_status")}</Label>
                <Select
                  value={editingDiary?.status}
                  onValueChange={(value: any) =>
                    setEditingDiary(editingDiary ? { ...editingDiary, status: value } : null)
                  }
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="draft">{t("construction_diaries.status.draft")}</SelectItem>
                    <SelectItem value="completed">{t("construction_diaries.status.completed")}</SelectItem>
                    <SelectItem value="approved">{t("construction_diaries.status.approved")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEditDiary(false)} className="text-slate-900">
                  {t("construction_diaries.actions.cancel")}
                </Button>
                <Button onClick={handleUpdateDiary} className="bg-green-600 hover:bg-green-700">
                  {t("construction_diaries.actions.update")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit ProjectGroup Dialog */}
        <Dialog open={showEditProjectGroup} onOpenChange={setShowEditProjectGroup}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>{t("construction_diaries.modal.edit_project_group")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-projectgroup-name">{t("construction_diaries.project_group_name")} *</Label>
                <Input
                  id="edit-projectgroup-name"
                  value={editingProjectGroup?.name || ""}
                  onChange={(e) => setEditingProjectGroup((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="edit-projectgroup-description">{t("construction_diaries.description")}</Label>
                <Textarea
                  id="edit-projectgroup-description"
                  value={editingProjectGroup?.description || ""}
                  onChange={(e) =>
                    setEditingProjectGroup((prev) => (prev ? { ...prev, description: e.target.value } : null))
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="edit-projectgroup-manager">{t("construction_diaries.manager")} *</Label>
                <Input
                  id="edit-projectgroup-manager"
                  value={editingProjectGroup?.manager || ""}
                  onChange={(e) =>
                    setEditingProjectGroup((prev) => (prev ? { ...prev, manager: e.target.value } : null))
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="edit-projectgroup-status">{t("construction_diaries.status")}</Label>
                <Select
                  value={editingProjectGroup?.status || "active"}
                  onValueChange={(value) =>
                    setEditingProjectGroup((prev) => (prev ? { ...prev, status: value } : null))
                  }
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="active">{t("construction_diaries.status_active")}</SelectItem>
                    <SelectItem value="completed">{t("construction_diaries.status_completed")}</SelectItem>
                    <SelectItem value="on-hold">{t("construction_diaries.status_on_hold")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditProjectGroup(false)}
                className="border-slate-600 text-slate-900 hover:bg-slate-100"
              >
                {t("construction_diaries.cancel")}
              </Button>
              <Button
                onClick={() => {
                  if (editingProjectGroup && editingProjectGroup.name && editingProjectGroup.manager) {
                    setProjectGroups((prev) => {
                      const newProjectGroups = prev.map((pg) =>
                        pg.id === editingProjectGroup.id ? editingProjectGroup : pg,
                      )
                      localStorage.setItem("projectGroups", JSON.stringify(newProjectGroups))
                      return newProjectGroups
                    })
                    setShowEditProjectGroup(false)
                    setEditingProjectGroup(null)
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {t("construction_diaries.update")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Construction Dialog */}
        <Dialog open={showEditConstructionDialog} onOpenChange={setShowEditConstructionDialog}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>{t("construction_diaries.modal.edit_construction")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-construction-name">{t("construction_diaries.construction_name")} *</Label>
                <Input
                  id="edit-construction-name"
                  value={editingConstruction?.name || ""}
                  onChange={(e) => setEditingConstruction((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="edit-construction-location">{t("construction_diaries.location")} *</Label>
                <Input
                  id="edit-construction-location"
                  value={editingConstruction?.location || ""}
                  onChange={(e) =>
                    setEditingConstruction((prev) => (prev ? { ...prev, location: e.target.value } : null))
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="edit-construction-manager">{t("construction_diaries.manager")} *</Label>
                <Input
                  id="edit-construction-manager"
                  value={editingConstruction?.manager || ""}
                  onChange={(e) =>
                    setEditingConstruction((prev) => (prev ? { ...prev, manager: e.target.value } : null))
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="edit-construction-status">{t("construction_diaries.status")}</Label>
                <Select
                  value={editingConstruction?.status || "in-progress"}
                  onValueChange={(value) =>
                    setEditingConstruction((prev) => (prev ? { ...prev, status: value } : null))
                  }
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="in-progress">{t("construction_diaries.status_in_progress")}</SelectItem>
                    <SelectItem value="completed">{t("construction_diaries.status_completed")}</SelectItem>
                    <SelectItem value="on-hold">{t("construction_diaries.status_on_hold")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditConstructionDialog(false)}
                className="border-slate-600 text-slate-900 hover:bg-slate-100"
              >
                {t("construction_diaries.cancel")}
              </Button>
              <Button
                onClick={() => {
                  if (
                    editingConstruction &&
                    editingConstruction.name &&
                    editingConstruction.location &&
                    editingConstruction.manager
                  ) {
                    setConstructions((prev) => {
                      const newConstructions = prev.map((c) =>
                        c.id === editingConstruction.id ? editingConstruction : c,
                      )
                      localStorage.setItem("constructions", JSON.stringify(newConstructions))
                      return newConstructions
                    })
                    setShowEditConstructionDialog(false)
                    setEditingConstruction(null)
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {t("construction_diaries.update")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Diary Dialog */}
        <Dialog open={showAddDiaryDialog} onOpenChange={setShowAddDiaryDialog}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Tạo thêm nhật ký</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <div
                    onClick={() => setUseTemplate(!useTemplate)}
                    style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid #3b82f6',
                      borderRadius: '4px',
                      backgroundColor: useTemplate ? '#3b82f6' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {useTemplate && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20,6 9,17 4,12"></polyline>
                      </svg>
                    )}
                  </div>
                  <label 
                    onClick={() => setUseTemplate(!useTemplate)}
                    style={{color: 'white', cursor: 'pointer', userSelect: 'none'}}
                  >
                    Sử dụng mẫu
                  </label>
                </div>
                <div className="mb-2">
                  <Label>Chọn mẫu từ "Mẫu nhật ký thêm" *</Label>
                </div>
                {useTemplate ? (
                  existingDiaries.length > 0 ? (
                    <Select 
                      value={selectedDiaryTemplate} 
                      onValueChange={setSelectedDiaryTemplate}
                      disabled={!useTemplate}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600">
                        <SelectValue placeholder="Chọn mẫu nhật ký..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="none">None (Không sử dụng mẫu)</SelectItem>
                        {existingDiaries.map((diary) => (
                          <SelectItem key={diary.id} value={diary.id}>
                            {diary.title} - {new Date(diary.createdAt).toLocaleDateString('vi-VN')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-md">
                      <p className="text-yellow-400 text-sm">
                        Chưa có nhật ký nào được tạo để làm mẫu. Hãy tạo và hoàn thành một số nhật ký trước.
                      </p>
                    </div>
                  )
                ) : (
                  <Select disabled>
                    <SelectTrigger className="bg-slate-600 border-slate-500 opacity-50">
                      <SelectValue placeholder="Dropdown bị khóa" />
                    </SelectTrigger>
                  </Select>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="image-pages">Số trang ảnh</Label>
                  <Input
                    id="image-pages"
                    type="number"
                    min="1"
                    max="10"
                    value={imagePages}
                    onChange={(e) => setImagePages(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div>
                  <Label htmlFor="images-per-page">Ảnh/trang</Label>
                  <Input
                    id="images-per-page"
                    type="number"
                    min="1"
                    max="12"
                    value={imagesPerPage}
                    onChange={(e) => setImagesPerPage(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="frames-per-row">Khung/hàng</Label>
                  <Input
                    id="frames-per-row"
                    type="number"
                    min="1"
                    max="4"
                    value={framesPerRow}
                    onChange={(e) => setFramesPerRow(Math.max(1, Math.min(4, Number(e.target.value) || 2)))}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div>
                  <Label htmlFor="aspect-ratio">Tỷ lệ ảnh</Label>
                  <Select value={selectedAspectRatio} onValueChange={setSelectedAspectRatio}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue placeholder="Chọn tỷ lệ ảnh..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {getRecommendedAspectRatios().map((ratio) => (
                        <SelectItem key={ratio.value} value={ratio.value}>
                          {ratio.label}
                        </SelectItem>
                      ))}
                      <SelectItem value="separator" disabled className="text-slate-400">
                        ── Tất cả tỷ lệ ──
                      </SelectItem>
                      {ASPECT_RATIOS.map((ratio) => (
                        <SelectItem key={ratio.value} value={ratio.value}>
                          {ratio.label} - {ratio.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="save-default"
                  checked={saveAsDefault}
                  onChange={(e) => setSaveAsDefault(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="save-default">Lưu làm mặc định</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddDiaryDialog(false)} 
                  className="text-black font-semibold hover:text-black border-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </Button>
                <Button onClick={handleCreateAddDiary} className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="h-4 w-4 mr-1" />
                  Tạo nhật ký
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
