import JSZip from 'jszip'

function decodeXml(str: string) {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function cleanXmlTags(str: string) {
  return str
    // Remove XML tags like <w:tab>, <w:rPr>, etc.
    .replace(/<\/?w:[^>]*>/g, '')
    // Remove other XML-like tags
    .replace(/<[^>]*>/g, '')
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    .trim()
}

export async function splitDocxIntoPagesHtml(buffer: Buffer): Promise<string[]> {
  const zip = await JSZip.loadAsync(buffer)
  const docPath = Object.keys(zip.files).find(p => p.toLowerCase() === 'word/document.xml')
  if (!docPath) return []

  const xml = await zip.file(docPath)!.async('text')

  // FIXED: Enhanced page break detection with multiple patterns
  const withTokens = xml
    .replace(/<w:br[^>]*w:type="page"[^>]*\/>/gi, '<w:t>[[PAGE_BREAK]]</w:t>')
    .replace(/<w:lastRenderedPageBreak\s*\/>/gi, '<w:t>[[PAGE_BREAK]]</w:t>')
    .replace(/<w:pageBreakBefore[^>]*\/>/gi, '<w:t>[[PAGE_BREAK]]</w:t>')
    .replace(/<w:sectPr[^>]*>[\s\S]*?<\/w:sectPr>/gi, '<w:t>[[PAGE_BREAK]]</w:t>')

  // Split by paragraphs
  const paragraphRegex = /<w:p[^>]*>[\s\S]*?<\/w:p>/gi
  const paragraphs = withTokens.match(paragraphRegex) || []

  const pages: string[] = []
  let currentParts: string[] = []

  for (const p of paragraphs) {
    // FIXED: Enhanced text extraction including tables and other elements
    const runs = [...p.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/gi)]
    
    // Check for tables within paragraph
    const tables = [...p.matchAll(/<w:tbl[^>]*>[\s\S]*?<\/w:tbl>/gi)]
    
    if (runs.length === 0 && tables.length === 0) {
      // Check if paragraph has other content like images or shapes
      const hasOtherContent = p.includes('<w:drawing>') || p.includes('<w:pict>') || p.includes('<w:object>')
      if (hasOtherContent) {
        currentParts.push('<p>[Nội dung đa phương tiện]</p>')
      } else {
        // Keep empty paragraphs to preserve structure
        currentParts.push('<p>&nbsp;</p>')
      }
      continue
    }

    let raw = ''
    
    // Extract text from runs
    if (runs.length > 0) {
      raw += runs.map(m => decodeXml(m[1])).join('')
    }
    
    // Extract text from tables (simplified)
    if (tables.length > 0) {
      for (const table of tables) {
        const tableCells = [...table[0].matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/gi)]
        if (tableCells.length > 0) {
          raw += ' [Bảng: ' + tableCells.map(m => decodeXml(m[1])).join(' | ') + '] '
        }
      }
    }

    // Split by page break tokens inside paragraph
    const segments = raw.split('[[PAGE_BREAK]]')
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i].trim()
      if (seg.length > 0) {
        const cleanedSeg = cleanXmlTags(seg)
        const html = `<p>${escapeHtml(cleanedSeg)}</p>`
        currentParts.push(html)
      }

      const hasMore = i < segments.length - 1
      if (hasMore) {
        // Finish current page and start a new one
        if (currentParts.length > 0) {
          pages.push(currentParts.join('\n'))
        } else {
          // Add placeholder for empty page
          pages.push('<p>&nbsp;</p>')
        }
        currentParts = []
      }
    }
  }

  // Push remaining content as last page
  if (currentParts.length > 0) {
    pages.push(currentParts.join('\n'))
  }

  // FIXED: Ensure we don't have completely empty pages
  const filteredPages = pages.map(page => {
    const trimmed = page.trim()
    if (trimmed === '' || trimmed === '<p></p>') {
      return '<p>&nbsp;</p>' // Replace empty pages with non-breaking space
    }
    return page
  })

  // Normalize: ensure at least one page
  if (filteredPages.length === 0) filteredPages.push('<p>&nbsp;</p>')
  return filteredPages
}
