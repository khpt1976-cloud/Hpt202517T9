"use client"

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    tinymce: any
  }
}

interface TinyMCENewEditorProps {
  value?: string
  onChange?: (content: string) => void
  height?: number
  placeholder?: string
  readonly?: boolean
}

export default function TinyMCENewEditor({ 
  value = '', 
  onChange, 
  height = 600,
  placeholder = 'Nhập nội dung...',
  readonly = false
}: TinyMCENewEditorProps) {
  const editorRef = useRef<any>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    
    const script = document.createElement('script')
    script.src = '/tinymce/js/tinymce/tinymce.min.js'
    script.onload = () => {
      if (window.tinymce) {
        // Đợi một chút để đảm bảo DOM ready
        setTimeout(() => {
          window.tinymce.init({
          selector: '#tinymce-editor',
          height: 'calc(297mm + 200px)',
          width: '100%',
          menubar: !readonly,
          resize: false,
          readonly: readonly,
          license_key: 'gpl',  // ✅ Sử dụng GPL license (miễn phí)
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'help', 'wordcount'
          ],
          toolbar: readonly ? false : 'undo redo | blocks | ' +
            'bold italic forecolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | help',
          content_style: `
            body { 
              font-family: Helvetica, Arial, sans-serif; 
              font-size: 12pt;
              line-height: 1.5;
              margin: 0 auto;
              padding: 25mm 20mm;
              width: 210mm;
              max-width: 210mm;
              min-height: 297mm;
              box-sizing: border-box;
              background: white;
              overflow: visible;
            }
            /* XÓA TẤT CẢ ĐƯỜNG KẺ VÀ GUIDE */
            .mce-visual-blocks *,
            .mce-visual-blocks *:before,
            .mce-visual-blocks *:after,
            p, div, span, h1, h2, h3, h4, h5, h6 {
              border: none !important;
              outline: none !important;
            }
            /* XÓA ĐƯỜNG KẺ DASHED CHỈ CHO TEXT ELEMENTS */
            p, div:not(.image-slot-cell), span, h1, h2, h3, h4, h5, h6, 
            .mce-content-body > div:not(table):not(.image-slot-cell) {
              border-style: none !important;
              border-width: 0 !important;
            }
            
            /* GIỮ BORDER CHO TABLE VÀ IMAGE SLOTS */
            table, td, th, .image-slot-cell, img {
              border: inherit !important;
            }
            /* ẨN THANH TRƯỢT TRONG CONTENT */
            html::-webkit-scrollbar,
            body::-webkit-scrollbar {
              display: none !important;
            }
            html, body {
              -ms-overflow-style: none !important;
              scrollbar-width: none !important;
            }
          `,
          // XÓA WATERMARK "POWERED BY TINYMCE"
          branding: false,
          promotion: false,
          
          // ALLOW DATA ATTRIBUTES AND IMAGE ELEMENTS
          extended_valid_elements: 'img[src|alt|title|width|height|style|data-*],td[style|data-*|onclick|onmouseover|onmouseout|class|title],table[style|data-*],tr[style|data-*]',
          custom_elements: '~image-slot-cell',
          allow_unsafe_link_target: true,
          
          // PRESERVE DATA URLS AND ATTRIBUTES
          paste_data_images: true,
          images_dataimg_filter: function(img: any) {
            return true; // Allow all data images
          },
          setup: (editor: any) => {
            try {
              editorRef.current = editor
              editor.on('change', () => {
                try {
                  const content = editor.getContent()
                  onChange?.(content)
                } catch (error) {
                  console.log('Error getting content:', error)
                }
              })
              
              // XÓA ĐƯỜNG KẺ DỌC NGAY KHI INIT - CHỈ CHO TEXT ELEMENTS
              editor.on('init', () => {
                try {
                  const editorDoc = editor.getDoc();
                  if (editorDoc) {
                    const style = editorDoc.createElement('style');
                    style.textContent = `
                      /* XÓA BORDER CHỈ CHO TEXT ELEMENTS */
                      p, div:not(.image-slot-cell):not(table), span, h1, h2, h3, h4, h5, h6 {
                        border: none !important;
                        outline: none !important;
                      }
                      body p, body div:not(.image-slot-cell):not(table), body span {
                        border-left: none !important;
                        border-right: none !important;
                      }
                      
                      /* GIỮ BORDER CHO TABLE VÀ IMAGE ELEMENTS */
                      table, td, th, .image-slot-cell, img {
                        border: inherit !important;
                      }
                      
                      /* ẨN THANH TRƯỢT */
                      html::-webkit-scrollbar,
                      body::-webkit-scrollbar {
                        display: none !important;
                      }
                      html, body {
                        -ms-overflow-style: none !important;
                        scrollbar-width: none !important;
                      }
                    `;
                    editorDoc.head.appendChild(style);
                  }
                } catch (error) {
                  console.log('Error adding styles:', error)
                }
              });
            } catch (error) {
              console.log('Error in setup:', error)
            }
          },
          init_instance_callback: (editor: any) => {
            if (value) {
              editor.setContent(value)
            }
            // Xóa thêm bất kỳ branding nào còn sót lại
            setTimeout(() => {
              try {
                const container = editor.getContainer()
                if (container) {
                  const brandingElements = container.querySelectorAll('[class*="branding"], [class*="promotion"], [href*="tinymce"]')
                  brandingElements.forEach((el: any) => el.remove())
                }
                
                // Xóa thêm các element khác
                const moreElements = document.querySelectorAll('.tox-promotion, .tox-statusbar__branding, a[href*="tinymce.com"], a[href*="tiny.cloud"]')
                moreElements.forEach((el: any) => el.remove())
              } catch (error) {
                console.log('Error removing branding elements:', error)
              }
            }, 500)
          }
          })
          initialized.current = true
        }, 100) // Đợi 100ms
      }
    }
    
    script.onerror = () => {
      console.error('Failed to load TinyMCE')
    }
    
    document.head.appendChild(script)

    return () => {
      if (window.tinymce && editorRef.current) {
        try {
          window.tinymce.remove(editorRef.current)
        } catch (error) {
          console.log('Error removing editor:', error)
        }
      }
    }
  }, [])

  // Update readonly mode when readonly prop changes
  useEffect(() => {
    if (window.tinymce && editorRef.current) {
      try {
        editorRef.current.mode.set(readonly ? 'readonly' : 'design')
      } catch (error) {
        console.log('Error setting readonly mode:', error)
      }
    }
  }, [readonly])

  useEffect(() => {
    if (editorRef.current && editorRef.current.getContent && value !== editorRef.current.getContent()) {
      editorRef.current.setContent(value)
    }
  }, [value])

  return (
    <div className="w-full">
      <style jsx global>{`
        /* XÓA HOÀN TOÀN TẤT CẢ WATERMARK VÀ NÚT UPGRADE */
        .tox-promotion,
        .tox-statusbar__branding,
        .tox-statusbar a[href*="tinymce"],
        .tox-statusbar a[href*="tiny.cloud"],
        .tox-statusbar a[href*="upgrade"],
        .tox-statusbar__path + div,
        .tox-statusbar__right-container a,
        .tox-statusbar__right-container,
        .tox-notification--warning,
        .tox-notification--info,
        [class*="upgrade"],
        [class*="promotion"],
        [class*="branding"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          height: 0 !important;
          width: 0 !important;
          overflow: hidden !important;
        }
        
        /* Ẩn toàn bộ statusbar */
        .tox-statusbar {
          display: none !important;
        }
        
        /* Ẩn notification upgrade */
        .tox-notification {
          display: none !important;
        }
        
        /* STYLE CHO KHUNG SOẠN THẢO A4 GIỐNG HỆT WORD - GIỮA NGUYÊN VỊ TRÍ */
        .tox-edit-area {
          background: #f5f5f5 !important;
          padding: 20px !important;
          display: flex !important;
          justify-content: center !important;
          align-items: flex-start !important;
          overflow: visible !important;
          height: calc(100vh - 200px) !important;
          min-height: calc(297mm + 200px) !important;
        }
        
        .tox-edit-area iframe {
          background: white !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24) !important;
          border: 1px solid #ccc !important;
          border-radius: 0 !important;
          width: 210mm !important;
          height: 297mm !important;
          max-width: none !important;
          max-height: none !important;
          margin: 20px auto !important;
          display: block !important;
        }
        
        /* ẨN THANH TRƯỢT */
        .tox-edit-area::-webkit-scrollbar {
          display: none !important;
        }
        .tox-edit-area {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        
        /* XÓA HOÀN TOÀN ĐƯỜNG KẺ DỌC TRONG IFRAME */
        .tox-edit-area iframe html,
        .tox-edit-area iframe body,
        .tox-edit-area iframe * {
          border-left: none !important;
          border-right: none !important;
          border-top: none !important;
          border-bottom: none !important;
          outline: none !important;
        }
        
        /* ẨN THANH TRƯỢT TRONG IFRAME */
        .tox-edit-area iframe html::-webkit-scrollbar,
        .tox-edit-area iframe body::-webkit-scrollbar {
          display: none !important;
        }
        .tox-edit-area iframe html,
        .tox-edit-area iframe body {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        
        /* Responsive cho màn hình nhỏ - giữ kích thước A4 chuẩn */
        @media (max-width: 900px) {
          .tox-edit-area {
            padding: 10px !important;
          }
        }
        
        /* Đảm bảo fit trong màn hình */
        @media (max-height: 800px) {
          .tox-edit-area iframe {
            height: 70vh !important;
            width: calc(70vh * 210 / 297) !important;
          }
        }
      `}</style>
      <textarea 
        id="tinymce-editor"
        defaultValue={value}
        className="w-full"
      />
    </div>
  )
}