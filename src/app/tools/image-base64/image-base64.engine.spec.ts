import { describe, expect, it } from 'vitest';
import { ImageBase64Engine } from './image-base64.engine';

describe('ImageBase64Engine', () => {
  // 1x1 transparent PNG Base64 sample
  const samplePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const sampleDataUri = `data:image/png;base64,${samplePngBase64}`;

  describe('detectMimeType', () => {
    it('should detect PNG from magic header', () => {
      expect(ImageBase64Engine.detectMimeType('iVBORw0KGgoAAAANSUhEUgAA...')).toBe('image/png');
    });

    it('should detect JPEG from magic header', () => {
      expect(ImageBase64Engine.detectMimeType('/9j/4AAQSkZJRgABAQEASABIAAD...')).toBe('image/jpeg');
    });

    it('should detect GIF from magic header', () => {
      expect(ImageBase64Engine.detectMimeType('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7')).toBe('image/gif');
    });

    it('should detect WebP from magic header', () => {
      expect(ImageBase64Engine.detectMimeType('UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAD8D+JaQAA3AA/ua1gAA=')).toBe('image/webp');
    });

    it('should detect SVG from magic header', () => {
      expect(ImageBase64Engine.detectMimeType('PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==')).toBe('image/svg+xml');
    });

    it('should detect BMP from magic header', () => {
      expect(ImageBase64Engine.detectMimeType('Qk02AAAAAAAAADYAAAAoAAAAAQAAAAEAAAABACAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAA')).toBe('image/bmp');
    });
  });

  describe('decodeBase64ToImage', () => {
    it('should decode a valid Data URI correctly', () => {
      const result = ImageBase64Engine.decodeBase64ToImage(sampleDataUri);
      expect(result.isValid).toBe(true);
      expect(result.mimeType).toBe('image/png');
      expect(result.detectedFormatName).toBe('PNG Image');
      expect(result.cleanBase64).toBe(samplePngBase64);
      expect(result.estimatedSizeBytes).toBeGreaterThan(0);
    });

    it('should decode raw Base64 without data prefix', () => {
      const result = ImageBase64Engine.decodeBase64ToImage(samplePngBase64);
      expect(result.isValid).toBe(true);
      expect(result.mimeType).toBe('image/png');
      expect(result.dataUri).toBe(sampleDataUri);
    });

    it('should strip quotes if user pasted quoted string', () => {
      const result = ImageBase64Engine.decodeBase64ToImage(`"${sampleDataUri}"`);
      expect(result.isValid).toBe(true);
      expect(result.mimeType).toBe('image/png');
    });

    it('should reject empty or whitespace input', () => {
      const result = ImageBase64Engine.decodeBase64ToImage('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Please paste a Base64 string');
    });

    it('should reject invalid characters not in Base64 alphabet', () => {
      const result = ImageBase64Engine.decodeBase64ToImage('iVBORw0KGgo!@#$%^&*()');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid Base64 sequence');
    });

    it('should reject too short string', () => {
      const result = ImageBase64Engine.decodeBase64ToImage('AAAA');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too short');
    });
  });

  describe('formatBytes', () => {
    it('should format bytes properly', () => {
      expect(ImageBase64Engine.formatBytes(0)).toBe('0 B');
      expect(ImageBase64Engine.formatBytes(512)).toBe('512 B');
      expect(ImageBase64Engine.formatBytes(2048)).toBe('2 KB');
      expect(ImageBase64Engine.formatBytes(1048576)).toBe('1 MB');
    });
  });

  describe('base64ToBlob', () => {
    it('should create valid binary Blob from base64 string', () => {
      const blob = ImageBase64Engine.base64ToBlob(samplePngBase64, 'image/png');
      expect(blob).toBeTruthy();
      expect(blob.type).toBe('image/png');
      expect(blob.size).toBeGreaterThan(0);
    });
  });
});

