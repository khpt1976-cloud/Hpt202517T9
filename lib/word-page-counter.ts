/**
 * Word Page Counter Utility
 * Provides accurate page counting for Word documents using server-side processing
 */

export interface PageCountResult {
  pageCount: number;
  methods: {
    pageBreaks?: number;
    estimatedFromParagraphs?: number;
    estimatedFromChars?: number;
    fileSizePages?: number;
    fallback?: boolean;
  };
  fileInfo: {
    name: string;
    size: number;
    paragraphCount?: number;
    characterCount?: number;
  };
  warning?: string;
}

export interface PageCountError {
  error: string;
  details?: string;
}

/**
 * Get accurate page count for a Word document
 * Uses server-side processing with mammoth.js for reliable results
 */
export const getWordPageCount = async (file: File): Promise<number> => {
  try {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.docx')) {
      throw new Error('Only DOCX files are supported');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum 10MB allowed.');
    }

    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/word-page-count', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const data: PageCountResult = await response.json();
    
    // Log detailed results for debugging
    console.log('Word page count result:', {
      file: data.fileInfo.name,
      pageCount: data.pageCount,
      methods: data.methods,
      warning: data.warning
    });
    
    return data.pageCount;
    
  } catch (error) {
    console.error('Error getting page count:', error);
    
    // Fallback: estimate from file size
    const fallbackPageCount = Math.max(1, Math.ceil(file.size / 50000));
    
    console.warn(`Using fallback page count: ${fallbackPageCount} for file: ${file.name}`);
    
    return fallbackPageCount;
  }
};

/**
 * Get detailed page count information including all estimation methods
 */
export const getWordPageCountDetailed = async (file: File): Promise<PageCountResult> => {
  try {
    if (!file.name.toLowerCase().endsWith('.docx')) {
      throw new Error('Only DOCX files are supported');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum 10MB allowed.');
    }

    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/word-page-count', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData: PageCountError = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const data: PageCountResult = await response.json();
    return data;
    
  } catch (error) {
    console.error('Error getting detailed page count:', error);
    
    // Return fallback result
    const fallbackPageCount = Math.max(1, Math.ceil(file.size / 50000));
    
    return {
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
    };
  }
};

/**
 * Validate Word document file
 */
export const validateWordFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  if (!file.name.toLowerCase().endsWith('.docx')) {
    return { valid: false, error: 'Only DOCX files are supported' };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File size too large. Maximum 10MB allowed.' };
  }

  // Check minimum file size (should be at least 1KB for valid DOCX)
  if (file.size < 1024) {
    return { valid: false, error: 'File appears to be corrupted or empty' };
  }

  return { valid: true };
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Estimate reading time based on page count
 */
export const estimateReadingTime = (pageCount: number): string => {
  const minutesPerPage = 2; // Average reading time per page
  const totalMinutes = pageCount * minutesPerPage;
  
  if (totalMinutes < 60) {
    return `${totalMinutes} phút`;
  } else {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0 ? `${hours} giờ ${minutes} phút` : `${hours} giờ`;
  }
};