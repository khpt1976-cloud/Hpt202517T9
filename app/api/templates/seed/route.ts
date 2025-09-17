import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import path from 'path'
import fs from 'fs'
import mammoth from 'mammoth'
import { getDocxPageCountFromAppXml } from '@/lib/docx-utils'

// POST /api/templates/seed - Import .docx templates from /templates into DB and mark defaults
export async function POST(_request: NextRequest) {
  try {
    const templatesDir = path.join(process.cwd(), 'templates')
    if (!fs.existsSync(templatesDir)) {
      return NextResponse.json({ success: false, error: 'Templates directory not found' }, { status: 404 })
    }

    const files = fs.readdirSync(templatesDir).filter(f => f.toLowerCase().endsWith('.docx'))
    if (files.length === 0) {
      return NextResponse.json({ success: false, error: 'No .docx files found in templates directory' }, { status: 404 })
    }

    const created: any[] = []

    for (const file of files) {
      const lower = file.toLowerCase()
      const isInitial = lower.includes('initial_') || lower.includes('mauchuandautien')
      const isDaily = lower.includes('daily_') || lower.includes('mauchuan2')

      if (!isInitial && !isDaily) continue

      // If already exists (by name), skip
      const name = path.basename(file, '.docx')
      const existing = await prisma.templateFile.findFirst({ where: { name } })
      if (existing) continue

      const filePath = path.join(templatesDir, file)
      const buffer = fs.readFileSync(filePath)

      // Calculate page count using preferred method
      let pageCount = 1
      try {
        const fromApp = await getDocxPageCountFromAppXml(buffer)
        if (fromApp && fromApp > 0) {
          pageCount = fromApp
        } else {
          const result = await mammoth.extractRawText({ path: filePath })
          const pageBreaks = (result.value.match(/\x0C/g) || []).length
          if (pageBreaks > 0) {
            pageCount = pageBreaks + 1
          } else {
            const paragraphs = result.value.split('\n').filter(p => p.trim().length > 0)
            const charCount = result.value.length
            const estimatedFromParagraphs = Math.max(1, Math.ceil(paragraphs.length / 25))
            const estimatedFromChars = Math.max(1, Math.ceil(charCount / 2500))
            const fileSizePages = Math.max(1, Math.ceil(buffer.length / 50000))
            pageCount = Math.round(estimatedFromParagraphs * 0.4 + estimatedFromChars * 0.4 + fileSizePages * 0.2)
          }
        }
      } catch {
        pageCount = Math.max(1, Math.ceil(buffer.length / 50000))
      }

      const fileType = isInitial ? 'INITIAL' : 'DAILY'
      const createdRec = await prisma.templateFile.create({
        data: {
          name,
          fileUrl: `/templates/${file}`,
          fileType: fileType as any,
          pageCount: Math.max(1, pageCount),
          fileSize: buffer.length,
          isDefault: false
        }
      })
      created.push(createdRec)
    }

    // Ensure defaults: pick by name keywords if present
    const all = await prisma.templateFile.findMany()
    const chooseDefault = async (type: 'INITIAL' | 'DAILY', keyword: string) => {
      const ofType = all.filter(t => t.fileType === type)
      if (ofType.length === 0) return
      const def = ofType.find(t => t.name.toLowerCase().includes(keyword)) || ofType[0]
      await prisma.templateFile.updateMany({ where: { fileType: type, isDefault: true }, data: { isDefault: false } })
      await prisma.templateFile.update({ where: { id: def.id }, data: { isDefault: true } })
    }

    await chooseDefault('INITIAL', 'mauchuandautien')
    await chooseDefault('DAILY', 'mauchuan2')

    return NextResponse.json({ success: true, createdCount: created.length, created })
  } catch (error) {
    console.error('Seed templates error:', error)
    return NextResponse.json({ success: false, error: 'Failed to seed templates', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
