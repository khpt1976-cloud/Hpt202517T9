import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'construction-files');
const LIBRARY_DIR = path.join(DATA_DIR, 'library');
const NAMED_DIR = path.join(DATA_DIR, 'named');

// Ensure directories exist
function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(LIBRARY_DIR)) {
    fs.mkdirSync(LIBRARY_DIR, { recursive: true });
  }
  if (!fs.existsSync(NAMED_DIR)) {
    fs.mkdirSync(NAMED_DIR, { recursive: true });
  }
}

export async function GET(request: NextRequest) {
  try {
    ensureDirectories();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'library' or 'named'

    const targetDir = type === 'library' ? LIBRARY_DIR : NAMED_DIR;
    const files = fs.readdirSync(targetDir)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(targetDir, file);
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return {
          filename: file.replace('.json', ''),
          ...content,
          savedAt: fs.statSync(filePath).mtime
        };
      })
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error reading files:', error);
    return NextResponse.json({ error: 'Failed to read files' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    ensureDirectories();
    const body = await request.json();
    const { type, filename, data } = body;

    if (!type || !filename || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const targetDir = type === 'library' ? LIBRARY_DIR : NAMED_DIR;
    const filePath = path.join(targetDir, `${filename}.json`);

    // Kiểm tra trùng tên (case-insensitive)
    const existingFiles = fs.readdirSync(targetDir)
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
    
    const duplicateName = existingFiles.find(existingFile => 
      existingFile.toLowerCase() === filename.toLowerCase()
    );

    if (duplicateName) {
      const fileType = type === 'library' ? 'thư viện' : 'file đã lưu';
      return NextResponse.json({ 
        error: `Tên file "${filename}" đã tồn tại trong ${fileType}. Vui lòng chọn tên khác.` 
      }, { status: 409 }); // 409 Conflict
    }

    const fileData = {
      ...data,
      savedAt: new Date().toISOString()
    };

    fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));

    return NextResponse.json({ success: true, message: 'File saved successfully' });
  } catch (error) {
    console.error('Error saving file:', error);
    return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const filename = searchParams.get('filename');

    if (!type || !filename) {
      return NextResponse.json({ error: 'Missing type or filename' }, { status: 400 });
    }

    const targetDir = type === 'library' ? LIBRARY_DIR : NAMED_DIR;
    const filePath = path.join(targetDir, `${filename}.json`);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return NextResponse.json({ success: true, message: 'File deleted successfully' });
    } else {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}