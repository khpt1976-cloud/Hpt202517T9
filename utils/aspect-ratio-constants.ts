/**
 * Aspect Ratio Constants for Image Grid Layout
 * Định nghĩa các tỷ lệ ảnh phổ biến cho hệ thống
 */

export interface AspectRatioOption {
  value: string
  label: string
  description: string
  widthRatio: number
  heightRatio: number
  category: 'standard' | 'wide' | 'tall' | 'square'
}

export const ASPECT_RATIOS: AspectRatioOption[] = [
  // Standard ratios
  {
    value: "4:3",
    label: "4:3 (Ngang chuẩn)",
    description: "Tỷ lệ truyền thống, phù hợp cho ảnh chụp thông thường",
    widthRatio: 4,
    heightRatio: 3,
    category: 'standard'
  },
  {
    value: "3:2",
    label: "3:2 (Ngang 35mm)",
    description: "Tỷ lệ máy ảnh 35mm, cân bằng tốt",
    widthRatio: 3,
    heightRatio: 2,
    category: 'standard'
  },
  
  // Wide ratios
  {
    value: "16:9",
    label: "16:9 (Ngang rộng)",
    description: "Tỷ lệ màn hình rộng, phù hợp cho ảnh panorama",
    widthRatio: 16,
    heightRatio: 9,
    category: 'wide'
  },
  {
    value: "16:10",
    label: "16:10 (Ngang vừa)",
    description: "Tỷ lệ màn hình máy tính, hơi rộng",
    widthRatio: 16,
    heightRatio: 10,
    category: 'wide'
  },
  
  // Square ratio
  {
    value: "1:1",
    label: "1:1 (Vuông)",
    description: "Tỷ lệ vuông, phù hợp cho ảnh Instagram",
    widthRatio: 1,
    heightRatio: 1,
    category: 'square'
  },
  
  // Tall ratios
  {
    value: "3:4",
    label: "3:4 (Dọc chuẩn)",
    description: "Tỷ lệ dọc truyền thống",
    widthRatio: 3,
    heightRatio: 4,
    category: 'tall'
  },
  {
    value: "2:3",
    label: "2:3 (Dọc 35mm)",
    description: "Tỷ lệ dọc máy ảnh 35mm",
    widthRatio: 2,
    heightRatio: 3,
    category: 'tall'
  },
  {
    value: "9:16",
    label: "9:16 (Dọc rộng)",
    description: "Tỷ lệ dọc cho video mobile",
    widthRatio: 9,
    heightRatio: 16,
    category: 'tall'
  }
]

/**
 * Get aspect ratio option by value
 */
export function getAspectRatioOption(value: string): AspectRatioOption | undefined {
  return ASPECT_RATIOS.find(ratio => ratio.value === value)
}

/**
 * Parse aspect ratio string to numeric values
 */
export function parseAspectRatio(aspectRatio: string): { widthRatio: number; heightRatio: number } {
  const option = getAspectRatioOption(aspectRatio)
  if (option) {
    return {
      widthRatio: option.widthRatio,
      heightRatio: option.heightRatio
    }
  }
  
  // Fallback parsing for custom ratios
  const [widthStr, heightStr] = aspectRatio.split(':')
  const widthRatio = parseFloat(widthStr) || 4
  const heightRatio = parseFloat(heightStr) || 3
  return { widthRatio, heightRatio }
}

/**
 * Calculate aspect ratio value (width/height)
 */
export function getAspectRatioValue(aspectRatio: string): number {
  const { widthRatio, heightRatio } = parseAspectRatio(aspectRatio)
  return widthRatio / heightRatio
}

/**
 * Get recommended aspect ratios for construction reports
 */
export function getRecommendedAspectRatios(): AspectRatioOption[] {
  return ASPECT_RATIOS.filter(ratio => 
    ['4:3', '3:2', '16:9', '1:1'].includes(ratio.value)
  )
}

/**
 * Validate if aspect ratio is suitable for A4 layout
 */
export function validateAspectRatioForA4(aspectRatio: string, imagesPerRow: number, rows: number): {
  isValid: boolean
  warnings: string[]
  recommendations: string[]
} {
  const result = {
    isValid: true,
    warnings: [] as string[],
    recommendations: [] as string[]
  }
  
  const ratioValue = getAspectRatioValue(aspectRatio)
  const option = getAspectRatioOption(aspectRatio)
  
  // Check for very wide ratios
  if (ratioValue > 2.5) {
    result.warnings.push(`Tỷ lệ ${aspectRatio} rất rộng, có thể khó bố trí trên A4`)
    result.recommendations.push("Khuyến nghị giảm số khung/hàng hoặc chọn tỷ lệ khác")
  }
  
  // Check for very tall ratios
  if (ratioValue < 0.4) {
    result.warnings.push(`Tỷ lệ ${aspectRatio} rất cao, có thể khó bố trí trên A4`)
    result.recommendations.push("Khuyến nghị giảm số hàng hoặc chọn tỷ lệ khác")
  }
  
  // Check for many images with extreme ratios
  const totalImages = imagesPerRow * rows
  if (totalImages > 6 && (ratioValue > 2 || ratioValue < 0.5)) {
    result.warnings.push(`Với ${totalImages} ảnh và tỷ lệ ${aspectRatio}, khung ảnh có thể rất nhỏ`)
    result.recommendations.push("Khuyến nghị giảm số ảnh hoặc chọn tỷ lệ cân bằng hơn (4:3, 3:2)")
  }
  
  return result
}