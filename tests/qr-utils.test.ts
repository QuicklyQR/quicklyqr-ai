import { describe, it, expect, vi } from 'vitest';
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

    it('should validate vCard with empty phone', () => {
      const result = validateQRData({
        type: 'vcard',
        vcard: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '',
          email: 'john@example.com',
          organization: 'Company',
          url: 'https://example.com',
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
    
    it('should generate vCard with only last name', () => {
      const result = generateQRString({
        type: 'vcard',
        vcard: {
          firstName: '',
          lastName: 'Doe',
          phone: '',
          email: '',
          organization: '',
          url: '',
        },
      });
      expect(result).toContain('BEGIN:VCARD');
      expect(result).toContain('FN: Doe');
      expect(result).toContain('N:Doe;;;;');
      expect(result).toContain('END:VCARD');
    });
    
    it('should handle validation for unknown QR data type', () => {
      const result = validateQRData({ type: 'unknown' as QRDataType });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should handle validation for undefined QR data properties', () => {
      // This test specifically targets line 69 in qr-utils.ts
      const result = validateQRData({ 
        type: 'vcard',
        vcard: undefined 
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Contact data is required');
      
      // Test the early return behavior
      const spy = vi.spyOn(console, 'log');
      validateQRData({ type: 'vcard', vcard: undefined });
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
    
    it('should handle validation for undefined WiFi data properties', () => {
      const result = validateQRData({ 
        type: 'wifi',
        wifi: undefined 
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('WiFi data is required');
    });
    
    it('should handle validation for text with undefined text property', () => {
      const result = validateQRData({ 
        type: 'text',
        text: undefined 
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Text content is required');
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
  
  describe('edge cases and error handling', () => {
    it('should handle null or undefined QR data', () => {
      // @ts-ignore - Testing runtime behavior with invalid input
      const result = generateQRString(null);
      expect(result).toBe('');
      
      // @ts-ignore - Testing runtime behavior with invalid input
      const result2 = generateQRString(undefined);
      expect(result2).toBe('');
    });
    
    it('should handle QR data with missing type', () => {
      // @ts-ignore - Testing runtime behavior with invalid input
      const result = generateQRString({});
      expect(result).toBe('');
    });
    
    it('should handle validation for null or undefined QR data', () => {
      // @ts-ignore - Testing runtime behavior with invalid input
      const result = validateQRData(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid QR data');
      
      // @ts-ignore - Testing runtime behavior with invalid input
      const result2 = validateQRData(undefined);
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('Invalid QR data');
    });
    
    it('should handle validation for QR data with missing type', () => {
      // @ts-ignore - Testing runtime behavior with invalid input
      const result = validateQRData({});
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid QR data type');
    });
    
    it('should handle createInitialQRData with invalid type', () => {
      // @ts-ignore - Testing runtime behavior with invalid input
      const result = createInitialQRData('invalid-type');
      expect(result.type).toBe('invalid-type');
      // Should still return an object with the type property
      expect(Object.keys(result)).toContain('type');
    });
  });
  
  describe('isValidUrl function', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('https://sub.domain.co.uk/path?query=value#hash')).toBe(true);
    });
    
    it('should invalidate incorrect URLs', () => {
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('http://')).toBe(false);
      expect(isValidUrl('www.example.com')).toBe(false); // Missing protocol
    });
    
    it('should handle edge cases in URL validation', () => {
      expect(isValidUrl(null as any)).toBe(false);
      expect(isValidUrl(undefined as any)).toBe(false);
      // @ts-ignore - Testing runtime behavior with invalid input
      expect(isValidUrl(123)).toBe(false);
    });
  });
  
  describe('isValidEmail function', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('name.surname@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });
    
    it('should invalidate incorrect email addresses', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('not-an-email')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user@domain')).toBe(false); // Missing TLD
    });
    
    it('should handle edge cases in email validation', () => {
      expect(isValidEmail(null as any)).toBe(false);
      expect(isValidEmail(undefined as any)).toBe(false);
      // @ts-ignore - Testing runtime behavior with invalid input
      expect(isValidEmail(123)).toBe(false);
    });
  });
  
  describe('comprehensive switch statement coverage', () => {
    describe('generateQRString switch branches', () => {
      it('should handle all QR data types', () => {
        // URL type
        expect(generateQRString({ type: 'url', url: 'https://example.com' })).toBe('https://example.com');
        
        // Text type
        expect(generateQRString({ type: 'text', text: 'Hello World' })).toBe('Hello World');
        
        // WiFi type
        const wifiResult = generateQRString({
          type: 'wifi',
          wifi: { ssid: 'Network', password: 'pass', security: 'WPA', hidden: true }
        });
        expect(wifiResult).toBe('WIFI:T:WPA;S:Network;P:pass;H:true;;');
        
        // vCard type
        const vcardResult = generateQRString({
          type: 'vcard',
          vcard: {
            firstName: 'John',
            lastName: 'Doe',
            phone: '123456789',
            email: 'john@example.com',
            organization: 'Company',
            url: 'https://example.com'
          }
        });
        expect(vcardResult).toContain('BEGIN:VCARD');
        expect(vcardResult).toContain('FN:John Doe');
        
        // Unknown type
        // @ts-ignore - Testing runtime behavior with invalid input
        expect(generateQRString({ type: 'unknown' })).toBe('');
      });
    });
    
    describe('validateQRData switch branches', () => {
      it('should validate all QR data types', () => {
        // URL type validation
        expect(validateQRData({ type: 'url', url: 'https://example.com' }).isValid).toBe(true);
        expect(validateQRData({ type: 'url', url: '' }).isValid).toBe(false);
        
        // Text type validation
        expect(validateQRData({ type: 'text', text: 'Hello' }).isValid).toBe(true);
        expect(validateQRData({ type: 'text', text: '' }).isValid).toBe(false);
        
        // WiFi type validation
        expect(validateQRData({
          type: 'wifi',
          wifi: { ssid: 'Network', password: 'pass', security: 'WPA', hidden: false }
        }).isValid).toBe(true);
        
        expect(validateQRData({
          type: 'wifi',
          wifi: { ssid: '', password: 'pass', security: 'WPA', hidden: false }
        }).isValid).toBe(false);
        
        // vCard type validation
        expect(validateQRData({
          type: 'vcard',
          vcard: { firstName: 'John', lastName: '', phone: '', email: '', organization: '', url: '' }
        }).isValid).toBe(true);
        
        expect(validateQRData({
          type: 'vcard',
          vcard: { firstName: '', lastName: '', phone: '', email: '', organization: '', url: '' }
        }).isValid).toBe(false);
        
        // Unknown type validation
        // @ts-ignore - Testing runtime behavior with invalid input
        expect(validateQRData({ type: 'unknown' }).isValid).toBe(true);
      });
    });
    
    describe('createInitialQRData switch branches', () => {
      it('should create initial data for all QR data types', () => {
        // URL type
        const urlData = createInitialQRData('url');
        expect(urlData.type).toBe('url');
        expect(urlData.url).toBe('');
        
        // Text type
        const textData = createInitialQRData('text');
        expect(textData.type).toBe('text');
        expect(textData.text).toBe('');
        
        // WiFi type
        const wifiData = createInitialQRData('wifi');
        expect(wifiData.type).toBe('wifi');
        expect(wifiData.wifi).toEqual({
          ssid: '',
          password: '',
          security: 'WPA',
          hidden: false
        });
        
        // vCard type
        const vcardData = createInitialQRData('vcard');
        expect(vcardData.type).toBe('vcard');
        expect(vcardData.vcard).toEqual({
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          organization: '',
          url: ''
        });
        
        // Unknown type (should just set the type property)
        // @ts-ignore - Testing runtime behavior with invalid input
        const unknownData = createInitialQRData('unknown');
        expect(unknownData.type).toBe('unknown');
      });
    });
  });
  
  describe('utility functions', () => {
    describe('getDefaultQROptions', () => {
      it('should return consistent default options', () => {
        const options1 = getDefaultQROptions();
        const options2 = getDefaultQROptions();
        
        // Should return new objects each time
        expect(options1).not.toBe(options2);
        
        // But with the same values
        expect(options1).toEqual(options2);
        
        // With the expected default values
        expect(options1).toEqual({
          size: 300,
          foregroundColor: '#000000',
          backgroundColor: '#ffffff',
          errorCorrectionLevel: 'M'
        });
      });
      
      it('should return an object with all required properties', () => {
        const options = getDefaultQROptions();
        
        expect(options).toHaveProperty('size');
        expect(options).toHaveProperty('foregroundColor');
        expect(options).toHaveProperty('backgroundColor');
        expect(options).toHaveProperty('errorCorrectionLevel');
        
        expect(typeof options.size).toBe('number');
        expect(typeof options.foregroundColor).toBe('string');
        expect(typeof options.backgroundColor).toBe('string');
        expect(typeof options.errorCorrectionLevel).toBe('string');
      });
    });
    
    describe('convertToQRCodeStylingOptions', () => {
      it('should convert options correctly with default values', () => {
        const defaultOptions = getDefaultQROptions();
        const stylingOptions = convertToQRCodeStylingOptions(defaultOptions, 'test-data');
        
        expect(stylingOptions.width).toBe(defaultOptions.size);
        expect(stylingOptions.height).toBe(defaultOptions.size);
        expect(stylingOptions.data).toBe('test-data');
        expect(stylingOptions.type).toBe('canvas');
        
        expect(stylingOptions.dotsOptions.color).toBe(defaultOptions.foregroundColor);
        expect(stylingOptions.cornersSquareOptions.color).toBe(defaultOptions.foregroundColor);
        expect(stylingOptions.cornersDotOptions.color).toBe(defaultOptions.foregroundColor);
        expect(stylingOptions.backgroundOptions.color).toBe(defaultOptions.backgroundColor);
        
        expect(stylingOptions.qrOptions.errorCorrectionLevel).toBe(defaultOptions.errorCorrectionLevel);
      });
      
      it('should handle custom options correctly', () => {
        const customOptions: QROptions = {
          size: 500,
          foregroundColor: '#FF0000',
          backgroundColor: '#0000FF',
          errorCorrectionLevel: 'H'
        };
        
        const stylingOptions = convertToQRCodeStylingOptions(customOptions, 'custom-data');
        
        expect(stylingOptions.width).toBe(500);
        expect(stylingOptions.height).toBe(500);
        expect(stylingOptions.data).toBe('custom-data');
        
        expect(stylingOptions.dotsOptions.color).toBe('#FF0000');
        expect(stylingOptions.cornersSquareOptions.color).toBe('#FF0000');
        expect(stylingOptions.cornersDotOptions.color).toBe('#FF0000');
        expect(stylingOptions.backgroundOptions.color).toBe('#0000FF');
        
        expect(stylingOptions.qrOptions.errorCorrectionLevel).toBe('H');
      });
      
      it('should handle edge cases in options conversion', () => {
        // Empty data string
        const emptyDataOptions = convertToQRCodeStylingOptions(getDefaultQROptions(), '');
        expect(emptyDataOptions.data).toBe('');
        
        // Zero size (though this would be invalid in practice)
        const zeroSizeOptions = convertToQRCodeStylingOptions(
          { ...getDefaultQROptions(), size: 0 },
          'test'
        );
        expect(zeroSizeOptions.width).toBe(0);
        expect(zeroSizeOptions.height).toBe(0);
        
        // Invalid error correction level (though TypeScript would catch this)
        // @ts-ignore - Testing runtime behavior with invalid input
        const invalidECLOptions = convertToQRCodeStylingOptions(
          { ...getDefaultQROptions(), errorCorrectionLevel: 'X' },
          'test'
        );
        // Should still pass through the invalid value
        expect(invalidECLOptions.qrOptions.errorCorrectionLevel).toBe('X');
      });
    });
  });
});
