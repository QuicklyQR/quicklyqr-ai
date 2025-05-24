'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, Wifi, User, Link, Type, AlertCircle, Eye, EyeOff, Camera } from 'lucide-react';
import dynamic from 'next/dynamic';
import QRCodeStyling from 'qr-code-styling';
import {
  QRData,
  QROptions,
  QRDataType,
  generateQRString,
  validateQRData,
  createInitialQRData,
  getDefaultQROptions,
  convertToQRCodeStylingOptions,
  ERROR_CORRECTION_LEVELS,
  QR_DATA_TYPES,
} from '../lib/qr-utils';

// Custom hook to handle QR code generation with proper cleanup
const useQRCode = (qrString: string, options: QROptions) => {
  const [qrInstance, setQrInstance] = useState<QRCodeStyling | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!qrString) {
      setQrInstance(null);
      setIsLoading(false);
      return;
    }

    // Store ref value at the start of effect to avoid stale closure
    const container = containerRef.current;
    if (!container) {
      setQrInstance(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const generateQR = async () => {
      try {
        // Clear existing content safely
        container.innerHTML = '';

        // Create new QR code instance
        const stylingOptions = convertToQRCodeStylingOptions(options, qrString);
        const qr = new QRCodeStyling(stylingOptions);

        // Wait for next frame to ensure DOM is ready
        await new Promise((resolve) => requestAnimationFrame(resolve));

        // Check if container still exists and is mounted before appending
        if (container && container.parentNode) {
          await qr.append(container);
          setQrInstance(qr);
        }
      } catch (error) {
        console.error('Failed to generate QR code:', error);
        setQrInstance(null);
      } finally {
        setIsLoading(false);
      }
    };

    generateQR();

    // FIXED: Cleanup function with proper ref handling
    return () => {
      // Use the container variable captured at the start of the effect
      if (container) {
        container.innerHTML = '';
      }
      setQrInstance(null);
    };
  }, [qrString, options]);

  return { qrInstance, containerRef, isLoading };
};

// Dynamically import the scanner component to avoid SSR issues with browser APIs
const QRCodeScanner = dynamic(() => import('./QRCodeScanner'), {
  ssr: false,
});

