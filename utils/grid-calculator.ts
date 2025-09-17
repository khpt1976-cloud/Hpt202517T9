/**
 * Grid Layout Calculator for A4 Construction Report Pages
 * Tính toán kích thước khung ảnh dựa trên input người dùng và constraints khổ A4
 * 
 * VERSION 2.0: Enhanced with flexible aspect ratio support
 */

import { parseAspectRatio, getAspectRatioValue, validateAspectRatioForA4 } from './aspect-ratio-constants'

export interface GridCalculationInput {
  imagesPerPage: number    // Số ảnh muốn chèn
  imagesPerRow: number     // Số khung theo chiều ngang
  // THÊM: Margin parameters tùy chỉnh
  marginLeft?: number      // mm - Margin trái (mặc định 10mm)
  marginRight?: number     // mm - Margin phải (mặc định 10mm)
  marginBottom?: number    // mm - Margin đáy (mặc định 10mm)
  marginHeader?: number    // mm - Khoảng cách từ đỉnh giấy đến khung ảnh (mặc định 45mm)
  // THÊM: Tỷ lệ ảnh
  aspectRatio?: string     // Tỷ lệ ảnh (mặc định "4:3")
  // THÊM: Căn giữa theo chiều ngang
  centerHorizontally?: boolean // Căn giữa khung ảnh theo chiều ngang (mặc định false)
}

export interface GridCalculationResult {
  // Kích thước khung tính được
  cellWidth: number        // mm
  cellHeight: number       // mm
  
  // Thông tin layout
  rows: number            // Số hàng thực tế
  cols: number            // Số cột thực tế
  
  // Validation results
  isValid: boolean        // Có thể chèn được không
  warnings: string[]      // Các cảnh báo
  errors: string[]        // Các lỗi
  
  // Grid dimensions
  totalGridWidth: number  // mm - Tổng chiều rộng grid
  totalGridHeight: number // mm - Tổng chiều cao grid
  
  // THÊM: Margin và available space info
  margins: {
    left: number
    right: number
    bottom: number
    header: number
  }
  availableArea: {
    width: number          // mm - Không gian khả dụng cho grid
    height: number         // mm
  }
  
  // NEW: Aspect ratio information
  aspectRatio: {
    value: string          // Original aspect ratio string (e.g., "4:3")
    numericValue: number   // Calculated ratio (width/height)
    actualRatio: number    // Actual ratio of calculated cells
    isExact: boolean       // Whether calculated cells match desired ratio exactly
  }
}

// Constants - Khổ A4 và constraints
const A4_CONSTANTS = {
  // A4 paper size
  PAPER_WIDTH: 210,       // mm
  PAPER_HEIGHT: 297,      // mm
  
  // Available area for images (TĂNG CHIỀU CAO ĐỂ CÓ THÊM KHÔNG GIAN)
  AVAILABLE_WIDTH: 180,   // mm (210 - 30 margin) - conservative
  AVAILABLE_HEIGHT: 220,  // mm (GIẢM ĐỂ ĐẢM BẢO KHUNG VUÔNG VỪA VẶN)
  
  // Header area (1/5 of page height)
  HEADER_HEIGHT: 59,      // mm (297 * 1/5)
  
  // Grid constraints
  MAX_ROWS: 5,
  MAX_COLS: 4,
  MAX_IMAGES_PER_PAGE: 20,
  
  // Size constraints
  MIN_CELL_SIZE: 15,      // mm - Minimum readable size
  // REMOVED: MAX_CELL_SIZE - không có quy định về kích thước tối đa
  GAP_SIZE: 5,            // mm - Gap between cells
  
  // Margins
  MARGIN: 10              // mm
}

/**
 * Tính toán layout grid dựa trên input người dùng - ENHANCED WITH ASPECT RATIO SUPPORT
 */
