// Advanced memory management for large files and documents
import { AdvancedCache } from './advanced-cache'

// Memory monitoring interface
interface MemoryStats {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
  percentage: number
}

// File streaming interface
interface StreamChunk {
  data: ArrayBuffer
  index: number
  isLast: boolean
}

// Memory management configuration
interface MemoryConfig {
  maxMemoryUsage: number // Maximum memory usage in bytes
  chunkSize: number // Chunk size for file processing
  gcThreshold: number // Threshold to trigger garbage collection
  warningThreshold: number // Threshold to show memory warning
}

export class AdvancedMemoryManager {
  private static instance: AdvancedMemoryManager
  private config: MemoryConfig
  private cache: AdvancedCache
  private memoryMonitorInterval?: NodeJS.Timeout
  private callbacks: {
    onMemoryWarning?: (stats: MemoryStats) => void
    onMemoryError?: (stats: MemoryStats) => void
    onGarbageCollection?: () => void
  } = {}

  constructor(config: Partial<MemoryConfig> = {}) {
    this.config = {
      maxMemoryUsage: 500 * 1024 * 1024, // 500MB default
      chunkSize: 1024 * 1024, // 1MB chunks
      gcThreshold: 400 * 1024 * 1024, // 400MB
      warningThreshold: 300 * 1024 * 1024, // 300MB
      ...config
    }

    this.cache = new AdvancedCache({
      maxSize: this.config.maxMemoryUsage * 0.3, // 30% of max memory for cache
      ttl: 10 * 60 * 1000 // 10 minutes
    })

    this.startMemoryMonitoring()
  }

  static getInstance(config?: Partial<MemoryConfig>): AdvancedMemoryManager {
    if (!AdvancedMemoryManager.instance) {
      AdvancedMemoryManager.instance = new AdvancedMemoryManager(config)
    }
    return AdvancedMemoryManager.instance
  }

