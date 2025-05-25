import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';

interface CSVUploadProps {
  onCSVUpload: (file: File, parsedData: CSVData[]) => void;
  onError: (error: string) => void;
}

export interface CSVData {
  content: string;
  type: 'url' | 'text' | 'wifi' | 'contact';
  customName?: string;
}

export default function CSVUpload({ onCSVUpload, onError }: CSVUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (file: File) => {
      if (!file) return;

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setUploadStatus('error');
        setStatusMessage('File is too large. Maximum size is 10MB.');
        onError('File is too large. Maximum size is 10MB.');
        return;
      }

      // Check file type
      if (!file.name.endsWith('.csv')) {
        setUploadStatus('error');
        setStatusMessage('Only CSV files are supported.');
        onError('Only CSV files are supported.');
        return;
      }

      try {
        setUploadedFile(file);
        const parsedData = await parseCSV(file);
        setUploadStatus('success');
        setStatusMessage(`Successfully processed ${parsedData.length} QR code entries.`);
        onCSVUpload(file, parsedData);
      } catch (error) {
        setUploadStatus('error');
        const errorMessage = error instanceof Error ? error.message : 'Failed to parse CSV file';
        setStatusMessage(errorMessage);
        onError(errorMessage);
      }
    },
    [onCSVUpload, onError]
  );

  const parseCSV = async (file: File): Promise<CSVData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const csvText = event.target?.result as string;
          if (!csvText) {
            reject(new Error('Failed to read file'));
            return;
          }

          // Split by lines and remove empty lines
          const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
          
          // Check if there's a header row
          if (lines.length === 0) {
            reject(new Error('CSV file is empty'));
            return;
          }

          // Parse header row
          const header = lines[0].split(',').map(h => h.trim().toLowerCase());
          const typeIndex = header.indexOf('type');
          const contentIndex = header.indexOf('content');
          const nameIndex = header.indexOf('name');

          // Validate required columns
          if (typeIndex === -1 || contentIndex === -1) {
            reject(new Error('CSV must contain "type" and "content" columns'));
            return;
          }

          const parsedData: CSVData[] = [];
          
          // Start from index 1 to skip header
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            
            if (values.length <= Math.max(typeIndex, contentIndex)) {
              continue; // Skip malformed rows
            }

            const type = values[typeIndex].toLowerCase();
            const content = values[contentIndex];
            const customName = nameIndex !== -1 ? values[nameIndex] : undefined;

            // Validate type
            if (!['url', 'text', 'wifi', 'contact'].includes(type)) {
              continue; // Skip invalid types
            }

            parsedData.push({
              type: type as 'url' | 'text' | 'wifi' | 'contact',
              content,
              customName
            });
          }

          resolve(parsedData);
        } catch (error) {
          reject(new Error('Failed to parse CSV file'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setUploadStatus('idle');
    setStatusMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {!uploadedFile ? (
        <div
          className={`border-2 border-dashed ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          } rounded-lg p-6 text-center transition-colors duration-200`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900 mb-1">
            Drop your CSV file here, or{' '}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              browse
            </button>
          </p>
          <p className="text-xs text-gray-500">
            Supports CSV files • Max 10MB
          </p>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-gray-500 mr-3" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {uploadedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {(uploadedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={resetUpload}
              className="ml-2 text-gray-400 hover:text-gray-600"
              aria-label="Remove file"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {uploadStatus !== 'idle' && (
            <div className={`mt-3 p-3 rounded-md ${
              uploadStatus === 'success' ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <div className="flex">
                {uploadStatus === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                )}
                <p className={`text-sm ${
                  uploadStatus === 'success' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {statusMessage}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}
