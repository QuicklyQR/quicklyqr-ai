'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface LogoUploadProps {
  logoFile: File | undefined;
  onLogoChange: (file: File | undefined) => void;
  className?: string;
}

const LogoUpload: React.FC<LogoUploadProps> = ({ 
  logoFile, 
  onLogoChange, 
  className = '' 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError('');
    
    if (rejectedFiles.length > 0) {
      setError('Please upload a valid image file (PNG, JPG, SVG)');
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      onLogoChange(file);
    }
  }, [onLogoChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp']
    },
    multiple: false,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  const handleRemoveLogo = () => {
    onLogoChange(undefined);
    setError('');
  };

  const logoPreview = logoFile ? URL.createObjectURL(logoFile) : null;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {!logoFile && (
        <div
          {...getRootProps()}
          className={`relative cursor-pointer rounded-lg border-2 border-dashed transition-all ${
            isDragActive || dragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center px-6 py-8 text-center">
            <div className={`rounded-full p-3 ${
              isDragActive || dragActive ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              <Upload className={`h-8 w-8 ${
                isDragActive || dragActive ? 'text-blue-600' : 'text-gray-400'
              }`} />
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-900">
                Drop your logo here, or{' '}
                <span className="text-blue-600 underline">browse files</span>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                PNG, JPG, SVG up to 5MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Logo Preview */}
      {logoFile && logoPreview && (
        <div className="relative rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center space-x-4">
            {/* Preview Image */}
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200">
              <img
                src={logoPreview}
                alt="Logo preview"
                className="h-full w-full object-contain"
              />
            </div>
            
            {/* File Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <ImageIcon className="mr-2 h-4 w-4 text-gray-400" />
                <p className="truncate text-sm font-medium text-gray-900">
                  {logoFile.name}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {(logoFile.size / 1024).toFixed(1)} KB
              </p>
            </div>

            {/* Remove Button */}
            <button
              onClick={handleRemoveLogo}
              className="flex-shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Remove logo"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Logo Settings */}
      {logoFile && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Logo Settings</h4>
          <p className="text-xs text-gray-600">
            Your logo will be automatically centered and sized appropriately for optimal QR code scanning.
          </p>
        </div>
      )}
    </div>
  );
};

export default LogoUpload;