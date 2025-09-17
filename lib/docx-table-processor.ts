/**
 * Enhanced DOCX Table Processor
 * Handles table extraction and conversion from DOCX to HTML with proper formatting
 */

import JSZip from 'jszip'

interface TableCell {
  content: string
  rowSpan?: number
  colSpan?: number
  style?: string
}

interface TableRow {
  cells: TableCell[]
}

interface Table {
  rows: TableRow[]
  style?: string
}

function decodeXml(str: string): string {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Extract and convert tables from DOCX XML to HTML
 */
export function extractTablesFromXml(xml: string): Table[] {
  const tables: Table[] = []
  
  // Find all table elements
  const tableRegex = /<w:tbl[^>]*>([\s\S]*?)<\/w:tbl>/gi
  let tableMatch
  
  while ((tableMatch = tableRegex.exec(xml)) !== null) {
    const tableXml = tableMatch[1]
    const table = parseTable(tableXml)
    if (table.rows.length > 0) {
      tables.push(table)
    }
  }
  
  return tables
}

/**
 * Parse a single table from XML
 */
function parseTable(tableXml: string): Table {
  const rows: TableRow[] = []
  
  // Extract table properties for styling
  const tblPrMatch = tableXml.match(/<w:tblPr[^>]*>([\s\S]*?)<\/w:tblPr>/)
  let tableStyle = 'border-collapse: collapse; width: 100%; margin: 10px 0;'
  
  if (tblPrMatch) {
    // Extract border information
    if (tblPrMatch[1].includes('<w:tblBorders>')) {
      tableStyle += ' border: 1px solid #000;'
    }
  }
  
  // Find all table rows
  const rowRegex = /<w:tr[^>]*>([\s\S]*?)<\/w:tr>/gi
  let rowMatch
  
  while ((rowMatch = rowRegex.exec(tableXml)) !== null) {
    const rowXml = rowMatch[1]
    const row = parseTableRow(rowXml)
    if (row.cells.length > 0) {
      rows.push(row)
    }
  }
  
  return { rows, style: tableStyle }
}

/**
 * Parse a table row from XML
 */
function parseTableRow(rowXml: string): TableRow {
  const cells: TableCell[] = []
  
  // Find all table cells
  const cellRegex = /<w:tc[^>]*>([\s\S]*?)<\/w:tc>/gi
  let cellMatch
  
  while ((cellMatch = cellRegex.exec(rowXml)) !== null) {
    const cellXml = cellMatch[1]
    const cell = parseTableCell(cellXml)
    cells.push(cell)
  }
  
  return { cells }
}

/**
 * Parse a table cell from XML
 */
function parseTableCell(cellXml: string): TableCell {
  let content = ''
  let cellStyle = 'border: 1px solid #000; padding: 5px; vertical-align: top;'
  
  // Extract cell properties
  const tcPrMatch = cellXml.match(/<w:tcPr[^>]*>([\s\S]*?)<\/w:tcPr>/)
  if (tcPrMatch) {
    // Check for cell borders
    if (tcPrMatch[1].includes('<w:tcBorders>')) {
      // Keep default border
    }
    
    // Check for cell shading/background
    const shadingMatch = tcPrMatch[1].match(/<w:shd[^>]*w:fill="([^"]*)"/)
    if (shadingMatch && shadingMatch[1] !== 'auto') {
      cellStyle += ` background-color: #${shadingMatch[1]};`
    }
    
    // Check for text alignment
    const alignMatch = tcPrMatch[1].match(/<w:vAlign[^>]*w:val="([^"]*)"/)
    if (alignMatch) {
      const alignment = alignMatch[1]
      if (alignment === 'center') {
        cellStyle += ' vertical-align: middle;'
      } else if (alignment === 'bottom') {
        cellStyle += ' vertical-align: bottom;'
      }
    }
  }
  
  // Extract text content from paragraphs within the cell
  const paragraphRegex = /<w:p[^>]*>([\s\S]*?)<\/w:p>/gi
  let paragraphMatch
  const paragraphs: string[] = []
  
  while ((paragraphMatch = paragraphRegex.exec(cellXml)) !== null) {
    const paragraphXml = paragraphMatch[1]
    const paragraphText = extractTextFromParagraph(paragraphXml)
    if (paragraphText.trim()) {
      paragraphs.push(paragraphText.trim())
    }
  }
  
  content = paragraphs.join('<br>')
  
  // If no content found, add non-breaking space
  if (!content.trim()) {
    content = '&nbsp;'
  }
  
  return { content, style: cellStyle }
}