export function calculateGridLayout(input: GridCalculationInput): GridCalculationResult {
  const { 
    imagesPerPage, 
    imagesPerRow,
    // THÊM: Margin parameters với giá trị mặc định
    marginLeft = 10,
    marginRight = 10,
    marginBottom = 10,
    marginHeader = 45,
    // THÊM: Aspect ratio với giá trị mặc định
    aspectRatio = "4:3",
    // THÊM: Center horizontally với giá trị mặc định
    centerHorizontally = false
  } = input
  
  // Parse aspect ratio
  const { widthRatio, heightRatio } = parseAspectRatio(aspectRatio)
  const desiredAspectRatio = getAspectRatioValue(aspectRatio)
  
  console.log(`🎯 GRID CALCULATOR: centerHorizontally = ${centerHorizontally}`)
  
  // Initialize result với margin info và aspect ratio info
  const result: GridCalculationResult = {
    cellWidth: 0,
    cellHeight: 0,
    rows: 0,
    cols: imagesPerRow,
    isValid: false,
    warnings: [],
    errors: [],
    totalGridWidth: 0,
    totalGridHeight: 0,
    // THÊM: Margin và available area info
    margins: {
      left: marginLeft,
      right: marginRight,
      bottom: marginBottom,
      header: marginHeader
    },
    availableArea: {
      width: 0,
      height: 0
    },
    // NEW: Aspect ratio information
    aspectRatio: {
      value: aspectRatio,
      numericValue: desiredAspectRatio,
      actualRatio: 0,
      isExact: false
    }
  }
  
  // Validation 1: Basic input validation
  if (imagesPerPage <= 0 || imagesPerRow <= 0) {
    result.errors.push("Số ảnh và số khung/hàng phải lớn hơn 0")
    return result
  }
  
  // Validation 2: STRICT Maximum constraints - KHÔNG CHO PHÉP VƯỢT QUÁ
  if (imagesPerPage > A4_CONSTANTS.MAX_IMAGES_PER_PAGE) {
    result.errors.push(`❌ VƯỢT QUÁ GIỚI HẠN: Tối đa ${A4_CONSTANTS.MAX_IMAGES_PER_PAGE} ảnh trên 1 trang. Bạn đang cố thêm ${imagesPerPage} ảnh.`)
    return result
  }
  
  if (imagesPerRow > A4_CONSTANTS.MAX_COLS) {
    result.errors.push(`❌ VƯỢT QUÁ GIỚI HẠN: Tối đa ${A4_CONSTANTS.MAX_COLS} khung theo chiều ngang. Bạn đang cố tạo ${imagesPerRow} khung/hàng.`)
    return result
  }
  
  // Calculate rows
  const rows = Math.ceil(imagesPerPage / imagesPerRow)
  result.rows = rows
  
  // Validation 3: STRICT Maximum rows - KHÔNG CHO PHÉP VƯỢT QUÁ
  if (rows > A4_CONSTANTS.MAX_ROWS) {
    result.errors.push(`❌ VƯỢT QUÁ GIỚI HẠN: Với ${imagesPerRow} khung/hàng và ${imagesPerPage} ảnh sẽ tạo ${rows} hàng. Tối đa chỉ được ${A4_CONSTANTS.MAX_ROWS} hàng.`)
    return result
  }
  
  // TÍNH TOÁN AVAILABLE SPACE VỚI MARGIN TÙY CHỈNH
  const availableWidth = A4_CONSTANTS.PAPER_WIDTH - marginLeft - marginRight
  const availableHeight = A4_CONSTANTS.PAPER_HEIGHT - marginHeader - marginBottom
  
  // Cập nhật available area trong result
  result.availableArea.width = availableWidth
  result.availableArea.height = availableHeight
  
  // Calculate available space for cells (minus gaps)
  const totalGapWidth = (imagesPerRow - 1) * A4_CONSTANTS.GAP_SIZE
  const totalGapHeight = (rows - 1) * A4_CONSTANTS.GAP_SIZE
  
  const availableWidthForCells = availableWidth - totalGapWidth
  const availableHeightForCells = availableHeight - totalGapHeight
  
  // Add aspect ratio validation
  const aspectRatioValidation = validateAspectRatioForA4(aspectRatio, imagesPerRow, rows)
  result.warnings.push(...aspectRatioValidation.warnings)
  
  // THUẬT TOÁN ĐÚNG THEO YÊU CẦU CỦA ANH:
  // 1. Tính max cell size theo cả 2 chiều
  // 2. So sánh khoảng dư của cả 2 phương pháp  
  // 3. Chọn phương pháp có khoảng dư ít hơn (tối ưu hơn)
  // 4. Giữ nguyên cạnh được chọn
  
  // Method 1: Width-constrained (giữ nguyên chiều ngang)
  const cellWidthByWidth = Math.floor(availableWidthForCells / imagesPerRow)
  const cellHeightByWidth = Math.floor(cellWidthByWidth / desiredAspectRatio)
  const totalGridWidthByWidth = (cellWidthByWidth * imagesPerRow) + totalGapWidth
  const totalGridHeightByWidth = (cellHeightByWidth * rows) + totalGapHeight
  const remainingWidthByWidth = availableWidth - totalGridWidthByWidth
  const remainingHeightByWidth = availableHeight - totalGridHeightByWidth
  
  // Method 2: Height-constrained (giữ nguyên chiều dọc)
  const cellHeightByHeight = Math.floor(availableHeightForCells / rows)
  const cellWidthByHeight = Math.floor(cellHeightByHeight * desiredAspectRatio)
  const totalGridWidthByHeight = (cellWidthByHeight * imagesPerRow) + totalGapWidth
  const totalGridHeightByHeight = (cellHeightByHeight * rows) + totalGapHeight
  const remainingWidthByHeight = availableWidth - totalGridWidthByHeight
  const remainingHeightByHeight = availableHeight - totalGridHeightByHeight
  
  console.log(`🔧 THUẬT TOÁN ĐÚNG:`)
  console.log(`   Method 1 (Width-constrained): ${cellWidthByWidth}×${cellHeightByWidth}mm → Remaining: ${remainingWidthByWidth}×${remainingHeightByWidth}mm`)
  console.log(`   Method 2 (Height-constrained): ${cellWidthByHeight}×${cellHeightByHeight}mm → Remaining: ${remainingWidthByHeight}×${remainingHeightByHeight}mm`)
  
  // Kiểm tra method nào FIT trong khổ giấy
  const method1Fits = (remainingWidthByWidth >= 0 && remainingHeightByWidth >= 0)
  const method2Fits = (remainingWidthByHeight >= 0 && remainingHeightByHeight >= 0)
  
  let finalCellWidth: number
  let finalCellHeight: number
  let chosenMethod: string
  
  console.log(`   Method 1 fits: ${method1Fits}, Method 2 fits: ${method2Fits}`)
  
  if (method1Fits && method2Fits) {
    // Cả 2 đều fit → chọn method có khoảng dư ít hơn (tối ưu hơn)
    const totalRemainingByWidth = remainingWidthByWidth + remainingHeightByWidth
    const totalRemainingByHeight = remainingWidthByHeight + remainingHeightByHeight
    
    if (totalRemainingByWidth <= totalRemainingByHeight) {
      finalCellWidth = cellWidthByWidth
      finalCellHeight = cellHeightByWidth
      chosenMethod = "Width-constrained (cả 2 fit, khoảng dư ít hơn)"
    } else {
      finalCellWidth = cellWidthByHeight
      finalCellHeight = cellHeightByHeight
      chosenMethod = "Height-constrained (cả 2 fit, khoảng dư ít hơn)"
    }
  } else if (method1Fits) {
    // Chỉ method 1 fit
    finalCellWidth = cellWidthByWidth
    finalCellHeight = cellHeightByWidth
    chosenMethod = "Width-constrained (chỉ method này fit)"
  } else if (method2Fits) {
    // Chỉ method 2 fit
    finalCellWidth = cellWidthByHeight
    finalCellHeight = cellHeightByHeight
    chosenMethod = "Height-constrained (chỉ method này fit)"
  } else {
    // Không method nào fit → chọn method ít overflow hơn
    const overflowByWidth = Math.abs(Math.min(0, remainingWidthByWidth)) + Math.abs(Math.min(0, remainingHeightByWidth))
    const overflowByHeight = Math.abs(Math.min(0, remainingWidthByHeight)) + Math.abs(Math.min(0, remainingHeightByHeight))
    
    if (overflowByWidth <= overflowByHeight) {
      finalCellWidth = cellWidthByWidth
      finalCellHeight = cellHeightByWidth
      chosenMethod = "Width-constrained (không fit, ít overflow hơn)"
    } else {
      finalCellWidth = cellWidthByHeight
      finalCellHeight = cellHeightByHeight
      chosenMethod = "Height-constrained (không fit, ít overflow hơn)"
    }
  }
  
  console.log(`   → Chosen: ${chosenMethod}`)
  console.log(`   → Final cell size: ${finalCellWidth}×${finalCellHeight}mm`)

  // Apply minimum size constraints
  const minSize = A4_CONSTANTS.MIN_CELL_SIZE
  if (finalCellWidth < minSize || finalCellHeight < minSize) {
    result.warnings.push(`⚠️ Khung ảnh rất nhỏ (${finalCellWidth}x${finalCellHeight}mm). Khuyến nghị giảm số khung/hàng hoặc số ảnh.`)
  }

  // REMOVED: MAX_CELL_SIZE constraint - không có quy định về kích thước tối đa
  // Chỉ kiểm tra overflow theo chiều dọc và thông báo
  
  // Đã xử lý warnings ở trên - xóa duplicate code
  
  // Calculate total grid dimensions
  const totalGridWidth = (finalCellWidth * imagesPerRow) + totalGapWidth
  const totalGridHeight = (finalCellHeight * rows) + totalGapHeight
  
  // Bước 4: Kiểm tra overflow theo chiều dọc và tính số ảnh bị tràn
  const totalRequiredHeight = totalGridHeight + marginHeader + marginBottom
  if (totalRequiredHeight > A4_CONSTANTS.PAPER_HEIGHT) {
    const overflowHeight = totalRequiredHeight - A4_CONSTANTS.PAPER_HEIGHT
    const availableHeightForGrid = A4_CONSTANTS.PAPER_HEIGHT - marginHeader - marginBottom
    const maxRowsThatFit = Math.floor((availableHeightForGrid + A4_CONSTANTS.GAP_SIZE) / (finalCellHeight + A4_CONSTANTS.GAP_SIZE))
    const maxImagesThatFit = maxRowsThatFit * imagesPerRow
    const overflowImages = imagesPerPage - maxImagesThatFit
    
    result.warnings.push(`⚠️ OVERFLOW THEO CHIỀU DỌC:`)
    result.warnings.push(`   - Tổng chiều cao cần: ${totalRequiredHeight}mm > Khổ giấy: ${A4_CONSTANTS.PAPER_HEIGHT}mm`)
    result.warnings.push(`   - Vượt quá: ${overflowHeight}mm`)
    result.warnings.push(`   - Số hàng hiện tại: ${rows} hàng`)
    result.warnings.push(`   - Số hàng tối đa vừa: ${maxRowsThatFit} hàng`)
    result.warnings.push(`   - Số ảnh hiện tại: ${imagesPerPage} ảnh`)
    result.warnings.push(`   - Số ảnh tối đa vừa: ${maxImagesThatFit} ảnh`)
    result.warnings.push(`   → ${overflowImages} ảnh bị tràn và cần thay đổi lại!`)
  }
  
  // Thông tin về chiều ngang (không block, chỉ thông báo)
  const totalRequiredWidth = totalGridWidth + marginLeft + marginRight
  if (totalRequiredWidth > A4_CONSTANTS.PAPER_WIDTH) {
    result.warnings.push(`⚠️ Tổng chiều rộng vượt quá khổ giấy: ${totalRequiredWidth}mm > ${A4_CONSTANTS.PAPER_WIDTH}mm`)
    result.warnings.push(`   - Chiều rộng grid: ${totalGridWidth}mm`)
    result.warnings.push(`   - Margin left: ${marginLeft}mm`)
    result.warnings.push(`   - Margin right: ${marginRight}mm`)
  }
  
  // Calculate actual aspect ratio and check accuracy
  const actualAspectRatio = finalCellWidth / finalCellHeight
  const aspectRatioDifference = Math.abs(actualAspectRatio - desiredAspectRatio)
  const isExactRatio = aspectRatioDifference < 0.05 // 5% tolerance
  
  // Success - populate result
  result.cellWidth = finalCellWidth
  result.cellHeight = finalCellHeight
  result.totalGridWidth = totalGridWidth
  result.totalGridHeight = totalGridHeight
  result.isValid = true
  
  // Update aspect ratio information
  result.aspectRatio.actualRatio = actualAspectRatio
  result.aspectRatio.isExact = isExactRatio
  
  // Debug console with aspect ratio info
  console.log(`🧮 Grid calculation: ${imagesPerPage} ảnh, ${imagesPerRow} cột → ${rows} hàng → ${finalCellWidth}×${finalCellHeight}mm → Total: ${totalGridWidth}×${totalGridHeight}mm`)
  console.log(`📐 Aspect ratio: Desired ${aspectRatio} (${desiredAspectRatio.toFixed(3)}) → Actual ${actualAspectRatio.toFixed(3)} → ${isExactRatio ? '✅ Exact' : '⚠️ Approximate'}`)
  console.log(`📏 Input margins: L=${marginLeft}, R=${marginRight}, B=${marginBottom}, H=${marginHeader}`)
  console.log(`📏 Available space: ${availableWidth}×${availableHeight}mm → Cells: ${availableWidthForCells}×${availableHeightForCells}mm`)
  
  // Add informational warnings
  if (finalCellWidth < 30 || finalCellHeight < 30) {
    result.warnings.push("Khung ảnh khá nhỏ, có thể khó nhìn khi in.")
  }
  
  if (!isExactRatio) {
    result.warnings.push(`Tỷ lệ thực tế ${actualAspectRatio.toFixed(2)}:1 khác với tỷ lệ mong muốn ${aspectRatio}`)
  }
  
  if (rows === 1 && imagesPerPage < imagesPerRow) {
    result.warnings.push(`Chỉ sử dụng ${imagesPerPage}/${imagesPerRow} khung trong hàng. Có thể tối ưu layout.`)
  }
  
  // THÊM: Logic căn giữa theo chiều ngang
  if (centerHorizontally) {
    const actualGridWidth = totalGridWidth
    const totalAvailableWidth = A4_CONSTANTS.PAPER_WIDTH
    const usedWidth = actualGridWidth + marginLeft + marginRight
    const remainingWidth = totalAvailableWidth - usedWidth
    
    if (remainingWidth > 0) {
      // Tính margin left và right mới để căn giữa
      const newMarginLeft = marginLeft + (remainingWidth / 2)
      const newMarginRight = marginRight + (remainingWidth / 2)
      
      // Cập nhật margins trong result
      result.margins.left = Math.floor(newMarginLeft)
      result.margins.right = Math.floor(newMarginRight)
      
      console.log(`🎯 CENTER HORIZONTALLY:`)
      console.log(`   - Grid width: ${actualGridWidth}mm`)
      console.log(`   - Total paper width: ${totalAvailableWidth}mm`)
      console.log(`   - Used width: ${usedWidth}mm`)
      console.log(`   - Remaining width: ${remainingWidth}mm`)
      console.log(`   - Original margins: L=${marginLeft}mm, R=${marginRight}mm`)
      console.log(`   - New margins: L=${result.margins.left}mm, R=${result.margins.right}mm`)
      
      result.warnings.push(`🎯 Căn giữa: Margin trái/phải được điều chỉnh thành ${result.margins.left}mm/${result.margins.right}mm`)
    } else {
      console.log(`🎯 CENTER HORIZONTALLY: Không thể căn giữa - grid đã chiếm hết không gian`)
      result.warnings.push(`⚠️ Không thể căn giữa - khung ảnh đã chiếm hết không gian theo chiều ngang`)
    }
  }
  
  return result
}

