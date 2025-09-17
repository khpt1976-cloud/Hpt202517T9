import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { getDocxPageCountFromAppXml } from '@/lib/docx-utils';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    // Handle JSON input for testing
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { fileName, fileSize, mockContent } = body;
      
      if (!fileName) {
        return NextResponse.json({
          error: 'fileName is required for JSON input'
        }, { status: 400 });
      }
      
      // Mock processing for testing
      const text = mockContent || 'Mock document content for testing purposes. This is a sample document with multiple paragraphs and content that would span several pages when formatted properly.';
      const wordCount = text.split(/\s+/).length;
      const estimatedPages = Math.max(1, Math.ceil(wordCount / 250)); // ~250 words per page
      
      return NextResponse.json({
        success: true,
        data: {
          fileName,
          fileSize: fileSize || 0,
          pageCount: estimatedPages,
          wordCount,
          estimatedPages,
          method: 'mock_json_input',
          processingTime: Math.random() * 500 + 100 // Mock processing time
        }
      });
    }
    
    // Handle form data input (original functionality)
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.docx')) {
      return NextResponse.json({ error: 'Only DOCX files are supported' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const nodeBuffer = Buffer.from(arrayBuffer);
    
    try {
      // Preferred Method: Read real page count from docProps/app.xml if available
      const pagesFromAppXml = await getDocxPageCountFromAppXml(nodeBuffer);
      if (pagesFromAppXml && pagesFromAppXml > 0) {
        return NextResponse.json({
          pageCount: pagesFromAppXml,
          methods: {
            appXmlPages: pagesFromAppXml
          },
          fileInfo: {
            name: file.name,
            size: file.size
          }
        });
      }

      // Method 1: Extract raw text and count page breaks
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      // Count explicit page breaks (form feed characters)
      const pageBreaks = (result.value.match(/\x0C/g) || []).length;
      
      // Method 2: Estimate based on content structure
      const paragraphs = result.value.split('\n').filter(p => p.trim().length > 0);
      const estimatedFromParagraphs = Math.max(1, Math.ceil(paragraphs.length / 25)); // ~25 paragraphs per page
      
      // Method 3: Estimate based on character count (more accurate for Vietnamese text)
      const charCount = result.value.length;
      const estimatedFromChars = Math.max(1, Math.ceil(charCount / 2500)); // ~2500 chars per page
      
      // Method 4: Estimate based on file size
      const fileSizePages = Math.max(1, Math.ceil(file.size / 50000)); // ~50KB per page
      
      // Calculate final page count using weighted average
      // Give more weight to page breaks if they exist, otherwise use content-based estimation
      let finalPageCount: number;
      
      if (pageBreaks > 0) {
        // If explicit page breaks exist, use them as primary indicator
        finalPageCount = pageBreaks + 1;
      } else {
        // Use weighted average of estimation methods
        const weights = {
          paragraphs: 0.4,
          chars: 0.4,
          fileSize: 0.2
        };
        
        finalPageCount = Math.round(
          estimatedFromParagraphs * weights.paragraphs +
          estimatedFromChars * weights.chars +
          fileSizePages * weights.fileSize
        );
      }
      
      // Ensure minimum of 1 page
      finalPageCount = Math.max(1, finalPageCount);
      
      return NextResponse.json({ 
        pageCount: finalPageCount,
        methods: {
          appXmlPages: null,
          pageBreaks: pageBreaks + 1,
          estimatedFromParagraphs,
          estimatedFromChars,
          fileSizePages
        },
        fileInfo: {
          name: file.name,
          size: file.size,
          paragraphCount: paragraphs.length,
          characterCount: charCount
        }
      });
      
    } catch (mammothError) {
      console.error('Mammoth processing error:', mammothError);
      
      // Fallback: estimate from file size only
      const fallbackPageCount = Math.max(1, Math.ceil(file.size / 50000));
      
      return NextResponse.json({ 
        pageCount: fallbackPageCount,
        methods: {
          fallback: true,
          fileSizePages: fallbackPageCount
        },
        fileInfo: {
          name: file.name,
          size: file.size
        },
        warning: 'Used fallback method due to processing error'
      });
    }
    
  } catch (error) {
    console.error('Error processing Word document:', error);
    return NextResponse.json({ 
      error: 'Failed to process document',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}