/**
 * Extract text from a paragraph XML
 */
function extractTextFromParagraph(paragraphXml: string): string {
  const textParts: string[] = []
  
  // Find all text runs
  const runRegex = /<w:r[^>]*>([\s\S]*?)<\/w:r>/gi
  let runMatch
  
  while ((runMatch = runRegex.exec(paragraphXml)) !== null) {
    const runXml = runMatch[1]
    
    // Extract text from text elements
    const textRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/gi
    let textMatch
    
    while ((textMatch = textRegex.exec(runXml)) !== null) {
      const text = decodeXml(textMatch[1])
      textParts.push(text)
    }
    
    // Handle tabs
    if (runXml.includes('<w:tab/>')) {
      textParts.push('\t')
    }
    
    // Handle line breaks
    if (runXml.includes('<w:br/>')) {
      textParts.push('<br>')
    }
  }
  
  return textParts.join('')
}

/**
 * Convert tables to HTML with construction report styling
 */
export function tablesToHtml(tables: Table[]): string {
  if (tables.length === 0) return ''
  
  const htmlTables = tables.map(table => {
    const tableHtml = [`<table class="data-table" style="${table.style || 'border-collapse: collapse; width: 100%;'}">`]
    
    table.rows.forEach((row, rowIndex) => {
      tableHtml.push('  <tr>')
      
      row.cells.forEach(cell => {
        // Detect header cells (first row or cells with bold content)
        const isHeader = rowIndex === 0 || cell.content.includes('<strong>') || cell.content.includes('<b>')
        const cellTag = isHeader ? 'th' : 'td'
        const styleAttr = cell.style ? ` style="${cell.style}"` : ''
        const rowSpanAttr = cell.rowSpan && cell.rowSpan > 1 ? ` rowspan="${cell.rowSpan}"` : ''
        const colSpanAttr = cell.colSpan && cell.colSpan > 1 ? ` colspan="${cell.colSpan}"` : ''
        
        tableHtml.push(`    <${cellTag}${styleAttr}${rowSpanAttr}${colSpanAttr}>${cell.content}</${cellTag}>`)
      })
      
      tableHtml.push('  </tr>')
    })
    
    tableHtml.push('</table>')
    return tableHtml.join('\n')
  })
  
  return htmlTables.join('\n\n')
}

/**
 * Enhanced DOCX processing with better table support
 */
export async function processDocxWithTables(buffer: Buffer): Promise<{ content: string; tables: Table[] }> {
  const zip = await JSZip.loadAsync(buffer)
  const docPath = Object.keys(zip.files).find(p => p.toLowerCase() === 'word/document.xml')
  if (!docPath) return { content: '', tables: [] }

  const xml = await zip.file(docPath)!.async('text')
  
  // Extract tables
  const tables = extractTablesFromXml(xml)
  
  // Replace table XML with HTML placeholders
  let processedXml = xml
  tables.forEach((table, index) => {
    const tableHtml = tablesToHtml([table])
    // This is a simplified replacement - in a full implementation,
    // you'd want to replace the exact table XML with the HTML
    processedXml = processedXml.replace(/<w:tbl[^>]*>[\s\S]*?<\/w:tbl>/, `[[TABLE_${index}]]`)
  })
  
  // Process the rest of the content (paragraphs, etc.)
  const paragraphRegex = /<w:p[^>]*>([\s\S]*?)<\/w:p>/gi
  const paragraphs = processedXml.match(paragraphRegex) || []
  
  const contentParts: string[] = []
  
  for (const p of paragraphs) {
    const runs = [...p.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/gi)]
    if (runs.length > 0) {
      const text = runs.map(m => decodeXml(m[1])).join('')
      if (text.trim()) {
        contentParts.push(`<p>${escapeHtml(text)}</p>`)
      }
    }
  }
  
  // Replace table placeholders with actual HTML
  let finalContent = contentParts.join('\n')
  tables.forEach((table, index) => {
    const tableHtml = tablesToHtml([table])
    finalContent = finalContent.replace(`[[TABLE_${index}]]`, tableHtml)
  })
  
  // Wrap content in construction-report styling
  const wrappedContent = `<div class="construction-report vietnamese-text">${finalContent}</div>`
  
  return { content: wrappedContent, tables }
}