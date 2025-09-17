// Advanced caching system for template loading and content management
import { LRUCache } from 'lru-cache'

// Cache configuration interface
interface CacheConfig {
  maxSize: number
  ttl: number // Time to live in milliseconds
  updateAgeOnGet: boolean
}

// Cache entry interface
interface CacheEntry<T> {
  data: T
  timestamp: number
  accessCount: number
  size: number
}

// Multi-level cache system
export class AdvancedCache {
  private memoryCache: LRUCache<string, CacheEntry<any>>
  private persistentCache: Map<string, CacheEntry<any>>
  private config: CacheConfig

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 100 * 1024 * 1024, // 100MB default
      ttl: 5 * 60 * 1000, // 5 minutes default
      updateAgeOnGet: true,
      ...config
    }

    // Initialize LRU cache for memory
    this.memoryCache = new LRUCache({
      max: 100, // Max number of items
      maxSize: this.config.maxSize,
      sizeCalculation: (entry: CacheEntry<any>) => entry.size,
      ttl: this.config.ttl,
      updateAgeOnGet: this.config.updateAgeOnGet,
      dispose: (entry: CacheEntry<any>, key: string) => {
        console.log(`Cache entry disposed: ${key}`)
      }
    })

    // Initialize persistent cache (could be localStorage in browser)
    this.persistentCache = new Map()

    // Load persistent cache from localStorage if available
    this.loadPersistentCache()

    // Setup periodic cleanup
    this.setupCleanup()
  }

  // Calculate size of data
  private calculateSize(data: any): number {
    if (typeof data === 'string') {
      return data.length * 2 // UTF-16 encoding
    }
    
    if (data instanceof ArrayBuffer) {
      return data.byteLength
    }
    
    if (data instanceof Blob) {
      return data.size
    }
    
    // Estimate size for objects
    return JSON.stringify(data).length * 2
  }

  // Set cache entry
  set(key: string, data: any, options: { ttl?: number; persistent?: boolean } = {}): void {
    const size = this.calculateSize(data)
    const entry: CacheEntry<any> = {
      data,
      timestamp: Date.now(),
      accessCount: 0,
      size
    }

    // Set in memory cache
    this.memoryCache.set(key, entry, { ttl: options.ttl })

    // Set in persistent cache if requested
    if (options.persistent) {
      this.persistentCache.set(key, entry)
      this.savePersistentCache()
    }
  }

  // Get cache entry
  get(key: string): any | null {
    // Try memory cache first
    let entry = this.memoryCache.get(key)
    
    if (entry) {
      entry.accessCount++
      return entry.data
    }

    // Try persistent cache
    entry = this.persistentCache.get(key)
    if (entry) {
      // Check if expired
      if (Date.now() - entry.timestamp > this.config.ttl) {
        this.persistentCache.delete(key)
        this.savePersistentCache()
        return null
      }

      entry.accessCount++
      
      // Promote to memory cache
      this.memoryCache.set(key, entry)
      
      return entry.data
    }

    return null
  }

  // Check if key exists
  has(key: string): boolean {
    return this.memoryCache.has(key) || this.persistentCache.has(key)
  }

  // Delete cache entry
  delete(key: string): boolean {
    const memoryDeleted = this.memoryCache.delete(key)
    const persistentDeleted = this.persistentCache.delete(key)
    
    if (persistentDeleted) {
      this.savePersistentCache()
    }
    
    return memoryDeleted || persistentDeleted
  }

  // Clear all cache
  clear(): void {
    this.memoryCache.clear()
    this.persistentCache.clear()
    this.savePersistentCache()
  }

  // Get cache statistics
  getStats(): {
    memorySize: number
    memoryCount: number
    persistentSize: number
    persistentCount: number
    hitRate: number
  } {
    const memoryStats = {
      size: this.memoryCache.calculatedSize || 0,
      count: this.memoryCache.size
    }

    let persistentSize = 0
    for (const entry of this.persistentCache.values()) {
      persistentSize += entry.size
    }

    return {
      memorySize: memoryStats.size,
      memoryCount: memoryStats.count,
      persistentSize,
      persistentCount: this.persistentCache.size,
      hitRate: this.calculateHitRate()
    }
  }

  // Calculate hit rate
  private calculateHitRate(): number {
    let totalAccess = 0
    let totalHits = 0

    for (const entry of this.memoryCache.values()) {
      totalAccess += entry.accessCount
      if (entry.accessCount > 0) totalHits++
    }

    for (const entry of this.persistentCache.values()) {
      totalAccess += entry.accessCount
      if (entry.accessCount > 0) totalHits++
    }

    return totalAccess > 0 ? totalHits / totalAccess : 0
  }

  // Load persistent cache from localStorage
  private loadPersistentCache(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('advanced-cache')
      if (stored) {
        const data = JSON.parse(stored)
        this.persistentCache = new Map(data)
      }
    } catch (error) {
      console.warn('Failed to load persistent cache:', error)
    }
  }

  // Save persistent cache to localStorage
  private savePersistentCache(): void {
    if (typeof window === 'undefined') return

    try {
      const data = Array.from(this.persistentCache.entries())
      localStorage.setItem('advanced-cache', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save persistent cache:', error)
    }
  }

  // Setup periodic cleanup
  private setupCleanup(): void {
    if (typeof setInterval === 'undefined') return

    setInterval(() => {
      this.cleanup()
    }, 60000) // Cleanup every minute
  }

  // Cleanup expired entries
  private cleanup(): void {
    const now = Date.now()
    
    // Cleanup persistent cache
    for (const [key, entry] of this.persistentCache.entries()) {
      if (now - entry.timestamp > this.config.ttl) {
        this.persistentCache.delete(key)
      }
    }
    
    this.savePersistentCache()
  }
}