  // Get current memory statistics
  getMemoryStats(): MemoryStats {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      }
    }

    // Fallback for environments without memory API
    return {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: this.config.maxMemoryUsage,
      percentage: 0
    }
  }

  // Check if memory usage is high
  isMemoryHigh(): boolean {
    const stats = this.getMemoryStats()
    return stats.usedJSHeapSize > this.config.warningThreshold
  }

  // Check if memory usage is critical
  isMemoryCritical(): boolean {
    const stats = this.getMemoryStats()
    return stats.usedJSHeapSize > this.config.gcThreshold
  }

  // Force garbage collection if available
  forceGarbageCollection(): void {
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as any).gc()
      this.callbacks.onGarbageCollection?.()
      console.log('Forced garbage collection')
    }
  }

  // Start memory monitoring
  private startMemoryMonitoring(): void {
    if (typeof setInterval === 'undefined') return

    this.memoryMonitorInterval = setInterval(() => {
      const stats = this.getMemoryStats()

      if (stats.usedJSHeapSize > this.config.gcThreshold) {
        this.callbacks.onMemoryError?.(stats)
        this.emergencyCleanup()
      } else if (stats.usedJSHeapSize > this.config.warningThreshold) {
        this.callbacks.onMemoryWarning?.(stats)
        this.performCleanup()
      }
    }, 5000) // Check every 5 seconds
  }

  // Stop memory monitoring
  stopMemoryMonitoring(): void {
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval)
      this.memoryMonitorInterval = undefined
    }
  }

  // Set memory event callbacks
  setCallbacks(callbacks: typeof this.callbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  // Perform regular cleanup
  private performCleanup(): void {
    // Clear old cache entries
    this.cache.clear()
    
    // Force garbage collection if available
    this.forceGarbageCollection()
    
    console.log('Performed memory cleanup')
  }

  // Emergency cleanup when memory is critical
  private emergencyCleanup(): void {
    // Clear all caches
    this.cache.clear()
    
    // Clear any global caches
    if (typeof window !== 'undefined') {
      // Clear image caches
      const images = document.querySelectorAll('img')
      images.forEach(img => {
        if (img.src.startsWith('blob:')) {
          URL.revokeObjectURL(img.src)
        }
      })
    }
    
    // Force multiple garbage collections
    for (let i = 0; i < 3; i++) {
      setTimeout(() => this.forceGarbageCollection(), i * 100)
    }
    
    console.warn('Performed emergency memory cleanup')
  }

  // Process large file in chunks
  async processFileInChunks<T>(
    file: File,
    processor: (chunk: ArrayBuffer, index: number, isLast: boolean) => Promise<T>
  ): Promise<T[]> {
    const results: T[] = []
    const totalChunks = Math.ceil(file.size / this.config.chunkSize)

    for (let i = 0; i < totalChunks; i++) {
      // Check memory before processing each chunk
      if (this.isMemoryCritical()) {
        this.emergencyCleanup()
        // Wait a bit for cleanup to take effect
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      const start = i * this.config.chunkSize
      const end = Math.min(start + this.config.chunkSize, file.size)
      const chunk = file.slice(start, end)
      
      const arrayBuffer = await chunk.arrayBuffer()
      const isLast = i === totalChunks - 1
      
      try {
        const result = await processor(arrayBuffer, i, isLast)
        results.push(result)
      } catch (error) {
        console.error(`Error processing chunk ${i}:`, error)
        throw error
      }

      // Allow browser to breathe between chunks
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    return results
  }

  // Stream large content processing
  async *streamContent(content: string, chunkSize: number = 10000): AsyncGenerator<string> {
    for (let i = 0; i < content.length; i += chunkSize) {
      // Check memory before yielding each chunk
      if (this.isMemoryHigh()) {
        this.performCleanup()
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      yield content.slice(i, i + chunkSize)
    }
  }

  // Optimize image memory usage
  async optimizeImageMemory(imageElement: HTMLImageElement): Promise<void> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      
      // Reduce image size if too large
      const maxWidth = 1920
      const maxHeight = 1080
      
      let { width, height } = imageElement
      
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
      
      ctx.drawImage(imageElement, 0, 0, width, height)
      
      // Convert to blob and replace src
      canvas.toBlob((blob) => {
        if (blob) {
          // Revoke old object URL if it exists
          if (imageElement.src.startsWith('blob:')) {
            URL.revokeObjectURL(imageElement.src)
          }
          
          imageElement.src = URL.createObjectURL(blob)
        }
        resolve()
      }, 'image/jpeg', 0.8)
    })
  }

  // Batch process with memory management
  async batchProcess<T, R>(
    items: T[],
    processor: (item: T, index: number) => Promise<R>,
    batchSize: number = 5
  ): Promise<R[]> {
    const results: R[] = []
    
    for (let i = 0; i < items.length; i += batchSize) {
      // Check memory before each batch
      if (this.isMemoryHigh()) {
        this.performCleanup()
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      const batch = items.slice(i, i + batchSize)
      const batchPromises = batch.map((item, batchIndex) => 
        processor(item, i + batchIndex)
      )
      
      try {
        const batchResults = await Promise.all(batchPromises)
        results.push(...batchResults)
      } catch (error) {
        console.error(`Error processing batch starting at index ${i}:`, error)
        throw error
      }

      // Allow browser to breathe between batches
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    
    return results
  }

  // Create memory-efficient blob from large data
  createOptimizedBlob(data: string | ArrayBuffer, type: string = 'text/plain'): Blob {
    // For large data, create blob in chunks to avoid memory spikes
    if (typeof data === 'string' && data.length > this.config.chunkSize) {
      const chunks: string[] = []
      for (let i = 0; i < data.length; i += this.config.chunkSize) {
        chunks.push(data.slice(i, i + this.config.chunkSize))
      }
      return new Blob(chunks, { type })
    }
    
    return new Blob([data], { type })
  }

  // Cleanup resources
  cleanup(): void {
    this.stopMemoryMonitoring()
    this.cache.clear()
    this.performCleanup()
  }

  // Get memory usage report
  getMemoryReport(): {
    stats: MemoryStats
    cacheStats: any
    recommendations: string[]
  } {
    const stats = this.getMemoryStats()
    const cacheStats = this.cache.getStats()
    const recommendations: string[] = []

    if (stats.percentage > 80) {
      recommendations.push('Bộ nhớ sử dụng cao, nên đóng các tab khác')
    }

    if (cacheStats.memorySize > this.config.maxMemoryUsage * 0.5) {
      recommendations.push('Cache sử dụng nhiều bộ nhớ, sẽ tự động dọn dẹp')
    }

    if (stats.usedJSHeapSize > this.config.warningThreshold) {
      recommendations.push('Nên refresh trang để giải phóng bộ nhớ')
    }

    return {
      stats,
      cacheStats,
      recommendations
    }
  }
}

// File streaming utilities
export class FileStreamer {
  private memoryManager: AdvancedMemoryManager

  constructor() {
    this.memoryManager = AdvancedMemoryManager.getInstance()
  }

  // Stream file reading
  async *readFileStream(file: File, chunkSize: number = 1024 * 1024): AsyncGenerator<StreamChunk> {
    const totalChunks = Math.ceil(file.size / chunkSize)

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const chunk = file.slice(start, end)
      
      const data = await chunk.arrayBuffer()
      
      yield {
        data,
        index: i,
        isLast: i === totalChunks - 1
      }

      // Memory check between chunks
      if (this.memoryManager.isMemoryHigh()) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
  }

  // Stream file writing (for downloads)
  async streamDownload(
    data: string | ArrayBuffer,
    filename: string,
    mimeType: string = 'application/octet-stream'
  ): Promise<void> {
    const blob = this.memoryManager.createOptimizedBlob(data, mimeType)
    
    // Create download link
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    
    // Trigger download
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Cleanup
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}

// Export singleton instance
export const memoryManager = AdvancedMemoryManager.getInstance()
export const fileStreamer = new FileStreamer()

// Classes are already exported above