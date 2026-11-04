export type ImageOutputFormat = 'dataUri' | 'raw' | 'htmlImg' | 'cssBg' | 'json';

export interface ImageBase64Result {
  fileName: string;
  mimeType: string;
  originalSizeBytes: number;
  base64SizeBytes: number;
  sizeOverheadPercent: number;
  rawBase64: string;
  dataUri: string;
  htmlImg: string;
  cssBg: string;
  json: string;
}

export interface ImageDecodeResult {
  isValid: boolean;
  error?: string;
  mimeType: string;
  dataUri: string;
  cleanBase64: string;
  estimatedSizeBytes: number;
  detectedFormatName: string;
}

export class ImageBase64Engine {
  /**
   * Convert an image File to a comprehensive Base64 result with multiple output representations.
   */
  public static async fileToBase64(file: File): Promise<ImageBase64Result> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const resultString = reader.result as string;
        if (!resultString) {
          return reject(new Error('Failed reading file contents'));
        }

        // Data URI format: data:[<mediatype>][;base64],<data>
        const match = resultString.match(/^data:([^;]+);base64,(.+)$/);
        const mimeType = match ? match[1] : (file.type || 'image/png');
        const rawBase64 = match ? match[2] : resultString;
        const dataUri = `data:${mimeType};base64,${rawBase64}`;

        const originalSizeBytes = file.size;
        const base64SizeBytes = rawBase64.length;
        const sizeOverheadPercent = originalSizeBytes > 0
          ? Math.round(((base64SizeBytes - originalSizeBytes) / originalSizeBytes) * 100)
          : 33;

        const safeFileName = file.name || 'image';

        resolve({
          fileName: safeFileName,
          mimeType,
          originalSizeBytes,
          base64SizeBytes,
          sizeOverheadPercent,
          rawBase64,
          dataUri,
          htmlImg: `<img src="${dataUri}" alt="${safeFileName}" />`,
          cssBg: `background-image: url('${dataUri}');`,
          json: JSON.stringify(
            {
              fileName: safeFileName,
              mimeType,
              data: dataUri
            },
            null,
            2
          )
        });
      };

      reader.onerror = () => {
        reject(new Error('Failed reading file: ' + (reader.error?.message || 'Unknown error')));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Inspect and decode a Base64 string or Data URI to verify validity and extract image details.
   */
  public static decodeBase64ToImage(rawInput: string): ImageDecodeResult {
    if (!rawInput || !rawInput.trim()) {
      return {
        isValid: false,
        error: 'Please paste a Base64 string or Data URI.',
        mimeType: '',
        dataUri: '',
        cleanBase64: '',
        estimatedSizeBytes: 0,
        detectedFormatName: ''
      };
    }

    let input = rawInput.trim();

    // Strip wrapping quotes if user pasted JSON string
    if ((input.startsWith('"') && input.endsWith('"')) || (input.startsWith("'") && input.endsWith("'"))) {
      input = input.slice(1, -1).trim();
    }

    let mimeType = 'image/png';
    let cleanBase64 = '';

    // Check for Data URI format
    const dataUriPrefixMatch = input.match(/^data:([^;]+);base64,(.+)$/s);
    if (dataUriPrefixMatch) {
      mimeType = dataUriPrefixMatch[1].trim().toLowerCase();
      cleanBase64 = dataUriPrefixMatch[2].replace(/\s+/g, '');
    } else {
      // Pure Base64 without data: prefix
      cleanBase64 = input.replace(/\s+/g, '');
      mimeType = this.detectMimeType(cleanBase64);
    }

    // Validate Base64 characters
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    if (!base64Regex.test(cleanBase64)) {
      return {
        isValid: false,
        error: 'Invalid Base64 sequence. Input contains characters not allowed in standard Base64.',
        mimeType,
        dataUri: '',
        cleanBase64: '',
        estimatedSizeBytes: 0,
        detectedFormatName: ''
      };
    }

    // Check minimum length
    if (cleanBase64.length < 8) {
      return {
        isValid: false,
        error: 'Base64 string is too short to be a valid image payload.',
        mimeType,
        dataUri: '',
        cleanBase64: '',
        estimatedSizeBytes: 0,
        detectedFormatName: ''
      };
    }

    // Calculate approximate binary size
    let padding = 0;
    if (cleanBase64.endsWith('==')) padding = 2;
    else if (cleanBase64.endsWith('=')) padding = 1;

    const estimatedSizeBytes = Math.max(0, Math.floor((cleanBase64.length * 3) / 4) - padding);
    const dataUri = `data:${mimeType};base64,${cleanBase64}`;
    const detectedFormatName = this.getFormatDisplayName(mimeType);

    return {
      isValid: true,
      mimeType,
      dataUri,
      cleanBase64,
      estimatedSizeBytes,
      detectedFormatName
    };
  }

  /**
   * Sniff image magic bytes from the start of a Base64 string.
   */
  public static detectMimeType(base64: string): string {
    if (base64.startsWith('iVBORw0KGgo')) return 'image/png';
    if (base64.startsWith('/9j/')) return 'image/jpeg';
    if (base64.startsWith('R0lGOD')) return 'image/gif';
    if (base64.startsWith('UklGR')) return 'image/webp';
    if (base64.startsWith('PHN2Zy') || base64.startsWith('PD94b')) return 'image/svg+xml';
    if (base64.startsWith('Qk0') || base64.startsWith('Qk1')) return 'image/bmp';
    if (base64.startsWith('AAABAA')) return 'image/x-icon';

    return 'image/png'; // Default fallback
  }

  /**
   * Convert MIME type to clean human-readable name.
   */
  public static getFormatDisplayName(mimeType: string): string {
    switch (mimeType) {
      case 'image/png': return 'PNG Image';
      case 'image/jpeg': return 'JPEG Image';
      case 'image/gif': return 'GIF Animation';
      case 'image/webp': return 'WebP Image';
      case 'image/svg+xml': return 'SVG Vector Image';
      case 'image/bmp': return 'BMP Bitmap';
      case 'image/x-icon':
      case 'image/vnd.microsoft.icon': return 'ICO Icon';
      default: return mimeType.toUpperCase();
    }
  }

  /**
   * Convert Base64 data to native Blob.
   */
  public static base64ToBlob(cleanBase64: string, mimeType: string): Blob {
    const byteCharacters = atob(cleanBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  /**
   * Format byte count to human-readable size (B, KB, MB).
   */
  public static formatBytes(bytes: number): string {
    if (bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const val = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
    return `${val} ${sizes[i]}`;
  }
}

