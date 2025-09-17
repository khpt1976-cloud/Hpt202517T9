import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'construction-files');
const LIBRARY_DIR = path.join(DATA_DIR, 'library');
const NAMED_DIR = path.join(DATA_DIR, 'named');

// Find file by ID in both directories
function findFileById(fileId: string): { filePath: string; type: 'library' | 'named' } | null {
  // Check library directory
  const libraryFiles = fs.existsSync(LIBRARY_DIR) ? fs.readdirSync(LIBRARY_DIR) : [];
  for (const file of libraryFiles) {
    if (file.endsWith('.json')) {
      const filePath = path.join(LIBRARY_DIR, file);
      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (content.id === fileId) {
          return { filePath, type: 'library' };
        }
      } catch (error) {
        console.error(`Error reading file ${file}:`, error);
      }
    }
  }

  // Check named directory
  const namedFiles = fs.existsSync(NAMED_DIR) ? fs.readdirSync(NAMED_DIR) : [];
  for (const file of namedFiles) {
    if (file.endsWith('.json')) {
      const filePath = path.join(NAMED_DIR, file);
      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (content.id === fileId) {
          return { filePath, type: 'named' };
        }
      } catch (error) {
        console.error(`Error reading file ${file}:`, error);
      }
    }
  }

  return null;
}

// DELETE - Delete file by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    const fileInfo = findFileById(fileId);
    if (!fileInfo) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Delete the file
    fs.unlinkSync(fileInfo.filePath);

    return NextResponse.json({ 
      success: true, 
      message: 'File deleted successfully',
      fileId,
      type: fileInfo.type
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}

// PATCH - Update file name by ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;
    const body = await request.json();
    const { name } = body;

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'New name is required' }, { status: 400 });
    }

    const fileInfo = findFileById(fileId);
    if (!fileInfo) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Read current file content
    const currentContent = JSON.parse(fs.readFileSync(fileInfo.filePath, 'utf8'));
    
    // Update the name and lastModified
    const updatedContent = {
      ...currentContent,
      name: name.trim(),
      lastModified: new Date().toISOString()
    };

    // Write back to file
    fs.writeFileSync(fileInfo.filePath, JSON.stringify(updatedContent, null, 2));

    return NextResponse.json({ 
      success: true, 
      message: 'File renamed successfully',
      fileId,
      newName: name.trim(),
      type: fileInfo.type
    });
  } catch (error) {
    console.error('Error renaming file:', error);
    return NextResponse.json({ error: 'Failed to rename file' }, { status: 500 });
  }
}

// GET - Get specific file by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    const fileInfo = findFileById(fileId);
    if (!fileInfo) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const content = JSON.parse(fs.readFileSync(fileInfo.filePath, 'utf8'));
    const stats = fs.statSync(fileInfo.filePath);

    return NextResponse.json({
      ...content,
      type: fileInfo.type,
      savedAt: stats.mtime
    });
  } catch (error) {
    console.error('Error reading file:', error);
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
  }
}