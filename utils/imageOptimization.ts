import React from 'react';
import { Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maintainAspectRatio?: boolean;
}

export interface OptimizedImageResult {
  uri: string;
  width: number;
  height: number;
  size?: number;
}

function getSaveFormat(
  format: ImageOptimizationOptions['format'] = 'jpeg'
): ImageManipulator.SaveFormat {
  if (format === 'webp') return ImageManipulator.SaveFormat.WEBP;
  if (format === 'png') return ImageManipulator.SaveFormat.PNG;
  return ImageManipulator.SaveFormat.JPEG;
}

async function saveManipulatedImage(
  uri: string,
  options: {
    resize?: { width?: number; height?: number };
    compress?: number;
    format?: ImageManipulator.SaveFormat;
    base64?: boolean;
  } = {}
): Promise<ImageManipulator.ImageResult> {
  const context = ImageManipulator.ImageManipulator.manipulate(uri);

  if (options.resize) {
    context.resize(options.resize);
  }

  const renderedImage = await context.renderAsync();
  return renderedImage.saveAsync({
    compress: options.compress,
    format: options.format,
    base64: options.base64,
  });
}

/**
 * Detects MIME type from file URI or extension
 */
export function detectMimeType(uri: string): string {
  // Handle Android content URIs
  if (uri.startsWith('content://')) {
    // For Android content URIs, default to JPEG unless we can determine otherwise
    if (uri.toLowerCase().includes('png')) {
      return 'image/png';
    }
    if (uri.toLowerCase().includes('gif')) {
      return 'image/gif';
    }
    if (uri.toLowerCase().includes('webp')) {
      return 'image/webp';
    }
    // Default for Android photos
    return 'image/jpeg';
  }

  // Extract extension from URI
  let extension = uri.split('.').pop()?.toLowerCase();

  // Handle Android file URIs that might not have clear extensions
  if (!extension || extension.length > 4) {
    // Check for common Android patterns
    if (uri.includes('JPEG') || uri.includes('jpg') || uri.includes('jpeg')) {
      extension = 'jpg';
    } else if (uri.includes('PNG') || uri.includes('png')) {
      extension = 'png';
    } else if (uri.includes('HEIC') || uri.includes('heic')) {
      extension = 'heic';
    } else {
      // Default for mobile photos
      return 'image/jpeg';
    }
  }

  // Handle common mobile formats
  switch (extension) {
    case 'heic':
    case 'heif':
      return 'image/heic'; // Will be converted to JPEG
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'mp4':
      return 'video/mp4';
    case 'mov':
      return 'video/quicktime';
    case 'avi':
      return 'video/x-msvideo';
    default:
      // Default to JPEG for unknown image types
      if (
        uri.includes('image') ||
        uri.includes('photo') ||
        uri.includes('camera')
      ) {
        return 'image/jpeg';
      }
      return 'application/octet-stream';
  }
}

/**
 * Determines if the file needs format conversion for web compatibility
 */
export function needsFormatConversion(mimeType: string): boolean {
  return mimeType === 'image/heic' || mimeType === 'image/heif';
}

/**
 * Converts incompatible formats (like HEIC) to web-compatible formats
 */
