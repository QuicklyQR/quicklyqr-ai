'use client';

import React, { useState, useCallback } from 'react';
import { X, FileText, Eye, Play, Download, CheckCircle } from 'lucide-react';

// Import the existing CSV components
// Note: These should be available based on the handoff document
import CSVUpload from './CSVUpload';
import CSVPreview from './CSVPreview';

export type ProcessingStage = 'upload' | 'preview' | 'processing' | 'complete';

export interface CSVRow {
  [key: string]: string;
}

export interface ProcessingOptions {
  logoFile?: File;
  qrSize: number;
  foregroundColor: string;
  backgroundColor: string;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
}

interface CSVBulkProcessorProps {
  isOpen: boolean;
  onClose: () => void;
  logoFile?: File;
  processingOptions?: Partial<ProcessingOptions>;
}

const CSVBulkProcessor: React.FC<CSVBulkProcessorProps> = ({
  isOpen,
  onClose,
  logoFile,
  processingOptions = {},
}) => {
  const [stage, setStage] = useState<ProcessingStage>('upload');
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [processedCount, setProcessedCount] = useState<number>(0);

  // Default processing options
  const defaultOptions: ProcessingOptions = {
    qrSize: 300,
    foregroundColor: '#000000',
    backgroundColor: '#ffffff',
    errorCorrectionLevel: 'M',
    ...processingOptions,
    logoFile: logoFile || processingOptions.logoFile,
  };

  // Handle CSV upload completion
  const handleCSVUpload = useCallback((data: CSVRow[], headers: string[], file: File) => {
    setCsvData(data);
    setCsvHeaders(headers);
    setFileName(file.name);
    setStage('preview');
  }, []);

  // Handle processing completion from CSVPreview
  const handleProcessingComplete = useCallback((zipBlob: Blob, processedCount: number) => {
    // Create download URL for the ZIP file
    const url = URL.createObjectURL(zipBlob);
    setDownloadUrl(url);
    setProcessedCount(processedCount);
    setStage('complete');
  }, []);

  // Handle back navigation
  const handleBack = useCallback(() => {
    switch (stage) {
      case 'preview':
        setStage('upload');
        setCsvData([]);
        setCsvHeaders([]);
        setFileName('');
        break;
      case 'processing':
        setStage('preview');
        break;
      case 'complete':
        setStage('preview');
        // Clean up the download URL
        if (downloadUrl) {
          URL.revokeObjectURL(downloadUrl);
          setDownloadUrl('');
        }
        setProcessedCount(0);
        break;
    }
  }, [stage, downloadUrl]);

  // Handle modal close with cleanup
  const handleClose = useCallback(() => {
    // Clean up any object URLs
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }
    
    // Reset all state
    setStage('upload');
    setCsvData([]);
    setCsvHeaders([]);
    setFileName('');
    setDownloadUrl('');
    setProcessedCount(0);
    
    onClose();
  }, [onClose, downloadUrl]);

  // Handle direct download
  const handleDownload = useCallback(() => {
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `qr-codes-${fileName.replace('.csv', '')}-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [downloadUrl, fileName]);

  // Stage progress indicator
  const getStageProgress = () => {
    switch (stage) {
      case 'upload': return 25;
      case 'preview': return 50;
      case 'processing': return 75;
      case 'complete': return 100;
      default: return 0;
    }
  };

  // Stage titles
  const getStageTitles = () => {
    switch (stage) {
      case 'upload': return 'Upload CSV File';
      case 'preview': return 'Preview & Configure';
      case 'processing': return 'Processing QR Codes';
      case 'complete': return 'Download Complete';
      default: return 'CSV Bulk Processing';
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="csv-processor-title"
    >
      <div className="relative max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div className="flex-1">
            <h2 id="csv-processor-title" className="text-xl font-semibold text-gray-900">
              {getStageTitles()}
            </h2>
            
            {/* Progress bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex space-x-4">
                  <span className={stage === 'upload' ? 'font-medium text-blue-600' : 'text-gray-400'}>
                    Upload
                  </span>
                  <span className={stage === 'preview' ? 'font-medium text-blue-600' : stage === 'upload' ? 'text-gray-400' : 'text-gray-600'}>
                    Preview
                  </span>
                  <span className={stage === 'processing' ? 'font-medium text-blue-600' : ['upload', 'preview'].includes(stage) ? 'text-gray-400' : 'text-gray-600'}>
                    Process
                  </span>
                  <span className={stage === 'complete' ? 'font-medium text-blue-600' : 'text-gray-400'}>
                    Complete
                  </span>
                </div>
              </div>
              
              <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                <div 
                  className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${getStageProgress()}%` }}
                />
              </div>
            </div>
          </div>
          
          <button
            onClick={handleClose}
            className="ml-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close CSV bulk processor"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-200px)] overflow-y-auto p-6">
          {stage === 'upload' && (
            <div className="space-y-6">
              <div className="text-center text-gray-600">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Upload your CSV file
                </h3>
                <p className="mt-2">
                  Upload a CSV file with data to generate QR codes in bulk. Each row will create one QR code.
                </p>
              </div>
              
              <CSVUpload onUpload={handleCSVUpload} />
              
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h4 className="font-medium text-blue-900">CSV Format Requirements</h4>
                <ul className="mt-2 space-y-1 text-sm text-blue-800">
                  <li>• Include a column with URLs, text, or other QR code data</li>
                  <li>• File size limit: 10MB</li>
                  <li>• Supported format: .csv files only</li>
                  <li>• First row should contain column headers</li>
                </ul>
              </div>
            </div>
          )}

          {stage === 'preview' && csvData.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Preview CSV Data
                  </h3>
                  <p className="text-gray-600">
                    Review your data and configure QR code generation settings
                  </p>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  <span>{fileName}</span>
                  <span>•</span>
                  <span>{csvData.length} rows</span>
                </div>
              </div>

              <CSVPreview
                data={csvData}
                headers={csvHeaders}
                processingOptions={defaultOptions}
                onProcessingComplete={handleProcessingComplete}
                onProcessingStart={() => setStage('processing')}
              />
            </div>
          )}

          {stage === 'processing' && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-4 border-t-blue-600" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Processing QR Codes
                </h3>
                <p className="mt-2 text-gray-600">
                  Generating QR codes and creating ZIP file...
                </p>
              </div>
            </div>
          )}

          {stage === 'complete' && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Processing Complete!
                </h3>
                <p className="mt-2 text-gray-600">
                  Successfully generated {processedCount} QR codes
                </p>
              </div>

              <div className="rounded-lg border border-green-200 bg-green-50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-green-900">
                      Your QR codes are ready
                    </h4>
                    <p className="mt-1 text-sm text-green-800">
                      {processedCount} QR codes generated and packaged in a ZIP file
                    </p>
                  </div>
                  
                  <button
                    onClick={handleDownload}
                    className="flex items-center space-x-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download ZIP</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-sm text-gray-600">
                <h4 className="font-medium text-gray-900">What's included:</h4>
                <ul className="space-y-1">
                  <li>• {processedCount} PNG QR code images</li>
                  <li>• Organized by row data for easy identification</li>
                  <li>• High-quality {defaultOptions.qrSize}×{defaultOptions.qrSize}px resolution</li>
                  {defaultOptions.logoFile && <li>• Logo embedded in each QR code</li>}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-3">
              {stage !== 'upload' && stage !== 'processing' && (
                <button
                  onClick={handleBack}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Back
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {stage === 'complete' && (
                <button
                  onClick={() => {
                    handleBack();
                    setStage('upload'); // Go back to start for new processing
                  }}
                  className="rounded-lg border border-blue-600 bg-white px-4 py-2 text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Process Another File
                </button>
              )}
              
              <button
                onClick={handleClose}
                className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVBulkProcessor;
