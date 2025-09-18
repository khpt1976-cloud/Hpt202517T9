"use client"

import { useState, useRef } from 'react'
import { useToast } from "@/hooks/use-toast"
import { calculateGridLayout } from "@/utils/grid-calculator"


interface ImageGridEditorProps {
  pageNumber: number
  imagesPerPage: number
  imagesPerRow: number
  images: (string | null)[]
  onImageChange: (slotIndex: number, imageData: string) => void
  readonly?: boolean
  // Thêm props để có thể chỉnh sửa text
  mainTitle?: string
  subTitle?: string
  onTitleChange?: (mainTitle: string, subTitle: string) => void
  // THÊM: Text editor props
  headerContent?: string
  onHeaderContentChange?: (content: string) => void
  // THÊM: Margin props
  marginLeft?: number
  marginRight?: number
  marginBottom?: number
  marginHeader?: number
  // THÊM: Aspect ratio prop
  aspectRatio?: string
  // THÊM: Center horizontally prop
  centerHorizontally?: boolean
}

export default function ImageGridEditor({
  pageNumber,
  imagesPerPage,
  imagesPerRow,
  images,
  onImageChange,
  readonly = false,
  mainTitle = "Nhật ký thi công",
  subTitle = "Hình ảnh thi công",
  onTitleChange,
  // NHẬN TEXT EDITOR PROPS
  headerContent = "",
  onHeaderContentChange,
  // NHẬN MARGIN PROPS VỚI GIÁ TRỊ MẶC ĐỊNH
  marginLeft = 10,
  marginRight = 10,
  marginBottom = 10,
  marginHeader = 45,
  // NHẬN ASPECT RATIO PROP
  aspectRatio = "4:3",
  // NHẬN CENTER HORIZONTALLY PROP
  centerHorizontally = false
}: ImageGridEditorProps) {
  const { toast } = useToast()
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [loadingSlots, setLoadingSlots] = useState<Set<number>>(new Set())
  
  // State để quản lý việc chỉnh sửa text
  const [editableMainTitle, setEditableMainTitle] = useState(mainTitle)
  const [editableSubTitle, setEditableSubTitle] = useState(subTitle)
  const [isEditingMain, setIsEditingMain] = useState(false)
  const [isEditingSub, setIsEditingSub] = useState(false)

  // TÍNH TOÁN VỚI MARGIN TÙY CHỈNH VÀ CENTER HORIZONTALLY
  const gridCalculation = calculateGridLayout({
    imagesPerPage,
    imagesPerRow,
    marginLeft,
    marginRight,
    marginBottom,
    marginHeader,
    aspectRatio,
    centerHorizontally
  })

  // Extract calculated values
  const {
    cellWidth: finalCellWidth,
    cellHeight: finalCellHeight,
    rows,
    totalGridWidth,
    totalGridHeight,
    isValid,
    warnings,
    errors,
    margins: calculatedMargins
  } = gridCalculation
  
  // Sử dụng margins từ calculation (có thể đã được điều chỉnh để căn giữa)
  const effectiveMarginLeft = calculatedMargins.left
  const effectiveMarginRight = calculatedMargins.right

  const gapSize = 5 // mm
  const availableWidth = 180 // mm - conservative
  const availableHeight = 200 // mm - conservative

  // Hàm xử lý việc chỉnh sửa text
  const handleMainTitleSave = () => {
    setIsEditingMain(false)
    if (onTitleChange) {
      onTitleChange(editableMainTitle, editableSubTitle)
    }
  }

  const handleSubTitleSave = () => {
    setIsEditingSub(false)
    if (onTitleChange) {
      onTitleChange(editableMainTitle, editableSubTitle)
    }
  }

  const handleMainTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleMainTitleSave()
    }
    if (e.key === 'Escape') {
      setEditableMainTitle(mainTitle)
      setIsEditingMain(false)
    }
  }

  const handleSubTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubTitleSave()
    }
    if (e.key === 'Escape') {
      setEditableSubTitle(subTitle)
      setIsEditingSub(false)
    }
  }

  const handleImageSlotClick = async (slotIndex: number) => {
    console.log(`🖼️ Image slot ${slotIndex} clicked on page ${pageNumber}, readonly: ${readonly}`)
    
    if (readonly) {
      console.log(`❌ Cannot click - page is readonly`)
      return
    }
    
    console.log(`✅ Processing click for slot ${slotIndex}`)
    
    // Create file input if not exists
    if (!fileInputRefs.current[slotIndex]) {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.style.display = 'none'
      document.body.appendChild(input)
      fileInputRefs.current[slotIndex] = input
    }

    const input = fileInputRefs.current[slotIndex]
    if (!input) return

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      console.log('📁 File selected:', file.name, 'Size:', file.size, 'Type:', file.type)

      // Set loading state
      setLoadingSlots(prev => new Set(prev).add(slotIndex))

      try {
        // Validate file
        if (!file.type.startsWith('image/')) {
          throw new Error("Vui lòng chọn file ảnh (JPG, PNG, GIF, etc.)")
        }

        if (file.size > 10 * 1024 * 1024) {
          throw new Error("File ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 10MB.")
        }

      // CROP ẢNH THEO TỶ LỆ ĐƯỢC CHỌN
      const cropImageToAspectRatio = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const img = new Image()
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          if (!ctx) {
            reject('Cannot create canvas context')
            return
          }
          
          img.onload = () => {
            // Parse aspect ratio
            const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number)
            const targetAspectRatio = widthRatio / heightRatio
            
            // Calculate crop dimensions
            let cropWidth: number
            let cropHeight: number
            
            const imageAspectRatio = img.width / img.height
            
            if (imageAspectRatio > targetAspectRatio) {
              // Image is wider than target - crop width
              cropHeight = img.height
              cropWidth = cropHeight * targetAspectRatio
            } else {
              // Image is taller than target - crop height
              cropWidth = img.width
              cropHeight = cropWidth / targetAspectRatio
            }
            
            // Calculate crop position (center crop)
            const cropX = (img.width - cropWidth) / 2
            const cropY = (img.height - cropHeight) / 2
            
            // Set canvas size to maintain aspect ratio
            const maxSize = 800 // Max dimension for performance
            let canvasWidth: number
            let canvasHeight: number
            
            if (cropWidth > cropHeight) {
              canvasWidth = Math.min(maxSize, cropWidth)
              canvasHeight = canvasWidth / targetAspectRatio
            } else {
              canvasHeight = Math.min(maxSize, cropHeight)
              canvasWidth = canvasHeight * targetAspectRatio
            }
            
            canvas.width = canvasWidth
            canvas.height = canvasHeight
            
            // Draw cropped image
            ctx.drawImage(
              img,
              cropX, cropY, cropWidth, cropHeight,  // Source crop area
              0, 0, canvasWidth, canvasHeight       // Destination area
            )
            
            // Convert to base64
            const croppedImageData = canvas.toDataURL('image/jpeg', 0.9)
            resolve(croppedImageData)
          }
          
          img.onerror = () => reject('Failed to load image')
          
          // Load image from file
          const reader = new FileReader()
          reader.onload = (e) => {
            img.src = e.target?.result as string
          }
          reader.readAsDataURL(file)
        })
      }

      // Crop ảnh theo tỷ lệ được chọn
        const croppedImageData = await cropImageToAspectRatio(file)
        console.log(`✂️ Image cropped to ${aspectRatio}, length:`, croppedImageData.length)
        
        onImageChange(slotIndex, croppedImageData)
        
        toast({
          title: "✅ Thành công",
          description: `Đã thêm ảnh "${file.name}" (tự động crop theo tỷ lệ ${aspectRatio}) vào vị trí ${slotIndex + 1}`,
        })
      } catch (error) {
        console.error('❌ Error processing image:', error)
        toast({
          title: "❌ Lỗi",
          description: error instanceof Error ? error.message : "Không thể xử lý ảnh! Vui lòng thử lại.",
          variant: "destructive",
        })
      } finally {
        // Clear loading state
        setLoadingSlots(prev => {
          const newSet = new Set(prev)
          newSet.delete(slotIndex)
          return newSet
        })
      }
    }

    // Trigger file picker
    input.click()
  }

  const renderImageSlot = (slotIndex: number) => {
    const hasImage = images[slotIndex]
    const imageUrl = hasImage || ''
    const isLoading = loadingSlots.has(slotIndex)

    return (
      <div
        key={slotIndex}
        className={`
          relative cursor-pointer transition-all duration-200 rounded-lg overflow-hidden image-slot
          ${hasImage ? 'border-4 border-solid border-green-500' : 'border-4 border-dashed border-blue-500'}
          ${!readonly && !isLoading ? 'hover:border-blue-700 hover:scale-105 hover:shadow-lg' : ''}
          ${readonly ? 'cursor-not-allowed opacity-75' : ''}
          ${isLoading ? 'cursor-wait opacity-75' : ''}
        `}
        style={{
          width: `${finalCellWidth}mm`,
          height: `${finalCellHeight}mm`,
          backgroundColor: hasImage ? '#f0f9ff' : '#f8fafc',
          // Ensure print compatibility
          printColorAdjust: 'exact',
          WebkitPrintColorAdjust: 'exact',
          // Force aspect ratio with high priority
          minWidth: `${finalCellWidth}mm`,
          minHeight: `${finalCellHeight}mm`,
          maxWidth: `${finalCellWidth}mm`,
          maxHeight: `${finalCellHeight}mm`,
          // CSS custom properties for debugging
          '--cell-width': `${finalCellWidth}mm`,
          '--cell-height': `${finalCellHeight}mm`,
        } as React.CSSProperties}
        onClick={() => !isLoading && handleImageSlotClick(slotIndex)}
        title={
          isLoading 
            ? `Đang xử lý ảnh ${slotIndex + 1}...` 
            : `Click để ${hasImage ? 'thay' : 'thêm'} ảnh ${slotIndex + 1}`
        }
      >
        {isLoading && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center z-10 screen-only">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        {hasImage ? (
          <>
            <img
              src={imageUrl}
              alt={`Ảnh ${slotIndex + 1}`}
              className="w-full h-full object-cover"
              style={{ 
                borderRadius: '4px',
                // Ensure print compatibility
                printColorAdjust: 'exact',
                WebkitPrintColorAdjust: 'exact',
                colorAdjust: 'exact',
                // Force visibility in print
                display: 'block',
                visibility: 'visible',
                opacity: 1,
              }}
            />
            <div className="absolute top-1 right-1 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded screen-only">
              {isLoading ? 'Đang xử lý...' : 'Click để thay ảnh'}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 screen-only">
            <div className="w-8 h-8 border-2 border-blue-500 rounded flex items-center justify-center text-blue-500 font-bold text-xl mb-2">
              +
            </div>
            <div className="text-sm font-medium">
              {isLoading ? 'Đang xử lý...' : 'Click để thêm ảnh'}
            </div>
            <div className="text-xs text-gray-400 mt-1">Ảnh {slotIndex + 1}</div>
          </div>
        )}
      </div>
    )
  }

  // Nếu có lỗi validation, hiển thị thông báo lỗi
  if (!isValid || errors.length > 0) {
    return (
      <div className="construction-report-page" style={{ height: '297mm', width: '210mm', padding: '20mm' }}>
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">❌ Không thể tạo trang ảnh</h2>
          <div className="text-left bg-red-50 p-4 rounded-lg border border-red-200">
            <h3 className="font-semibold text-red-700 mb-2">Lỗi:</h3>
            {errors.map((error, index) => (
              <p key={index} className="text-red-600 mb-1">• {error}</p>
            ))}
            
            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
              <h4 className="font-semibold text-blue-700 mb-2">📋 Giới hạn cho phép:</h4>
              <ul className="text-blue-600 text-sm">
                <li>• Tối đa <strong>4 khung theo chiều ngang</strong></li>
                <li>• Tối đa <strong>5 khung theo chiều dọc</strong></li>
                <li>• Tổng số ảnh tối đa: <strong>20 ảnh</strong> (4×5)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>

      
      <div className="construction-report-page" style={{ 
        height: '297mm', 
        width: '210mm',
        margin: '0',
        padding: '0',
        boxSizing: 'border-box',
        overflow: 'hidden' // QUAN TRỌNG: Ngăn tràn trang
      }}>
      {/* Header Section - TEXT EDITOR */}
      <div className="text-center" style={{ 
        height: `${marginHeader}mm`, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        padding: `10mm ${effectiveMarginRight}mm 5mm ${effectiveMarginLeft}mm`,
        boxSizing: 'border-box'
      }}>
        {/* Text Editor */}
        {!readonly ? (
          <div className="w-full">
            <textarea
              value={headerContent}
              onChange={(e) => onHeaderContentChange?.(e.target.value)}
              placeholder="Nhập nội dung cho trang này..."
              className="w-full h-20 p-3 border-2 border-gray-300 rounded-lg resize-none focus:border-blue-500 focus:outline-none text-sm print:hidden"
              style={{
                minHeight: '60px',
                fontFamily: 'Arial, sans-serif'
              }}
            />
            {/* PRINT VERSION - ALWAYS SHOW IN PRINT MODE */}
            <div 
              className="print-header-content"
              style={{ 
                fontFamily: 'Arial, sans-serif',
                display: 'none'
              }}
              data-content={headerContent}
              data-print-content="true"
            >
              {headerContent || "Chưa có nội dung"}
            </div>

          </div>
        ) : (
          <div className="w-full">
            {headerContent ? (
              <div 
                className="header-content text-sm text-gray-800 whitespace-pre-wrap p-2 bg-gray-50 rounded border min-h-[60px] flex items-center justify-center"
                style={{ fontFamily: 'Arial, sans-serif' }}
                data-content={headerContent}
                data-print-content="true"
              >
                {headerContent}
              </div>
            ) : (
              <div className="text-sm text-gray-400 italic min-h-[60px] flex items-center justify-center">
                Chưa có nội dung
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Grid Section - DYNAMIC HEIGHT VỚI MARGIN TÙY CHỈNH */}
      <div className="image-grid-container" style={{ 
        height: `${297 - marginHeader - marginBottom}mm`,
        display: 'flex', 
        alignItems: 'flex-start', 
        justifyContent: 'flex-start', // Changed from 'center' to respect margins
        padding: `0 ${effectiveMarginRight}mm ${marginBottom}mm ${effectiveMarginLeft}mm`,
        boxSizing: 'border-box',
        overflow: 'hidden' // QUAN TRỌNG: Ngăn tràn
      }}>
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${imagesPerRow}, ${finalCellWidth}mm)`,
            gridTemplateRows: `repeat(${rows}, ${finalCellHeight}mm)`,
            gap: `${gapSize}mm`,
            width: `${totalGridWidth}mm`,
            height: `${totalGridHeight}mm`,
            // Remove centering to respect margin positioning
            justifyItems: 'center',
            alignItems: 'center'
          }}
        >
          {Array.from({ length: imagesPerPage }, (_, index) => renderImageSlot(index))}
        </div>
      </div>
    </div>
    </>
  )
}