'use client'

import React, { useState, useEffect } from 'react'
import { memoryManager } from '@/lib/memory-manager'
import { templateCache, contentCache } from '@/lib/advanced-cache'
import { PerformanceMonitor } from '@/lib/performance-optimizer'

interface PerformanceDashboardProps {
  isVisible: boolean
  onClose: () => void
}

export default function PerformanceDashboard({ isVisible, onClose }: PerformanceDashboardProps) {
  const [memoryStats, setMemoryStats] = useState<any>({})
  const [cacheStats, setCacheStats] = useState<any>({})
  const [performanceMetrics, setPerformanceMetrics] = useState<any>({})
  const [recommendations, setRecommendations] = useState<string[]>([])

  useEffect(() => {
    if (!isVisible) return

    const updateStats = () => {
      // Memory statistics
      const memoryReport = memoryManager.getMemoryReport()
      setMemoryStats(memoryReport.stats)
      setRecommendations(memoryReport.recommendations)

      // Cache statistics
      const templateCacheStats = templateCache.getStats()
      const contentCacheStats = contentCache.getStats()
      setCacheStats({
        template: templateCacheStats,
        content: contentCacheStats
      })

      // Performance metrics
      const metrics = PerformanceMonitor.getMetrics()
      setPerformanceMetrics(metrics)
    }

    updateStats()
    const interval = setInterval(updateStats, 2000)

    return () => clearInterval(interval)
  }, [isVisible])

  if (!isVisible) return null

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getMemoryColor = (percentage: number): string => {
    if (percentage > 80) return 'text-red-600 bg-red-100'
    if (percentage > 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Memory Usage */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Sử Dụng Bộ Nhớ</h3>
            <div className="space-y-2">
              <div className={`p-2 rounded ${getMemoryColor(memoryStats.percentage || 0)}`}>
                <div className="text-sm font-medium">
                  Đã sử dụng: {formatBytes(memoryStats.usedJSHeapSize || 0)}
                </div>
                <div className="text-xs">
                  Tổng: {formatBytes(memoryStats.totalJSHeapSize || 0)}
                </div>
                <div className="text-xs">
                  Giới hạn: {formatBytes(memoryStats.jsHeapSizeLimit || 0)}
                </div>
                <div className="text-xs font-bold">
                  {(memoryStats.percentage || 0).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Template Cache */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Template Cache</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Kích thước:</span> {formatBytes(cacheStats.template?.memorySize || 0)}
              </div>
              <div>
                <span className="font-medium">Số lượng:</span> {cacheStats.template?.memoryCount || 0}
              </div>
              <div>
                <span className="font-medium">Hit rate:</span> {((cacheStats.template?.hitRate || 0) * 100).toFixed(1)}%
              </div>
              <div>
                <span className="font-medium">Persistent:</span> {cacheStats.template?.persistentCount || 0}
              </div>
            </div>
          </div>

          {/* Content Cache */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Content Cache</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Kích thước:</span> {formatBytes(cacheStats.content?.memorySize || 0)}
              </div>
              <div>
                <span className="font-medium">Số lượng:</span> {cacheStats.content?.memoryCount || 0}
              </div>
              <div>
                <span className="font-medium">Hit rate:</span> {((cacheStats.content?.hitRate || 0) * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
            <h3 className="text-lg font-semibold mb-3">Performance Metrics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(performanceMetrics).map(([name, data]: [string, any]) => (
                <div key={name} className="text-sm">
                  <div className="font-medium">{name}:</div>
                  <div className="text-gray-600">
                    Trung bình: {data.average?.toFixed(2)}ms
                  </div>
                  <div className="text-gray-600">
                    Số lần: {data.count}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Khuyến Nghị</h3>
            {recommendations.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-yellow-500 mr-2">⚠️</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-green-600 text-sm">✅ Hiệu suất tốt</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => {
              templateCache.clearAll()
              contentCache.clearAll()
            }}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Xóa Cache
          </button>
          
          <button
            onClick={() => {
              memoryManager.forceGarbageCollection()
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Force GC
          </button>
          
          <button
            onClick={() => {
              PerformanceMonitor.clearMetrics()
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Reset Metrics
          </button>
          
          <button
            onClick={() => {
              const report = memoryManager.getMemoryReport()
              console.log('Performance Report:', report)
              alert('Chi tiết báo cáo đã được ghi vào console')
            }}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Export Report
          </button>
        </div>

        {/* Real-time Memory Graph */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Memory Usage Over Time</h3>
          <MemoryGraph />
        </div>
      </div>
    </div>
  )
}

// Simple memory usage graph component
function MemoryGraph() {
  const [memoryHistory, setMemoryHistory] = useState<number[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      const stats = memoryManager.getMemoryStats()
      setMemoryHistory(prev => {
        const newHistory = [...prev, stats.percentage || 0]
        return newHistory.slice(-50) // Keep last 50 data points
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const maxValue = Math.max(...memoryHistory, 100)
  const points = memoryHistory.map((value, index) => {
    const x = (index / (memoryHistory.length - 1)) * 300
    const y = 100 - (value / maxValue) * 100
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="bg-white p-4 rounded border">
      <svg width="300" height="100" className="w-full">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(y => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="300"
            y2={y}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}
        
        {/* Memory usage line */}
        {memoryHistory.length > 1 && (
          <polyline
            points={points}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
          />
        )}
        
        {/* Labels */}
        <text x="5" y="15" fontSize="12" fill="#6b7280">100%</text>
        <text x="5" y="95" fontSize="12" fill="#6b7280">0%</text>
      </svg>
    </div>
  )
}