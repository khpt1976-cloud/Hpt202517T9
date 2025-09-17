"use client"

import { useRef, useEffect, useState } from 'react'

interface TinyMCEEditorProps {
  value: string
  onChange: (content: string) => void
  height?: number
  placeholder?: string
  disabled?: boolean
}

declare global {
  interface Window {
    tinymce: any
  }
}

export default function TinyMCEEditor({ 
  value, 
  onChange, 
  height = 400, 
  placeholder = "Nhập nội dung nhật ký thi công...",
  disabled = false 
}: TinyMCEEditorProps) {
  const editorRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [editorId] = useState(`tinymce-editor-${Math.random().toString(36).substr(2, 9)}`)

  useEffect(() => {
    const loadTinyMCE = async () => {
      if (typeof window === 'undefined') return

      // Check if TinyMCE is already loaded
      if (window.tinymce) {
        initializeEditor()
        return
      }

      // Load TinyMCE script
      const script = document.createElement('script')
      script.src = '/tinymce/tinymce.min.js'
      script.onload = () => {
        setIsLoaded(true)
        initializeEditor()
      }
      script.onerror = () => {
        console.error('Failed to load TinyMCE')
      }
      document.head.appendChild(script)
    }

    const initializeEditor = () => {
      if (!window.tinymce) return

      window.tinymce.init({
        selector: `#${editorId}`,
        height: height,
        menubar: true,
        license_key: 'gpl',  // ✅ Sử dụng GPL license (miễn phí)
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'help', 'wordcount',
          'directionality', 'emoticons', 'codesample'
        ],
        toolbar: 'undo redo | blocks | ' +
          'bold italic forecolor backcolor | alignleft aligncenter ' +
          'alignright alignjustify | bullist numlist outdent indent | ' +
          'removeformat | table | image media link | fullscreen preview | help',
        content_style: `
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            font-size: 14px; 
            line-height: 1.6;
            color: #333;
            background-color: #fff;
            margin: 20px;
          }
          h1, h2, h3, h4, h5, h6 {
            color: #2c3e50;
            margin-top: 20px;
            margin-bottom: 10px;
          }
          p {
            margin-bottom: 10px;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 15px 0;
          }
          table, th, td {
            border: 1px solid #ddd;
          }
          th, td {
            padding: 8px 12px;
            text-align: left;
          }
          th {
            background-color: #f8f9fa;
            font-weight: bold;
          }
        `,
        placeholder: placeholder,
        branding: false,
        promotion: false,
        directionality: 'ltr',
        paste_data_images: true,
        paste_as_text: false,
        paste_webkit_styles: 'font-weight font-style color',
        paste_retain_style_properties: 'color font-size font-family font-weight font-style text-decoration',
        image_advtab: true,
        image_uploadtab: true,
        file_picker_types: 'image',
        automatic_uploads: true,
        images_upload_handler: (blobInfo: any, success: any, failure: any) => {
          const reader = new FileReader()
          reader.onload = () => {
            success(reader.result)
          }
          reader.onerror = () => {
            failure('Image upload failed')
          }
          reader.readAsDataURL(blobInfo.blob())
        },
        setup: (editor: any) => {
          editorRef.current = editor
          
          editor.on('init', () => {
            console.log('TinyMCE Self-hosted Editor initialized successfully')
            if (value) {
              editor.setContent(value)
            }
          })

          editor.on('change keyup', () => {
            const content = editor.getContent()
            onChange(content)
          })
        }
      })
    }

    loadTinyMCE()

    return () => {
      if (window.tinymce && editorRef.current) {
        window.tinymce.remove(`#${editorId}`)
      }
    }
  }, [])

  // Update editor content when value prop changes
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getContent()) {
      editorRef.current.setContent(value || '')
    }
  }, [value])

  return (
    <div className="tinymce-wrapper w-full">
      <textarea
        id={editorId}
        defaultValue={value}
        className="w-full"
        style={{ display: 'none' }}
      />
      {!isLoaded && (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded border">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải Editor...</p>
          </div>
        </div>
      )}
    </div>
  )
}