const QRCodeBuilder: React.FC = () => {
  const [qrData, setQrData] = useState<QRData>(createInitialQRData('url'));
  const [qrOptions, setQrOptions] = useState<QROptions>(getDefaultQROptions());
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [canGenerate, setCanGenerate] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Handle field touch for validation timing
  const handleFieldTouch = useCallback((fieldName: string) => {
    setTouchedFields((prev) => ({
      ...prev,
      [fieldName]: true,
    }));
  }, []);

  // Update validation and generate status when qrData changes
  useEffect(() => {
    const validation = validateQRData(qrData);
    const qrString = generateQRString(qrData).trim();
    const isValid = Boolean(qrString && validation.isValid);

    // Only show errors if user has interacted with fields
    const shouldShowErrors = Object.keys(touchedFields).some((key) => touchedFields[key]);
    setValidationErrors(shouldShowErrors ? validation.errors : []);
    setCanGenerate(isValid);
  }, [qrData, touchedFields]);

  // Use custom hook for QR code management
  const qrString = canGenerate ? generateQRString(qrData).trim() : '';
  const { qrInstance, containerRef, isLoading } = useQRCode(qrString, qrOptions);

  // Download QR code as PNG
  const handleDownload = async () => {
    if (!qrInstance) return;

    setIsGenerating(true);
    try {
      await qrInstance.download({
        name: `qr-code-${Date.now()}`,
        extension: 'png',
      });
    } catch (error) {
      console.error('Failed to download QR code:', error);
      alert('Failed to download QR code. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Handle successful QR code scan
  const handleScanSuccess = (scannedData: string) => {
    try {
      // Try to detect the QR code type and parse the data
      if (scannedData.startsWith('BEGIN:VCARD') && scannedData.includes('END:VCARD')) {
        // vCard format
        const newData = createInitialQRData('vcard');
        
        // Extract name
        const fnMatch = scannedData.match(/FN:(.*?)(?:\r?\n|$)/);
        const nameMatch = scannedData.match(/N:(.*?)(?:\r?\n|$)/);
        
        if (fnMatch && fnMatch[1]) {
          const nameParts = fnMatch[1].trim().split(' ');
          if (nameParts.length > 0) {
            newData.vcard!.firstName = nameParts[0] || '';
            newData.vcard!.lastName = nameParts.slice(1).join(' ') || '';
          }
        } else if (nameMatch && nameMatch[1]) {
          const nameParts = nameMatch[1].split(';');
          newData.vcard!.lastName = nameParts[0] || '';
          newData.vcard!.firstName = nameParts[1] || '';
        }
        
        // Extract other fields
        const telMatch = scannedData.match(/TEL(?:;[^:]*)?:(.*?)(?:\r?\n|$)/);
        if (telMatch) newData.vcard!.phone = telMatch[1].trim();
        
        const emailMatch = scannedData.match(/EMAIL(?:;[^:]*)?:(.*?)(?:\r?\n|$)/);
        if (emailMatch) newData.vcard!.email = emailMatch[1].trim();
        
        const orgMatch = scannedData.match(/ORG:(.*?)(?:\r?\n|$)/);
        if (orgMatch) newData.vcard!.organization = orgMatch[1].trim();
        
        const urlMatch = scannedData.match(/URL:(.*?)(?:\r?\n|$)/);
        if (urlMatch) newData.vcard!.url = urlMatch[1].trim();
        
        setQrData(newData);
        setTouchedFields({});
      } else if (scannedData.startsWith('WIFI:')) {
        // WiFi format
        const newData = createInitialQRData('wifi');
        
        const securityMatch = scannedData.match(/T:([^;]*)/);
        if (securityMatch) {
          newData.wifi!.security = (securityMatch[1] === 'WPA' || securityMatch[1] === 'WEP') 
            ? securityMatch[1] 
            : 'nopass';
        }
        
        const ssidMatch = scannedData.match(/S:([^;]*)/);
        if (ssidMatch) newData.wifi!.ssid = ssidMatch[1];
        
        const passwordMatch = scannedData.match(/P:([^;]*)/);
        if (passwordMatch) newData.wifi!.password = passwordMatch[1];
        
        const hiddenMatch = scannedData.match(/H:([^;]*)/);
        if (hiddenMatch) newData.wifi!.hidden = hiddenMatch[1].toLowerCase() === 'true';
        
        setQrData(newData);
        setTouchedFields({});
      } else if (scannedData.match(/^https?:\/\//)) {
        // URL format
        const newData = createInitialQRData('url');
        newData.url = scannedData;
        setQrData(newData);
        setTouchedFields({});
      } else {
        // Default to text
        const newData = createInitialQRData('text');
        newData.text = scannedData;
        setQrData(newData);
        setTouchedFields({});
      }
      
      setShowScanner(false);
    } catch (error) {
      console.error('Failed to parse scanned QR code:', error);
      // Fall back to text format
      const newData = createInitialQRData('text');
      newData.text = scannedData;
      setQrData(newData);
      setTouchedFields({});
      setShowScanner(false);
    }
  };

  // Update QR data based on type
  const updateQRData = useCallback((field: string, value: string | boolean) => {
    setQrData((prev) => {
      if (prev.type === 'wifi' && prev.wifi) {
        return { ...prev, wifi: { ...prev.wifi, [field]: value } };
      } else if (prev.type === 'vcard' && prev.vcard) {
        return { ...prev, vcard: { ...prev.vcard, [field]: value } };
      } else {
        return { ...prev, [field]: value };
      }
    });
  }, []);

  // Change QR data type
  const changeDataType = useCallback((type: QRDataType) => {
    setQrData(createInitialQRData(type));
    setValidationErrors([]);
    setTouchedFields({});
  }, []);

  // Update QR options
  const updateQROptions = useCallback((field: keyof QROptions, value: string | number) => {
    setQrOptions((prev) => ({ ...prev, [field]: value }));
  }, []);

  const renderDataInputs = () => {
    switch (qrData.type) {
      case 'url':
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="url-input">
                URL *
              </label>
              <input
                id="url-input"
                type="url"
                value={qrData.url || ''}
                onChange={(e) => {
                  let value = e.target.value;
                  // Auto-add https:// if user types a domain without protocol
                  if (
                    value &&
                    value.length > 3 &&
                    !value.match(/^https?:\/\//) &&
                    value.includes('.')
                  ) {
                    value = `https://${value}`;
                  }
                  updateQRData('url', value);
                }}
                onBlur={() => handleFieldTouch('url')}
                placeholder="https://example.com"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-describedby="url-help"
                aria-invalid={validationErrors.some((error) => error.includes('URL'))}
              />
              <p id="url-help" className="mt-1 text-xs text-gray-500">
                We&apos;ll automatically add https:// if you don&apos;t include it
              </p>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="text-input">
                Text Content *
              </label>
              <textarea
                id="text-input"
                value={qrData.text || ''}
                onChange={(e) => updateQRData('text', e.target.value)}
                onBlur={() => handleFieldTouch('text')}
                placeholder="Enter your text here..."
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-describedby="text-help"
                aria-invalid={validationErrors.some((error) => error.includes('Text'))}
              />
              <p id="text-help" className="mt-1 text-xs text-gray-500">
                Any text content will be encoded in the QR code
              </p>
            </div>
          </div>
        );

      case 'wifi':
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="ssid-input">
                Network Name (SSID) *
              </label>
              <input
                id="ssid-input"
                type="text"
                value={qrData.wifi?.ssid || ''}
                onChange={(e) => updateQRData('ssid', e.target.value)}
                onBlur={() => handleFieldTouch('ssid')}
                placeholder="My WiFi Network"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-invalid={validationErrors.some((error) => error.includes('SSID'))}
              />
            </div>
            <div>
              <label
                className="mb-2 block text-sm font-medium text-gray-700"
                htmlFor="security-select"
              >
                Security Type
              </label>
              <select
                id="security-select"
                value={qrData.wifi?.security || 'WPA'}
                onChange={(e) => updateQRData('security', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">No Password</option>
              </select>
            </div>
            {qrData.wifi?.security !== 'nopass' && (
              <div>
                <label
                  className="mb-2 block text-sm font-medium text-gray-700"
                  htmlFor="password-input"
                >
                  Password *
                </label>
                <div className="relative">
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={qrData.wifi?.password || ''}
                    onChange={(e) => updateQRData('password', e.target.value)}
                    onBlur={() => handleFieldTouch('password')}
                    placeholder="WiFi password"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-invalid={validationErrors.some((error) => error.includes('Password'))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 transform rounded text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hidden-network"
                checked={qrData.wifi?.hidden || false}
                onChange={(e) => updateQRData('hidden', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="hidden-network" className="ml-2 block text-sm text-gray-700">
                Hidden Network
              </label>
            </div>
          </div>
        );

      case 'vcard':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label
                  className="mb-2 block text-sm font-medium text-gray-700"
                  htmlFor="firstname-input"
                >
                  First Name *
                </label>
                <input
                  id="firstname-input"
                  type="text"
                  value={qrData.vcard?.firstName || ''}
                  onChange={(e) => updateQRData('firstName', e.target.value)}
                  onBlur={() => handleFieldTouch('firstName')}
                  placeholder="John"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-invalid={validationErrors.some((error) => error.includes('name'))}
                />
              </div>
              <div>
                <label
                  className="mb-2 block text-sm font-medium text-gray-700"
                  htmlFor="lastname-input"
                >
                  Last Name
                </label>
                <input
                  id="lastname-input"
                  type="text"
                  value={qrData.vcard?.lastName || ''}
                  onChange={(e) => updateQRData('lastName', e.target.value)}
                  onBlur={() => handleFieldTouch('lastName')}
                  placeholder="Doe"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="phone-input">
                Phone Number
              </label>
              <input
                id="phone-input"
                type="tel"
                value={qrData.vcard?.phone || ''}
                onChange={(e) => updateQRData('phone', e.target.value)}
                onBlur={() => handleFieldTouch('phone')}
                placeholder="+1 (555) 123-4567"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="email-input">
                Email
              </label>
              <input
                id="email-input"
                type="email"
                value={qrData.vcard?.email || ''}
                onChange={(e) => updateQRData('email', e.target.value)}
                onBlur={() => handleFieldTouch('email')}
                placeholder="john@example.com"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-invalid={validationErrors.some((error) => error.includes('email'))}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="org-input">
                Organization
              </label>
              <input
                id="org-input"
                type="text"
                value={qrData.vcard?.organization || ''}
                onChange={(e) => updateQRData('organization', e.target.value)}
                onBlur={() => handleFieldTouch('organization')}
                placeholder="Company Name"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                className="mb-2 block text-sm font-medium text-gray-700"
                htmlFor="website-input"
              >
                Website
              </label>
              <input
                id="website-input"
                type="url"
                value={qrData.vcard?.url || ''}
                onChange={(e) => updateQRData('url', e.target.value)}
                onBlur={() => handleFieldTouch('vcardUrl')}
                placeholder="https://company.com"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-invalid={validationErrors.some((error) => error.includes('URL'))}
              />
            </div>
            <p className="text-xs text-gray-500">* At least first name or last name is required</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4">

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            {/* QR Code Type Selection */}
            <div>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">QR Code Type</h2>
              <div
                className="grid grid-cols-2 gap-3"
                role="radiogroup"
                aria-label="QR Code Type Selection"
              >
                {Object.entries(QR_DATA_TYPES).map(([type, config]) => {
                  const IconComponent = {
                    Link,
                    Type,
                    Wifi,
                    User,
                  }[config.icon];

                  return (
                    <button
                      key={type}
                      onClick={() => changeDataType(type as QRDataType)}
                      className={`flex items-center justify-center rounded-lg border-2 p-3 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        qrData.type === type
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                      role="radio"
                      aria-checked={qrData.type === type}
                      aria-label={`Select ${config.label} QR code type`}
                    >
                      <IconComponent className="mr-2 h-5 w-5" aria-hidden="true" />
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div
                className="rounded-lg border border-red-200 bg-red-50 p-4"
                role="alert"
                aria-live="polite"
              >
                <div className="flex items-start">
                  <AlertCircle
                    className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-red-500"
                    aria-hidden="true"
                  />
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-red-800">
                      Please fix the following errors:
                    </h4>
                    <ul className="space-y-1 text-sm text-red-700">
                      {validationErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Data Inputs */}
            <div>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Content</h2>
              {renderDataInputs()}
            </div>

            {/* Customization Options */}
            <div>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Customization</h2>
              <div className="space-y-4">
                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-gray-700"
                    htmlFor="size-slider"
                  >
                    Size: {qrOptions.size}px
                  </label>
                  <input
                    id="size-slider"
                    type="range"
                    min="128"
                    max="1024"
                    step="32"
                    value={qrOptions.size}
                    onChange={(e) => updateQROptions('size', parseInt(e.target.value))}
                    className="w-full accent-blue-600"
                    aria-label={`QR code size: ${qrOptions.size} pixels`}
                  />
                  <div className="mt-1 flex justify-between text-xs text-gray-500">
                    <span>128px</span>
                    <span>1024px</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Foreground Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={qrOptions.foregroundColor}
                        onChange={(e) => updateQROptions('foregroundColor', e.target.value)}
                        className="h-10 w-12 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Foreground color picker"
                      />
                      <input
                        type="text"
                        value={qrOptions.foregroundColor}
                        onChange={(e) => updateQROptions('foregroundColor', e.target.value)}
                        className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="#000000"
                        aria-label="Foreground color hex value"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Background Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={qrOptions.backgroundColor}
                        onChange={(e) => updateQROptions('backgroundColor', e.target.value)}
                        className="h-10 w-12 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Background color picker"
                      />
                      <input
                        type="text"
                        value={qrOptions.backgroundColor}
                        onChange={(e) => updateQROptions('backgroundColor', e.target.value)}
                        className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="#ffffff"
                        aria-label="Background color hex value"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-gray-700"
                    htmlFor="error-correction"
                  >
                    Error Correction Level
                  </label>
                  <select
                    id="error-correction"
                    value={qrOptions.errorCorrectionLevel}
                    onChange={(e) => updateQROptions('errorCorrectionLevel', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.values(ERROR_CORRECTION_LEVELS).map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Higher levels provide better error recovery but result in larger QR codes
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - QR Code Preview */}
          <div className="space-y-6">
            <div>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Preview</h2>
              <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-gray-200 bg-white p-8">
                <div className="flex h-full w-full items-center justify-center">
                  {canGenerate ? (
                    <div className="relative">
                      <div
                        ref={containerRef}
                        className="flex items-center justify-center"
                        aria-label="Generated QR code"
                      />
                      {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                          <div className="text-gray-500">Generating...</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400">
                      <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-lg bg-gray-100">
                        <Type className="h-16 w-16 text-gray-300" aria-hidden="true" />
                      </div>
                      <p>
                        {validationErrors.length > 0
                          ? 'Fix errors to generate QR code'
                          : 'Enter content to generate QR code'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {/* Download Button */}
              <button
                onClick={handleDownload}
                disabled={!canGenerate || isGenerating}
                className={`flex items-center justify-center rounded-lg px-6 py-3 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  !canGenerate || isGenerating
                    ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                aria-label={isGenerating ? 'Generating QR code' : 'Download QR code as PNG'}
              >
                <Download className="mr-2 h-5 w-5" aria-hidden="true" />
                {isGenerating ? 'Generating...' : 'Download'}
              </button>
              
              {/* Scan Button */}
              <button
                onClick={() => setShowScanner(true)}
                className="flex items-center justify-center rounded-lg border-2 border-blue-600 bg-white px-6 py-3 font-medium text-blue-600 transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Scan QR code with camera"
              >
                <Camera className="mr-2 h-5 w-5" aria-hidden="true" />
                Scan QR
              </button>
            </div>

            {/* Info Section */}
            {canGenerate && (
              <div
                className="rounded-lg border border-blue-200 bg-blue-50 p-4"
                role="status"
                aria-live="polite"
              >
                <div className="text-sm text-blue-800">
                  <p className="mb-1 font-medium">Ready to download!</p>
                  <p>
                    Your {qrOptions.size}×{qrOptions.size}px QR code will be saved as a PNG file.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* QR Code Scanner Modal */}
      {showScanner && (
        <QRCodeScanner 
          onScanSuccess={handleScanSuccess} 
          onClose={() => setShowScanner(false)} 
        />
      )}
    </div>
  );
};

export default QRCodeBuilder;