/**
 * Đề xuất layout tối ưu cho số ảnh cho trước với aspect ratio
 */
export function suggestOptimalLayout(
  imagesPerPage: number, 
  aspectRatio: string = "4:3"
): GridCalculationInput[] {
  const suggestions: GridCalculationInput[] = []
  
  // Try different combinations
  for (let imagesPerRow = 1; imagesPerRow <= A4_CONSTANTS.MAX_COLS; imagesPerRow++) {
    const input: GridCalculationInput = { imagesPerPage, imagesPerRow, aspectRatio }
    const result = calculateGridLayout(input)
    
    if (result.isValid && result.errors.length === 0) {
      suggestions.push(input)
    }
  }
  
  // Sort by multiple criteria: aspect ratio accuracy, then cell size
  return suggestions.sort((a, b) => {
    const resultA = calculateGridLayout(a)
    const resultB = calculateGridLayout(b)
    
    // Priority 1: Exact aspect ratio match
    if (resultA.aspectRatio.isExact && !resultB.aspectRatio.isExact) return -1
    if (!resultA.aspectRatio.isExact && resultB.aspectRatio.isExact) return 1
    
    // Priority 2: Cell area (larger is better)
    const areaA = resultA.cellWidth * resultA.cellHeight
    const areaB = resultB.cellWidth * resultB.cellHeight
    return areaB - areaA
  })
}

/**
 * Get optimal aspect ratio suggestions for given layout constraints
 */
export function suggestAspectRatiosForLayout(
  imagesPerPage: number,
  imagesPerRow: number
): { aspectRatio: string; result: GridCalculationResult }[] {
  const suggestions: { aspectRatio: string; result: GridCalculationResult }[] = []
  
  // Test common aspect ratios
  const testRatios = ["1:1", "4:3", "3:2", "16:9", "3:4", "2:3"]
  
  for (const ratio of testRatios) {
    const input: GridCalculationInput = { imagesPerPage, imagesPerRow, aspectRatio: ratio }
    const result = calculateGridLayout(input)
    
    if (result.isValid && result.errors.length === 0) {
      suggestions.push({ aspectRatio: ratio, result })
    }
  }
  
  // Sort by cell area (larger is better)
  return suggestions.sort((a, b) => {
    const areaA = a.result.cellWidth * a.result.cellHeight
    const areaB = b.result.cellWidth * b.result.cellHeight
    return areaB - areaA
  })
}