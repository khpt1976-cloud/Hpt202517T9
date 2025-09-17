import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, templateType } = body;
    
    if (!templateId || !templateType) {
      return NextResponse.json({
        error: 'templateId and templateType are required'
      }, { status: 400 });
    }

    // Prefer DB lookup by templateId
    let filePathResolved: string | null = null
    let resolvedFileName: string | null = null

    try {
      const tpl = await prisma.templateFile.findUnique({ where: { id: templateId } })
      if (tpl?.fileUrl) {
        const publicPath = path.join(process.cwd(), 'public', tpl.fileUrl)
        const altPath1 = path.join(process.cwd(), 'templates', path.basename(tpl.fileUrl))
        const altPath2 = path.join(process.cwd(), 'public', 'templates', path.basename(tpl.fileUrl))
        if (fs.existsSync(publicPath)) filePathResolved = publicPath
        else if (fs.existsSync(altPath1)) filePathResolved = altPath1
        else if (fs.existsSync(altPath2)) filePathResolved = altPath2
        resolvedFileName = path.basename(tpl.fileUrl)
      }
    } catch (e) {
      console.warn('Template DB lookup failed; will fallback to filesystem search.', e)
    }

    // Fallback: search in templates directory by type
    if (!filePathResolved) {
      const templatesDir = path.join(process.cwd(), 'templates');
      if (!fs.existsSync(templatesDir)) {
        return NextResponse.json({ error: 'Templates directory not found' }, { status: 404 });
      }
      const files = fs.readdirSync(templatesDir);
      console.log('Available template files:', files);
      const fallbackFile = files.find(file => {
        if (!file.endsWith('.docx')) return false;
        if (templateType === 'initial') return file.includes('initial_') || file.includes('Mauchuandautien');
        if (templateType === 'daily') return file.includes('daily_') || file.includes('Mauchuan2');
        return false;
      });

      if (fallbackFile) {
        filePathResolved = path.join(templatesDir, fallbackFile);
        resolvedFileName = fallbackFile
      }
    }
    


    if (!filePathResolved) {
      return NextResponse.json({ error: `No template file found for type: ${templateType}` }, { status: 404 });
    }

    const buffer = fs.readFileSync(filePathResolved);

    // Extract HTML content from Word document
    const result = await mammoth.convertToHtml({ buffer });

    // Clean up the HTML content
    let htmlContent = result.value || '';

    // Remove empty paragraphs and clean up formatting
    htmlContent = htmlContent
      .replace(/<p><\/p>/g, '')
      .replace(/<p>\s*<\/p>/g, '')
      .replace(/style=\"[^\"]*\"/g, '') // Remove inline styles
      .trim();

    // If content is empty, provide default content
    if (!htmlContent || htmlContent === '') {
      htmlContent = `<p>Nội dung từ template ${templateType}</p>`;
    }

    return NextResponse.json({
      success: true,
      content: htmlContent,
      templateId,
      templateType,
      fileName: resolvedFileName || undefined,
      messages: result.messages || []
    });
    
  } catch (error) {
    console.error('Error reading Word template:', error);
    return NextResponse.json({
      error: 'Failed to read template content',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}