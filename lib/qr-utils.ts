// lib/qr-utils.ts

export type QRDataType = 'url' | 'wifi' | 'vcard' | 'text';
export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export interface WiFiData {
  ssid: string;
  password: string;
  security: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

export interface VCardData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  organization: string;
  url: string;
}

export interface QRData {
  type: QRDataType;
  url?: string;
  text?: string;
  wifi?: WiFiData;
  vcard?: VCardData;
}

export interface QROptions {
  size: number;
  foregroundColor: string;
  backgroundColor: string;
  errorCorrectionLevel: ErrorCorrectionLevel;
}

/**
 * Generates QR code data string based on type and content
 */
export function generateQRString(data: QRData): string {
  if (!data || !data.type) {
    return '';
  }
  
  switch (data.type) {
    case 'url':
      return data.url || '';

    case 'text':
      return data.text || '';

    case 'wifi':
      if (!data.wifi) return '';
      const { ssid, password, security, hidden } = data.wifi;
      return `WIFI:T:${security};S:${ssid};P:${password};H:${hidden ? 'true' : 'false'};;`;

    case 'vcard':
      if (!data.vcard) return '';
      const { firstName, lastName, phone, email, organization, url } = data.vcard;
      return `BEGIN:VCARD
VERSION:3.0
FN:${firstName} ${lastName}
N:${lastName};${firstName};;;
ORG:${organization}
TEL:${phone}
EMAIL:${email}
URL:${url}
END:VCARD`;

    default:
      return '';
  }
}

/**
 * Validates QR data based on type
 */
export function validateQRData(data: QRData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data) {
    errors.push('Invalid QR data');
    return { isValid: false, errors };
  }
  
  if (!data.type) {
    errors.push('Invalid QR data type');
    return { isValid: false, errors };
  }

  switch (data.type) {
    case 'url':
      if (!data.url) {
        errors.push('URL is required');
      } else if (!isValidUrl(data.url)) {
        errors.push('Invalid URL format');
      }
      break;

    case 'text':
      if (!data.text || data.text.trim().length === 0) {
        errors.push('Text content is required');
      }
      break;

    case 'wifi':
      if (!data.wifi) {
        errors.push('WiFi data is required');
      } else {
        if (!data.wifi.ssid.trim()) {
          errors.push('Network name (SSID) is required');
        }
        if (data.wifi.security !== 'nopass' && !data.wifi.password.trim()) {
          errors.push('Password is required for secured networks');
        }
      }
      break;

    case 'vcard':
      if (!data.vcard) {
        errors.push('Contact data is required');
        return { isValid: false, errors };
      } else {
        if (!data.vcard.firstName.trim() && !data.vcard.lastName.trim()) {
          errors.push('At least first name or last name is required');
        }
        if (data.vcard.email && !isValidEmail(data.vcard.email)) {
          errors.push('Invalid email format');
        }
        if (data.vcard.url && !isValidUrl(data.vcard.url)) {
          errors.push('Invalid URL format');
        }
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Creates initial data structure for a given QR type
 */
export function createInitialQRData(type: QRDataType): QRData {
  const baseData: QRData = { type };

  switch (type) {
    case 'url':
      baseData.url = '';
      break;
    case 'text':
      baseData.text = '';
      break;
    case 'wifi':
      baseData.wifi = {
        ssid: '',
        password: '',
        security: 'WPA',
        hidden: false,
      };
      break;
    case 'vcard':
      baseData.vcard = {
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        organization: '',
        url: '',
      };
      break;
  }

  return baseData;
}

/**
 * Gets default QR options
 */
export function getDefaultQROptions(): QROptions {
  return {
    size: 300,
    foregroundColor: '#000000',
    backgroundColor: '#ffffff',
    errorCorrectionLevel: 'M',
  };
}

/**
 * Converts QR options to qr-code-styling format
 */
export function convertToQRCodeStylingOptions(options: QROptions, data: string) {
  return {
    width: options.size,
    height: options.size,
    type: 'canvas' as const,
    data,
    dotsOptions: {
      color: options.foregroundColor,
      type: 'rounded' as const,
    },
    backgroundOptions: {
      color: options.backgroundColor,
    },
    cornersSquareOptions: {
      color: options.foregroundColor,
      type: 'extra-rounded' as const,
    },
    cornersDotOptions: {
      color: options.foregroundColor,
      type: 'dot' as const,
    },
    qrOptions: {
      errorCorrectionLevel: options.errorCorrectionLevel,
    },
  };
}

/**
 * Utility functions for validation
 */
function isValidUrl(url: string): boolean {
  try {
    if (!url) return false;
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Error correction level information
 */
export const ERROR_CORRECTION_LEVELS = {
  L: { label: 'Low (7%)', value: 'L' as ErrorCorrectionLevel },
  M: { label: 'Medium (15%)', value: 'M' as ErrorCorrectionLevel },
  Q: { label: 'Quartile (25%)', value: 'Q' as ErrorCorrectionLevel },
  H: { label: 'High (30%)', value: 'H' as ErrorCorrectionLevel },
} as const;

/**
 * QR data type configurations
 */
export const QR_DATA_TYPES = {
  url: { label: 'URL', icon: 'Link' },
  text: { label: 'Text', icon: 'Type' },
  wifi: { label: 'WiFi', icon: 'Wifi' },
  vcard: { label: 'Contact', icon: 'User' },
} as const;
