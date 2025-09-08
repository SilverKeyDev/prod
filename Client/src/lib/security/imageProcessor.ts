/**
 * Image Processing with EXIF Data Stripping
 * Removes sensitive metadata from uploaded images for SOC 2 compliance
 */

import { log } from './secureLogger';

interface ProcessedImage {
  file: File;
  originalSize: number;
  processedSize: number;
  metadataRemoved: string[];
  warnings: string[];
}

interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  stripAllMetadata?: boolean;
}

class ImageProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context not supported');
    }
    this.ctx = context;
  }

  /**
   * Process image file to remove EXIF data and optionally resize
   */
  async processImage(
    file: File, 
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImage> {
    const {
      maxWidth = 2048,
      maxHeight = 2048,
      quality = 0.9,
      format = 'jpeg',
      stripAllMetadata = true,
    } = options;

    log.info('IMAGE_PROCESSOR', 'Processing image', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    try {
      // Load image
      const img = await this.loadImage(file);
      
      // Calculate new dimensions
      const { width, height } = this.calculateDimensions(
        img.width,
        img.height,
        maxWidth,
        maxHeight
      );

      // Set canvas size
      this.canvas.width = width;
      this.canvas.height = height;

      // Clear canvas and draw image
      this.ctx.clearRect(0, 0, width, height);
      this.ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob (this automatically strips EXIF data)
      const processedBlob = await this.canvasToBlob(format, quality);
      
      // Create new file
      const processedFile = new File(
        [processedBlob],
        this.generateFileName(file.name, format),
        { type: processedBlob.type }
      );

      const result: ProcessedImage = {
        file: processedFile,
        originalSize: file.size,
        processedSize: processedFile.size,
        metadataRemoved: stripAllMetadata ? ['EXIF', 'GPS', 'Camera Info', 'Timestamps'] : [],
        warnings: [],
      };

      // Add warnings for large size reduction
      const sizeReduction = ((file.size - processedFile.size) / file.size) * 100;
      if (sizeReduction > 50) {
        result.warnings.push(`File size reduced by ${sizeReduction.toFixed(1)}%`);
      }

      // Add warning if image was resized
      if (width !== img.width || height !== img.height) {
        result.warnings.push(`Image resized from ${img.width}x${img.height} to ${width}x${height}`);
      }

      log.info('IMAGE_PROCESSOR', 'Image processed successfully', {
        originalSize: file.size,
        processedSize: processedFile.size,
        metadataRemoved: result.metadataRemoved,
        warnings: result.warnings,
      });

      return result;

    } catch (error) {
      log.error('IMAGE_PROCESSOR', 'Image processing failed', error);
      throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process multiple images
   */
  async processImages(
    files: File[],
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImage[]> {
    const results: ProcessedImage[] = [];
    
    for (const file of files) {
      try {
        const processed = await this.processImage(file, options);
        results.push(processed);
      } catch (error) {
        log.error('IMAGE_PROCESSOR', 'Failed to process image', {
          fileName: file.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        
        // Create error result
        results.push({
          file,
          originalSize: file.size,
          processedSize: file.size,
          metadataRemoved: [],
          warnings: [`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        });
      }
    }
    
    return results;
  }

  /**
   * Load image from file
   */
  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }

  /**
   * Calculate new dimensions while maintaining aspect ratio
   */
  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };
    
    // Calculate scaling factor
    const widthRatio = maxWidth / width;
    const heightRatio = maxHeight / height;
    const ratio = Math.min(widthRatio, heightRatio, 1); // Don't upscale
    
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
    
    return { width, height };
  }

  /**
   * Convert canvas to blob
   */
  private canvasToBlob(format: string, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        `image/${format}`,
        quality
      );
    });
  }

  /**
   * Generate new filename with proper extension
   */
  private generateFileName(originalName: string, format: string): string {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const timestamp = Date.now();
    return `${nameWithoutExt}_processed_${timestamp}.${format}`;
  }

  /**
   * Validate file type
   */
  static isValidImageFile(file: File): boolean {
    const validTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/bmp',
    ];
    
    return validTypes.includes(file.type.toLowerCase());
  }

  /**
   * Get file size in human readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Extract basic image info without loading full image
   */
  static async getImageInfo(file: File): Promise<{
    name: string;
    size: string;
    type: string;
    lastModified: string;
  }> {
    return {
      name: file.name,
      size: ImageProcessor.formatFileSize(file.size),
      type: file.type,
      lastModified: new Date(file.lastModified).toLocaleDateString(),
    };
  }
}

// Export singleton instance
export const imageProcessor = new ImageProcessor();

// Convenience functions
export const processImage = (file: File, options?: ImageProcessingOptions) =>
  imageProcessor.processImage(file, options);

export const processImages = (files: File[], options?: ImageProcessingOptions) =>
  imageProcessor.processImages(files, options);

export const isValidImageFile = ImageProcessor.isValidImageFile;
export const formatFileSize = ImageProcessor.formatFileSize;
export const getImageInfo = ImageProcessor.getImageInfo;

export type { ProcessedImage, ImageProcessingOptions };
