import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'

const CONTENT_TYPES: Record<string, string> = {
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
}

export async function GET(
  _req: NextRequest,
  context: { params: { file: string[] } }
) {
  try {
    const parts = context.params.file || []
    const safeParts = parts.filter((p) => p && p !== '..' && p !== '/')
    const absPath = path.join(process.cwd(), 'uploads', ...safeParts)

    if (!absPath.startsWith(path.join(process.cwd(), 'uploads'))) {
      return new Response('Forbidden', { status: 403 })
    }

    if (!fs.existsSync(absPath) || !fs.statSync(absPath).isFile()) {
      return new Response('Not found', { status: 404 })
    }

    const ext = path.extname(absPath).toLowerCase()
    const mime = CONTENT_TYPES[ext] || 'application/octet-stream'
    const data = fs.readFileSync(absPath)

    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Disposition': `inline; filename="${path.basename(absPath)}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (err) {
    console.error('Error serving upload:', err)
    return new Response('Internal Server Error', { status: 500 })
  }
}
