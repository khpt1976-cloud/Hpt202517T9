"use client"

import React, { useEffect, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Save, Undo, Redo, Edit3, Eye } from 'lucide-react'

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })
import 'react-quill/dist/quill.snow.css'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  onSave?: () => void
  readOnly?: boolean
  placeholder?: string
  autoSaveInterval?: number // in milliseconds, default 30000 (30s)
}

interface HistoryState {
  content: string
  timestamp: number
}

export default function RichTextEditor({
  content,
  onChange,
  onSave,
  readOnly = false,
  placeholder = "Start editing...",
  autoSaveInterval = 30000
}: RichTextEditorProps) {
  const [editorContent, setEditorContent] = useState(content)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // History management for undo/redo
  const [history, setHistory] = useState<HistoryState[]>([{ content, timestamp: Date.now() }])
  const [historyIndex, setHistoryIndex] = useState(0)
  
  const quillRef = useRef<any>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastChangeRef = useRef<number>(Date.now())

  // Quill modules configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
    history: {
      delay: 1000,
      maxStack: 100,
      userOnly: true
    }
  }

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list', 'bullet', 'indent',
    'align', 'link', 'image'
  ]

  // Update editor content when prop changes
  useEffect(() => {
    if (content !== editorContent && !isEditing) {
      setEditorContent(content)
      // Reset history when content changes from outside
      setHistory([{ content, timestamp: Date.now() }])
      setHistoryIndex(0)
      setHasUnsavedChanges(false)
    }
  }, [content, editorContent, isEditing])

  // Auto-save functionality
  useEffect(() => {
    if (!isEditing || !hasUnsavedChanges) return

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // Set new timer
    autoSaveTimerRef.current = setTimeout(() => {
      handleAutoSave()
    }, autoSaveInterval)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [editorContent, isEditing, hasUnsavedChanges, autoSaveInterval])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditing) return

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        handleRedo()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isEditing, historyIndex, history])

  const handleContentChange = useCallback((value: string) => {
    setEditorContent(value)
    setHasUnsavedChanges(true)
    lastChangeRef.current = Date.now()
    
    // Add to history if significant change
    const now = Date.now()
    if (now - lastChangeRef.current > 1000) { // Only add to history if 1s passed
      addToHistory(value)
    }
    
    onChange(value)
  }, [onChange])

  const addToHistory = useCallback((content: string) => {
    const newHistoryState: HistoryState = {
      content,
      timestamp: Date.now()
    }
    
    // Remove any history after current index (when user made changes after undo)
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newHistoryState)
    
    // Limit history size
    if (newHistory.length > 50) {
      newHistory.shift()
    } else {
      setHistoryIndex(historyIndex + 1)
    }
    
    setHistory(newHistory)
  }, [history, historyIndex])

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      const previousState = history[newIndex]
      setEditorContent(previousState.content)
      setHistoryIndex(newIndex)
      onChange(previousState.content)
      setHasUnsavedChanges(true)
    }
  }, [historyIndex, history, onChange])

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      const nextState = history[newIndex]
      setEditorContent(nextState.content)
      setHistoryIndex(newIndex)
      onChange(nextState.content)
      setHasUnsavedChanges(true)
    }
  }, [historyIndex, history, onChange])

  const handleAutoSave = useCallback(async () => {
    if (!hasUnsavedChanges) return

    try {
      // Save to localStorage as backup
      const autoSaveKey = `editor-autosave-${Date.now()}`
      localStorage.setItem(autoSaveKey, JSON.stringify({
        content: editorContent,
        timestamp: Date.now()
      }))

      // Clean up old autosave entries (keep only last 5)
      const keys = Object.keys(localStorage).filter(key => key.startsWith('editor-autosave-'))
      if (keys.length > 5) {
        keys.sort().slice(0, -5).forEach(key => localStorage.removeItem(key))
      }

      setLastSaved(new Date())
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Auto-save failed:', error)
    }
  }, [editorContent, hasUnsavedChanges])

  const handleSave = useCallback(async () => {
    if (!onSave) return

    try {
      setIsSaving(true)
      await onSave()
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }, [onSave])

  const toggleEditMode = () => {
    if (isEditing && hasUnsavedChanges) {
      // Auto-save when exiting edit mode
      handleAutoSave()
    }
    setIsEditing(!isEditing)
  }

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  return (
    <div className="rich-text-editor">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleEditMode}
            disabled={readOnly}
          >
            {isEditing ? (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </>
            ) : (
              <>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </>
            )}
          </Button>
          
          {isEditing && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRedo}
                disabled={!canRedo}
                title="Redo (Ctrl+Y)"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-xs text-amber-600">Unsaved changes</span>
          )}
          {lastSaved && (
            <span className="text-xs text-gray-500">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {onSave && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Editor Content */}
      <div className="min-h-[400px] bg-white rounded-b-lg">
        {isEditing ? (
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={editorContent}
            onChange={handleContentChange}
            modules={modules}
            formats={formats}
            placeholder={placeholder}
            readOnly={readOnly}
            style={{ height: '400px' }}
          />
        ) : (
          <div className="p-6 prose max-w-none min-h-[400px]">
            <div dangerouslySetInnerHTML={{ __html: editorContent || 'No content available' }} />
          </div>
        )}
      </div>
    </div>
  )
}