// Template-specific cache manager
export class TemplateCacheManager {
  private cache: AdvancedCache
  private static instance: TemplateCacheManager

  constructor() {
    this.cache = new AdvancedCache({
      maxSize: 200 * 1024 * 1024, // 200MB for templates
      ttl: 10 * 60 * 1000, // 10 minutes for templates
      updateAgeOnGet: true
    })
  }

  static getInstance(): TemplateCacheManager {
    if (!TemplateCacheManager.instance) {
      TemplateCacheManager.instance = new TemplateCacheManager()
    }
    return TemplateCacheManager.instance
  }

  // Cache template content
  cacheTemplate(templateId: string, content: string, pageNumber?: number): void {
    const key = pageNumber 
      ? `template:${templateId}:page:${pageNumber}`
      : `template:${templateId}:full`
    
    this.cache.set(key, content, { persistent: true })
  }

  // Get cached template
  getTemplate(templateId: string, pageNumber?: number): string | null {
    const key = pageNumber 
      ? `template:${templateId}:page:${pageNumber}`
      : `template:${templateId}:full`
    
    return this.cache.get(key)
  }

  // Cache template metadata
  cacheTemplateMetadata(templateId: string, metadata: any): void {
    const key = `template:${templateId}:metadata`
    this.cache.set(key, metadata, { persistent: true })
  }

  // Get cached template metadata
  getTemplateMetadata(templateId: string): any | null {
    const key = `template:${templateId}:metadata`
    return this.cache.get(key)
  }

  // Cache processed DOCX pages
  cacheDocxPages(templateId: string, pages: string[]): void {
    const key = `template:${templateId}:docx:pages`
    this.cache.set(key, pages, { persistent: true })
  }

  // Get cached DOCX pages
  getDocxPages(templateId: string): string[] | null {
    const key = `template:${templateId}:docx:pages`
    return this.cache.get(key)
  }

