/**
 * Image processing and security utilities
 */

/**
 * Check if file is a valid image type
 */
export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Process image file (placeholder for EXIF stripping and other security measures)
 */
export function processImage(
  file: File,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    stripAllMetadata?: boolean;
  }
): {
  file: File;
  originalSize: number;
  processedSize: number;
  metadataRemoved: string[];
  warnings: string[];
} {
  // For now, just return the file as-is with the expected structure
  // In a full implementation, this would strip EXIF data and perform other security processing
  const warnings: string[] = [];

  // Log options for debugging (in a real implementation, these would be used for processing)
  if (options?.maxWidth || options?.maxHeight) {
    warnings.push('Image resizing not yet implemented');
  }
  if (options?.stripAllMetadata) {
    warnings.push('Metadata stripping not yet implemented');
  }

  return {
    file,
    originalSize: file.size,
    processedSize: file.size,
    metadataRemoved: [],
    warnings,
  };
}

/**
 * Image processor object for compatibility
 */
export const imageProcessor = {
  isValidImageFile,
  processImage,
  formatFileSize,

  /**
   * Strip EXIF data from image (placeholder)
   */
  stripExifData: (file: File): File => {
    const result = processImage(file);
    return result.file;
  },

  /**
   * Validate image dimensions and size
   */
  validateImage: (file: File, maxSizeMB: number = 10): boolean => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes && isValidImageFile(file);
  },
};
