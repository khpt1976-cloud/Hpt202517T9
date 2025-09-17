'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  MemoryManager, 
  PerformanceMonitor, 
  useLazyLoading, 
  useDebounce,
  DocumentChunker 
} from '@/lib/performance-optimizer'

interface OptimizedPageViewerProps {
  templateId: string
  reportId?: string
  totalPages: number
  currentPage: number
  onPageChange: (page: number) => void
  onContentLoad: (content: string) => void
}

interface PageData {
  pageNumber: number
  content: string
  isLoaded: boolean
  isLoading: boolean
}

export default function OptimizedPageViewer({
  templateId,
  reportId,
  totalPages,
  currentPage,
  onPageChange,
  onContentLoad
}: OptimizedPageViewerProps) {
  const [pages, setPages] = useState<Map<number, PageData>>(new Map())
  const [loadingPages, setLoadingPages] = useState<Set<number>>(new Set())
  const memoryManager = MemoryManager.getInstance()

  // Debounced page loading to prevent excessive API calls
  const debouncedLoadPage = useDebounce(async (pageNumber: number) => {
    if (pages.has(pageNumber) && pages.get(pageNumber)?.isLoaded) {
      return
    }

    // Check memory usage before loading
    if (memoryManager.isMemoryHigh()) {
      // Clear old pages to free memory
      clearOldPages(pageNumber)
    }

    setLoadingPages(prev => new Set(prev).add(pageNumber))

    try {
      PerformanceMonitor.startMeasure(`load-page-${pageNumber}`)
      
      const cacheKey = `${templateId}-${reportId || 'template'}-${pageNumber}`
      let content = memoryManager.get(cacheKey)

      if (!content) {
        const response = await fetch(
          `/api/templates/content?templateId=${templateId}&pageNumber=${pageNumber}${
            reportId ? `&reportId=${reportId}` : ''
          }`
        )

        if (!response.ok) {
          throw new Error(`Failed to load page ${pageNumber}`)
        }

        const data = await response.json()
        content = data.content

        // Cache the content
        memoryManager.set(cacheKey, content)
      }

      const loadTime = PerformanceMonitor.endMeasure(`load-page-${pageNumber}`)
      console.log(`Page ${pageNumber} loaded in ${loadTime.toFixed(2)}ms`)

      setPages(prev => new Map(prev).set(pageNumber, {
        pageNumber,
        content,
        isLoaded: true,
        isLoading: false
      }))

      if (pageNumber === currentPage) {
        onContentLoad(content)
      }

    } catch (error) {
      console.error(`Error loading page ${pageNumber}:`, error)
      setPages(prev => new Map(prev).set(pageNumber, {
        pageNumber,
        content: '<p>Lỗi tải trang. Vui lòng thử lại.</p>',
        isLoaded: false,
        isLoading: false
      }))
    } finally {
      setLoadingPages(prev => {
        const newSet = new Set(prev)
        newSet.delete(pageNumber)
        return newSet
      })
    }
  }, 300)

  // Clear old pages to manage memory
  const clearOldPages = useCallback((currentPageNumber: number) => {
    const keepRange = 5 // Keep 5 pages before and after current page
    const pagesToKeep = new Set<number>()

    // Keep pages in range
    for (let i = Math.max(1, currentPageNumber - keepRange); 
         i <= Math.min(totalPages, currentPageNumber + keepRange); 
         i++) {
      pagesToKeep.add(i)
    }

    setPages(prev => {
      const newPages = new Map<number, PageData>()
      prev.forEach((pageData, pageNumber) => {
        if (pagesToKeep.has(pageNumber)) {
          newPages.set(pageNumber, pageData)
        } else {
          // Clear from memory cache as well
          const cacheKey = `${templateId}-${reportId || 'template'}-${pageNumber}`
          memoryManager.cache.delete(cacheKey)
        }
      })
      return newPages
    })

    // Force garbage collection if available
    if (memoryManager.isMemoryHigh()) {
      memoryManager.forceGC()
    }
  }, [templateId, reportId, totalPages, memoryManager])

  // Preload adjacent pages for smooth navigation
  const preloadAdjacentPages = useCallback((pageNumber: number) => {
    const preloadRange = 2
    
    for (let i = Math.max(1, pageNumber - preloadRange); 
         i <= Math.min(totalPages, pageNumber + preloadRange); 
         i++) {
      if (i !== pageNumber && !pages.has(i) && !loadingPages.has(i)) {
        // Preload with lower priority
        setTimeout(() => debouncedLoadPage(i), 100 * Math.abs(i - pageNumber))
      }
    }
  }, [totalPages, pages, loadingPages, debouncedLoadPage])

  // Load current page and preload adjacent pages
  useEffect(() => {
    debouncedLoadPage(currentPage)
    preloadAdjacentPages(currentPage)
  }, [currentPage, debouncedLoadPage, preloadAdjacentPages])

  // Get current page content
  const currentPageData = pages.get(currentPage)
  const isCurrentPageLoading = loadingPages.has(currentPage)

  // Chunked content rendering for large pages
  const chunkedContent = useMemo(() => {
    if (!currentPageData?.content) return []
    
    // Only chunk if content is very large (>10KB)
    if (currentPageData.content.length > 10000) {
      return DocumentChunker.chunkContent(currentPageData.content)
    }
    
    return [currentPageData.content]
  }, [currentPageData?.content])

  return (
    <div className="optimized-page-viewer">
      {/* Loading indicator */}
      {isCurrentPageLoading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Đang tải trang {currentPage}...</span>
        </div>
      )}

      {/* Page content */}
      {currentPageData && !isCurrentPageLoading && (
        <div className="page-content">
          {chunkedContent.map((chunk, index) => (
            <ChunkedContent 
              key={`${currentPage}-${index}`}
              content={chunk}
              chunkIndex={index}
            />
          ))}
        </div>
      )}

      {/* Memory usage indicator (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <MemoryUsageIndicator />
      )}

      {/* Performance metrics (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <PerformanceMetrics />
      )}
    </div>
  )
}

// Component for rendering chunked content with lazy loading
function ChunkedContent({ content, chunkIndex }: { content: string; chunkIndex: number }) {
  const { ref, isVisible } = useLazyLoading(0.1)

  return (
    <div ref={ref} className="chunk-content">
      {isVisible ? (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <div className="h-20 bg-gray-100 animate-pulse rounded" />
      )}
    </div>
  )
}

// Memory usage indicator for development
function MemoryUsageIndicator() {
  const [memoryUsage, setMemoryUsage] = useState(0)
  const memoryManager = MemoryManager.getInstance()

  useEffect(() => {
    const interval = setInterval(() => {
      setMemoryUsage(memoryManager.getMemoryUsage())
    }, 1000)

    return () => clearInterval(interval)
  }, [memoryManager])

  const memoryMB = Math.round(memoryUsage / (1024 * 1024))
  const isHigh = memoryManager.isMemoryHigh()

  return (
    <div className={`fixed bottom-4 right-4 p-2 rounded text-sm ${
      isHigh ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
    }`}>
      Memory: {memoryMB}MB {isHigh && '⚠️'}
    </div>
  )
}

// Performance metrics display for development
function PerformanceMetrics() {
  const [metrics, setMetrics] = useState<Record<string, { average: number; count: number }>>({})

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(PerformanceMonitor.getMetrics())
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed bottom-4 left-4 p-2 bg-blue-100 text-blue-800 rounded text-xs max-w-xs">
      <div className="font-semibold">Performance:</div>
      {Object.entries(metrics).map(([name, data]) => (
        <div key={name}>
          {name}: {data.average.toFixed(1)}ms ({data.count})
        </div>
      ))}
    </div>
  )
}