  // Invalidate template cache
  invalidateTemplate(templateId: string): void {
    const keysToDelete = [
      `template:${templateId}:full`,
      `template:${templateId}:metadata`,
      `template:${templateId}:docx:pages`
    ]

    keysToDelete.forEach(key => this.cache.delete(key))

    // Delete page-specific caches
    // Note: In a real implementation, you'd want to track page keys
    // This is a simplified version
  }

  // Get cache statistics
  getStats() {
    return this.cache.getStats()
  }

  // Clear all template cache
  clearAll(): void {
    this.cache.clear()
  }
}

// Content cache manager for edited content
export class ContentCacheManager {
  private cache: AdvancedCache
  private static instance: ContentCacheManager

  constructor() {
    this.cache = new AdvancedCache({
      maxSize: 50 * 1024 * 1024, // 50MB for content
      ttl: 30 * 60 * 1000, // 30 minutes for edited content
      updateAgeOnGet: true
    })
  }

  static getInstance(): ContentCacheManager {
    if (!ContentCacheManager.instance) {
      ContentCacheManager.instance = new ContentCacheManager()
    }
    return ContentCacheManager.instance
  }

  // Cache edited content
  cacheContent(reportId: string, templateId: string, pageNumber: number, content: string): void {
    const key = `content:${reportId}:${templateId}:${pageNumber}`
    this.cache.set(key, content, { persistent: false }) // Don't persist edited content
  }

  // Get cached content
  getContent(reportId: string, templateId: string, pageNumber: number): string | null {
    const key = `content:${reportId}:${templateId}:${pageNumber}`
    return this.cache.get(key)
  }

  // Cache auto-save content
  cacheAutoSave(reportId: string, templateId: string, pageNumber: number, content: string): void {
    const key = `autosave:${reportId}:${templateId}:${pageNumber}`
    this.cache.set(key, content, { ttl: 5 * 60 * 1000 }) // 5 minutes for auto-save
  }

  // Get auto-save content
  getAutoSave(reportId: string, templateId: string, pageNumber: number): string | null {
    const key = `autosave:${reportId}:${templateId}:${pageNumber}`
    return this.cache.get(key)
  }

  // Clear auto-save for specific content
  clearAutoSave(reportId: string, templateId: string, pageNumber: number): void {
    const key = `autosave:${reportId}:${templateId}:${pageNumber}`
    this.cache.delete(key)
  }

  // Get cache statistics
  getStats() {
    return this.cache.getStats()
  }
}

// Cache warming utilities
export class CacheWarmer {
  private templateCache: TemplateCacheManager
  private contentCache: ContentCacheManager

  constructor() {
    this.templateCache = TemplateCacheManager.getInstance()
    this.contentCache = ContentCacheManager.getInstance()
  }

  // Warm up template cache
  async warmTemplateCache(templateId: string): Promise<void> {
    try {
      // Load template metadata
      const metadataResponse = await fetch(`/api/templates/${templateId}/metadata`)
      if (metadataResponse.ok) {
        const metadata = await metadataResponse.json()
        this.templateCache.cacheTemplateMetadata(templateId, metadata)

        // Pre-load first few pages
        const pagesToPreload = Math.min(5, metadata.totalPages || 1)
        
        for (let page = 1; page <= pagesToPreload; page++) {
          const contentResponse = await fetch(
            `/api/templates/content?templateId=${templateId}&pageNumber=${page}`
          )
          
          if (contentResponse.ok) {
            const data = await contentResponse.json()
            this.templateCache.cacheTemplate(templateId, data.content, page)
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to warm cache for template ${templateId}:`, error)
    }
  }

  // Warm up multiple templates
  async warmMultipleTemplates(templateIds: string[]): Promise<void> {
    const promises = templateIds.map(id => this.warmTemplateCache(id))
    await Promise.allSettled(promises)
  }
}

// Export singleton instances
export const templateCache = TemplateCacheManager.getInstance()
export const contentCache = ContentCacheManager.getInstance()
export const cacheWarmer = new CacheWarmer()

// Classes are already exported above