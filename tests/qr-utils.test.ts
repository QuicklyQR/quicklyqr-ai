import { describe, it, expect } from 'vitest';
import {
  generateQRString,
  validateQRData,
  createInitialQRData,
  getDefaultQROptions,
  convertToQRCodeStylingOptions,
  QRData,
  QRDataType,
} from '../lib/qr-utils';

describe('qr-utils', () => {
  it('should create initial QR data for a URL', () => {
    const result = createInitialQRData('url');
    expect(result.type).toBe('url');
    expect(result.url).toBe('');
  });

  it('should validate a correct URL', () => {
    const result = validateQRData({ type: 'url', url: 'https://example.com' });
    expect(result.isValid).toBe(true);
  });

  it('should invalidate an incorrect WiFi QR input', () => {
    const result = validateQRData({
      type: 'wifi',
      wifi: { ssid: '', password: '', security: 'WPA', hidden: false },
    });
    expect(result.isValid).toBe(false);
  });

  it('should return default QR options', () => {
    const options = getDefaultQROptions();
    expect(options.size).toBeGreaterThan(0);
  });

  it('should convert internal options to styling options', () => {
    const input = getDefaultQROptions();
    const output = convertToQRCodeStylingOptions(input, 'test-data');
    expect(output).toHaveProperty('width');
    expect(output).toHaveProperty('height');
  });

  it('should generate a valid QR string for text input', () => {
    const result = generateQRString({ type: 'text', text: 'Hello World' });
    expect(result).toBe('Hello World');
  });

  it('should generate empty string for missing data', () => {
    const result = generateQRString({ type: 'url', url: '' });
    expect(result).toBe('');
  });
});
