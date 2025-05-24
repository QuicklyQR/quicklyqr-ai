import { describe, it, expect } from 'vitest';
import {
  generateQRString,
  validateQRData,
  createInitialQRData,
  getDefaultQROptions,
  convertToQRCodeStylingOptions,
  QRData,
  QRDataType,
  ERROR_CORRECTION_LEVELS,
  QR_DATA_TYPES
} from '../lib/qr-utils';

describe('qr-utils', () => {
  describe('createInitialQRData', () => {
    it('should create initial QR data for a URL', () => {
      const result = createInitialQRData('url');
      expect(result.type).toBe('url');
      expect(result.url).toBe('');
    });

    it('should create initial QR data for text', () => {
      const result = createInitialQRData('text');
      expect(result.type).toBe('text');
      expect(result.text).toBe('');
    });

    it('should create initial QR data for WiFi', () => {
      const result = createInitialQRData('wifi');
      expect(result.type).toBe('wifi');
      expect(result.wifi).toEqual({
        ssid: '',
        password: '',
        security: 'WPA',
        hidden: false,
      });
    });

    it('should create initial QR data for vCard', () => {
      const result = createInitialQRData('vcard');
      expect(result.type).toBe('vcard');
      expect(result.vcard).toEqual({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        organization: '',
        url: '',
      });
    });
  });

  describe('validateQRData', () => {
    it('should validate a correct URL', () => {
      const result = validateQRData({ type: 'url', url: 'https://example.com' });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should invalidate a missing URL', () => {
      const result = validateQRData({ type: 'url', url: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('URL is required');
    });

    it('should invalidate an invalid URL format', () => {
      const result = validateQRData({ type: 'url', url: 'not-a-url' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid URL format');
    });

    it('should validate correct text input', () => {
      const result = validateQRData({ type: 'text', text: 'Hello World' });
      expect(result.isValid).toBe(true);
    });

    it('should invalidate empty text input', () => {
      const result = validateQRData({ type: 'text', text: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Text content is required');
    });

    it('should invalidate text with only whitespace', () => {
      const result = validateQRData({ type: 'text', text: '   ' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Text content is required');
    });

    it('should validate correct WiFi input', () => {
      const result = validateQRData({
        type: 'wifi',
        wifi: { ssid: 'MyNetwork', password: 'password123', security: 'WPA', hidden: false },
      });
      expect(result.isValid).toBe(true);
    });

    it('should invalidate an incorrect WiFi QR input with empty SSID', () => {
      const result = validateQRData({
        type: 'wifi',
        wifi: { ssid: '', password: 'password123', security: 'WPA', hidden: false },
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Network name (SSID) is required');
    });

    it('should invalidate WiFi with missing password for secured network', () => {
      const result = validateQRData({
        type: 'wifi',
        wifi: { ssid: 'MyNetwork', password: '', security: 'WPA', hidden: false },
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is required for secured networks');
    });

    it('should validate WiFi with no password for open network', () => {
      const result = validateQRData({
        type: 'wifi',
        wifi: { ssid: 'MyNetwork', password: '', security: 'nopass', hidden: false },
      });
      expect(result.isValid).toBe(true);
    });

    it('should invalidate missing WiFi data', () => {
      const result = validateQRData({ type: 'wifi' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('WiFi data is required');
    });

    it('should validate correct vCard input', () => {
      const result = validateQRData({
        type: 'vcard',
        vcard: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '123456789',
          email: 'john@example.com',
          organization: 'Company',
          url: 'https://example.com',
        },
      });
      expect(result.isValid).toBe(true);
    });

    it('should invalidate vCard with missing name', () => {
      const result = validateQRData({
        type: 'vcard',
        vcard: {
          firstName: '',
          lastName: '',
          phone: '123456789',
          email: 'john@example.com',
          organization: 'Company',
          url: 'https://example.com',
        },
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least first name or last name is required');
    });

    it('should validate vCard with only first name', () => {
      const result = validateQRData({
        type: 'vcard',
        vcard: {
          firstName: 'John',
          lastName: '',
          phone: '123456789',
          email: 'john@example.com',
          organization: 'Company',
          url: 'https://example.com',
        },
      });
      expect(result.isValid).toBe(true);
    });

    it('should validate vCard with only last name', () => {
      const result = validateQRData({
        type: 'vcard',
        vcard: {
          firstName: '',
          lastName: 'Doe',
          phone: '123456789',
          email: 'john@example.com',
          organization: 'Company',
          url: 'https://example.com',
        },
      });
      expect(result.isValid).toBe(true);
    });

    it('should invalidate vCard with invalid email', () => {
      const result = validateQRData({
        type: 'vcard',
        vcard: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '123456789',
          email: 'invalid-email',
          organization: 'Company',
          url: 'https://example.com',
        },
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('should invalidate vCard with invalid URL', () => {
      const result = validateQRData({
        type: 'vcard',
        vcard: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '123456789',
          email: 'john@example.com',
          organization: 'Company',
          url: 'invalid-url',
        },
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid URL format');
    });

    it('should validate vCard with empty email', () => {
      const result = validateQRData({
        type: 'vcard',
        vcard: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '123456789',
          email: '',
          organization: 'Company',
          url: 'https://example.com',
        },
      });
      expect(result.isValid).toBe(true);
    });

    it('should validate vCard with empty URL', () => {
      const result = validateQRData({
        type: 'vcard',
        vcard: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '123456789',
          email: 'john@example.com',
          organization: 'Company',
          url: '',
        },
      });
      expect(result.isValid).toBe(true);
    });

    it('should invalidate missing vCard data', () => {
      const result = validateQRData({ type: 'vcard' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Contact data is required');
    });
  });

  describe('generateQRString', () => {
    it('should generate a valid QR string for URL input', () => {
      const result = generateQRString({ type: 'url', url: 'https://example.com' });
      expect(result).toBe('https://example.com');
    });

    it('should generate a valid QR string for text input', () => {
      const result = generateQRString({ type: 'text', text: 'Hello World' });
      expect(result).toBe('Hello World');
    });

    it('should generate a valid QR string for WiFi input', () => {
      const result = generateQRString({
        type: 'wifi',
        wifi: { ssid: 'MyNetwork', password: 'password123', security: 'WPA', hidden: false },
      });
      expect(result).toBe('WIFI:T:WPA;S:MyNetwork;P:password123;H:false;;');
    });

    it('should generate a valid QR string for WiFi with hidden network', () => {
      const result = generateQRString({
        type: 'wifi',
        wifi: { ssid: 'MyNetwork', password: 'password123', security: 'WPA', hidden: true },
      });
      expect(result).toBe('WIFI:T:WPA;S:MyNetwork;P:password123;H:true;;');
    });

    it('should generate a valid QR string for vCard input', () => {
      const result = generateQRString({
        type: 'vcard',
        vcard: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '123456789',
          email: 'john@example.com',
          organization: 'Company',
          url: 'https://example.com',
        },
      });
      expect(result).toContain('BEGIN:VCARD');
      expect(result).toContain('VERSION:3.0');
      expect(result).toContain('FN:John Doe');
      expect(result).toContain('N:Doe;John;;;');
      expect(result).toContain('ORG:Company');
      expect(result).toContain('TEL:123456789');
      expect(result).toContain('EMAIL:john@example.com');
      expect(result).toContain('URL:https://example.com');
      expect(result).toContain('END:VCARD');
    });

    it('should generate empty string for missing URL data', () => {
      const result = generateQRString({ type: 'url', url: '' });
      expect(result).toBe('');
    });

    it('should generate empty string for missing text data', () => {
      const result = generateQRString({ type: 'text', text: '' });
      expect(result).toBe('');
    });

    it('should generate empty string for missing WiFi data', () => {
      const result = generateQRString({ type: 'wifi' });
      expect(result).toBe('');
    });

    it('should generate empty string for missing vCard data', () => {
      const result = generateQRString({ type: 'vcard' });
      expect(result).toBe('');
    });

    it('should generate empty string for unknown type', () => {
      const result = generateQRString({ type: 'unknown' as QRDataType });
      expect(result).toBe('');
    });

    it('should generate vCard with minimal information', () => {
      const result = generateQRString({
        type: 'vcard',
        vcard: {
          firstName: 'John',
          lastName: '',
          phone: '',
          email: '',
          organization: '',
          url: '',
        },
      });
      expect(result).toContain('BEGIN:VCARD');
      expect(result).toContain('FN:John ');
      expect(result).toContain('N:;John;;;');
      expect(result).toContain('END:VCARD');
    });
  });

  describe('getDefaultQROptions', () => {
    it('should return default QR options', () => {
      const options = getDefaultQROptions();
      expect(options.size).toBe(300);
      expect(options.foregroundColor).toBe('#000000');
      expect(options.backgroundColor).toBe('#ffffff');
      expect(options.errorCorrectionLevel).toBe('M');
    });
  });

  describe('convertToQRCodeStylingOptions', () => {
    it('should convert internal options to styling options', () => {
      const input = getDefaultQROptions();
      const output = convertToQRCodeStylingOptions(input, 'test-data');
      expect(output.width).toBe(300);
      expect(output.height).toBe(300);
      expect(output.type).toBe('canvas');
      expect(output.data).toBe('test-data');
      expect(output.dotsOptions.color).toBe('#000000');
      expect(output.backgroundOptions.color).toBe('#ffffff');
      expect(output.qrOptions.errorCorrectionLevel).toBe('M');
    });

    it('should apply custom size to styling options', () => {
      const input = { ...getDefaultQROptions(), size: 500 };
      const output = convertToQRCodeStylingOptions(input, 'test-data');
      expect(output.width).toBe(500);
      expect(output.height).toBe(500);
    });

    it('should apply custom colors to styling options', () => {
      const input = {
        ...getDefaultQROptions(),
        foregroundColor: '#FF0000',
        backgroundColor: '#0000FF',
      };
      const output = convertToQRCodeStylingOptions(input, 'test-data');
      expect(output.dotsOptions.color).toBe('#FF0000');
      expect(output.cornersSquareOptions.color).toBe('#FF0000');
      expect(output.cornersDotOptions.color).toBe('#FF0000');
      expect(output.backgroundOptions.color).toBe('#0000FF');
    });

    it('should apply custom error correction level to styling options', () => {
      const input = { ...getDefaultQROptions(), errorCorrectionLevel: 'H' };
      const output = convertToQRCodeStylingOptions(input, 'test-data');
      expect(output.qrOptions.errorCorrectionLevel).toBe('H');
    });
  });

  describe('constants', () => {
    it('should have correct ERROR_CORRECTION_LEVELS', () => {
      expect(ERROR_CORRECTION_LEVELS.L.label).toBe('Low (7%)');
      expect(ERROR_CORRECTION_LEVELS.M.label).toBe('Medium (15%)');
      expect(ERROR_CORRECTION_LEVELS.Q.label).toBe('Quartile (25%)');
      expect(ERROR_CORRECTION_LEVELS.H.label).toBe('High (30%)');
    });

    it('should have correct QR_DATA_TYPES', () => {
      expect(QR_DATA_TYPES.url.label).toBe('URL');
      expect(QR_DATA_TYPES.text.label).toBe('Text');
      expect(QR_DATA_TYPES.wifi.label).toBe('WiFi');
      expect(QR_DATA_TYPES.vcard.label).toBe('Contact');
    });
  });
});