export async function convertToWebFormat(
  uri: string,
  mimeType: string,
  options: Partial<ImageOptimizationOptions> = {}
): Promise<{
  uri: string;
  mimeType: string;
  format: ImageManipulator.SaveFormat;
}> {
  if (!needsFormatConversion(mimeType)) {
    // No conversion needed, return original
    const format =
      mimeType === 'image/png'
        ? ImageManipulator.SaveFormat.PNG
        : ImageManipulator.SaveFormat.JPEG;
    return { uri, mimeType, format };
  }

  // Convert HEIC/HEIF to JPEG
  const result = await saveManipulatedImage(uri, {
    compress: options.quality || 0.9,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  return {
    uri: result.uri,
    mimeType: 'image/jpeg',
    format: ImageManipulator.SaveFormat.JPEG,
  };
}

/**
 * Optimizes an image for different use cases following web.dev best practices
 * - Reduces file size through compression
 * - Resizes to appropriate dimensions
 * - Converts to optimal format
 */
export class ImageOptimizer {
  /**
   * Creates a thumbnail/preview version of an image for fast loading
   * Following web.dev recommendations for responsive images
   */
  static async createThumbnail(
    imageUri: string,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImageResult> {
    const {
      width = 300,
      height = 300,
      quality = 0.6,
      format = 'jpeg',
      maintainAspectRatio = true,
    } = options;

    try {
      const result = await saveManipulatedImage(imageUri, {
        resize: maintainAspectRatio ? { width } : { width, height },
        compress: quality,
        format: getSaveFormat(format),
      });

      return {
        uri: result.uri,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      console.error('Error creating thumbnail:', error);
      throw new Error('Failed to create image thumbnail');
    }
  }

  /**
   * Creates a full-size optimized version for upload
   * Balances quality and file size for efficient storage
   */
  static async createOptimizedVersion(
    imageUri: string,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImageResult> {
    const {
      width = 1200,
      height = 1200,
      quality = 0.8,
      format = 'jpeg',
      maintainAspectRatio = true,
    } = options;

    try {
      const result = await saveManipulatedImage(imageUri, {
        resize: maintainAspectRatio ? { width } : { width, height },
        compress: quality,
        format: getSaveFormat(format),
      });

      return {
        uri: result.uri,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      console.error('Error optimizing image:', error);
      throw new Error('Failed to optimize image');
    }
  }

  /**
   * Creates multiple sizes for responsive display
   * Following srcset best practices from web.dev
   */
  static async createResponsiveSizes(
    imageUri: string,
    sizes: number[] = [300, 600, 1200],
    quality: number = 0.8
  ): Promise<{ size: number; result: OptimizedImageResult }[]> {
    const results = await Promise.all(
      sizes.map(async size => ({
        size,
        result: await this.createOptimizedVersion(imageUri, {
          width: size,
          quality,
          maintainAspectRatio: true,
        }),
      }))
    );

    return results;
  }

  /**
   * Determines optimal image format based on content and platform
   * Following web.dev format selection guidelines
   */
  static getOptimalFormat(
    hasTransparency: boolean = false,
    isPhotographic: boolean = true
  ): 'jpeg' | 'png' | 'webp' {
    // WebP support check for web platform
    if (Platform.OS === 'web') {
      // Modern browsers support WebP
      return 'webp';
    }

    // For mobile platforms
    if (hasTransparency) {
      return 'png';
    }

    if (isPhotographic) {
      return 'jpeg';
    }

    return 'png';
  }

  /**
   * Estimates file size reduction percentage
   */
  static estimateCompressionSavings(
    originalDimensions: { width: number; height: number },
    targetDimensions: { width: number; height: number },
    qualityReduction: number = 0.2
  ): number {
    const dimensionReduction =
      (targetDimensions.width * targetDimensions.height) /
      (originalDimensions.width * originalDimensions.height);

    const totalReduction = dimensionReduction * (1 - qualityReduction);
    return Math.round((1 - totalReduction) * 100);
  }
}

/**
 * Hook for image optimization with loading states
 */
export const useImageOptimization = () => {
  const [isOptimizing, setIsOptimizing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const optimizeImage = async (
    imageUri: string,
    options?: ImageOptimizationOptions
  ) => {
    setIsOptimizing(true);
    setError(null);

    try {
      const result = await ImageOptimizer.createOptimizedVersion(
        imageUri,
        options
      );
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to optimize image');
      throw err;
    } finally {
      setIsOptimizing(false);
    }
  };

  const createThumbnail = async (
    imageUri: string,
    options?: ImageOptimizationOptions
  ) => {
    setIsOptimizing(true);
    setError(null);

    try {
      const result = await ImageOptimizer.createThumbnail(imageUri, options);
      return result;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create thumbnail'
      );
      throw err;
    } finally {
      setIsOptimizing(false);
    }
  };

  return {
    optimizeImage,
    createThumbnail,
    isOptimizing,
    error,
  };
};
