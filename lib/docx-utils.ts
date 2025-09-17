import JSZip from 'jszip'

/**
 * Try to read the real page count from DOCX's docProps/app.xml
 * Returns number if found, otherwise null
 */
export async function getDocxPageCountFromAppXml(buffer: Buffer): Promise<number | null> {
  try {
    const zip = await JSZip.loadAsync(buffer)

    // Locate docProps/app.xml (case-insensitive)
    const appXmlPath = Object.keys(zip.files).find(
      (p) => p.toLowerCase() === 'docprops/app.xml'
    )

    if (!appXmlPath) return null

    const appXmlFile = zip.file(appXmlPath)
    if (!appXmlFile) return null

    const xml = await appXmlFile.async('text')

    // Common pattern: <Pages>123</Pages> (may include namespace prefixes)
    const match = xml.match(/<\s*([a-zA-Z0-9:]+:)?Pages\s*>\s*(\d+)\s*<\s*\/\s*([a-zA-Z0-9:]+:)?Pages\s*>/)
    if (match && match[2]) {
      const pages = parseInt(match[2], 10)
      if (!Number.isNaN(pages) && pages > 0) return pages
    }

    return null
  } catch (_err) {
    // If the file isn't a proper DOCX or zip parsing fails
    return null
  }
}
