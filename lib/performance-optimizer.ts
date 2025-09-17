// Performance optimization utilities for large documents
// React hooks will be imported in client components that use them

// Virtual scrolling configuration
export interface VirtualScrollConfig {
  itemHeight: number
  containerHeight: number
  overscan: number
}

// Memory management utilities
export class MemoryManager {
  private static instance: MemoryManager
  private cache = new Map<string, any>()
  private maxCacheSize = 50 // Maximum number of cached items
  private memoryThreshold = 100 * 1024 * 1024 // 100MB threshold

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager()
    }
    return MemoryManager.instance
  }

  // Cache management with LRU eviction
  set(key: string, value: any): void {
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, value)
  }

  get(key: string): any {
    const value = this.cache.get(key)
    if (value) {
      // Move to end (LRU)
      this.cache.delete(key)
      this.cache.set(key, value)
    }
    return value
  }

  clear(): void {
    this.cache.clear()
  }

  // Memory usage estimation
  getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize
    }
    return 0
  }

  // Check if memory usage is above threshold
  isMemoryHigh(): boolean {
    return this.getMemoryUsage() > this.memoryThreshold
  }

  // Force garbage collection if available
  forceGC(): void {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc()
    }
  }
}

// Debounce utility for performance (non-hook version)
export function debounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout
  
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => callback(...args), delay)
  }) as T
}

// Throttle utility for scroll events (non-hook version)
export function throttle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  let lastRun = 0
  
  return ((...args: Parameters<T>) => {
    if (Date.now() - lastRun >= delay) {
      callback(...args)
      lastRun = Date.now()
    }
  }) as T
}

// Virtual scrolling utility (non-hook version)
export function calculateVirtualScroll(
  scrollTop: number,
  items: any[],
  config: VirtualScrollConfig
) {
  const { itemHeight, containerHeight, overscan } = config
  
  const start = Math.floor(scrollTop / itemHeight)
  const end = Math.min(
    start + Math.ceil(containerHeight / itemHeight) + overscan,
    items.length
  )
  
  const visibleRange = {
    start: Math.max(0, start - overscan),
    end
  }

  const visibleItems = items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
    ...item,
    index: visibleRange.start + index
  }))

  const totalHeight = items.length * itemHeight

  return {
    visibleItems,
    totalHeight,
    visibleRange
  }
}

// Lazy loading utility (non-hook version)
export function createLazyLoader(threshold = 0.1) {
  return {
    observe: (element: HTMLElement, callback: () => void) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            callback()
            observer.disconnect()
          }
        },
        { threshold }
      )

      observer.observe(element)
      return () => observer.disconnect()
    }
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map()

  static startMeasure(name: string): void {
    performance.mark(`${name}-start`)
  }

  static endMeasure(name: string): number {
    performance.mark(`${name}-end`)
    performance.measure(name, `${name}-start`, `${name}-end`)
    
    const measure = performance.getEntriesByName(name, 'measure')[0]
    const duration = measure.duration

    // Store metrics
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(duration)

    // Clean up
    performance.clearMarks(`${name}-start`)
    performance.clearMarks(`${name}-end`)
    performance.clearMeasures(name)

    return duration
  }

  static getAverageTime(name: string): number {
    const times = this.metrics.get(name) || []
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
  }

  static getMetrics(): Record<string, { average: number; count: number }> {
    const result: Record<string, { average: number; count: number }> = {}
    
    this.metrics.forEach((times, name) => {
      result[name] = {
        average: times.reduce((a, b) => a + b, 0) / times.length,
        count: times.length
      }
    })

    return result
  }

  static clearMetrics(): void {
    this.metrics.clear()
  }
}

// Image optimization utilities
export class ImageOptimizer {
  static async compressImage(
    file: File,
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8
  ): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(resolve, 'image/jpeg', quality)
      }

      img.src = URL.createObjectURL(file)
    })
  }

  static createThumbnail(
    file: File,
    size = 150
  ): Promise<Blob> {
    return this.compressImage(file, size, size, 0.7)
  }
}

// Document chunking for large files
export class DocumentChunker {
  private static chunkSize = 1000 // Characters per chunk

  static chunkContent(content: string): string[] {
    const chunks: string[] = []
    
    for (let i = 0; i < content.length; i += this.chunkSize) {
      chunks.push(content.slice(i, i + this.chunkSize))
    }
    
    return chunks
  }

  static async processChunksAsync<T>(
    chunks: string[],
    processor: (chunk: string, index: number) => Promise<T>
  ): Promise<T[]> {
    const results: T[] = []
    
    // Process chunks in batches to avoid overwhelming the browser
    const batchSize = 5
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)
      const batchPromises = batch.map((chunk, batchIndex) => 
        processor(chunk, i + batchIndex)
      )
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      // Allow browser to breathe between batches
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    
    return results
  }
}

// All utilities are already exported above