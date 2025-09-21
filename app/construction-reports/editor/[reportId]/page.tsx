"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

import { useLanguage } from "@/contexts/language-context"
import { useToast } from "@/hooks/use-toast"
import { calculateGridLayout } from "@/utils/grid-calculator"
import { ASPECT_RATIOS, getRecommendedAspectRatios } from "@/utils/aspect-ratio-constants"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
// import { Toaster } from "@/components/ui/toaster" // DISABLED to prevent red notification boxes
import {
  ArrowLeft,
  Save,
  Lock,
  Unlock,
  FileText,
  // Đã xóa: Upload,
  Plus,
  Minus,
  Eye,
  Printer,
  Share2,
  X,
  Mail,
  Users,
  FolderOpen,
  Download,
  Upload,
  Archive,
  Settings,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import TinyMCENewEditor from "@/components/tinymce-new-editor"
import ImageGridEditor from "@/components/image-grid-editor"
import FileManagement from "@/components/file-management"

// Removed OnlyOffice declarations - using TinyMCE only

// Removed DocumentConfig interface - using TinyMCE only

export default function ReportEditorPage() {
  // Thêm CSS global để ẩn text "about:blank"
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @media print {
        /* Ẩn text about:blank và các text không mong muốn khác */
        body::before,
        body::after,
        html::before,
        html::after {
          display: none !important;
          content: none !important;
        }
        
        /* Ẩn header và footer mặc định của browser */
        @page {
          margin: 0;
        }
        
        /* Ẩn URL và title trong print */
        @page :first {
          margin-top: 0;
        }
        
        @page :last {
          margin-bottom: 0;
        }
      }
    `
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])
  const params = useParams()
  const reportId = params.reportId as string
  const { t } = useLanguage()
  const { toast, dismiss } = useToast()

  const [reportName, setReportName] = useState("Nhật ký thi công")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(false)
  // Removed documentConfig state - using TinyMCE only
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [mockContent, setMockContent] = useState("Đây là nội dung của trang")
  // ❌ REMOVED: templateContent (không cần thiết)
  const [templateLoading, setTemplateLoading] = useState(false)
  
  // State cho quản lý trang
  const [pagesContent, setPagesContent] = useState<{[key: number]: string}>({1: ""})
  const [showDeletePageModal, setShowDeletePageModal] = useState(false)
  const [pageToDelete, setPageToDelete] = useState<number | null>(null)
  const [selectedPagesToDelete, setSelectedPagesToDelete] = useState<number[]>([])
  const [selectAllPages, setSelectAllPages] = useState(false)
  // ❌ REMOVED: Template-related states (không cần thiết khi không dùng Word templates)
  // Đã xóa: const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [showShareModal, setShowShareModal] = useState(false)
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const [shareEmails, setShareEmails] = useState<string[]>([])
  const [currentEmail, setCurrentEmail] = useState("")
  const [shareType, setShareType] = useState<"specific" | "all">("specific")
  const [emailError, setEmailError] = useState("")
  const [showLockModal, setShowLockModal] = useState(false)
  const [lockAction, setLockAction] = useState<"lock" | "unlock">("lock")
  const [selectedPages, setSelectedPages] = useState<number[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [lockedPages, setLockedPages] = useState<number[]>([])
  
  // Editor state
  const [editorContent, setEditorContent] = useState("")
  
  // Add Diary Dialog states
  const [showAddDiaryDialog, setShowAddDiaryDialog] = useState(false)
  // ❌ REMOVED: selectedTemplate state (không cần thiết)
  const [imagePages, setImagePages] = useState(1)
  const [imagesPerPage, setImagesPerPage] = useState(4)
  const [imagesPerRow, setImagesPerRow] = useState(2)
  const [saveAsDefault, setSaveAsDefault] = useState(false)
  const [useImagePages, setUseImagePages] = useState(true)
  
  // THÊM: 4 biến margin tùy chỉnh
  const [marginLeft, setMarginLeft] = useState(10)     // mm - Margin trái
  const [marginRight, setMarginRight] = useState(10)   // mm - Margin phải  
  const [marginBottom, setMarginBottom] = useState(10) // mm - Margin đáy
  const [marginHeader, setMarginHeader] = useState(45) // mm - Khoảng cách từ đỉnh giấy đến khung ảnh
  
  // THÊM: Tỷ lệ ảnh
  const [imageAspectRatio, setImageAspectRatio] = useState("4:3") // Tỷ lệ ảnh mặc định
  
  // THÊM: Checkbox căn giữa theo chiều ngang
  const [centerHorizontally, setCenterHorizontally] = useState(false)
  
  // Template states - KHÔI PHỤC
  const [existingDiaries, setExistingDiaries] = useState<any[]>([])
  const [selectedDiaryId, setSelectedDiaryId] = useState("")
  const [useTemplate, setUseTemplate] = useState(false)
  
  // THÊM: Hàm lưu image settings
  const saveImageSettings = async () => {
    try {
      const settings = {
        marginLeft,
        marginRight,
        marginBottom,
        marginHeader,
        imageAspectRatio,
        centerHorizontally,
        imagesPerPage,
        framesPerRow: imagesPerRow,
        imagePages
      }

      console.log('💾 Saving image settings:', settings)

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: 'imageConfig',
          value: settings,
          description: 'Image configuration settings'
        })
      })

      if (response.ok) {
        console.log('✅ Image settings saved successfully')
      } else {
        console.error('❌ Failed to save image settings')
      }
    } catch (error) {
      console.error('❌ Error saving image settings:', error)
    }
  }
  
  // State to track image pages configuration
  const [imagePagesConfig, setImagePagesConfig] = useState<Record<number, { 
    imagesPerPage: number; 
    imagesPerRow: number; 
    images: string[];
    // ✅ THÊM: Lưu trữ cấu hình riêng cho từng trang
    marginLeft?: number;
    marginRight?: number;
    marginBottom?: number;
    marginHeader?: number;
    imageAspectRatio?: string;
    centerHorizontally?: boolean;
    // ✅ THÊM: Header content cho text editor
    headerContent?: string;
  }>>({})

  // ✅ Refs để access state mới nhất trong callbacks
  const pagesContentRef = useRef(pagesContent)
  const imagePagesConfigRef = useRef(imagePagesConfig)
  const totalPagesRef = useRef(totalPages)
  
  // Update refs khi state thay đổi
  useEffect(() => {
    pagesContentRef.current = pagesContent
  }, [pagesContent])
  
  useEffect(() => {
    imagePagesConfigRef.current = imagePagesConfig
  }, [imagePagesConfig])
  
  useEffect(() => {
    totalPagesRef.current = totalPages
  }, [totalPages])

  // File management states
  const [showSaveAsLibraryDialog, setShowSaveAsLibraryDialog] = useState(false)
  const [showSaveWithNameDialog, setShowSaveWithNameDialog] = useState(false)
  const [showOpenFileDialog, setShowOpenFileDialog] = useState(false)
  const [showOpenLibraryDialog, setShowOpenLibraryDialog] = useState(false)
  const [fileName, setFileName] = useState("")
  const [currentTime, setCurrentTime] = useState("")
  const [savedFiles, setSavedFiles] = useState<any[]>([])
  const [libraryFiles, setLibraryFiles] = useState<any[]>([])
  const [fileNameError, setFileNameError] = useState("")
  const [showFileManagement, setShowFileManagement] = useState(false)

  // Auto-save states
  const [showAutoSaveDialog, setShowAutoSaveDialog] = useState(false)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false) // Disabled by default to prevent errors
  const [autoSaveInterval, setAutoSaveInterval] = useState(60) // Increased to 60 seconds to reduce errors
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null)
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  // Refs to prevent infinite loops
  const isUpdatingContent = useRef(false)
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)

  const handleRemoveEmail = (email: string) => {
    setShareEmails((prev) => prev.filter((e) => e !== email))
  }

  const loadPageContent = (pageNum: number) => {
    try {
      // First check if content exists in current pagesContent state
      if (pagesContent[pageNum]) {
        setEditorContent(pagesContent[pageNum])
        console.log(`📋 Loaded content for page ${pageNum} from state`)
        return
      }

      // Then check localStorage
      const existingReports = JSON.parse(localStorage.getItem("construction-reports") || "[]")
      const currentReport = existingReports.find((r: any) => r.id === reportId)
      
      if (currentReport && currentReport.pages && currentReport.pages[pageNum]) {
        setEditorContent(currentReport.pages[pageNum])
        // Also update pagesContent state
        setPagesContent(prev => ({
          ...prev,
          [pageNum]: currentReport.pages[pageNum]
        }))
        console.log(`💾 Loaded content for page ${pageNum} from localStorage`)
      } else {
        setEditorContent("")
        console.log(`🆕 No saved content for page ${pageNum}, starting fresh`)
      }
    } catch (error) {
      console.error("Error loading page content:", error)
      setEditorContent("")
    }
  }

  useEffect(() => {
    // COMPLETELY DISABLE ALL TOASTS - no more red notification boxes
    try {
      dismiss()
      setTimeout(() => dismiss(), 100)
      setTimeout(() => dismiss(), 500) // Triple clear to ensure all toasts are removed
    } catch (e) {
      // Ignore any toast errors
    }
    
    // Set initial time on client only
    setCurrentTime(new Date().toLocaleTimeString())
    
    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString())
    }, 60000)
    
    initializeDocument()
    loadReportName()
    
    // ✅ FORCE LOAD dữ liệu ngay lập tức
    console.log(`🚀 [FORCE] Loading report data immediately for ${reportId}`)
    
    // 🔍 DEBUG: Show localStorage content
    const debugLocalStorage = () => {
      try {
        const data = localStorage.getItem("construction-reports")
        console.log(`🔍 [DEBUG] localStorage content:`, data ? JSON.parse(data) : null)
      } catch (e) {
        console.log(`🔍 [DEBUG] localStorage error:`, e)
      }
    }
    
    debugLocalStorage()
    setTimeout(async () => {
      await loadReportData()
      debugLocalStorage()
    }, 50)
    
    loadDefaultSettings()
    loadAvailableTemplates()
    loadPageContent(currentPage)
    
    // Load auto-save settings
    const savedAutoSaveSettings = localStorage.getItem(`autosave-settings-${reportId}`)
    if (savedAutoSaveSettings) {
      try {
        const settings = JSON.parse(savedAutoSaveSettings)
        setAutoSaveEnabled(settings.enabled || false)
        setAutoSaveInterval(settings.interval || 30)
      } catch (error) {
        console.error("Error loading auto-save settings:", error)
      }
    }
    
    return () => {
      clearInterval(timeInterval)
      stopAutoSave()
    }
  }, [reportId])

  // ✅ IMPROVED: Load report data with better timing and error handling
  useEffect(() => {
    if (reportId) {
      console.log(`🔍 [LOAD EFFECT] useEffect for loadReportData triggered with reportId: ${reportId}`)
      
      // ✅ MULTIPLE ATTEMPTS: Try loading data multiple times to ensure success
      let attempts = 0
      const maxAttempts = 3
      
      const tryLoadData = async () => {
        attempts++
        console.log(`🔄 [LOAD EFFECT] Attempt ${attempts}/${maxAttempts} to load data`)
        
        const success = await loadReportData()
        
        if (!success && attempts < maxAttempts) {
          console.log(`⏳ [LOAD EFFECT] Attempt ${attempts} failed, retrying in ${attempts * 100}ms`)
          setTimeout(tryLoadData, attempts * 100)
        } else if (success) {
          console.log(`✅ [LOAD EFFECT] Successfully loaded data on attempt ${attempts}`)
          
          // ✅ AUTO-CREATE: Tự động tạo imagePagesConfig cho trang 7 với 4x5 grid (20 ảnh)
          setTimeout(() => {
            setImagePagesConfig(prev => {
              if (!prev[7]) {
                console.log(`🖼️ [AUTO-CREATE] Tạo imagePagesConfig cho trang 7 với 4x5 grid (20 ảnh)`)
                return {
                  ...prev,
                  7: {
                    imagesPerPage: 20,
                    imagesPerRow: 4,
                    images: Array(20).fill(null),
                    // ✅ THÊM CẤU HÌNH MẶC ĐỊNH CHO TRANG 7
                    marginLeft: 10,
                    marginRight: 10,
                    marginBottom: 10,
                    marginHeader: 45,
                    imageAspectRatio: "4:3",
                    centerHorizontally: false,
                    headerContent: "Hoạt động xây dựng"
                  }
                }
              }
              return prev
            })
          }, 500)
        } else {
          console.log(`❌ [LOAD EFFECT] Failed to load data after ${maxAttempts} attempts`)
        }
      }
      
      // Start loading immediately, then retry if needed
      tryLoadData()
    }
  }, [reportId])

  // ✅ FORCE CREATE: Tự động tạo imagePagesConfig cho trang 7 nếu chưa có
  useEffect(() => {
    console.log(`🔍 [FORCE CREATE] Checking imagePagesConfig for page 7...`)
    console.log(`🔍 [FORCE CREATE] Current imagePagesConfig:`, imagePagesConfig)
    
    if (!imagePagesConfig[7]) {
      console.log(`🖼️ [FORCE CREATE] Tạo imagePagesConfig cho trang 7 với 4x5 grid (20 ảnh)`)
      setImagePagesConfig(prev => ({
        ...prev,
        7: {
          imagesPerPage: 20,
          imagesPerRow: 4,
          images: Array(20).fill(null),
          // ✅ THÊM CẤU HÌNH MẶC ĐỊNH CHO TRANG 7
          marginLeft: 10,
          marginRight: 10,
          marginBottom: 10,
          marginHeader: 45,
          imageAspectRatio: "4:3",
          centerHorizontally: false,
          headerContent: "Hoạt động xây dựng"
        }
      }))
    } else {
      console.log(`✅ [FORCE CREATE] imagePagesConfig cho trang 7 đã tồn tại`)
    }
  }, [imagePagesConfig])

  // Load page content when currentPage changes
  useEffect(() => {
    loadPageContent(currentPage)
  }, [currentPage])

  // ✅ IMPROVED: Debug effect with auto-save on critical state changes
  useEffect(() => {
    console.log("🔍 State Debug:")
    console.log("  - pagesContent:", pagesContent)
    console.log("  - currentPage:", currentPage)
    console.log("  - editorContent:", editorContent)
    console.log("  - totalPages:", totalPages)
    console.log("  - imagePagesConfig:", imagePagesConfig)
    
    // ✅ AUTO-SAVE: Save when critical data changes (but not during data loading)
    if (!isLoadingData && (totalPages > 1 || Object.keys(pagesContent).length > 1 || Object.keys(imagePagesConfig).length > 0)) {
      console.log("🔄 [AUTO-SAVE] Critical state changed, auto-saving...")
      setTimeout(() => {
        manualSaveToLocalStorage()
      }, 200) // Small delay to batch multiple changes
    } else if (isLoadingData) {
      console.log("⏸️ [AUTO-SAVE] Skipping auto-save during data loading")
    }
  }, [pagesContent, totalPages, imagePagesConfig, isLoadingData])

  // ✅ FORCE FIX: Đảm bảo trang được thêm bằng "Thêm trang" không có imagePagesConfig
  useEffect(() => {
    console.log(`🔍 [FORCE FIX] Kiểm tra state hiện tại:`)
    console.log(`🔍 [FORCE FIX] - currentPage: ${currentPage}`)
    console.log(`🔍 [FORCE FIX] - pagesContent keys:`, Object.keys(pagesContent))
    console.log(`🔍 [FORCE FIX] - imagePagesConfig keys:`, Object.keys(imagePagesConfig))
    
    // Kiểm tra nếu có trang không có nội dung và không phải trang 1
    Object.keys(pagesContent).forEach(pageNum => {
      const pageNumber = parseInt(pageNum)
      // Kiểm tra trang trống (không có nội dung hoặc chỉ có whitespace)
      const pageContent = pagesContent[pageNumber] || ""
      const isEmptyPage = pageContent.trim() === ""
      
      if (pageNumber > 1 && isEmptyPage && imagePagesConfig[pageNumber]) {
        console.log(`🚨 [FORCE FIX] PHÁT HIỆN LỖI: Trang ${pageNumber} trống nhưng có imagePagesConfig!`)
        console.log(`🚨 [FORCE FIX] Nội dung trang ${pageNumber}:`, JSON.stringify(pageContent.substring(0, 100)))
        console.log(`🚨 [FORCE FIX] imagePagesConfig[${pageNumber}]:`, imagePagesConfig[pageNumber])
        
        setImagePagesConfig(prev => {
          const updated = { ...prev }
          delete updated[pageNumber]
          console.log(`🗑️ [FORCE FIX] ĐÃ XÓA imagePagesConfig cho trang ${pageNumber}`)
          console.log(`🗑️ [FORCE FIX] imagePagesConfig còn lại:`, Object.keys(updated))
          return updated
        })
        
        // Note: Auto-save will handle this automatically
      }
    })
    
    // Kiểm tra trang hiện tại
    if (currentPage > 1) {
      const currentPageContent = pagesContent[currentPage] || ""
      const isCurrentPageEmpty = currentPageContent.trim() === ""
      const hasCurrentPageImageConfig = !!imagePagesConfig[currentPage]
      
      console.log(`🔍 [FORCE FIX] Trang hiện tại ${currentPage}:`)
      console.log(`🔍 [FORCE FIX] - isEmpty: ${isCurrentPageEmpty}`)
      console.log(`🔍 [FORCE FIX] - hasImageConfig: ${hasCurrentPageImageConfig}`)
      
      if (isCurrentPageEmpty && hasCurrentPageImageConfig) {
        console.log(`🚨 [FORCE FIX] TRANG HIỆN TẠI ${currentPage} CẦN SỬA!`)
      }
    }
  }, [pagesContent, imagePagesConfig, currentPage])

  // Calculate total pages dynamically based on templates and image pages
  // ❌ REMOVED: Template-based page calculation useEffects (không cần thiết)
  // Logic mới: Khởi tạo = 1 trang, tạo thêm = dựa vào form

  // ❌ REMOVED: Load template content useEffect (không cần thiết)

  // ❌ REMOVED: Template-related useEffects (không cần thiết)

  // ❌ REMOVED: useEffect tự động tính totalPages từ templates (gây nhấp nháy 1↔6)
  // Anh không dùng templates nên đã xóa bỏ để tránh conflict

  // Auto-save effect
  useEffect(() => {
    if (autoSaveEnabled) {
      startAutoSave()
    } else {
      stopAutoSave()
    }
    
    return () => stopAutoSave()
  }, [autoSaveEnabled, autoSaveInterval])

  // Đồng bộ nội dung khi chuyển trang
  useEffect(() => {
    if (isUpdatingContent.current) return
    
    // Lưu nội dung trang hiện tại trước khi chuyển
    if (editorContent && editorContent !== (pagesContent[currentPage] || "")) {
      isUpdatingContent.current = true
      setPagesContent(prev => {
        const updated = {
          ...prev,
          [currentPage]: editorContent
        }
        console.log(`📝 Synced content for page ${currentPage}:`, editorContent.substring(0, 50) + "...")
        return updated
      })
      setTimeout(() => {
        isUpdatingContent.current = false
      }, 100) // Tăng thời gian chờ
    }
  }, [editorContent, currentPage])

  // Load nội dung trang khi currentPage thay đổi - cải thiện logic
  useEffect(() => {
    if (isUpdatingContent.current) return
    
    const pageContent = pagesContent[currentPage] || ""
    if (editorContent !== pageContent) {
      isUpdatingContent.current = true
      setEditorContent(pageContent)
      console.log(`📖 Loaded content for page ${currentPage}:`, pageContent.substring(0, 50) + "...")
      setTimeout(() => {
        isUpdatingContent.current = false
      }, 100) // Tăng thời gian chờ
    }
  }, [currentPage, pagesContent])

  // Auto-persist data to localStorage when pagesContent changes
  useEffect(() => {
    console.log(`💾 [AUTO-SAVE] Checking if should save...`)
    
    // ✅ Thêm delay để tránh conflict với manual save
    const autoSaveTimer = setTimeout(() => {
      // Chỉ save khi có dữ liệu thực sự (totalPages > 1 hoặc có imagePagesConfig)
      if (Object.keys(pagesContent).length > 0 || totalPages > 1 || Object.keys(imagePagesConfig).length > 0) {
      try {
        const existingReports = JSON.parse(localStorage.getItem("construction-reports") || "[]")
        const reportIndex = existingReports.findIndex((r: any) => r.id === reportId)
        
        let reportData
        if (reportIndex >= 0) {
          reportData = existingReports[reportIndex]
          reportData.pages = { ...reportData.pages, ...pagesContent }
          reportData.totalPages = totalPages // ✅ Lưu totalPages
          reportData.imagePagesConfig = imagePagesConfig // ✅ Lưu imagePagesConfig
          reportData.lastModified = new Date().toISOString()
        } else {
          reportData = {
            id: reportId,
            title: reportName,
            pages: pagesContent,
            totalPages: totalPages, // ✅ Lưu totalPages
            imagePagesConfig: imagePagesConfig, // ✅ Lưu imagePagesConfig
            lastModified: new Date().toISOString(),
            createdAt: new Date().toISOString()
          }
          existingReports.push(reportData)
        }
        
        localStorage.setItem("construction-reports", JSON.stringify(existingReports))
        console.log("📝 Auto-persisted pages content, totalPages, and imagePagesConfig to localStorage")
        console.log(`🔍 [DEBUG] Saved data for ${reportId}:`, {
          totalPages,
          imagePagesConfig,
          pagesContentKeys: Object.keys(pagesContent)
        })
      } catch (error) {
        console.error("Error auto-persisting data:", error)
      }
      }
    }, 1000) // Delay 1 giây để tránh conflict với manual save
    
    return () => clearTimeout(autoSaveTimer)
  }, [pagesContent, totalPages, imagePagesConfig, reportId, reportName])


  const loadDefaultSettings = () => {
    // First try to load report-specific config
    const reportConfig = localStorage.getItem(`report-config-${reportId}`)
    if (reportConfig) {
      try {
        const config = JSON.parse(reportConfig)
        console.log(`📋 Loading report-specific config for ${reportId}:`, config)
        
        // ❌ REMOVED: Template config loading (không cần thiết)
        
        // Legacy support for old template system - validate templates exist
        if (config.mauNhatKyDau && availableTemplates.some((t: any) => t.id === config.mauNhatKyDau)) {
          setInitialTemplateId(config.mauNhatKyDau)
        } else if (config.mauNhatKyDau) {
          console.warn(`Invalid initial template ID in config: ${config.mauNhatKyDau}, clearing from localStorage`)
          // Clear invalid template from localStorage
          const updatedConfig = { ...config, mauNhatKyDau: null }
          localStorage.setItem(`report-config-${reportId}`, JSON.stringify(updatedConfig))
        }
        
        if (config.mauNhatKyThem && availableTemplates.some((t: any) => t.id === config.mauNhatKyThem)) {
          setDailyTemplateId(config.mauNhatKyThem)
        } else if (config.mauNhatKyThem) {
          console.warn(`Invalid daily template ID in config: ${config.mauNhatKyThem}, clearing from localStorage`)
          // Clear invalid template from localStorage
          const updatedConfig = { ...config, mauNhatKyThem: null }
          localStorage.setItem(`report-config-${reportId}`, JSON.stringify(updatedConfig))
        }
        
        // Set image pages from report config (soTrangAnh)
        if (config.soTrangAnh) {
          setImagePages(config.soTrangAnh)
          console.log(`📊 Setting image pages from report config: ${config.soTrangAnh}`)
        }
        
        // Set images per page from report config
        if (config.soAnhTrenTrang) {
          setImagesPerPage(config.soAnhTrenTrang)
        }
        
        // Set frames per row from report config
        if (config.soKhungTrenHang) {
          setImagesPerRow(config.soKhungTrenHang)
        }
        
        // Set aspect ratio from report config
        if (config.aspectRatio) {
          setImageAspectRatio(config.aspectRatio)
          console.log(`📐 Setting aspect ratio from report config: ${config.aspectRatio}`)
        }
        
        return // Exit early if report config was found
      } catch (error) {
        console.error("[v0] Error loading report config:", error)
      }
    }
    
    // Fallback to default settings if no report config found
    const savedSettings = localStorage.getItem("diary-default-settings")
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        console.log(`📋 Loading default settings (fallback):`, settings)
        // ❌ REMOVED: setSelectedTemplate (không cần thiết)
        setImagePages(settings.imagePages || 2)
        setImagesPerPage(settings.imagesPerPage || 4)
        setImagesPerRow(settings.framesPerRow || 2)
        // THÊM: Load margin settings
        setMarginLeft(settings.marginLeft || 10)
        setMarginRight(settings.marginRight || 10)
        setMarginBottom(settings.marginBottom || 10)
        setMarginHeader(settings.marginHeader || 45)
        // THÊM: Load aspect ratio setting
        setImageAspectRatio(settings.imageAspectRatio || "4:3")
        // THÊM: Load center horizontally setting
        setCenterHorizontally(settings.centerHorizontally || false)
      } catch (error) {
        console.error("[v0] Error loading default settings:", error)
      }
    }
  }

  const loadReportName = () => {
    const savedReports = localStorage.getItem("construction-reports")
    if (savedReports) {
      try {
        const reports = JSON.parse(savedReports)
        const currentReport = reports.find((r: any) => r.id === reportId)
        if (currentReport) {
          setReportName(currentReport.title || currentReport.name || "Nhật ký thi công")
          return
        }
      } catch (error) {
        console.error("[v0] Error loading report name:", error)
      }
    }

    if (reportId.includes("rep-")) {
      setReportName("Nhật ký thi công")
    } else {
      setReportName("Nhật ký thi công")
    }
  }

  // ✅ IMPROVED MANUAL SAVE FUNCTION with better error handling and verification
  const manualSaveToLocalStorage = async (newTotalPages?: number, newImagePagesConfig?: any, newPagesContent?: any) => {
    console.log(`💾 [SAVE] Manual save function called!`)
    
    const currentTotalPages = newTotalPages || totalPages
    const currentPagesContent = newPagesContent || pagesContent
    const currentImagePagesConfig = newImagePagesConfig || imagePagesConfig
    
    const reportData = {
      id: reportId,
      title: reportName,
      pages: currentPagesContent,
      totalPages: currentTotalPages,
      imagePagesConfig: currentImagePagesConfig,
      lastModified: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }
    
    console.log(`💾 [SAVE] Data to save:`, {
      reportId,
      totalPages: currentTotalPages,
      pagesContentKeys: Object.keys(currentPagesContent),
      imagePagesConfigKeys: Object.keys(currentImagePagesConfig)
    })
    
    // Save to API first
    try {
      console.log(`🌐 [API SAVE] Saving to API...`)
      const response = await fetch('/api/construction-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId,
          data: reportData
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log(`✅ [API SAVE] SUCCESS! Saved to API:`, result)
      } else {
        console.error(`❌ [API SAVE] FAILED! Status:`, response.status)
      }
    } catch (apiError) {
      console.error(`❌ [API SAVE] ERROR:`, apiError)
    }
    
    // Also save to localStorage as backup
    try {
      console.log(`💾 [LOCALSTORAGE SAVE] Saving to localStorage...`)
      const existingReports = JSON.parse(localStorage.getItem("construction-reports") || "[]")
      console.log(`💾 [LOCALSTORAGE SAVE] Existing reports count:`, existingReports.length)
      
      // Remove existing report with same ID
      const filteredReports = existingReports.filter((r: any) => r.id !== reportId)
      filteredReports.push(reportData)
      
      localStorage.setItem("construction-reports", JSON.stringify(filteredReports))
      
      // ✅ VERIFICATION: Verify data was saved correctly
      setTimeout(() => {
        try {
          const verifyData = localStorage.getItem("construction-reports")
          if (verifyData) {
            const verifyReports = JSON.parse(verifyData)
            const verifyReport = verifyReports.find((r: any) => r.id === reportId)
            if (verifyReport) {
              console.log(`✅ [LOCALSTORAGE SAVE] VERIFICATION SUCCESS! Data saved correctly:`, {
                totalPages: verifyReport.totalPages,
                pagesCount: Object.keys(verifyReport.pages || {}).length,
                imagePagesCount: Object.keys(verifyReport.imagePagesConfig || {}).length
              })
            } else {
              console.error(`❌ [LOCALSTORAGE SAVE] VERIFICATION FAILED! Report not found after save`)
            }
          }
        } catch (verifyError) {
          console.error(`❌ [LOCALSTORAGE SAVE] VERIFICATION ERROR:`, verifyError)
        }
      }, 50)
      
      console.log(`✅ [LOCALSTORAGE SAVE] SUCCESS! Saved report with ${Object.keys(currentPagesContent).length} pages`)
      
    } catch (error) {
      console.error("❌ [LOCALSTORAGE SAVE] ERROR:", error)
      // Disable error toast to prevent red notification box
      console.error("Save data error (toast disabled):", error)
    }
  }

  // ✅ IMPROVED: Load data from API first, then localStorage as fallback
  const loadReportData = async () => {
    console.log(`🔍 [LOAD] loadReportData called with reportId: ${reportId}`)
    
    // Set loading flag to prevent auto-save during load
    setIsLoadingData(true)
    
    // Try API first
    try {
      console.log(`🌐 [API] Trying to load from API...`)
      const response = await fetch(`/api/construction-reports?reportId=${reportId}`)
      if (response.ok) {
        const apiData = await response.json()
        console.log(`🌐 [API] Loaded from API:`, apiData)
        
        if (apiData && (apiData.totalPages || apiData.imagePagesConfig || apiData.pages)) {
          console.log(`🚀 [API LOAD] Loading all data from API for report ${reportId}`)
          
          // Load from API data
          const loadedTotalPages = apiData.totalPages || 1
          setTotalPages(loadedTotalPages)
          console.log(`📊 [API] Set totalPages: ${loadedTotalPages}`)
          
          const loadedImagePagesConfig = apiData.imagePagesConfig || {}
          setImagePagesConfig(loadedImagePagesConfig)
          console.log(`🖼️ [API] Set imagePagesConfig:`, loadedImagePagesConfig)
          
          const loadedPagesContent = apiData.pages || {}
          setPagesContent(loadedPagesContent)
          console.log(`📄 [API] Set pagesContent with ${Object.keys(loadedPagesContent).length} pages:`, Object.keys(loadedPagesContent))
          
          // Update refs
          setTimeout(() => {
            pagesContentRef.current = loadedPagesContent
            imagePagesConfigRef.current = loadedImagePagesConfig
            totalPagesRef.current = loadedTotalPages
            console.log(`🔄 [API] Updated refs with loaded data`)
            
            // Clear loading flag after data is loaded
            setIsLoadingData(false)
          }, 10)
          
          return true
        }
      }
    } catch (apiError) {
      console.log(`⚠️ [API] API load failed, trying localStorage:`, apiError)
    }
    
    // Fallback to localStorage
    try {
      const savedReports = localStorage.getItem("construction-reports")
      console.log(`🔍 [LOCALSTORAGE] localStorage data:`, savedReports ? JSON.parse(savedReports) : null)
      
      if (savedReports) {
        const reports = JSON.parse(savedReports)
        const currentReport = reports.find((r: any) => r.id === reportId)
        console.log(`🔍 [LOCALSTORAGE] Found report for ${reportId}:`, currentReport)
        
        if (currentReport) {
          console.log(`🚀 [LOCALSTORAGE LOAD] Loading all data for report ${reportId}`)
          
          const loadedTotalPages = currentReport.totalPages || 1
          setTotalPages(loadedTotalPages)
          console.log(`📊 [LOCALSTORAGE] Set totalPages: ${loadedTotalPages}`)
          
          const loadedImagePagesConfig = currentReport.imagePagesConfig || {}
          setImagePagesConfig(loadedImagePagesConfig)
          console.log(`🖼️ [LOCALSTORAGE] Set imagePagesConfig:`, loadedImagePagesConfig)
          
          const loadedPagesContent = currentReport.pages || {}
          setPagesContent(loadedPagesContent)
          console.log(`📄 [LOCALSTORAGE] Set pagesContent with ${Object.keys(loadedPagesContent).length} pages:`, Object.keys(loadedPagesContent))
          
          setTimeout(() => {
            pagesContentRef.current = loadedPagesContent
            imagePagesConfigRef.current = loadedImagePagesConfig
            totalPagesRef.current = loadedTotalPages
            console.log(`🔄 [LOCALSTORAGE] Updated refs with loaded data`)
            
            // Clear loading flag after data is loaded
            setIsLoadingData(false)
          }, 10)
          
          return true
        } else {
          console.log(`🔍 [LOCALSTORAGE] No report found for ${reportId}, creating new`)
        }
      } else {
        console.log(`🔍 [LOCALSTORAGE] No localStorage data found`)
      }
    } catch (error) {
      console.error("🚨 [LOAD] Error loading report data:", error)
    }
    
    // Clear loading flag even if load failed
    setIsLoadingData(false)
    return false
  }

  // ❌ REMOVED: loadExistingDiaries function (không cần thiết)

  const initializeDocument = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const onlyofficeUrl = process.env.NEXT_PUBLIC_ONLYOFFICE_SERVER_URL
      if (!onlyofficeUrl) {
        console.log("[v0] ONLYOFFICE server not configured, using fallback UI")
        setIsLoading(false)
        return
      }

      const config: DocumentConfig = {
        document: {
          fileType: "docx",
          key: `report_${reportId}_${Date.now()}`,
          title: `Nhật ký thi công - ${reportId}`,
          url: `/api/construction-reports/documents/${reportId}`,
          permissions: {
            edit: true,
            download: true,
            print: true,
          },
        },
        documentType: "word",
        editorConfig: {
          user: {
            id: "user_1",
            name: "Construction Manager",
          },
          customization: {
            autosave: true,
            forcesave: true,
            compactToolbar: false,
          },
          callbackUrl: `/api/construction-reports/callback`,
        },
        width: "100%",
        height: "100%",
      }

      setDocumentConfig(config)
      await loadOnlyOfficeScript()

      if (typeof window !== "undefined" && window.DocsAPI) {
        new window.DocsAPI.DocEditor("onlyoffice-editor", config)
      } else {
        throw new Error("ONLYOFFICE API not available")
      }

      setIsLoading(false)
    } catch (error) {
      console.error("[v0] Error initializing document:", error)
      setError(error instanceof Error ? error.message : "Unknown error occurred")
      setIsLoading(false)
    }
  }

  const loadOnlyOfficeScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("Not in browser environment"))
        return
      }

      if (window.DocsAPI) {
        resolve()
        return
      }

      const onlyofficeUrl = process.env.NEXT_PUBLIC_ONLYOFFICE_SERVER_URL
      if (!onlyofficeUrl) {
        reject(new Error("ONLYOFFICE server URL not configured"))
        return
      }

      const script = document.createElement("script")
      script.src = `${onlyofficeUrl}/web-apps/apps/api/documents/api.js`
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("Failed to load ONLYOFFICE script"))
      document.head.appendChild(script)
    })
  }

  const handleSave = async (isAutoSave = false) => {
    try {
      if (isAutoSave) {
        setAutoSaveStatus("saving")
      }

      console.log(`💾 [HANDLE SAVE] Starting ${isAutoSave ? 'auto' : 'manual'} save for page ${currentPage}`)

      // ✅ UNIFIED SAVE: Update current page content first
      const updatedPagesContent = {
        ...pagesContent,
        [currentPage]: editorContent
      }
      
      // Update state immediately
      setPagesContent(updatedPagesContent)
      
      // ✅ FULL SAVE: Use manualSaveToLocalStorage with complete data
      await manualSaveToLocalStorage(totalPages, imagePagesConfig, updatedPagesContent)
      
      if (isAutoSave) {
        setAutoSaveStatus("saved")
        setLastAutoSave(new Date())
        // Reset status after 3 seconds
        setTimeout(() => setAutoSaveStatus("idle"), 3000)
        console.log(`✅ [HANDLE SAVE] Auto-save completed for page ${currentPage}`)
      } else {
        console.log(`✅ [HANDLE SAVE] Manual save completed for page ${currentPage}`)
        console.log(`✅ [HANDLE SAVE] Saved data includes:`, {
          totalPages,
          pagesCount: Object.keys(updatedPagesContent).length,
          imagePagesCount: Object.keys(imagePagesConfig).length,
          currentPageContent: editorContent.length > 0 ? 'Has content' : 'Empty'
        })
      }
      
    } catch (error) {
      console.error(`❌ [HANDLE SAVE] Error during ${isAutoSave ? 'auto' : 'manual'} save:`, error)
      
      if (isAutoSave) {
        setAutoSaveStatus("error")
        setTimeout(() => setAutoSaveStatus("idle"), 5000)
      } else {
        console.error("Manual save failed:", error)
        // Disable error toast to prevent red notification box
        console.warn("Save error (toast disabled):", error instanceof Error ? error.message : 'Unknown error')
      }
    }
  }

  // Auto-save functions - IMPROVED ERROR HANDLING
  const startAutoSave = () => {
    if (autoSaveTimer.current) {
      clearInterval(autoSaveTimer.current)
    }
    
    if (autoSaveEnabled && autoSaveInterval > 0) {
      console.log("🔄 Starting auto-save with interval:", autoSaveInterval, "seconds")
      autoSaveTimer.current = setInterval(() => {
        try {
          if (editorContent && editorContent.trim() && editorContent.length > 10) {
            console.log("💾 Auto-saving content...")
            handleSave(true)
          } else {
            console.log("⏭️ Skipping auto-save - content too short or empty")
          }
        } catch (error) {
          console.error("❌ Auto-save error:", error)
          setAutoSaveStatus("error")
          setTimeout(() => setAutoSaveStatus("idle"), 5000)
        }
      }, autoSaveInterval * 1000)
    }
  }

  const stopAutoSave = () => {
    if (autoSaveTimer.current) {
      clearInterval(autoSaveTimer.current)
      autoSaveTimer.current = null
    }
  }

  const handleAutoSaveToggle = (enabled: boolean) => {
    setAutoSaveEnabled(enabled)
    
    // Save auto-save settings to localStorage
    const settings = {
      enabled,
      interval: autoSaveInterval
    }
    localStorage.setItem(`autosave-settings-${reportId}`, JSON.stringify(settings))
    
    if (enabled) {
      startAutoSave()
      toast({
        title: "Lưu tự động đã bật",
        description: `Tài liệu sẽ được lưu tự động mỗi ${autoSaveInterval} giây`,
        variant: "default",
      })
    } else {
      stopAutoSave()
      toast({
        title: "Lưu tự động đã tắt",
        description: "Bạn cần lưu thủ công",
        variant: "default",
      })
    }
  }

  const handleAutoSaveIntervalChange = (interval: number) => {
    setAutoSaveInterval(interval)
    
    // Save settings
    const settings = {
      enabled: autoSaveEnabled,
      interval
    }
    localStorage.setItem(`autosave-settings-${reportId}`, JSON.stringify(settings))
    
    // Restart auto-save with new interval
    if (autoSaveEnabled) {
      startAutoSave()
    }
  }

  // File management functions
  const handleSaveAsLibrary = () => {
    setFileName("")
    setFileNameError("")
    setShowSaveAsLibraryDialog(true)
  }

  const handleSaveWithName = () => {
    setFileName("")
    setFileNameError("")
    setShowSaveWithNameDialog(true)
  }

  const handleOpenFile = async () => {
    await loadSavedFiles()
    setShowOpenFileDialog(true)
  }

  const handleOpenLibrary = async () => {
    await loadLibraryFiles()
    setShowOpenLibraryDialog(true)
  }

  const saveFileToLibrary = async () => {
    if (!fileName.trim()) {
      setFileNameError("Tên file không được để trống")
      return
    }

    try {
      // Kiểm tra trùng tên trong thư viện
      const checkResponse = await fetch('/api/construction-files?type=library')
      if (checkResponse.ok) {
        const existingFiles = await checkResponse.json()
        const duplicateName = existingFiles.files.find((file: any) => 
          file.name.toLowerCase() === fileName.trim().toLowerCase()
        )
        
        if (duplicateName) {
          setFileNameError(`Tên file "${fileName.trim()}" đã tồn tại trong thư viện. Vui lòng chọn tên khác.`)
          return
        }
      }

      // Đồng bộ nội dung trang hiện tại trước khi lưu
      const updatedPagesContent = {
        ...pagesContent,
        [currentPage]: editorContent
      }

      // Get current document data
      const documentData = {
        id: `lib-${Date.now()}`,
        name: fileName.trim(),
        reportId: reportId,
        reportName: reportName,
        totalPages: totalPages,
        currentPage: currentPage,
        pagesContent: updatedPagesContent,
        editorContent: editorContent,
        createdAt: new Date().toISOString(),
        type: 'library'
      }

      // Save to server
      const response = await fetch('/api/construction-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'library',
          filename: fileName.trim(),
          data: documentData
        })
      })

      if (response.ok) {
        toast({
          title: "Lưu thành công",
          description: `Đã lưu "${fileName}" vào thư viện`,
          variant: "default",
        })

        setShowSaveAsLibraryDialog(false)
        setFileName("")
      } else if (response.status === 409) {
        // Conflict - duplicate name
        const error = await response.json()
        setFileNameError(error.error)
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      console.error("Error saving to library:", error)
      const errorToast = toast({
        title: "Lỗi lưu file",
        description: "Không thể lưu vào thư viện. Vui lòng thử lại.",
        variant: "destructive",
      })
      // Auto dismiss error toast after 3 seconds
      setTimeout(() => errorToast.dismiss(), 3000)
    }
  }

  const saveFileWithName = async () => {
    if (!fileName.trim()) {
      setFileNameError("Tên file không được để trống")
      return
    }

    try {
      // Kiểm tra trùng tên trong file đã lưu
      const checkResponse = await fetch('/api/construction-files?type=named')
      if (checkResponse.ok) {
        const existingFiles = await checkResponse.json()
        const duplicateName = existingFiles.files.find((file: any) => 
          file.name.toLowerCase() === fileName.trim().toLowerCase()
        )
        
        if (duplicateName) {
          setFileNameError(`Tên file "${fileName.trim()}" đã tồn tại. Vui lòng chọn tên khác.`)
          return
        }
      }

      // Đồng bộ nội dung trang hiện tại trước khi lưu
      const updatedPagesContent = {
        ...pagesContent,
        [currentPage]: editorContent
      }

      // Get current document data
      const documentData = {
        id: `file-${Date.now()}`,
        name: fileName.trim(),
        reportId: reportId,
        reportName: reportName,
        totalPages: totalPages,
        currentPage: currentPage,
        pagesContent: updatedPagesContent,
        editorContent: editorContent,
        createdAt: new Date().toISOString(),
        type: 'named'
      }

      // Save to server
      const response = await fetch('/api/construction-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'named',
          filename: fileName.trim(),
          data: documentData
        })
      })

      if (response.ok) {
        toast({
          title: "Lưu thành công",
          description: `Đã lưu file "${fileName}"`,
          variant: "default",
        })

        setShowSaveWithNameDialog(false)
        setFileName("")
      } else if (response.status === 409) {
        // Conflict - duplicate name
        const error = await response.json()
        setFileNameError(error.error)
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      console.error("Error saving named file:", error)
      const errorToast = toast({
        title: "Lỗi lưu file",
        description: "Không thể lưu file. Vui lòng thử lại.",
        variant: "destructive",
      })
      // Auto dismiss error toast after 3 seconds
      setTimeout(() => errorToast.dismiss(), 3000)
    }
  }

  const loadSavedFiles = async () => {
    try {
      const response = await fetch('/api/construction-files?type=named')
      if (response.ok) {
        const data = await response.json()
        setSavedFiles(data.files || [])
      } else {
        setSavedFiles([])
      }
    } catch (error) {
      console.error("Error loading saved files:", error)
      setSavedFiles([])
    }
  }

  const loadLibraryFiles = async () => {
    try {
      console.log("🔍 Loading library files...")
      const response = await fetch('/api/construction-files?type=library')
      console.log("📡 API Response status:", response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log("📚 Library data received:", data)
        console.log("📁 Files count:", data.files?.length || 0)
        setLibraryFiles(data.files || [])
      } else {
        console.log("❌ API response not ok")
        setLibraryFiles([])
      }
    } catch (error) {
      console.error("Error loading library files:", error)
      setLibraryFiles([])
    }
  }

  const openFile = (fileData: any) => {
    try {
      // Load file data into current editor
      setReportName(fileData.reportName || fileData.name)
      setTotalPages(fileData.totalPages || 1)
      setCurrentPage(fileData.currentPage || 1)
      setPagesContent(fileData.pagesContent || {})
      setEditorContent(fileData.editorContent || "")

      // Đồng bộ dữ liệu vào localStorage để đảm bảo tính nhất quán
      try {
        const existingReports = JSON.parse(localStorage.getItem("construction-reports") || "[]")
        const reportIndex = existingReports.findIndex((r: any) => r.id === reportId)
        
        const reportData = {
          id: reportId,
          title: fileData.reportName || fileData.name,
          name: fileData.reportName || fileData.name,
          pages: fileData.pagesContent || {},
          totalPages: fileData.totalPages || 1,
          currentPage: fileData.currentPage || 1,
          lastModified: new Date().toISOString()
        }

        if (reportIndex >= 0) {
          existingReports[reportIndex] = reportData
        } else {
          existingReports.push(reportData)
        }

        localStorage.setItem("construction-reports", JSON.stringify(existingReports))
        console.log("✅ Synced opened file data to localStorage")
      } catch (syncError) {
        console.warn("⚠️ Failed to sync to localStorage:", syncError)
      }

      toast({
        title: "Mở file thành công",
        description: `Đã mở file "${fileData.name}"`,
        variant: "default",
      })

      setShowOpenFileDialog(false)
      setShowOpenLibraryDialog(false)
    } catch (error) {
      console.error("Error opening file:", error)
      const errorToast = toast({
        title: "Lỗi mở file",
        description: "Không thể mở file. Vui lòng thử lại.",
        variant: "destructive",
      })
      // Auto dismiss error toast after 3 seconds
      setTimeout(() => errorToast.dismiss(), 3000)
    }
  }

  const handleLockAll = () => {
    setLockAction("lock")
    setShowLockModal(true)
  }

  const handleUnlockAll = () => {
    setLockAction("unlock")
    setShowLockModal(true)
  }

  const loadAvailableTemplates = async () => {
    try {
      const response = await fetch('/api/templates')
      const result = await response.json()
      
      if (result.success) {
        setAvailableTemplates(result.data)
        
        // Find templates by type with better fallback logic
        const initialTemplates = result.data.filter((t: any) => t.fileType === 'INITIAL')
        const dailyTemplates = result.data.filter((t: any) => t.fileType === 'DAILY')
        
        const initialTemplate = initialTemplates.find((t: any) => t.isDefault) || 
                               initialTemplates.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        const dailyTemplate = dailyTemplates.find((t: any) => t.isDefault) || 
                             dailyTemplates.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

        if (initialTemplate) {
          setInitialTemplateId(initialTemplate.id)
          setInitialTemplate(initialTemplate)
          console.log('✅ Initial template set:', initialTemplate.name, 'Pages:', initialTemplate.pageCount)
        }
        
        if (dailyTemplate) {
          setDailyTemplateId(dailyTemplate.id)
          setDailyTemplate(dailyTemplate)
          console.log('✅ Daily template set:', dailyTemplate.name, 'Pages:', dailyTemplate.pageCount)
        }

        // ❌ REMOVED: Template selection logic (không cần thiết)
        
        console.log('Available templates loaded:', result.data.length)
      } else {
        console.error('Failed to load templates:', result.error)
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  // KHÔI PHỤC: Load existing diaries for template selection
  const loadExistingDiaries = async () => {
    try {
      console.log('📚 Loading library templates from API...')
      const response = await fetch('/api/construction-files?type=library')
      const result = await response.json()
      
      console.log('📚 Library API response:', result)
      
      if (result && result.files && Array.isArray(result.files) && result.files.length > 0) {
        // Map library files to diary format for dropdown
        const libraryTemplates = result.files.map((file: any) => ({
          id: file.id,
          title: file.name,
          totalPages: file.totalPages || 1,
          isLibrary: true
        }))
        setExistingDiaries(libraryTemplates)
        console.log('📚 Loaded library templates for dropdown:', libraryTemplates.length)
        console.log('📚 Available templates:', libraryTemplates.map(d => ({ id: d.id, title: d.title, totalPages: d.totalPages })))
      } else {
        console.log('📚 No library templates found or invalid response format')
        setExistingDiaries([])
      }
    } catch (error) {
      console.error('Error loading library templates:', error)
      setExistingDiaries([])
    }
  }

  // ❌ REMOVED: loadTemplateContent function (không cần thiết)

  const handlePageClick = (pageNum: number) => {
    // Save current page content before switching
    if (editorContent) {
      handleSave()
    }
    
    setCurrentPage(pageNum)
    setMockContent("Đây là nội dung của trang")
    
    // Load saved content for the new page
    loadPageContent(pageNum)
    
    // ✅ SIMPLIFIED: Không cần template logic
    console.log(`📄 Page ${pageNum}: Standard page (no template)`)
  }

  // Đã xóa: handleImageUpload function

  const handleAddDiary = async () => {
    setShowAddDiaryDialog(true)
    // Load existing diaries when dialog opens
    await loadExistingDiaries()
  }

  // Generate HTML for image page - Simple Table Approach
  const generateImagePageHTML = (pageData: any) => {
    const { imagesPerPage, imagesPerRow, images, pageNumber } = pageData
    const rows = Math.ceil(imagesPerPage / imagesPerRow)
    
    // Calculate cell dimensions for A4 page
    const cellWidth = Math.floor(160 / imagesPerRow) // 160mm available width
    const cellHeight = Math.floor(240 / rows) // Much more height for full image display
    
    let html = `
      <style>
        table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 8px;
        }
        
        .image-slot-cell {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          box-sizing: border-box;
        }
        
        .image-slot-cell img {
          width: auto;
          height: auto;
          max-width: 95%;
          max-height: 95%;
          object-fit: contain;
          object-position: center;
          border-radius: 4px;
          display: block;
          margin: 0 auto;
        }
      </style>
      <div style="width: 100%; max-width: 210mm; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 20px;">
          <!-- <h2 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">Báo cáo thi công</h2> -->
          <p style="color: #64748b; margin: 0; font-size: 12px;">Trang ${pageNumber}</p>
          <!-- <h3 style="color: #374151; margin: 15px 0; font-size: 14px;">Hình ảnh thi công</h3> -->
        </div>
        
        <table style="width: 100%; border-collapse: separate; border-spacing: 10px; margin: 20px auto;">
    `
    
    let imageIndex = 0
    for (let row = 0; row < rows; row++) {
      html += '<tr>'
      for (let col = 0; col < imagesPerRow; col++) {
        if (imageIndex >= imagesPerPage) break
        
        const imageData = images && images[imageIndex]
        const hasImage = imageData && (typeof imageData === 'string' || imageData.url)
        const imageUrl = typeof imageData === 'string' ? imageData : imageData?.url
        
        const cellStyle = `
          width: ${cellWidth}mm;
          height: ${cellHeight}mm;
          border: 3px ${hasImage ? 'solid #10b981' : 'dashed #3b82f6'};
          border-radius: 8px;
          text-align: center;
          vertical-align: middle;
          cursor: pointer;
          background: ${hasImage ? '#f0f9ff' : '#f8fafc'};
          position: relative;
          transition: all 0.2s ease;
          overflow: visible;
          padding: 5px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
        `
        
        html += `
          <td 
            class="image-slot-cell"
            style="${cellStyle}"
            data-slot="${imageIndex}"
            data-page="${pageNumber}"
            data-mce-contenteditable="false"
            onclick="handleImageSlotClick(${pageNumber}, ${imageIndex}); return false;"
            onmouseover="this.style.borderColor='#1d4ed8'; this.style.transform='scale(1.02)'"
            onmouseout="this.style.borderColor='#3b82f6'; this.style.transform='scale(1)'"
            title="Click để ${hasImage ? 'thay' : 'thêm'} ảnh ${imageIndex + 1}"
          >
        `
        
        if (hasImage) {
          html += `
            <img 
              src="${imageUrl}" 
              alt="Ảnh ${imageIndex + 1}"
              style="
                max-width: 90%;
                max-height: 90%;
                width: auto;
                height: auto;
                object-fit: contain;
                object-position: center;
                border-radius: 4px;
                display: block;
                margin: auto;
              "
              data-mce-contenteditable="false"
            />
          `
        } else {
          html += `
            <div style="
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100%;
              color: #64748b;
              font-size: 12px;
              font-weight: 500;
            ">
              <div style="
                width: 30px;
                height: 30px;
                border: 2px solid #3b82f6;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                color: #3b82f6;
                font-weight: bold;
                margin-bottom: 8px;
              ">+</div>
              <div>Click để thêm ảnh</div>
              <div style="font-size: 10px; margin-top: 4px; color: #94a3b8;">Ảnh ${imageIndex + 1}</div>
            </div>
          `
        }
        
        html += '</td>'
        imageIndex++
      }
      html += '</tr>'
    }
    
    html += `
        </table>
        
        <div style="
          text-align: center;
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 11px;
        ">
          Trang ${pageNumber} - ${imagesPerPage} ảnh (${imagesPerRow} ảnh/hàng) - ${rows} hàng
        </div>
        
        <script>
          console.log('🔧 Image page script loaded for page ${pageNumber}');
          
          function handleImageSlotClick(pageNumber, slotIndex) {
            console.log('🖼️ Image slot clicked:', pageNumber, slotIndex);
            
            // Show immediate feedback
            alert('Đang mở hộp thoại chọn ảnh...');
            
            // Try multiple ways to communicate with parent
            try {
              // Method 1: PostMessage to parent
              if (window.parent && window.parent !== window) {
                window.parent.postMessage({
                  type: 'imageSlotClick',
                  pageNumber: pageNumber,
                  slotIndex: slotIndex
                }, '*');
              }
              
              // Method 2: Direct parent function call
              if (window.parent && typeof window.parent.handleImageSlotClick === 'function') {
                window.parent.handleImageSlotClick(pageNumber, slotIndex);
              }
              
              // Method 3: TinyMCE specific
              if (window.parent && window.parent.tinymce && window.parent.tinymce.activeEditor) {
                const editor = window.parent.tinymce.activeEditor;
                if (editor.windowManager) {
                  // Trigger custom event
                  editor.fire('imageSlotClick', { pageNumber, slotIndex });
                }
              }
              
              // Method 4: Direct file picker as fallback
              setTimeout(function() {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.style.display = 'none';
                document.body.appendChild(input);
                
                input.onchange = function(e) {
                  const file = e.target.files[0];
                  if (file) {
                    console.log('📁 File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
                    
                    // Validate file type
                    if (!file.type.startsWith('image/')) {
                      alert('Vui lòng chọn file ảnh!');
                      document.body.removeChild(input);
                      return;
                    }
                    
                    // Validate file size (max 5MB)
                    if (file.size > 5 * 1024 * 1024) {
                      alert('File ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 5MB.');
                      document.body.removeChild(input);
                      return;
                    }
                    
                    // Send file data to parent
                    const reader = new FileReader();
                    reader.onload = function(event) {
                      const imageData = event.target.result;
                      console.log('📄 Image data loaded, length:', imageData.length);
                      
                      if (window.parent && window.parent.postMessage) {
                        console.log('📤 Sending imageSelected message to parent');
                        window.parent.postMessage({
                          type: 'imageSelected',
                          pageNumber: pageNumber,
                          slotIndex: slotIndex,
                          imageData: imageData,
                          fileName: file.name
                        }, '*');
                      }
                    };
                    
                    reader.onerror = function(error) {
                      console.error('❌ Error reading file:', error);
                      alert('Lỗi đọc file ảnh!');
                    };
                    
                    reader.readAsDataURL(file);
                  }
                  document.body.removeChild(input);
                };
                
                input.click();
              }, 100);
              
            } catch (error) {
              console.error('Error handling image slot click:', error);
            }
          }
          
          // Setup click handlers when DOM is ready
          document.addEventListener('DOMContentLoaded', function() {
            console.log('🔧 Setting up click listeners');
            const cells = document.querySelectorAll('td[data-slot]');
            cells.forEach(function(cell) {
              cell.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const pageNum = parseInt(cell.getAttribute('data-page'));
                const slotIdx = parseInt(cell.getAttribute('data-slot'));
                console.log('🖱️ Cell clicked:', pageNum, slotIdx);
                handleImageSlotClick(pageNum, slotIdx);
              });
            });
          });
        </script>
      </div>
    `
    
    return html
  }

  const handleCreateDiary = async () => {
    // KHÔI PHỤC: Xử lý template trước
    if (useTemplate && selectedDiaryId) {
      try {
        const savedReports = localStorage.getItem("construction-reports")
        if (savedReports) {
          const reports = JSON.parse(savedReports)
          const templateReport = reports.find((r: any) => r.id === selectedDiaryId)
          
          if (templateReport) {
            // Copy content from template
            const templatePages = templateReport.pages || {}
            const templateImageConfig = templateReport.imagePagesConfig || {}
            
            // Add template pages to current report
            const startPage = totalPages + 1
            const newPagesContent = { ...pagesContent }
            const newImageConfig = { ...imagePagesConfig }
            
            Object.keys(templatePages).forEach((pageKey) => {
              const pageNum = parseInt(pageKey)
              const newPageNum = startPage + pageNum - 1
              newPagesContent[newPageNum] = templatePages[pageKey]
            })
            
            Object.keys(templateImageConfig).forEach((pageKey) => {
              const pageNum = parseInt(pageKey)
              const newPageNum = startPage + pageNum - 1
              newImageConfig[newPageNum] = { ...templateImageConfig[pageKey] }
            })
            
            setPagesContent(newPagesContent)
            setImagePagesConfig(newImageConfig)
            setTotalPages(totalPages + (templateReport.totalPages || 1))
            
            toast({
              title: "✅ Thành công",
              description: `Đã sao chép ${templateReport.totalPages || 1} trang từ "${templateReport.title}"`,
            })
            
            setShowAddDiaryDialog(false)
            return
          }
        }
      } catch (error) {
        console.error('Error copying template:', error)
        toast({
          title: "❌ Lỗi",
          description: "Không thể sao chép từ nhật ký mẫu",
          variant: "destructive",
        })
        return
      }
    }

    // Validation cho image pages
    if (useImagePages) {
      const calculation = calculateGridLayout({
        imagesPerPage,
        imagesPerRow,
        marginLeft,
        marginRight,
        marginBottom,
        marginHeader,
        aspectRatio: imageAspectRatio,
        centerHorizontally
      })
      
      if (!calculation.isValid || calculation.errors.length > 0) {
        const errorMessage = calculation.errors.length > 0 
          ? calculation.errors[0] 
          : "Không thể tạo layout với cấu hình này"
          
        const errorToast = toast({
          title: "Lỗi",
          description: errorMessage,
          variant: "destructive",
        })
        setTimeout(() => errorToast.dismiss(), 3000)
        return
      }
      
      // Hiển thị cảnh báo nếu có (nhưng vẫn cho phép tạo)
      if (calculation.warnings.length > 0) {
        const warningToast = toast({
          title: "Cảnh báo",
          description: calculation.warnings[0],
          variant: "default",
        })
        setTimeout(() => warningToast.dismiss(), 5000)
      }
    }

    console.log("✅ Tạo thêm nhật ký với cấu hình:", {
      useTemplate,
      selectedDiaryId,
      useImagePages,
      imagePages,
      imagesPerPage,
      imagesPerRow,
      saveAsDefault
    })

    if (saveAsDefault) {
      // Save settings as default (bao gồm cả margin settings)
      localStorage.setItem("diary-default-settings", JSON.stringify({
        imagePages,
        imagesPerPage,
        imagesPerRow,
        marginLeft,
        marginRight,
        marginBottom,
        marginHeader,
        imageAspectRatio,
        centerHorizontally
      }))
    }

    // ✅ LOGIC MỚI: Chỉ tính image pages
    let newImagePages = useImagePages ? imagePages : 0
    
    // ✅ LOGIC MỚI: Chỉ tính tổng image pages
    const totalNewPages = newImagePages

    console.log(`✅ [SIMPLIFIED] Thêm ${newImagePages} trang ảnh = ${totalNewPages} trang mới`)

    // Create image pages with layout configuration (only if useImagePages is true)
    const newImagePagesData = []
    if (useImagePages) {
      for (let i = 0; i < newImagePages; i++) {
        const pageNumber = totalPages + i + 1
        newImagePagesData.push({
          pageNumber,
          type: 'image-page',
          imagesPerPage,
          imagesPerRow,
          images: Array(imagesPerPage).fill(null) // Empty slots for images
        })
      }
      console.log("🖼️ Creating image pages:", newImagePagesData)
    } else {
      console.log("🚫 Không tạo trang ảnh vì useImagePages = false")
    }

    // Calculate new total pages
    const newTotalPages = totalPages + totalNewPages
    console.log(`[v0] Tổng số trang sau khi thêm: ${newTotalPages}`)

    // Prepare updated data
    const updatedPagesContent = { ...pagesContent }
    const updatedImagePagesConfig = { ...imagePagesConfig }
    
    // Only process image pages if they were created
    if (useImagePages) {
      newImagePagesData.forEach(pageData => {
        updatedPagesContent[pageData.pageNumber] = generateImagePageHTML(pageData)
        updatedImagePagesConfig[pageData.pageNumber] = {
          imagesPerPage: pageData.imagesPerPage,
          imagesPerRow: pageData.imagesPerRow,
          images: pageData.images,
          // ✅ LỰU CẤU HÌNH RIÊNG CHO TỪNG TRANG
          marginLeft: marginLeft,
          marginRight: marginRight,
          marginBottom: marginBottom,
          marginHeader: marginHeader,
          imageAspectRatio: imageAspectRatio,
          centerHorizontally: centerHorizontally
        }
        console.log(`🖼️ Set imagePagesConfig for page ${pageData.pageNumber}:`, updatedImagePagesConfig[pageData.pageNumber])
      })
    }

    // Store image pages data
    setPagesContent(updatedPagesContent)

    // Update total pages count
    setTotalPages(newTotalPages)

    // ✅ QUAN TRỌNG: Set imagePagesConfig để component biết đây là trang ảnh
    setImagePagesConfig(updatedImagePagesConfig)
    
    // ✅ IMMEDIATE SAVE: Save data immediately with multiple attempts
    console.log(`💾 [CREATE DIARY] About to save with updated data`)
    
    // Save immediately (single save only)
    manualSaveToLocalStorage(newTotalPages, updatedImagePagesConfig, updatedPagesContent)
    
    // Show success toast
    toast({
      title: "Thành công",
      description: `Đã tạo thêm ${totalNewPages} trang ảnh (${imagesPerRow}x${Math.ceil(imagesPerPage/imagesPerRow)} layout)`,
      variant: "default",
    })
    
    // Close dialog
    setShowAddDiaryDialog(false)

    // Navigate to first newly created page and load its content
    const firstNewPage = totalPages + 1
    setTimeout(() => {
      console.log("🔄 Navigating to first new page:", firstNewPage)
      handlePageChange(firstNewPage)
    }, 300)
  }

  const handlePreview = () => {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      const documentContent = editorContent || "Không có nội dung để xem trước"
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Xem trước - ${reportName}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 20px; 
                background: #f5f5f5;
              }
              .preview-container { 
                max-width: 210mm; 
                margin: 0 auto; 
                background: white;
                padding: 20mm;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
              }
              h1, h2, h3 { color: #333; }
              p { line-height: 1.6; }
              @media print { 
                body { margin: 0; background: white; }
                .preview-container { box-shadow: none; }
              }
            </style>
          </head>
          <body>
            <div class="preview-container">
              <h1>${reportName} - Trang ${currentPage}</h1>
              <div>${documentContent}</div>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  // Function to convert image to square canvas
  const createSquareImage = (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        // Create square canvas (70mm = ~264px at 96 DPI)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject('Cannot create canvas context')
          return
        }
        
        const size = 264 // 70mm at 96 DPI
        canvas.width = size
        canvas.height = size
        
        // Fill white background
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, size, size)
        
        // Calculate scaling to fit image in square while maintaining aspect ratio
        const scale = Math.min(size / img.width, size / img.height)
        const scaledWidth = img.width * scale
        const scaledHeight = img.height * scale
        
        // Center the image
        const x = (size - scaledWidth) / 2
        const y = (size - scaledHeight) / 2
        
        // Draw image centered in square
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight)
        
        // Convert to base64
        resolve(canvas.toDataURL('image/jpeg', 0.9))
      }
      
      img.onerror = () => reject('Failed to load image')
      img.src = imageUrl
    })
  }

  // NEW APPROACH: jsPDF + html2canvas with forced square images
  const handleExportPDFNew = async () => {
    try {
      // Dynamic imports
      const jsPDF = (await import('jspdf')).default
      const html2canvas = (await import('html2canvas')).default
      
      const pdf = new jsPDF('p', 'mm', 'a4')
      let isFirstPage = true
      
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const isImagePage = !!imagePagesConfig[pageNum]
        
        if (isImagePage) {
          const config = imagePagesConfig[pageNum]
          const images = config?.images || []
          
          // COPY CHÍNH XÁC layout từ web - KHÔNG ĐƯỢC NHẢY TRANG
          const tempDiv = document.createElement('div')
          tempDiv.style.cssText = `
            width: 210mm;
            height: 297mm;
            padding: 15mm;
            background: white;
            position: absolute;
            top: -9999px;
            left: -9999px;
            font-family: Arial, sans-serif;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden;
          `
          
          tempDiv.innerHTML = `
            <div style="text-align: center; margin-bottom: 15px;">
              <!-- <h2 style="color: #1d4ed8; font-size: 20px; margin: 0 0 8px 0;">Báo cáo thi công</h2> -->

              <!-- <h3 style="font-size: 16px; margin: 0; color: #333;">Hình ảnh thi công</h3> -->
            </div>
            
            <div style="
              display: grid;
              grid-template-columns: 70mm 70mm;
              grid-template-rows: 70mm 70mm;
              gap: 5mm;
              width: 145mm;
              height: 145mm;
              justify-content: center;
              align-items: center;
              margin: 0 auto;
              justify-items: center;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            ">
              ${images.map((imageUrl, index) => `
                <div style="
                  width: 70mm;
                  height: 70mm;
                  min-width: 70mm;
                  min-height: 70mm;
                  max-width: 70mm;
                  max-height: 70mm;
                  border: 4px solid ${imageUrl ? '#10b981' : '#3b82f6'};
                  border-style: ${imageUrl ? 'solid' : 'dashed'};
                  border-radius: 8px;
                  overflow: hidden;
                  background: ${imageUrl ? '#f0f9ff' : '#f8fafc'};
                  position: relative;
                  display: block;
                ">
                  ${imageUrl ? `
                    <img src="${imageUrl}" alt="Ảnh ${index + 1}" style="
                      width: 70mm !important;
                      height: 70mm !important;
                      object-fit: cover !important;
                      display: block !important;
                      border-radius: 4px;
                    " />
                  ` : `
                    <div style="
                      width: 70mm;
                      height: 70mm;
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                      justify-content: center;
                      color: #666;
                      font-size: 14px;
                    ">
                      <div style="
                        width: 32px;
                        height: 32px;
                        border: 2px solid #3b82f6;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #3b82f6;
                        font-weight: bold;
                        font-size: 20px;
                        margin-bottom: 8px;
                      ">+</div>
                      <div>Ảnh ${index + 1}</div>
                    </div>
                  `}
                </div>
              `).join('')}
            </div>
            

          `
          
          document.body.appendChild(tempDiv)
          
          // Capture with html2canvas - FORCE SINGLE PAGE
          const canvas = await html2canvas(tempDiv, {
            width: 794, // A4 width at 96 DPI (210mm)
            height: 1123, // A4 height at 96 DPI (297mm)
            scale: 1.5, // Reduce scale to prevent overflow
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            scrollX: 0,
            scrollY: 0,
            windowWidth: 794,
            windowHeight: 1123,
            // FORCE single page capture
            onclone: (clonedDoc) => {
              const clonedDiv = clonedDoc.querySelector('div')
              if (clonedDiv) {
                clonedDiv.style.pageBreakInside = 'avoid'
                clonedDiv.style.breakInside = 'avoid'
                clonedDiv.style.overflow = 'hidden'
                clonedDiv.style.height = '297mm'
                clonedDiv.style.maxHeight = '297mm'
              }
            }
          })
          
          document.body.removeChild(tempDiv)
          
          if (!isFirstPage) {
            pdf.addPage()
          }
          
          // Add canvas to PDF
          const imgData = canvas.toDataURL('image/jpeg', 0.9)
          pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297)
          
          isFirstPage = false
        }
      }
      
      // Save PDF
      pdf.save(`bao-cao-thi-cong-${reportName || 'report'}.pdf`)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Lỗi tạo PDF: ' + error)
    }
  }

  // Enhanced PDF export function with square image preprocessing
  const handleExportPDF = async () => {
    if (typeof window !== 'undefined') {
      const printWindow = window.open('', '_blank', 'width=800,height=600')
      
      if (printWindow) {
        try {
          // Show loading message
          printWindow.document.write('<div style="text-align: center; padding: 50px; font-family: Arial;">Đang xử lý ảnh thành hình vuông... Vui lòng đợi...</div>')
          
          // Collect all pages content with better formatting
          let allPagesContent = ''
          
          for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            const pageContent = pagesContent[pageNum] || ''
            const isImagePage = !!imagePagesConfig[pageNum]
            const hasTextContent = pageContent && pageContent.trim() !== ''
            
            // ✅ FIX: Xử lý mixed content (trang có cả text và ảnh)
            if (isImagePage && hasTextContent) {
              // Render mixed content page (text + images)
              const config = imagePagesConfig[pageNum]
              const originalImages = config?.images || []
              const imagesPerRow = config?.imagesPerRow || 2
              
              // PRE-PROCESS: Convert all images to squares
              const squareImages: string[] = []
              for (const imageUrl of originalImages) {
                if (imageUrl) {
                  try {
                    const squareImageUrl = await createSquareImage(imageUrl)
                    squareImages.push(squareImageUrl)
                  } catch (error) {
                    console.error('Failed to create square image:', error)
                    squareImages.push(imageUrl) // Fallback to original
                  }
                } else {
                  squareImages.push('') // Empty slot
                }
              }

              allPagesContent += `
                <div class="pdf-page ${pageNum > 1 ? 'page-break' : ''}">
                  <div class="pdf-header">
                    <div class="header-left">
                      <div class="company-info">
                        <strong>CÔNG TY XÂY DỰNG ABC</strong><br>
                        <small>Địa chỉ: 123 Đường ABC, Quận 1, TP.HCM</small>
                      </div>
                    </div>
                    <div class="header-center">
                      <h1 class="document-title">NHẬT KÝ THI CÔNG</h1>
                      <div class="document-subtitle">${reportName}</div>
                    </div>
                    <div class="header-right">
                      <div class="page-info">
                        
                        <small>${new Date().toLocaleDateString('vi-VN')}</small>
                      </div>
                    </div>
                  </div>
                  
                  <div class="pdf-content">
                    <div class="section-header">
                      <h2></h2>
                      <div class="section-line"></div>
                    </div>
                    
                    <div class="text-content">
                      ${pageContent}
                    </div>
                    
                    <div class="section-header" style="margin-top: 20px;">
                      <h3>HÌNH ẢNH</h3>
                      <div class="section-line"></div>
                    </div>
                    
                    <div class="image-grid" style="display: grid; grid-template-columns: repeat(${imagesPerRow}, 1fr); gap: 10px; margin: 15px 0;">
                      ${squareImages.map((imageUrl, index) => `
                        <div class="image-container" style="aspect-ratio: 1; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center; background: #f9f9f9;">
                          ${imageUrl ? `<img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="Ảnh ${index + 1}">` : `<span style="color: #999; font-size: 12px;">Ảnh ${index + 1}</span>`}
                        </div>
                      `).join('')}
                    </div>
                  </div>
                  
                  <div class="pdf-footer">
                    <div class="footer-left">Nhật ký thi công - ${reportName}</div>
                    <div class="footer-center"></div>
                    <div class="footer-right">${new Date().toLocaleDateString('vi-VN')}</div>
                  </div>
                </div>
              `
            } else if (isImagePage) {
              // Render image page with professional layout
              const config = imagePagesConfig[pageNum]
              const originalImages = config?.images || []
              const imagesPerRow = config?.imagesPerRow || 2
              
              // PRE-PROCESS: Convert all images to squares
              const squareImages: string[] = []
              for (const imageUrl of originalImages) {
                if (imageUrl) {
                  try {
                    const squareImageUrl = await createSquareImage(imageUrl)
                    squareImages.push(squareImageUrl)
                  } catch (error) {
                    console.error('Failed to create square image:', error)
                    squareImages.push(imageUrl) // Fallback to original
                  }
                } else {
                  squareImages.push('') // Empty slot
                }
              }
            
            allPagesContent += `
              <div class="pdf-page ${pageNum > 1 ? 'page-break' : ''}">
                <div class="pdf-header">
                  <div class="header-left">
                    <div class="company-info">
                      <strong>CÔNG TY XÂY DỰNG ABC</strong><br>
                      <small>Địa chỉ: 123 Đường ABC, Quận 1, TP.HCM</small>
                    </div>
                  </div>
                  <div class="header-center">
                    <h1 class="document-title">NHẬT KÝ THI CÔNG</h1>
                    <div class="document-subtitle">Báo cáo hình ảnh thi công</div>
                  </div>
                  <div class="header-right">
                    <div class="page-info">
                      
                      <small>${new Date().toLocaleDateString('vi-VN')}</small>
                    </div>
                  </div>
                </div>
                
                <div class="pdf-content">
                  <div class="section-header">
                    <h2>HÌNH ẢNH THI CÔNG - TRANG ${pageNum}</h2>
                    <div class="section-line"></div>
                  </div>
                  
                  <div class="image-grid-professional" style="display: grid; grid-template-columns: repeat(2, 70mm); grid-template-rows: repeat(2, auto); gap: 5mm; margin: 20px auto; width: 145mm; justify-content: center; page-break-inside: avoid;">
                    ${squareImages.map((imageUrl, index) => `
                      <div class="image-frame" style="width: 70mm; height: auto; border: 2px solid #e5e7eb; border-radius: 8px; overflow: hidden; background-color: #f8fafc;">
                        <div class="image-number" style="padding: 5px; font-size: 12px; text-align: center; background: #f1f5f9;">Ảnh ${index + 1}</div>
                        ${imageUrl ? `
                          <img src="${imageUrl}" alt="Ảnh thi công ${index + 1}" style="width: 70mm !important; height: 70mm !important; object-fit: contain !important; display: block !important;" />
                        ` : `
                          <div class="empty-frame" style="width: 70mm; height: 70mm; display: flex; align-items: center; justify-content: center; background: #f8fafc;">
                            <div class="empty-text" style="color: #9ca3af; font-size: 14px;">Chưa có ảnh</div>
                          </div>
                        `}
                        <div class="image-caption" style="padding: 5px; font-size: 10px; text-align: center; background: #f1f5f9;">
                          Mô tả: Hình ảnh thi công ngày ${new Date().toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    `).join('')}
                  </div>
                  
                  <div class="summary-section">
                    <div class="summary-box">
                      <strong>Tóm tắt:</strong> ${squareImages.filter(img => img).length} ảnh đã chụp / ${squareImages.length} vị trí (Đã xử lý thành hình vuông)
                    </div>
                  </div>
                </div>
                
                <div class="pdf-footer">
                  <div class="footer-left">Nhật ký thi công - ${reportName}</div>
                  <div class="footer-center"></div>
                  <div class="footer-right">${new Date().toLocaleDateString('vi-VN')}</div>
                </div>
              </div>
            `
          } else {
            // Render text page with professional layout
            // ✅ FIX: Chỉ render trang nếu có nội dung thực sự
            if (pageContent && pageContent.trim() !== '') {
              const content = pageContent
              allPagesContent += `
                <div class="pdf-page ${pageNum > 1 ? 'page-break' : ''}">
                  <div class="pdf-header">
                    <div class="header-left">
                      <div class="company-info">
                        <strong>CÔNG TY XÂY DỰNG ABC</strong><br>
                        <small>Địa chỉ: 123 Đường ABC, Quận 1, TP.HCM</small>
                      </div>
                    </div>
                    <div class="header-center">
                      <h1 class="document-title">NHẬT KÝ THI CÔNG</h1>
                      <div class="document-subtitle">${reportName}</div>
                    </div>
                    <div class="header-right">
                      <div class="page-info">
                        
                        <small>${new Date().toLocaleDateString('vi-VN')}</small>
                      </div>
                    </div>
                  </div>
                  
                  <div class="pdf-content">
                    <div class="section-header">
                      <h2></h2>
                      <div class="section-line"></div>
                    </div>
                    
                    <div class="text-content">
                      ${content}
                    </div>
                  </div>
                  
                  <div class="pdf-footer">
                    <div class="footer-left">Nhật ký thi công - ${reportName}</div>
                    <div class="footer-center"></div>
                    <div class="footer-right">${new Date().toLocaleDateString('vi-VN')}</div>
                  </div>
                </div>
              `
            }
          }
        }

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Xuất PDF - ${reportName}</title>
            <meta charset="UTF-8">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body { 
                font-family: 'Times New Roman', serif;
                font-size: 12pt;
                line-height: 1.5;
                color: #000;
                background: white;
              }
              
              @page {
                size: A4;
                margin: 20mm 15mm;
              }
              
              .pdf-page {
                width: 100%;
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                position: relative;
                padding: 0;
                page-break-inside: avoid;
                break-inside: avoid;
              }
              
              .page-break {
                page-break-before: always;
              }
              
              .pdf-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                padding: 15px 0;
                border-bottom: 2px solid #1e40af;
                margin-bottom: 25px;
              }
              
              .header-left, .header-right {
                flex: 1;
              }
              
              .header-center {
                flex: 2;
                text-align: center;
              }
              
              .company-info {
                font-size: 10pt;
                line-height: 1.3;
              }
              
              .document-title {
                color: #1e40af;
                font-size: 20pt;
                font-weight: bold;
                margin-bottom: 5px;
                letter-spacing: 1px;
              }
              
              .document-subtitle {
                color: #666;
                font-size: 12pt;
                font-style: italic;
              }
              
              .page-info {
                text-align: right;
                font-size: 10pt;
                line-height: 1.3;
              }
              
              .pdf-content {
                flex: 1;
                padding: 0;
              }
              
              .section-header {
                margin-bottom: 25px;
                text-align: center;
              }
              
              .section-header h2 {
                color: #1e40af;
                font-size: 16pt;
                font-weight: bold;
                margin-bottom: 10px;
              }
              
              .section-line {
                width: 100px;
                height: 2px;
                background: #1e40af;
                margin: 0 auto;
              }
              
              .image-grid-professional {
                max-width: 100%;
                margin: 0 auto;
                page-break-inside: avoid;
                break-inside: avoid;
                display: grid !important;
                gap: 15px !important;
              }
              
              .image-frame {
                border: 2px solid #ddd;
                border-radius: 8px;
                overflow: hidden;
                background: white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                page-break-inside: avoid;
                break-inside: avoid;
                margin-bottom: 0;
                height: 280px;
                display: flex;
                flex-direction: column;
              }
              
              .image-number {
                background: #1e40af;
                color: white;
                padding: 8px;
                text-align: center;
                font-weight: bold;
                font-size: 11pt;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
              }
              
              .professional-image {
                width: 100%;
                height: 200px;
                object-fit: cover;
                display: block;
                page-break-inside: avoid;
                break-inside: avoid;
                border-radius: 4px;
                flex: 1;
              }
              
              .empty-frame {
                width: 100%;
                height: 200px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #f5f5f5;
                border: 2px dashed #ccc;
                flex: 1;
              }
              
              .empty-text {
                color: #999;
                font-size: 11pt;
                font-style: italic;
              }
              
              .image-caption {
                padding: 10px;
                font-size: 10pt;
                color: #666;
                background: #f9f9f9;
                border-top: 1px solid #eee;
                height: 50px;
                display: flex;
                align-items: center;
                flex-shrink: 0;
              }
              
              .summary-section {
                margin-top: 30px;
                padding: 20px 0;
                border-top: 1px solid #eee;
              }
              
              .summary-box {
                background: #f0f8ff;
                border: 1px solid #1e40af;
                border-radius: 5px;
                padding: 15px;
                text-align: center;
                font-size: 11pt;
              }
              
              .text-content {
                line-height: 1.8;
                font-size: 12pt;
                text-align: justify;
                margin: 20px 0;
              }
              
              .text-content p {
                margin-bottom: 15px;
              }
              
              .text-content h1, .text-content h2, .text-content h3 {
                margin: 25px 0 15px 0;
                color: #1e40af;
              }
              
              .text-content ul, .text-content ol {
                margin: 15px 0 15px 25px;
              }
              
              .text-content li {
                margin-bottom: 8px;
              }
              
              .pdf-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 0;
                border-top: 1px solid #ddd;
                margin-top: 25px;
                font-size: 10pt;
                color: #666;
              }
              
              .footer-left, .footer-right {
                flex: 1;
              }
              
              .footer-center {
                flex: 1;
                text-align: center;
                font-weight: bold;
              }
              
              .footer-right {
                text-align: right;
              }
              
              @media print {
                body { 
                  margin: 0; 
                  background: white;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                
                .pdf-page {
                  min-height: auto;
                }
                
                .page-break {
                  page-break-before: always;
                }
                
                .image-frame {
                  break-inside: avoid;
                  page-break-inside: avoid;
                  display: flex !important;
                  flex-direction: column !important;
                  height: 280px !important;
                }
                
                .image-grid-professional {
                  break-inside: avoid;
                  page-break-inside: avoid;
                  display: grid !important;
                  gap: 15px !important;
                }
                
                .professional-image {
                  width: 100% !important;
                  height: 200px !important;
                  object-fit: cover !important;
                  flex: 1 !important;
                }
                
                .summary-section {
                  break-inside: avoid;
                }
              }
            </style>
          </head>
          <body>
            ${allPagesContent}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 1500);
              }
            </script>
          </body>
          </html>
        `)
        printWindow.document.close()
        } catch (error) {
          console.error('Error processing images for PDF:', error)
          printWindow.document.write(`
            <div style="text-align: center; padding: 50px; font-family: Arial; color: red;">
              <h3>Lỗi xử lý ảnh!</h3>
              <p>Không thể chuyển đổi ảnh thành hình vuông. Vui lòng thử lại.</p>
              <p>Chi tiết lỗi: ${error}</p>
            </div>
          `)
          printWindow.document.close()
        }
      } else {
        alert('Không thể mở cửa sổ xuất PDF. Vui lòng cho phép popup trong trình duyệt.')
      }
    }
  }

  const handlePrint = () => {
    setShowPrintPreview(true)
  }

  const handleActualPrint = () => {
    // Đồng bộ nội dung hiện tại trước khi in
    const currentContent = editorContent || ""
    const updatedPagesContent = {
      ...pagesContent,
      [currentPage]: currentContent
    }
    
    // Tạo cửa sổ in mới với chỉ nội dung cần in
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    
    if (printWindow) {
      // Tạo HTML cho print với tất cả các trang
      let printHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title></title>
          <meta charset="utf-8">
          <style>
            @media print {
              @page {
                size: A4;
                margin: 15mm;
              }
              
              body {
                margin: 0;
                padding: 0;
                background: white !important;
                font-family: Arial, sans-serif;
                font-size: 12pt;
                line-height: 1.4;
                color: black !important;
              }
              
              /* Ẩn text about:blank và các text không mong muốn khác */
              body::before,
              body::after,
              html::before,
              html::after {
                display: none !important;
                content: none !important;
              }
              
              /* Ẩn header và footer mặc định của browser */
              @page {
                margin-top: 0;
                margin-bottom: 0;
              }
              
              /* Ẩn tất cả text không mong muốn trong print */
              * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              
              /* Ẩn URL, title, about:blank */
              html:before,
              html:after,
              body:before, 
              body:after {
                content: "" !important;
                display: none !important;
              }
              
              .print-page {
                width: 100%;
                min-height: 250mm;
                padding: 20mm;
                background: white !important;
                page-break-after: always;
                box-sizing: border-box;
                position: relative;
                margin: 0 auto;
              }
              
              .print-page:last-child {
                page-break-after: auto;
              }
              
              .page-header {
                text-align: center;
                margin-bottom: 20px;
                border-bottom: 2px solid #333;
                padding-bottom: 10px;
              }
              
              .page-title {
                font-size: 18pt;
                font-weight: bold;
                margin-bottom: 5px;
                color: black !important;
              }
              
              .page-info {
                font-size: 12pt;
                color: #666 !important;
              }
              
              .editor-content {
                margin: 20px 0;
                min-height: 150px;
              }
              
              .image-grid {
                display: grid !important;
                grid-template-columns: repeat(2, 70mm) !important;
                grid-template-rows: repeat(2, 70mm) !important;
                gap: 5mm !important;
                justify-content: center !important;
                align-items: center !important;
                justify-items: center !important;
                align-content: center !important;
                margin: 15mm auto !important;
                width: auto !important;
                box-sizing: border-box !important;
              }
              
              .image-item {
                width: 70mm !important;
                height: 70mm !important;
                border: 4px solid #10b981 !important;
                border-radius: 8px !important;
                overflow: hidden !important;
                page-break-inside: avoid !important;
                margin-bottom: 0 !important;
                box-sizing: border-box !important;
                position: relative !important;
                background-color: #f0f9ff !important;
              }
              
              .image-item img {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
                border-radius: 4px !important;
                display: block !important;
              }
              
              * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
            
            @media screen {
              body {
                margin: 20px;
                font-family: Arial, sans-serif;
              }
              
              .print-page {
                width: 210mm;
                min-height: 297mm;
                padding: 20mm;
                margin: 0 auto 20px auto;
                background: white;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                border: 1px solid #ddd;
              }
              
              .page-header {
                text-align: center;
                margin-bottom: 20px;
                border-bottom: 2px solid #333;
                padding-bottom: 10px;
              }
              
              .image-grid {
                display: grid;
                grid-template-columns: repeat(2, 70mm);
                grid-template-rows: repeat(2, 70mm);
                gap: 5mm;
                justify-content: center;
                align-items: center;
                justify-items: center;
                align-content: center;
                margin: 15mm auto;
                width: auto;
                box-sizing: border-box;
              }
              
              .image-item {
                width: 70mm;
                height: 70mm;
                border: 4px solid #10b981;
                border-radius: 8px;
                overflow: hidden;
                margin-bottom: 0;
                box-sizing: border-box;
                position: relative;
                background-color: #f0f9ff;
              }
              
              .image-item img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 4px;
                display: block;
              }
            }
          </style>
        </head>
        <body>
      `
      
      // Thêm nội dung từng trang
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const pageContent = updatedPagesContent[pageNum] || ""
        const hasImageConfig = imagePagesConfig[pageNum] && Object.keys(imagePagesConfig[pageNum]).length > 0
        
        printHTML += `
          <div class="print-page">
            <div class="page-header">
              <h1 class="page-title">${reportName}</h1>
            </div>
            
            <div class="page-content">
        `
        
        if (hasImageConfig) {
          // Trang ảnh - bao gồm cả text và ảnh
          const headerContent = imagePagesConfig[pageNum]?.headerContent || ""
          
          // Thêm phần text nếu có
          if (headerContent.trim()) {
            printHTML += `
              <div class="header-content" style="
                margin-bottom: 15mm;
                padding: 5mm;
                font-family: Arial, sans-serif;
                font-size: 12pt;
                line-height: 1.4;
                white-space: pre-wrap;
                background-color: white;
              ">
                ${headerContent}
              </div>
            `
          }
          
          // Thêm phần ảnh
          printHTML += '<div class="image-grid">'
          const images = imagePagesConfig[pageNum]?.images || []
          images.forEach((imageUrl, slotIndex) => {
            if (imageUrl) {
              printHTML += `
                <div class="image-item">
                  <img src="${imageUrl}" alt="Ảnh ${slotIndex + 1}" />
                </div>
              `
            }
          })
          printHTML += '</div>'
        } else {
          // Trang text
          printHTML += `<div class="editor-content">${pageContent}</div>`
        }
        
        printHTML += `
            </div>
          </div>
        `
      }
      
      printHTML += `
        </body>
        </html>
      `
      
      printWindow.document.write(printHTML)
      printWindow.document.close()
      
      // Đợi ảnh load xong rồi mới in
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
          setShowPrintPreview(false)
        }, 1000)
      }
    }
  }

  const handleShare = () => {
    setShowShareModal(true)
  }

  const handleShareSubmit = () => {
    if (shareType === "all") {
      console.log("[v0] Chia sẻ với tất cả thành viên")
    } else if (shareEmails.length > 0) {
      console.log("[v0] Chia sẻ với emails:", shareEmails)
    }
    setShowShareModal(false)
    setShareEmails([])
    setCurrentEmail("")
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleAddEmail = () => {
    const trimmedEmail = currentEmail.trim()

    if (!trimmedEmail) {
      setEmailError(t("editor.share.email_error_required"))
      return
    }

    if (!validateEmail(trimmedEmail)) {
      setEmailError(t("editor.share.email_error_invalid"))
      return
    }

    if (shareEmails.includes(trimmedEmail)) {
      setEmailError(t("editor.share.email_error_exists"))
      return
    }

    setShareEmails([...shareEmails, trimmedEmail])
    setCurrentEmail("")
    setEmailError("")
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentEmail(e.target.value)
    if (emailError) {
      setEmailError("")
    }
  }

  // Đã xóa: handleImageSlotClick function

  const handlePageSelect = (pageNum: number) => {
    setSelectedPages((prev) => (prev.includes(pageNum) ? prev.filter((p) => p !== pageNum) : [...prev, pageNum]))
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedPages([])
    } else {
      setSelectedPages(Array.from({ length: totalPages }, (_, i) => i + 1))
    }
    setSelectAll(!selectAll)
  }

  const handleLockUnlockSubmit = () => {
    if (selectedPages.length > 0) {
      if (lockAction === "lock") {
        // Thêm các trang được chọn vào danh sách khóa
        setLockedPages(prev => [...new Set([...prev, ...selectedPages])])
        toast({
          title: "Khóa trang thành công",
          description: `Đã khóa ${selectedPages.length} trang. Các trang này không thể chỉnh sửa.`,
        })
      } else {
        // Xóa các trang được chọn khỏi danh sách khóa
        setLockedPages(prev => prev.filter(page => !selectedPages.includes(page)))
        toast({
          title: "Mở khóa trang thành công", 
          description: `Đã mở khóa ${selectedPages.length} trang. Các trang này có thể chỉnh sửa.`,
        })
      }
      console.log(`[v0] ${lockAction === "lock" ? "Khóa" : "Mở khóa"} các trang:`, selectedPages)
    }
    setShowLockModal(false)
    setSelectedPages([])
    setSelectAll(false)
  }

  // Hàm thêm trang mới
  const handleAddPage = () => {
    const newPageNumber = totalPages + 1
    console.log(`[ADD PAGE] 🆕 Bắt đầu thêm trang trắng mới: ${newPageNumber}`)
    console.log(`[ADD PAGE] 📊 imagePagesConfig TRƯỚC khi thêm:`, imagePagesConfig)
    console.log(`[ADD PAGE] 📄 pagesContent TRƯỚC khi thêm:`, Object.keys(pagesContent))
    
    // ✅ STEP 1: Tạo state mới hoàn toàn sạch
    const cleanImagePagesConfig = { ...imagePagesConfig }
    delete cleanImagePagesConfig[newPageNumber] // Đảm bảo trang mới không có config
    
    const cleanPagesContent = {
      ...pagesContent,
      [newPageNumber]: "" // Trang trắng hoàn toàn
    }
    
    console.log(`[ADD PAGE] 🧹 Tạo state sạch:`)
    console.log(`[ADD PAGE] 📊 cleanImagePagesConfig:`, Object.keys(cleanImagePagesConfig))
    console.log(`[ADD PAGE] 📄 cleanPagesContent:`, Object.keys(cleanPagesContent))
    
    // ✅ STEP 2: Cập nhật tất cả state cùng lúc
    setImagePagesConfig(cleanImagePagesConfig)
    setPagesContent(cleanPagesContent)
    setTotalPages(newPageNumber)
    setCurrentPage(newPageNumber)
    setEditorContent("") // Đảm bảo editor content cũng trắng
    
    // ✅ EMERGENCY FIX: Force re-render để đảm bảo UI cập nhật
    setTimeout(() => {
      console.log(`[ADD PAGE] 🚨 EMERGENCY CHECK: Kiểm tra UI render`)
      console.log(`[ADD PAGE] 📊 imagePagesConfig[${newPageNumber}]:`, imagePagesConfig[newPageNumber])
      console.log(`[ADD PAGE] 📄 pagesContent[${newPageNumber}]:`, pagesContent[newPageNumber])
      
      // Nếu vẫn có imagePagesConfig cho trang mới, xóa ngay
      if (imagePagesConfig[newPageNumber]) {
        console.log(`[ADD PAGE] 🚨 EMERGENCY: Vẫn có imagePagesConfig, xóa ngay!`)
        setImagePagesConfig(prev => {
          const emergency = { ...prev }
          delete emergency[newPageNumber]
          return emergency
        })
      }
    }, 100)
    
    console.log(`[ADD PAGE] ✅ Hoàn thành thêm trang trắng ${newPageNumber}`)
    
    // Note: Auto-save will handle saving automatically
  }

  // Hàm xóa trang
  const handleDeletePage = () => {
    if (totalPages <= 1) {
      alert("Không thể xóa trang cuối cùng!")
      return
    }
    setShowDeletePageModal(true)
  }

  // Xác nhận xóa trang
  // Helper functions for multiple page selection
  const togglePageSelection = (pageNum: number) => {
    // Không cho phép chọn trang 1 (trang mặc định)
    if (pageNum === 1) {
      return
    }
    
    setSelectedPagesToDelete(prev => {
      if (prev.includes(pageNum)) {
        return prev.filter(p => p !== pageNum)
      } else {
        return [...prev, pageNum]
      }
    })
  }

  const toggleSelectAll = () => {
    if (selectAllPages) {
      setSelectedPagesToDelete([])
      setSelectAllPages(false)
    } else {
      // Chọn tất cả trang NGOẠI TRỪ trang 1 (trang mặc định không được xóa)
      const allPages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(page => page !== 1)
      setSelectedPagesToDelete(allPages)
      setSelectAllPages(true)
    }
  }

  const confirmDeletePage = () => {
    const pagesToDelete = selectedPagesToDelete.length > 0 ? selectedPagesToDelete : (pageToDelete ? [pageToDelete] : [])
    
    if (pagesToDelete.length > 0 && totalPages > pagesToDelete.length) {
      const newPagesContent = { ...pagesContent }
      const newImagePagesConfig = { ...imagePagesConfig }
      
      // Xóa các trang đã chọn
      pagesToDelete.forEach(pageNum => {
        delete newPagesContent[pageNum]
        delete newImagePagesConfig[pageNum]
      })
      
      // Sắp xếp lại số trang
      const remainingPages = Object.keys(newPagesContent)
        .map(Number)
        .sort((a, b) => a - b)
      
      const reorderedContent: {[key: number]: string} = {}
      const reorderedImageConfig: {[key: number]: any} = {}
      
      remainingPages.forEach((oldPageNum, index) => {
        const newPageNum = index + 1
        reorderedContent[newPageNum] = newPagesContent[oldPageNum]
        if (imagePagesConfig[oldPageNum]) {
          reorderedImageConfig[newPageNum] = imagePagesConfig[oldPageNum]
        }
      })
      
      setPagesContent(reorderedContent)
      setImagePagesConfig(reorderedImageConfig)
      setTotalPages(totalPages - pagesToDelete.length)
      
      // Điều chỉnh trang hiện tại
      const newTotalPages = totalPages - pagesToDelete.length
      if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages)
      } else {
        // Nếu trang hiện tại bị xóa, chuyển về trang gần nhất
        const minDeletedPage = Math.min(...pagesToDelete)
        if (pagesToDelete.includes(currentPage)) {
          setCurrentPage(Math.min(minDeletedPage, newTotalPages))
        }
      }
      
      console.log(`[v0] Đã xóa ${pagesToDelete.length} trang:`, pagesToDelete)
    }
    
    // Reset states
    setShowDeletePageModal(false)
    setPageToDelete(null)
    setSelectedPagesToDelete([])
    setSelectAllPages(false)
  }

  // Handle image slot click
  const handleImageSlotClick = (pageNumber: number, slotIndex: number) => {
    console.log(`🖼️ Image slot clicked: page ${pageNumber}, slot ${slotIndex}`)
    
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.style.cssText = 'position: absolute; left: -9999px; top: -9999px; opacity: 0; width: 1px; height: 1px; overflow: hidden;'
    
    const cleanup = () => {
      try {
        if (input && input.parentNode) {
          input.parentNode.removeChild(input)
          console.log('✅ Input element cleaned up')
        }
      } catch (e) {
        console.warn('Input cleanup warning:', e)
      }
    }
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string
          
          // Update image in the specific slot
          setImagePagesConfig(prev => {
            const updated = { ...prev }
            if (updated[pageNumber]) {
              const newImages = [...updated[pageNumber].images]
              newImages[slotIndex] = imageUrl
              updated[pageNumber] = {
                ...updated[pageNumber],
                images: newImages
              }
            }
            return updated
          })
          
          // Regenerate page content
          const pageConfig = imagePagesConfig[pageNumber]
          if (pageConfig) {
            const updatedConfig = {
              ...pageConfig,
              images: [...pageConfig.images]
            }
            updatedConfig.images[slotIndex] = imageUrl
            
            const newHTML = generateImagePageHTML({
              pageNumber,
              ...updatedConfig
            })
            
            setPagesContent(prev => ({
              ...prev,
              [pageNumber]: newHTML
            }))
            
            // If currently viewing this page, update editor content
            if (currentPage === pageNumber) {
              setEditorContent(newHTML)
            }
          }
          
          toast({
            title: "Thành công",
            description: `Đã thêm ảnh vào vị trí ${slotIndex + 1} trang ${pageNumber}`,
          })
          
          // Cleanup after successful upload
          cleanup()
        }
        
        reader.onerror = () => {
          toast({
            title: "Lỗi",
            description: "Không thể đọc file ảnh",
            variant: "destructive"
          })
          cleanup()
        }
        
        reader.readAsDataURL(file)
      } else {
        // Cleanup if no file selected
        cleanup()
      }
    }
    
    // Cleanup on cancel (when user closes file dialog without selecting)
    input.oncancel = cleanup
    
    // Add to DOM temporarily and trigger click
    document.body.appendChild(input)
    input.click()
    
    // Fallback cleanup after 30 seconds
    setTimeout(cleanup, 30000)
  }

  // Clean up all file input elements and red debug elements
  useEffect(() => {
    const cleanupAllInputs = () => {
      // Remove ALL file input elements from DOM
      const fileInputs = document.querySelectorAll('input[type="file"]')
      fileInputs.forEach(input => {
        try {
          if (input.parentNode) {
            input.parentNode.removeChild(input)
            console.log('🗑️ Removed stray file input')
          }
        } catch (e) {
          // Ignore errors
        }
      })
      
      // Remove any red background elements (target likely suspects)
      const suspiciousSelectors = [
        'div[style*="position: fixed"]',
        'div[style*="position: absolute"]',
        'div[style*="z-index"]',
        'div[style*="bottom"]',
        'div[style*="right"]'
      ]
      
      suspiciousSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector)
          elements.forEach(el => {
            const style = window.getComputedStyle(el)
            const bgColor = style.backgroundColor
            
            if (
              bgColor.includes('rgb(255, 0, 0)') ||
              bgColor.includes('rgba(255, 0, 0') ||
              bgColor === 'red'
            ) {
              console.log('🚫 Removing red element:', el.tagName, el.className)
              if (el.parentNode) {
                el.parentNode.removeChild(el)
              }
            }
          })
        } catch (e) {
          // Ignore errors
        }
      })
    }

    // Run immediately
    cleanupAllInputs()
    
    // Run periodically to catch new elements
    const interval = setInterval(cleanupAllInputs, 3000)
    
    // Run on page visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(cleanupAllInputs, 100)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Setup TinyMCE event handlers and inject click functionality
  useEffect(() => {
    const setupTinyMCEHandlers = () => {
      if (typeof window !== 'undefined' && (window as any).tinymce) {
        const editor = (window as any).tinymce.activeEditor
        if (editor) {
          // Inject global function into editor window
          const editorWindow = editor.getWin()
          const editorDoc = editor.getDoc()
          
          if (editorWindow && editorDoc) {
            // Create global function in editor window
            editorWindow.handleImageSlotClick = (pageNumber: number, slotIndex: number) => {
              console.log("🖼️ Editor window click:", pageNumber, slotIndex)
              // Call parent window function
              if (window.parent && window.parent !== window) {
                window.parent.postMessage({
                  type: 'imageSlotClick',
                  pageNumber,
                  slotIndex
                }, '*')
              } else {
                handleImageSlotClick(pageNumber, slotIndex)
              }
            }
            
            console.log("🔧 Global function injected into editor window")
          }
          
          // Also setup click event listener for table cells and images
          editor.on('click', (e: any) => {
            const target = e.target
            console.log("🖼️ TinyMCE click detected on:", target.tagName, target.dataset, target.className)
            
            // Check if clicked on image inside table cell
            if (target && target.tagName === 'IMG' && target.parentElement && target.parentElement.tagName === 'TD') {
              const cell = target.parentElement
              if (cell.dataset && cell.dataset.slot) {
                const pageNumber = parseInt(cell.dataset.page || '1')
                const slotIndex = parseInt(cell.dataset.slot || '0')
                console.log("🖼️ Image click event:", pageNumber, slotIndex)
                handleImageSlotClick(pageNumber, slotIndex)
                e.preventDefault()
                e.stopPropagation()
                return false
              }
            }
            
            // Check if clicked on table cell with data-slot
            if (target && target.tagName === 'TD' && target.dataset && target.dataset.slot) {
              const pageNumber = parseInt(target.dataset.page || '1')
              const slotIndex = parseInt(target.dataset.slot || '0')
              console.log("🖼️ Table cell click event:", pageNumber, slotIndex)
              handleImageSlotClick(pageNumber, slotIndex)
              e.preventDefault()
              e.stopPropagation()
              return false
            }
            
            // Also check parent elements in case click is on inner div
            let parent = target.parentElement
            while (parent && parent.tagName !== 'BODY') {
              if (parent.tagName === 'TD' && parent.dataset && parent.dataset.slot) {
                const pageNumber = parseInt(parent.dataset.page || '1')
                const slotIndex = parseInt(parent.dataset.slot || '0')
                console.log("🖼️ Parent table cell click:", pageNumber, slotIndex)
                handleImageSlotClick(pageNumber, slotIndex)
                e.preventDefault()
                e.stopPropagation()
                return false
              }
              parent = parent.parentElement
            }
          })
          
          console.log("🔧 TinyMCE handlers attached")
        }
      }
    }
    
    // Listen for messages from editor iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'imageSlotClick') {
        console.log("🖼️ Received imageSlotClick message:", event.data)
        handleImageSlotClick(event.data.pageNumber, event.data.slotIndex)
      } else if (event.data.type === 'imageSelected') {
        console.log("📁 Received imageSelected message:", event.data)
        // Handle the selected image
        const { pageNumber, slotIndex, imageData, fileName } = event.data
        
        console.log(`🖼️ Processing image: page ${pageNumber}, slot ${slotIndex}, data length: ${imageData?.length}`)
        
        // Update the image pages config
        setImagePagesConfig(prev => {
          const updated = { ...prev }
          if (!updated[pageNumber]) {
            updated[pageNumber] = {
              imagesPerPage: imagesPerPage,
              imagesPerRow: imagesPerRow,
              images: Array(imagesPerPage).fill(null),
              // ✅ THÊM CẤU HÌNH MẶC ĐỊNH
              marginLeft: marginLeft,
              marginRight: marginRight,
              marginBottom: marginBottom,
              marginHeader: marginHeader,
              imageAspectRatio: imageAspectRatio,
              centerHorizontally: centerHorizontally,
              headerContent: "Hoạt động xây dựng"
            }
          }
          updated[pageNumber].images[slotIndex] = imageData
          console.log(`📝 Updated config for page ${pageNumber}:`, updated[pageNumber])
          return updated
        })

        // Create updated page config for immediate use
        const updatedPageConfig = {
          imagesPerPage: imagesPerPage,
          imagesPerRow: imagesPerRow,
          images: Array(imagesPerPage).fill(null),
          // ✅ THÊM CẤU HÌNH MẶC ĐỊNH
          marginLeft: marginLeft,
          marginRight: marginRight,
          marginBottom: marginBottom,
          marginHeader: marginHeader,
          imageAspectRatio: imageAspectRatio,
          centerHorizontally: centerHorizontally
        }
        
        // Get existing images if any
        if (imagePagesConfig[pageNumber]) {
          updatedPageConfig.images = [...imagePagesConfig[pageNumber].images]
        }
        
        // Set the new image
        updatedPageConfig.images[slotIndex] = imageData
        
        console.log(`🔄 Generating new HTML for page ${pageNumber} with image at slot ${slotIndex}`)

        const newHTML = generateImagePageHTML({
          pageNumber,
          ...updatedPageConfig
        })

        console.log(`📄 New HTML generated, length: ${newHTML.length}`)
        
        // Debug: Log a snippet of the HTML to see if image is included
        const htmlSnippet = newHTML.substring(newHTML.indexOf('<img'), newHTML.indexOf('<img') + 200)
        console.log(`🔍 HTML snippet with image:`, htmlSnippet)

        setPagesContent(prev => ({
          ...prev,
          [pageNumber]: newHTML
        }))

        // If currently viewing this page, update editor content immediately
        if (currentPage === pageNumber) {
          console.log(`🔄 Updating editor content for current page ${pageNumber}`)
          setEditorContent(newHTML)
          
          // Force TinyMCE to refresh
          setTimeout(() => {
            if (editorRef.current) {
              console.log(`🔄 Force updating TinyMCE content`)
              editorRef.current.setContent(newHTML)
              
              // Debug: Check what TinyMCE actually has
              setTimeout(() => {
                const actualContent = editorRef.current.getContent()
                console.log(`🔍 TinyMCE actual content length:`, actualContent.length)
                const imgCount = (actualContent.match(/<img/g) || []).length
                console.log(`🔍 Number of <img> tags in TinyMCE:`, imgCount)
              }, 200)
            }
          }, 100)
        }

        toast({
          title: "Thành công",
          description: `Đã thêm ảnh "${fileName}" vào vị trí ${slotIndex + 1} trang ${pageNumber}`,
        })
      }
    }
    
    window.addEventListener('message', handleMessage)
    
    // Try to setup TinyMCE handlers multiple times
    const timer1 = setTimeout(setupTinyMCEHandlers, 500)
    const timer2 = setTimeout(setupTinyMCEHandlers, 1500)
    const timer3 = setTimeout(setupTinyMCEHandlers, 3000)
    
    console.log("🔧 TinyMCE setup scheduled multiple times")
    
    return () => {
      window.removeEventListener('message', handleMessage)
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      console.log("🔧 Event listeners removed")
    }
  }, []) // Remove dependency to prevent constant re-creation

  // Chuyển trang
  const handlePageChange = (pageNum: number) => {
    console.log(`🔄 Changing to page ${pageNum}`)
    console.log(`📋 Current pagesContent:`, pagesContent)
    
    // Lưu nội dung trang hiện tại (chỉ nếu không phải trang ảnh)
    if (!imagePagesConfig[currentPage]) {
      setPagesContent(prev => ({
        ...prev,
        [currentPage]: editorContent
      }))
    }
    
    // Chuyển sang trang mới
    setCurrentPage(pageNum)
    
    // Load content for new page
    if (imagePagesConfig[pageNum]) {
      // This is an image page, generate HTML
      const pageConfig = imagePagesConfig[pageNum]
      const html = generateImagePageHTML({
        pageNumber: pageNum,
        ...pageConfig
      })
      console.log(`🖼️ Loading image page ${pageNum} with HTML:`, html)
      setEditorContent(html)
    } else {
      // Regular text page
      const content = pagesContent[pageNum] || ""
      console.log(`📄 Loading text page ${pageNum} with content:`, content)
      setEditorContent(content)
    }
    
    // Thông báo nếu trang bị khóa
    if (lockedPages.includes(pageNum)) {
      const warningToast = toast({
        title: "Trang đã bị khóa",
        description: `Trang ${pageNum} đang ở chế độ chỉ đọc. Sử dụng chức năng "Mở khóa trang" để chỉnh sửa.`,
        variant: "destructive",
      })
      // Auto dismiss warning toast after 4 seconds
      setTimeout(() => warningToast.dismiss(), 4000)
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            .no-print, .sidebar, .toolbar, .navigation, .controls, .print-hide {
              display: none !important;
            }
            
            body {
              margin: 0;
              padding: 0;
              background: white !important;
              font-family: Arial, sans-serif;
              font-size: 12pt;
              line-height: 1.4;
              color: black !important;
            }
            
            .print-container {
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }
            
            .page-content {
              page-break-after: always;
              padding: 20mm;
              min-height: 250mm;
              background: white !important;
            }
            
            .page-content:last-child {
              page-break-after: auto;
            }
            
            .page-header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            
            .page-title {
              font-size: 18pt;
              font-weight: bold;
              margin-bottom: 5px;
              color: black !important;
            }
            
            .page-info {
              font-size: 12pt;
              color: #666 !important;
            }
            
            .editor-content {
              margin: 20px 0;
              min-height: 150px;
            }
            
            .image-grid {
              display: grid !important;
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 10px;
              margin: 20px 0;
            }
            
            .image-item {
              border: 1px solid #ddd;
              border-radius: 4px;
              overflow: hidden;
              page-break-inside: avoid;
            }
            
            .image-item img {
              width: 100%;
              height: auto;
              max-height: 80mm;
              object-fit: contain;
            }
            
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            @page {
              size: A4;
              margin: 15mm;
            }
            
            /* Print preview styles */
            .print-preview-content {
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            .print-page {
              width: 100% !important;
              margin: 0 !important;
              padding: 20mm !important;
              background: white !important;
              box-shadow: none !important;
              border: none !important;
              page-break-after: always;
            }
            
            .print-page:last-child {
              page-break-after: auto;
            }
          }
          
          @media screen {
            .print-only {
              display: none;
            }
          }
        `
      }} />
      
      <div className="min-h-screen bg-slate-100 flex print-container">
      <div className="w-80 bg-gradient-to-b from-teal-900 to-slate-900 flex flex-col text-white no-print sidebar">
        {/* Header */}
        <div className="p-4 border-b border-teal-700/30">
          <div className="flex items-center justify-between mb-2">
            <Link href="/construction-reports">
              <Button variant="ghost" size="sm" className="text-teal-200 hover:text-white hover:bg-teal-700/30 p-1">
                <ArrowLeft className="w-4 h-4" />
                {t("editor.back")}
              </Button>
            </Link>
            <span className="text-teal-200 text-sm">
              {t("editor.page")} {currentPage}/{totalPages}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{reportName}</h1>
            <span className="bg-yellow-500 text-yellow-900 px-2 py-1 rounded text-xs font-medium">
              {t("editor.group")}
            </span>
          </div>
        </div>

        <div className="p-4">
          <Button
            onClick={handleAddDiary}
            className="w-full bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 text-white font-medium shadow-lg mb-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("editor.add_diary")}
          </Button>
          

          <p className="text-xs text-teal-300 text-center mb-4">{t("editor.add_diary_desc")}</p>

          <Button
            onClick={handleShare}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-lg"
          >
            <Share2 className="w-4 h-4 mr-2" />
            {t("editor.share_report")}
          </Button>
        </div>

        <div className="px-4 pb-4">
          <h3 className="text-white font-medium text-sm mb-3">{t("editor.lock_unlock")}</h3>
          <div className="space-y-2">
            <Button
              onClick={handleLockAll}
              variant="ghost"
              className="w-full justify-start text-teal-200 hover:text-white hover:bg-teal-700/30 p-2"
            >
              <Lock className="w-4 h-4 mr-3" />
              {t("editor.lock_all")}
            </Button>
            <Button
              onClick={handleUnlockAll}
              variant="ghost"
              className="w-full justify-start text-teal-200 hover:text-white hover:bg-teal-700/30 p-2"
            >
              <Unlock className="w-4 h-4 mr-3" />
              {t("editor.unlock_all")}
            </Button>
          </div>
        </div>

        {/* Page Grid */}
        <div className="px-4 pb-4">
          <h3 className="text-white font-medium text-sm mb-3">{t("editor.page_navigation")}</h3>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <div
                key={pageNum}
                onClick={() => handlePageClick(pageNum)}
                className={`aspect-square border rounded cursor-pointer flex items-center justify-center text-xs font-medium transition-all ${
                  pageNum === currentPage
                    ? "border-cyan-400 bg-cyan-400/20 text-cyan-400"
                    : "border-teal-600 bg-teal-700/30 text-teal-200 hover:border-teal-500 hover:bg-teal-600/50"
                }`}
              >
                {pageNum}
              </div>
            ))}
          </div>
        </div>

        {/* Document Info */}
        <div className="mt-auto p-4 border-t border-teal-700/30">
          <h3 className="text-white font-medium text-sm mb-2">{t("editor.document_info")}</h3>
          <div className="space-y-1 text-xs text-teal-200">
            <p>
              {t("editor.total_pages")}: {totalPages} {t("editor.page").toLowerCase()}
            </p>
            <p>
              {t("editor.locked_pages")}: 0 {t("editor.page").toLowerCase()}
            </p>
            <p>{t("editor.updated")}: 14:43:53 26/8/2026</p>
          </div>
        </div>
      </div>

      {/* TINYMCE EDITOR MỚI - TÍCH HỢP HOÀN CHỈNH */}
      <div className="flex-1 flex flex-col print-container">
        {/* Thanh công cụ mới */}
        <div className="bg-blue-600 px-6 py-3 flex items-center gap-4 no-print toolbar">
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setShowAutoSaveDialog(true)} 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-blue-700"
            >
              <Clock className="w-4 h-4 mr-2" />
              Lưu tự động
            </Button>
            
            {/* Auto-save status indicator */}
            <div className="flex items-center gap-1 text-xs">
              {autoSaveStatus === "saving" && (
                <>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-yellow-200">Đang lưu...</span>
                </>
              )}
              {autoSaveStatus === "saved" && (
                <>
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span className="text-green-200">Đã lưu</span>
                </>
              )}
              {autoSaveStatus === "error" && (
                <>
                  <AlertCircle className="w-3 h-3 text-red-400" />
                  <span className="text-red-200">Lỗi</span>
                </>
              )}
              {autoSaveEnabled && autoSaveStatus === "idle" && (
                <>
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-200">Tự động: {autoSaveInterval}s</span>
                </>
              )}
            </div>
            
            {/* Manual save button */}
            <Button 
              onClick={() => handleSave(false)} 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-blue-700 ml-2"
            >
              <Save className="w-4 h-4 mr-1" />
              Lưu ngay
            </Button>
          </div>
          <Button onClick={handlePrint} variant="ghost" size="sm" className="text-white hover:bg-blue-700">
            <Printer className="w-4 h-4 mr-2" />
            In tài liệu
          </Button>
          


          {/* 4 nút quản lý file mới */}
          <div className="border-l border-blue-500 pl-4 ml-2">
            <Button onClick={handleSaveAsLibrary} variant="ghost" size="sm" className="text-white hover:bg-blue-700">
              <Archive className="w-4 h-4 mr-2" />
              Lưu làm thư viện
            </Button>
            <Button onClick={handleSaveWithName} variant="ghost" size="sm" className="text-white hover:bg-blue-700 ml-2">
              <Download className="w-4 h-4 mr-2" />
              Lưu với tên
            </Button>
            <Button onClick={handleOpenFile} variant="ghost" size="sm" className="text-white hover:bg-blue-700 ml-2">
              <Upload className="w-4 h-4 mr-2" />
              Mở
            </Button>
            <Button onClick={handleOpenLibrary} variant="ghost" size="sm" className="text-white hover:bg-blue-700 ml-2">
              <FolderOpen className="w-4 h-4 mr-2" />
              Mở thư viện
            </Button>
          </div>

          {/* Nút Quản lý file mới */}
          <div className="border-l border-blue-500 pl-4 ml-2">
            <Button onClick={() => setShowFileManagement(true)} variant="ghost" size="sm" className="text-white hover:bg-blue-700">
              <Settings className="w-4 h-4 mr-2" />
              Quản lý file
            </Button>
          </div>
          
          {/* Nút quản lý trang */}
          <div className="border-l border-blue-500 pl-4 ml-2">
            <Button onClick={handleAddPage} variant="ghost" size="sm" className="text-white hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Thêm trang
            </Button>
            <Button 
              onClick={handleDeletePage} 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-red-600 ml-2"
              disabled={totalPages <= 1}
            >
              <Minus className="w-4 h-4 mr-2" />
              Xóa trang
            </Button>
          </div>
          <div className="ml-auto text-white text-sm">
          </div>
        </div>

        {/* Editor chính */}
        <div className="flex-1">
            {(() => {
              // ✅ HARD CHECK: Kiểm tra nội dung trang để quyết định editor
              const pageContent = pagesContent[currentPage] || ""
              const isEmptyPage = pageContent.trim() === ""
              const hasImageConfig = !!imagePagesConfig[currentPage]
              
              console.log(`[RENDER] 🎨 Trang ${currentPage}:`)
              console.log(`[RENDER] 📄 pageContent length: ${pageContent.length}`)
              console.log(`[RENDER] 🔍 isEmptyPage: ${isEmptyPage}`)
              console.log(`[RENDER] 📊 hasImageConfig: ${hasImageConfig}`)
              console.log(`[RENDER] 🔍 imagePagesConfig[${currentPage}]:`, imagePagesConfig[currentPage])
              
              // ✅ NEW LOGIC: Ưu tiên ImageGridEditor khi có imagePagesConfig
              let shouldUseImageEditor = hasImageConfig
              
              // ✅ OVERRIDE: Chỉ dùng TinyMCE khi trang trống VÀ không có imagePagesConfig
              if (isEmptyPage && !hasImageConfig) {
                console.log(`[RENDER] 🛡️ SAFETY CHECK: Trang ${currentPage} trống và không có imagePagesConfig, dùng TinyMCE`)
                shouldUseImageEditor = false
              }
              
              // ✅ FINAL CHECK: Nếu có imagePagesConfig thì LUÔN dùng ImageGridEditor
              if (hasImageConfig) {
                console.log(`[RENDER] 🛡️ FINAL CHECK: Có imagePagesConfig, FORCE dùng ImageGridEditor`)
                shouldUseImageEditor = true
              }
              
              console.log(`[RENDER] 🎯 QUYẾT ĐỊNH CUỐI CÙNG: shouldUseImageEditor = ${shouldUseImageEditor}`)
              
              if (shouldUseImageEditor) {
                console.log(`[RENDER] 🖼️ → Hiển thị ImageGridEditor cho trang ${currentPage}`)
              } else {
                console.log(`[RENDER] 📝 → Hiển thị TinyMCE Editor cho trang ${currentPage}`)
              }
              
              return shouldUseImageEditor
            })() ? (
              /* Trang ảnh - Dùng Custom Image Grid với container A4 */
              <div className="a4-page-container page-content">
                {/* Header cho in */}
                <div className="print-only page-header">
                  <h1 className="page-title">{reportName}</h1>
                  
                </div>
                
                <div className="a4-page image-grid">
                  <ImageGridEditor
                pageNumber={currentPage}
                imagesPerPage={imagePagesConfig[currentPage].imagesPerPage}
                imagesPerRow={imagePagesConfig[currentPage].imagesPerRow}
                images={imagePagesConfig[currentPage].images}
                marginLeft={imagePagesConfig[currentPage].marginLeft || marginLeft}
                marginRight={imagePagesConfig[currentPage].marginRight || marginRight}
                marginBottom={imagePagesConfig[currentPage].marginBottom || marginBottom}
                marginHeader={imagePagesConfig[currentPage].marginHeader || marginHeader}
                aspectRatio={imagePagesConfig[currentPage].imageAspectRatio || imageAspectRatio}
                centerHorizontally={imagePagesConfig[currentPage].centerHorizontally || centerHorizontally}
                headerContent={imagePagesConfig[currentPage].headerContent || ""}
                onHeaderContentChange={(content) => {
                  console.log(`📝 Header content changed: page ${currentPage}`)
                  setImagePagesConfig(prev => ({
                    ...prev,
                    [currentPage]: {
                      ...prev[currentPage],
                      headerContent: content
                    }
                  }))
                }}
                onImageChange={(slotIndex, imageData) => {
                  console.log(`🖼️ Image changed: page ${currentPage}, slot ${slotIndex}`)
                  
                  // Update imagePagesConfig
                  setImagePagesConfig(prev => {
                    const updated = { ...prev }
                    if (!updated[currentPage]) {
                      updated[currentPage] = {
                        imagesPerPage: 4,
                        imagesPerRow: 2,
                        images: Array(4).fill(null),
                        // ✅ THÊM CẤU HÌNH MẶC ĐỊNH KHI TẠO MỚI
                        marginLeft: marginLeft,
                        marginRight: marginRight,
                        marginBottom: marginBottom,
                        marginHeader: marginHeader,
                        imageAspectRatio: imageAspectRatio,
                        centerHorizontally: centerHorizontally,
                        headerContent: "Hoạt động xây dựng"
                      }
                    }
                    updated[currentPage].images[slotIndex] = imageData
                    return updated
                  })
                }}
                readonly={lockedPages.includes(currentPage)}
                  />
                </div>
                
                {/* Số trang cho ImageGrid - ngoài container A4 */}
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 shadow-lg no-print">
                  <span className="text-sm font-medium text-gray-700">
                    
                  </span>
                </div>
              </div>
            ) : (
              /* Trang text - Dùng TinyMCE với container linh hoạt */
              <div className="p-4 bg-gray-50 page-content">
                {/* Header cho in */}
                <div className="print-only page-header">
                  <h1 className="page-title">{reportName}</h1>
                  
                </div>
                
                <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative editor-content">
                  <TinyMCENewEditor
                value={editorContent}
                onChange={setEditorContent}
                height={800}
                placeholder={`Nhập nội dung nhật ký thi công - Trang ${currentPage}`}
                readonly={lockedPages.includes(currentPage)}
                  />
                  
                  {/* Số trang cho TinyMCE */}
                  <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 shadow-lg no-print">
                    <span className="text-sm font-medium text-gray-700">
                      
                    </span>
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* Pagination - Nút số trang */}
        <div className="bg-white px-6 py-3 border-t border-gray-200 no-print pagination">
          <div className="flex justify-center items-center gap-2">
            <span className="text-sm text-gray-600 mr-4">Trang:</span>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
              const isLocked = lockedPages.includes(pageNum)
              const isImagePage = !!imagePagesConfig[pageNum]
              const isCurrent = pageNum === currentPage
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-8 h-8 rounded-full text-sm font-medium transition-all relative ${
                    isCurrent
                      ? isLocked 
                        ? "bg-red-600 text-white shadow-md" 
                        : isImagePage
                          ? "bg-green-600 text-white shadow-md"
                          : "bg-blue-600 text-white shadow-md"
                      : isLocked
                        ? "bg-red-100 text-red-700 hover:bg-red-200 hover:shadow-sm"
                        : isImagePage
                          ? "bg-green-100 text-green-700 hover:bg-green-200 hover:shadow-sm"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm"
                  }`}
                  title={
                    isLocked 
                      ? `Trang ${pageNum} (Đã khóa)` 
                      : isImagePage 
                        ? `Trang ${pageNum} (Trang ảnh)`
                        : `Trang ${pageNum}`
                  }
                >
                  {pageNum}
                  {isLocked && (
                    <Lock className="w-2 h-2 absolute -top-1 -right-1 text-red-600" />
                  )}
                  {isImagePage && !isLocked && (
                    <div className="w-2 h-2 absolute -top-1 -right-1 bg-green-500 rounded-full" />
                  )}
                </button>
              )
            })}
            <span className="text-sm text-gray-500 ml-4">
              Tổng: {totalPages} trang | Khóa: {lockedPages.length} trang | Ảnh: {Object.keys(imagePagesConfig).length} trang
            </span>
          </div>
        </div>

        {/* Thanh trạng thái */}
        <div className="bg-gray-100 px-6 py-2 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>📝 {reportName}</span>
            <span> | Cập nhật: {currentTime}</span>
          </div>
        </div>
      </div>

      {showLockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {lockAction === "lock" ? t("editor.lock.title") : t("editor.unlock.title")}
              </h3>
              <Button
                onClick={() => setShowLockModal(false)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="selectAll"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="selectAll" className="text-gray-700 font-medium">
                  {t("editor.lock.select_all")}
                </label>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">{t("editor.lock.select_specific")}</p>
                <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <label
                      key={pageNum}
                      className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPages.includes(pageNum)}
                        onChange={() => handlePageSelect(pageNum)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {t("editor.page")} {pageNum}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedPages.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                    {t("editor.lock.selected_count")
                      .replace("{count}", selectedPages.length.toString())
                      .replace("{pages}", selectedPages.join(", "))}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setShowLockModal(false)}
                  variant="outline"
                  className="flex-1 text-slate-900 hover:text-white"
                >
                  {t("editor.share.cancel")}
                </Button>
                <Button
                  onClick={handleLockUnlockSubmit}
                  className={`flex-1 ${
                    lockAction === "lock" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                  }`}
                  disabled={selectedPages.length === 0}
                >
                  {lockAction === "lock" ? (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      {t("editor.lock.lock_pages")}
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 mr-2" />
                      {t("editor.unlock.unlock_pages")}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">{t("editor.share.title")}</h3>
              <Button
                onClick={() => setShowShareModal(false)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="shareType"
                    value="specific"
                    checked={shareType === "specific"}
                    onChange={(e) => setShareType(e.target.value as "specific")}
                    className="text-blue-600"
                  />
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{t("editor.share.email_specific")}</span>
                </label>

                {shareType === "specific" && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="email"
                          placeholder={t("editor.share.email_placeholder")}
                          value={currentEmail}
                          onChange={handleEmailChange}
                          onKeyPress={(e) => e.key === "Enter" && handleAddEmail()}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            emailError ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
                      </div>
                      <Button
                        onClick={handleAddEmail}
                        disabled={!currentEmail.trim()}
                        className="bg-green-600 hover:bg-green-700 px-3"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {shareEmails.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">{t("editor.share.shared_with")}</p>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {shareEmails.map((email, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
                            >
                              <span className="text-sm text-gray-700">{email}</span>
                              <Button
                                onClick={() => handleRemoveEmail(email)}
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="shareType"
                    value="all"
                    checked={shareType === "all"}
                    onChange={(e) => setShareType(e.target.value as "all")}
                    className="text-blue-600"
                  />
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{t("editor.share.all_members")}</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={() => setShowShareModal(false)} variant="outline" className="flex-1">
                  {t("editor.share.cancel")}
                </Button>
                <Button
                  onClick={handleShareSubmit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={shareType === "specific" && shareEmails.length === 0}
                >
                  {t("editor.share.share")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {showPrintPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[90vw] h-[90vh] max-w-4xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Xem trước khi in</h3>
              <div className="flex gap-2">
                <Button onClick={handleActualPrint} className="bg-blue-600 hover:bg-blue-700">
                  <Printer className="w-4 h-4 mr-2" />
                  In tài liệu
                </Button>
                <Button onClick={() => setShowPrintPreview(false)} variant="outline">
                  Đóng
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4 bg-gray-100">
              <div className="print-preview-content">
                {/* Render tất cả các trang */}
                {Array.from({ length: totalPages }, (_, index) => {
                  const pageNum = index + 1
                  // Sử dụng nội dung hiện tại nếu đang ở trang hiện tại, nếu không thì dùng pagesContent
                  const pageContent = pageNum === currentPage ? (editorContent || "") : (pagesContent[pageNum] || "")
                  const hasImageConfig = imagePagesConfig[pageNum] && Object.keys(imagePagesConfig[pageNum]).length > 0
                  
                  return (
                    <div key={pageNum} className="print-page bg-white shadow-lg mb-4 mx-auto" style={{ width: '210mm', minHeight: '297mm', padding: '20mm' }}>
                      {/* Header cho mỗi trang */}
                      <div className="page-header mb-4 pb-2 border-b">
                        <h1 className="text-xl font-bold">{reportName}</h1>
                      </div>
                      
                      {/* Nội dung trang */}
                      <div className="page-content">
                        {hasImageConfig ? (
                          /* Trang ảnh - bao gồm cả text và ảnh */
                          <div>
                            {/* Hiển thị text nếu có */}
                            {imagePagesConfig[pageNum]?.headerContent?.trim() && (
                              <div style={{
                                marginBottom: '15mm',
                                padding: '5mm',
                                fontFamily: 'Arial, sans-serif',
                                fontSize: '12pt',
                                lineHeight: '1.4',
                                whiteSpace: 'pre-wrap',
                                backgroundColor: 'white'
                              }}>
                                {imagePagesConfig[pageNum].headerContent}
                              </div>
                            )}
                            
                            {/* Hiển thị grid ảnh */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, 70mm)',
                              gridTemplateRows: 'repeat(2, 70mm)',
                              gap: '5mm',
                              justifyContent: 'center',
                              alignItems: 'center',
                              justifyItems: 'center',
                              alignContent: 'center',
                              margin: '15mm 0'
                            }}>
                              {(imagePagesConfig[pageNum]?.images || []).map((imageUrl, slotIndex) => {
                                if (!imageUrl) return null
                                return (
                                  <div key={slotIndex} style={{
                                    width: '70mm',
                                    height: '70mm',
                                    border: '4px solid #10b981',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    backgroundColor: '#f0f9ff'
                                  }}>
                                    <img 
                                      src={imageUrl} 
                                      alt={`Ảnh ${slotIndex + 1}`}
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        borderRadius: '4px'
                                      }}
                                      onError={(e) => {
                                        console.error('Image load error:', imageUrl)
                                        e.currentTarget.style.display = 'none'
                                      }}
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ) : (
                          /* Trang text */
                          <div 
                            className="editor-content"
                            dangerouslySetInnerHTML={{ __html: pageContent }}
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Diary Dialog */}
      <Dialog open={showAddDiaryDialog} onOpenChange={(open) => {
        setShowAddDiaryDialog(open)
        if (!open) {
          // Reset states when dialog closes
          setUseTemplate(false)
          setSelectedDiaryId("")
          setUseImagePages(true)
        }
      }}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-cyan-400">Tạo thêm nhật ký</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* KHÔI PHỤC: Template Selection */}
            <div className="border border-slate-600 rounded-lg p-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="use-template"
                  checked={useTemplate}
                  onCheckedChange={setUseTemplate}
                />
                <Label htmlFor="use-template" className="text-sm font-medium">
                  Sử dụng nhật ký đã tạo làm mẫu
                </Label>
              </div>

              {useTemplate && (
                <div>
                  <Label htmlFor="template-select" className="text-sm font-medium">
                    Chọn nhật ký làm mẫu
                  </Label>
                  <Select value={selectedDiaryId} onValueChange={setSelectedDiaryId}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Chọn nhật ký..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {existingDiaries.map((diary) => (
                        <SelectItem key={diary.id} value={diary.id} className="text-white hover:bg-slate-600">
                          <div className="flex items-center gap-2">
                            <span>{diary.title}</span>
                            {diary.isLibrary && (
                              <span className="text-xs bg-blue-500 text-white px-1 rounded">Thư viện</span>
                            )}
                            <span className="text-gray-400">({diary.totalPages || 1} trang)</span>
                          </div>
                        </SelectItem>
                      ))}
                      {existingDiaries.length === 0 && (
                        <SelectItem value="no-diaries" disabled className="text-gray-400">
                          Không có template nào trong thư viện
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* KHỐI 2: Margin Settings */}
            <div className="border border-slate-600 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-medium text-cyan-400">⚙️ Cài Đặt Margin (mm)</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="margin-left" className="text-sm font-medium">
                    Margin trái
                  </Label>
                  <Input
                    id="margin-left"
                    type="number"
                    min="5"
                    max="50"
                    step="1"
                    value={marginLeft}
                    onChange={(e) => {
                      setMarginLeft(Number(e.target.value))
                      setTimeout(() => saveImageSettings(), 100)
                    }}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="margin-right" className="text-sm font-medium">
                    Margin phải
                  </Label>
                  <Input
                    id="margin-right"
                    type="number"
                    min="5"
                    max="50"
                    step="1"
                    value={marginRight}
                    onChange={(e) => {
                      setMarginRight(Number(e.target.value))
                      setTimeout(() => saveImageSettings(), 100)
                    }}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="margin-bottom" className="text-sm font-medium">
                    Margin đáy
                  </Label>
                  <Input
                    id="margin-bottom"
                    type="number"
                    min="5"
                    max="50"
                    step="1"
                    value={marginBottom}
                    onChange={(e) => {
                      setMarginBottom(Number(e.target.value))
                      setTimeout(() => saveImageSettings(), 100)
                    }}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="margin-header" className="text-sm font-medium">
                    Margin header
                  </Label>
                  <Input
                    id="margin-header"
                    type="number"
                    min="20"
                    max="100"
                    step="1"
                    value={marginHeader}
                    onChange={(e) => {
                      setMarginHeader(Number(e.target.value))
                      setTimeout(() => saveImageSettings(), 100)
                    }}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              
              <p className="text-xs text-slate-400">
                💡 Margin header: Khoảng cách từ đỉnh giấy đến khung ảnh đầu tiên
              </p>
              
              {/* THÊM: Checkbox căn giữa theo chiều ngang */}
              <div className="flex items-center space-x-2 pt-2 border-t border-slate-600">
                <input
                  type="checkbox"
                  id="center-horizontally"
                  checked={centerHorizontally}
                  onChange={(e) => {
                    console.log('🎯 CENTER CHECKBOX CHANGED:', e.target.checked)
                    setCenterHorizontally(e.target.checked)
                    // Lưu settings sau khi thay đổi
                    setTimeout(() => saveImageSettings(), 100)
                  }}
                  className="w-4 h-4 text-cyan-400 bg-slate-700 border-slate-600 rounded focus:ring-cyan-400 focus:ring-2"
                />
                <Label htmlFor="center-horizontally" className="text-sm font-medium text-cyan-400">
                  🎯 Luôn căn giữa theo chiều ngang
                </Label>
              </div>
              <p className="text-xs text-slate-400 ml-6">
                ✅ Khung ảnh sẽ căn giữa, 2 bên thừa khoảng trống bằng nhau
              </p>
            </div>

            {/* KHỐI 3: Image Pages Configuration */}
            <div className="border border-slate-600 rounded-lg p-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="use-image-pages" 
                  checked={useImagePages} 
                  onCheckedChange={setUseImagePages}
                  disabled={useTemplate}
                />
                <Label htmlFor="use-image-pages" className={`text-sm font-medium ${useTemplate ? 'text-gray-400' : ''}`}>
                  Sử dụng trang chứa ảnh
                </Label>
              </div>
              
              {useTemplate && (
                <p className="text-xs text-yellow-400">
                  ⚠️ Tắt khi sử dụng mẫu - cấu hình ảnh sẽ được sao chép từ nhật ký mẫu
                </p>
              )}

              {/* Image Configuration */}
              {useImagePages && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="image-pages" className="text-sm font-medium">
                        Số trang ảnh
                      </Label>
                      <Input
                        id="image-pages"
                        type="number"
                        min="1"
                        max="10"
                        value={imagePages}
                        onChange={(e) => setImagePages(Number(e.target.value))}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="images-per-page" className="text-sm font-medium">
                        Ảnh/trang
                      </Label>
                      <Input
                        id="images-per-page"
                        type="number"
                        min="1"
                        max="20"
                        step="1"
                        value={imagesPerPage}
                        onChange={(e) => {
                          const value = Number(e.target.value)
                          
                          // STRICT VALIDATION - Không cho phép vượt quá giới hạn
                          if (value > 20) {
                            toast({
                              title: "❌ Vượt quá giới hạn",
                              description: "Tối đa 20 ảnh trên 1 trang. Vui lòng nhập số từ 1-20.",
                              variant: "destructive",
                            })
                            return // KHÔNG cập nhật state
                          }
                          
                          if (value < 1) {
                            toast({
                              title: "❌ Giá trị không hợp lệ",
                              description: "Số ảnh phải lớn hơn 0.",
                              variant: "destructive",
                            })
                            return // KHÔNG cập nhật state
                          }
                          
                          // Cập nhật state chỉ khi hợp lệ
                          setImagesPerPage(value)
                          
                          // Sử dụng hàm tính toán thông minh
                          const calculation = calculateGridLayout({
                            imagesPerPage: value,
                            imagesPerRow: imagesPerRow,
                            marginLeft,
                            marginRight,
                            marginBottom,
                            marginHeader,
                            aspectRatio: imageAspectRatio,
                            centerHorizontally
                          })
                          
                          // Hiển thị lỗi nếu có
                          if (calculation.errors.length > 0) {
                            toast({
                              title: "❌ Lỗi layout",
                              description: calculation.errors[0],
                              variant: "destructive",
                            })
                          }
                          
                          // Hiển thị cảnh báo nếu có
                          if (calculation.warnings.length > 0) {
                            toast({
                              title: "⚠️ Cảnh báo", 
                              description: calculation.warnings[0],
                              variant: "default",
                            })
                          }
                        }}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>

                  {/* Layout Configuration */}
                  <div>
                    <Label htmlFor="images-per-row" className="text-sm font-medium">
                      Số khung theo chiều ngang khổ giấy
                    </Label>
                    <Select value={imagesPerRow.toString()} onValueChange={(value) => {
                      const newImagesPerRow = Number(value)
                      
                      // STRICT VALIDATION - Không cho phép vượt quá 4 cột
                      if (newImagesPerRow > 4) {
                        toast({
                          title: "❌ Vượt quá giới hạn",
                          description: "Tối đa 4 khung theo chiều ngang. Vui lòng chọn từ 1-4.",
                          variant: "destructive",
                        })
                        return // KHÔNG cập nhật state
                      }
                      
                      // Sử dụng hàm tính toán thông minh
                      const calculation = calculateGridLayout({
                        imagesPerPage: imagesPerPage,
                        imagesPerRow: newImagesPerRow,
                        marginLeft,
                        marginRight,
                        marginBottom,
                        marginHeader,
                        aspectRatio: imageAspectRatio,
                        centerHorizontally
                      })
                      
                      // Chỉ cập nhật state khi hợp lệ
                      if (calculation.errors.length === 0) {
                        setImagesPerRow(newImagesPerRow)
                      }
                      
                      // Hiển thị lỗi nếu có
                      if (calculation.errors.length > 0) {
                        toast({
                          title: "❌ Lỗi layout",
                          description: calculation.errors[0],
                          variant: "destructive",
                        })
                      }
                      
                      // Hiển thị cảnh báo nếu có
                      if (calculation.warnings.length > 0) {
                        toast({
                          title: "⚠️ Cảnh báo",
                          description: calculation.warnings[0],
                          variant: "default",
                        })
                      }
                    }}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Chọn số khung ngang..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="1">1 khung/hàng</SelectItem>
                        <SelectItem value="2">2 khung/hàng</SelectItem>
                        <SelectItem value="3">3 khung/hàng</SelectItem>
                        <SelectItem value="4">4 khung/hàng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Aspect Ratio Selector */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      📐 Tỷ lệ ảnh
                    </label>
                    <select
                      value={imageAspectRatio}
                      onChange={(e) => {
                        setImageAspectRatio(e.target.value)
                        setTimeout(() => saveImageSettings(), 100)
                      }}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <optgroup label="🌟 Khuyến nghị">
                        {getRecommendedAspectRatios().map((ratio) => (
                          <option key={ratio.value} value={ratio.value}>
                            {ratio.label}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="📐 Tất cả tỷ lệ">
                        {ASPECT_RATIOS.map((ratio) => (
                          <option key={ratio.value} value={ratio.value}>
                            {ratio.label} - {ratio.description}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    <p className="text-xs text-slate-400 mt-1">
                      💡 Tỷ lệ này sẽ áp dụng cho tất cả khung ảnh trong nhật ký
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setShowAddDiaryDialog(false)
                  setUseTemplate(false)
                  setSelectedDiaryId("")
                  setUseImagePages(true)
                }}
                variant="outline"
                className="flex-1 border-slate-600 text-black font-bold bg-white hover:bg-gray-100"
              >
                Hủy
              </Button>
              <Button
                onClick={handleCreateDiary}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                disabled={useTemplate && !selectedDiaryId}
              >
                <Plus className="w-4 h-4 mr-2" />
                {useTemplate ? 'Sao chép mẫu' : 'Tạo nhật ký'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal xóa trang */}
      {showDeletePageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px] max-w-[90vw]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Xóa trang
              </h3>
              <Button
                onClick={() => {
                  setShowDeletePageModal(false)
                  setPageToDelete(null)
                  setSelectedPagesToDelete([])
                  setSelectAllPages(false)
                }}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Header với thông tin và nút chọn tất cả */}
              <div className="flex items-center justify-between">
                <p className="text-gray-600">
                  Chọn trang muốn xóa: ({selectedPagesToDelete.length}/{totalPages - 1})
                </p>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="select-all"
                    checked={selectAllPages}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <label htmlFor="select-all" className="text-sm text-gray-700 cursor-pointer">
                    Chọn tất cả
                  </label>
                </div>
              </div>
              
              {/* Thông báo về trang 1 */}
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-blue-800 text-sm">
                  ℹ️ Trang 1 là trang mặc định và không thể xóa.
                </p>
              </div>
              
              {/* Grid các trang */}
              <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto border rounded p-3 bg-gray-50">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  const isPage1 = pageNum === 1
                  return (
                    <div key={pageNum} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`page-${pageNum}`}
                        checked={selectedPagesToDelete.includes(pageNum)}
                        onChange={() => togglePageSelection(pageNum)}
                        disabled={isPage1}
                        className={`w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 ${
                          isPage1 ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      />
                      <label 
                        htmlFor={`page-${pageNum}`}
                        className={`flex-1 text-center py-2 px-3 rounded border text-sm font-medium transition-all ${
                          isPage1 
                            ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                            : selectedPagesToDelete.includes(pageNum)
                              ? "border-red-500 bg-red-50 text-red-600 cursor-pointer"
                              : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 cursor-pointer"
                        }`}
                    >
                      {pageNum}
                      {isPage1 && <span className="text-xs block text-gray-400">(Mặc định)</span>}
                    </label>
                  </div>
                  )
                })}
              </div>

              {/* Thông báo cảnh báo */}
              {selectedPagesToDelete.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ Bạn sắp xóa {selectedPagesToDelete.length} trang: {selectedPagesToDelete.sort((a, b) => a - b).join(', ')}. 
                    Nội dung của các trang này sẽ bị mất vĩnh viễn.
                  </p>
                </div>
              )}

              {/* Chế độ xóa nhanh từng trang */}
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-2">Hoặc chọn nhanh một trang:</p>
                <div className="grid grid-cols-8 gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    const isPage1 = pageNum === 1
                    return (
                      <button
                        key={pageNum}
                        onClick={() => {
                          if (!isPage1) {
                            setSelectedPagesToDelete([pageNum])
                            setSelectAllPages(false)
                          }
                        }}
                        disabled={isPage1}
                        className={`w-8 h-8 rounded border text-xs font-medium transition-all ${
                          isPage1
                            ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                            : selectedPagesToDelete.length === 1 && selectedPagesToDelete[0] === pageNum
                              ? "border-red-500 bg-red-50 text-red-600"
                              : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => {
                  setShowDeletePageModal(false)
                  setPageToDelete(null)
                  setSelectedPagesToDelete([])
                  setSelectAllPages(false)
                }}
                variant="outline"
                className="flex-1 text-black font-bold bg-white hover:bg-gray-100"
              >
                Hủy
              </Button>
              <Button
                onClick={confirmDeletePage}
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={selectedPagesToDelete.length === 0}
              >
                <Minus className="w-4 h-4 mr-2" />
                Xóa {selectedPagesToDelete.length > 0 ? `${selectedPagesToDelete.length} trang` : 'trang'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Lưu làm thư viện */}
      {showSaveAsLibraryDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4">Lưu làm thư viện</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="libraryFileName">Tên file</Label>
                <Input
                  id="libraryFileName"
                  value={fileName}
                  onChange={(e) => {
                    setFileName(e.target.value)
                    setFileNameError("")
                  }}
                  placeholder="Nhập tên file..."
                  className={fileNameError ? "border-red-500" : ""}
                />
                {fileNameError && (
                  <p className="text-red-500 text-sm mt-1">{fileNameError}</p>
                )}
              </div>
              <div className="text-sm text-gray-600">
                <p>File sẽ được lưu vào thư viện với tất cả nội dung và định dạng hiện tại.</p>
                <p className="mt-1">Tổng số trang: {totalPages}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowSaveAsLibraryDialog(false)}
                className="flex-1 text-black font-semibold hover:text-black"
              >
                Hủy
              </Button>
              <Button
                onClick={saveFileToLibrary}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Archive className="w-4 h-4 mr-2" />
                Lưu vào thư viện
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Lưu với tên */}
      {showSaveWithNameDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4">Lưu với tên</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="namedFileName">Tên file</Label>
                <Input
                  id="namedFileName"
                  value={fileName}
                  onChange={(e) => {
                    setFileName(e.target.value)
                    setFileNameError("")
                  }}
                  placeholder="Nhập tên file..."
                  className={fileNameError ? "border-red-500" : ""}
                />
                {fileNameError && (
                  <p className="text-red-500 text-sm mt-1">{fileNameError}</p>
                )}
              </div>
              <div className="text-sm text-gray-600">
                <p>File sẽ được lưu với tên tùy chỉnh, giữ nguyên định dạng và nội dung.</p>
                <p className="mt-1">Tổng số trang: {totalPages}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowSaveWithNameDialog(false)}
                className="flex-1 text-black font-semibold hover:text-black"
              >
                Hủy
              </Button>
              <Button
                onClick={saveFileWithName}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Lưu file
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Mở file */}
      {showOpenFileDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] max-w-[90vw] max-h-[80vh] overflow-hidden">
            <h3 className="text-lg font-semibold mb-4">Mở file đã lưu</h3>
            <div className="space-y-4">
              {savedFiles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Chưa có file nào được lưu</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {savedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => openFile(file)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{file.name}</h4>
                          <p className="text-sm text-gray-600">
                            {file.totalPages} trang • {new Date(file.createdAt).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                        <Upload className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowOpenFileDialog(false)}
                className="flex-1 text-black font-semibold hover:text-black"
              >
                Hủy
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Mở thư viện */}
      {showOpenLibraryDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] max-w-[90vw] max-h-[80vh] overflow-hidden">
            <h3 className="text-lg font-semibold mb-4">Mở từ thư viện</h3>
            <div className="space-y-4">
              {libraryFiles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Thư viện trống</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {libraryFiles.map((file) => (
                    <div
                      key={file.id}
                      className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => openFile(file)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{file.name}</h4>
                          <p className="text-sm text-gray-600">
                            {file.totalPages} trang • {new Date(file.createdAt).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                        <FolderOpen className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowOpenLibraryDialog(false)}
                className="flex-1 text-black font-semibold hover:text-black"
              >
                Hủy
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* File Management Dialog */}
      <FileManagement 
        isOpen={showFileManagement} 
        onClose={() => setShowFileManagement(false)} 
      />

      {/* Auto-save Settings Dialog */}
      {showAutoSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Cài đặt lưu tự động
            </h3>
            
            <div className="space-y-4">
              {/* Enable/Disable Auto-save */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Bật lưu tự động</Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Tự động lưu nội dung theo khoảng thời gian đã đặt
                  </p>
                </div>
                <Checkbox
                  checked={autoSaveEnabled}
                  onCheckedChange={handleAutoSaveToggle}
                />
              </div>

              {/* Auto-save Interval */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Khoảng thời gian lưu (giây)
                </Label>
                <Select
                  value={autoSaveInterval.toString()}
                  onValueChange={(value) => handleAutoSaveIntervalChange(parseInt(value))}
                  disabled={!autoSaveEnabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 giây</SelectItem>
                    <SelectItem value="15">15 giây</SelectItem>
                    <SelectItem value="30">30 giây</SelectItem>
                    <SelectItem value="60">1 phút</SelectItem>
                    <SelectItem value="120">2 phút</SelectItem>
                    <SelectItem value="300">5 phút</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Information */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Trạng thái:</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      autoSaveEnabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {autoSaveEnabled ? 'Đang hoạt động' : 'Tắt'}
                    </span>
                  </div>
                  
                  {lastAutoSave && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Lưu lần cuối:</span>
                      <span className="text-xs text-gray-500">
                        {lastAutoSave.toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-yellow-800">
                    <p className="font-medium mb-1">Lưu ý:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Lưu tự động chỉ hoạt động khi có nội dung</li>
                      <li>• Dữ liệu được lưu vào bộ nhớ trình duyệt</li>
                      <li>• Khi chuyển trang, nội dung sẽ được lưu tự động</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAutoSaveDialog(false)}
                className="flex-1"
              >
                Đóng
              </Button>
              <Button
                onClick={() => {
                  handleSave(false)
                  setShowAutoSaveDialog(false)
                }}
                className="flex-1"
              >
                Lưu ngay & Đóng
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TOASTER COMPLETELY DISABLED to prevent red notification boxes */}
      {/* <Toaster /> */}
    </div>
    </>
  )
}
