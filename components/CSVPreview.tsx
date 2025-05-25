'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Eye,
  EyeOff,
  MoreVertical 
} from 'lucide-react';
import JSZip from 'jszip';
import QRCodeStyling from 'qr-code-styling';
import { 
  generateQRString, 
  validateQRData, 
  createInitialQRData,
  getDefaultQROptions,
  convertToQRCodeStylingOptions,
  QRData,
  QROptions 
} from '../lib/qr-utils';

export interface CSVRow {
  id: string;
  originalIndex: number;
  data: Record<string, string>;
  selected: boolean;
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  qrCodeUrl?: string;
}

export interface CSVPreviewProps {
  data: any[];
  headers: string[];
  onProcessComplete: (results: ProcessingResult[]) => void;
  onCancel: () => void;
  qrOptions?: QROptions;
}

export interface ProcessingResult {
  row: CSVRow;
  success: boolean;
  qrCodeDataUrl?: string;
  error?: string;
}

export interface ProcessingProgress {
  total: number;
  completed: number;
  failed: number;
  current?: string;
}

const CSVPreview: React.FC<CSVPreviewProps> = ({
  data,
  headers,
  onProcessComplete,
  onCancel,
  qrOptions = getDefaultQROptions()
}) => {
  // Initialize rows with proper structure
  const [rows, setRows] = useState<CSVRow[]>(() =>
    data.map((item, index) => ({
      id: `row-${index}`,
      originalIndex: index,
      data: item,
      selected: true,
      status: 'pending' as const,
    }))
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress>({
    total: 0,
    completed: 0,
    failed: 0,
  });
  const [showPreview, setShowPreview] = useState(false);
  const [previewLimit] = useState(10);
  const [qrField, setQrField] = useState<string>(headers[0] || '');
  
  // Processing control refs
  const processingRef = useRef<{
    shouldStop: boolean;
    isPaused: boolean;
  }>({ shouldStop: false, isPaused: false });

  // Update processing refs when state changes
  useEffect(() => {
    processingRef.current.shouldStop = false;
    processingRef.current.isPaused = isPaused;
  }, [isPaused]);

  // Toggle all rows selection
  const toggleAllSelection = useCallback(() => {
    const allSelected = rows.every(row => row.selected);
    setRows(prevRows => prevRows.map(row => ({ ...row, selected: !allSelected })));
  }, [rows]);

  // Toggle individual row selection
  const toggleRowSelection = useCallback((rowId: string) => {
    setRows(prevRows => prevRows.map(row => 
      row.id === rowId ? { ...row, selected: !row.selected } : row
    ));
  }, [rows]);

  // Generate QR code for a single data string
  const generateQRCode = useCallback(async (dataString: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        if (!dataString || dataString.trim() === '') {
          reject(new Error('Empty data string'));
          return;
        }

        // Create QR data object based on content type
        let qrData: QRData;
        
        if (dataString.match(/^https?:\/\//)) {
          qrData = createInitialQRData('url');
          qrData.url = dataString;
        } else {
          qrData = createInitialQRData('text');
          qrData.text = dataString;
        }

        // Validate the data
        const validation = validateQRData(qrData);
        if (!validation.isValid) {
          reject(new Error(`Invalid QR data: ${validation.errors.join(', ')}`));
          return;
        }

        // Generate QR string
        const qrString = generateQRString(qrData);
        if (!qrString.trim()) {
          reject(new Error('Empty QR data'));
          return;
        }

        // Create QR code styling options
        const stylingOptions = convertToQRCodeStylingOptions(qrOptions, qrString);
        const qr = new QRCodeStyling(stylingOptions);

        // Create a temporary canvas to get the data URL
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = qrOptions.size;
        tempCanvas.height = qrOptions.size;

        // Use a container div for proper rendering
        const tempDiv = document.createElement('div');
        tempDiv.appendChild(tempCanvas);

        qr.append(tempDiv).then(() => {
          try {
            const dataUrl = tempCanvas.toDataURL('image/png');
            if (dataUrl === 'data:,') {
              reject(new Error('Failed to generate QR code image'));
              return;
            }
            resolve(dataUrl);
          } catch (error) {
            reject(error);
          }
        }).catch(reject);

      } catch (error) {
        reject(error);
      }
    });
  }, [qrOptions]);

  // Process selected rows
  const startProcessing = useCallback(async () => {
    const selectedRows = rows.filter(row => row.selected);
    if (selectedRows.length === 0) return;

    setIsProcessing(true);
    setIsPaused(false);
    processingRef.current.shouldStop = false;
    processingRef.current.isPaused = false;

    const results: ProcessingResult[] = [];
    
    setProgress({
      total: selectedRows.length,
      completed: 0,
      failed: 0,
    });

    // Reset all selected rows to pending status
    setRows(prevRows => 
      prevRows.map(row => 
        row.selected 
          ? { ...row, status: 'pending' as const, errorMessage: undefined, qrCodeUrl: undefined }
          : row
      )
    );

    for (let i = 0; i < selectedRows.length; i++) {
      // Check if processing should stop
      if (processingRef.current.shouldStop) {
        break;
      }

      // Handle pause
      while (processingRef.current.isPaused && !processingRef.current.shouldStop) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const currentRow = selectedRows[i];
      const dataValue = currentRow.data[qrField] || '';

      // Update current processing status
      setProgress(prev => ({
        ...prev,
        current: `Processing row ${i + 1}: ${dataValue.substring(0, 50)}${dataValue.length > 50 ? '...' : ''}`
      }));

      // Update row status to processing
      setRows(prevRows =>
        prevRows.map(row =>
          row.id === currentRow.id
            ? { ...row, status: 'processing' as const }
            : row
        )
      );

      try {
        // Generate QR code
        const qrCodeDataUrl = await generateQRCode(dataValue);
        
        // Update row status to completed
        setRows(prevRows =>
          prevRows.map(row =>
            row.id === currentRow.id
              ? { 
                  ...row, 
                  status: 'completed' as const, 
                  qrCodeUrl: qrCodeDataUrl 
                }
              : row
          )
        );

        results.push({
          row: { ...currentRow, status: 'completed', qrCodeUrl: qrCodeDataUrl },
          success: true,
          qrCodeDataUrl,
        });

        setProgress(prev => ({
          ...prev,
          completed: prev.completed + 1,
        }));

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Update row status to error
        setRows(prevRows =>
          prevRows.map(row =>
            row.id === currentRow.id
              ? { 
                  ...row, 
                  status: 'error' as const, 
                  errorMessage 
                }
              : row
          )
        );

        results.push({
          row: { ...currentRow, status: 'error', errorMessage },
          success: false,
          error: errorMessage,
        });

        setProgress(prev => ({
          ...prev,
          failed: prev.failed + 1,
        }));
      }

      // Small delay to prevent overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    setIsProcessing(false);
    setIsPaused(false);
    processingRef.current.shouldStop = false;
    
    // Update final progress
    setProgress(prev => ({
      ...prev,
      current: undefined,
    }));

    // Call completion callback
    onProcessComplete(results);
  }, [rows, qrField, generateQRCode, onProcessComplete]);

  // Pause processing
  const pauseProcessing = useCallback(() => {
    setIsPaused(true);
    processingRef.current.isPaused = true;
  }, []);

  // Resume processing
  const resumeProcessing = useCallback(() => {
    setIsPaused(false);
    processingRef.current.isPaused = false;
  }, []);

  // Stop processing
  const stopProcessing = useCallback(() => {
    processingRef.current.shouldStop = true;
    setIsProcessing(false);
    setIsPaused(false);
    
    setProgress({
      total: 0,
      completed: 0,
      failed: 0,
    });
  }, []);

  // Download results as ZIP
  const downloadResults = useCallback(async () => {
    const completedRows = rows.filter(row => row.status === 'completed' && row.qrCodeUrl);
    if (completedRows.length === 0) return;

    try {
      const zip = new JSZip();
      
      for (const row of completedRows) {
        if (row.qrCodeUrl) {
          // Convert data URL to blob
          const response = await fetch(row.qrCodeUrl);
          const blob = await response.blob();
          
          // Create filename from row data
          const dataValue = row.data[qrField] || '';
          const safeFilename = dataValue
            .replace(/[^a-zA-Z0-9-_]/g, '_')
            .substring(0, 50) || `qr_${row.originalIndex}`;
          
          zip.file(`${safeFilename}.png`, blob);
        }
      }
      
      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr_codes_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download results:', error);
      alert('Failed to download results. Please try again.');
    }
  }, [rows, qrField]);

  // Get status icon
  const getStatusIcon = (status: CSVRow['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const selectedCount = rows.filter(row => row.selected).length;
  const completedCount = rows.filter(row => row.status === 'completed').length;
  const displayRows = showPreview ? rows : rows.slice(0, previewLimit);

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">CSV Preview & Processing</h2>
        <p className="text-gray-600">
          Review your data and select which rows to process into QR codes
        </p>
      </div>

      {/* Field Selection */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select field for QR code generation:
        </label>
        <select
          value={qrField}
          onChange={(e) => setQrField(e.target.value)}
          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          data-testid="qr-field-select"
        >
          {headers.map(header => (
            <option key={header} value={header}>
              {header}
            </option>
          ))}
        </select>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedCount === rows.length && rows.length > 0}
            onChange={toggleAllSelection}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            data-testid="select-all-checkbox"
          />
          <span className="text-sm text-gray-700">
            Select All ({selectedCount} of {rows.length} selected)
          </span>
        </div>

        <button
          onClick={() => setShowPreview(!showPreview)}
          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          data-testid="toggle-preview-button"
        >
          {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showPreview ? 'Show Less' : `Show All (${rows.length} rows)`}
        </button>

        {completedCount > 0 && (
          <button
            onClick={downloadResults}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
            data-testid="download-results-button"
          >
            <Download className="h-4 w-4" />
            Download Results ({completedCount})
          </button>
        )}
      </div>

      {/* Processing Controls */}
      {selectedCount > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex flex-wrap gap-3 items-center">
            {!isProcessing ? (
              <button
                onClick={startProcessing}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                data-testid="start-processing-button"
              >
                <Play className="h-4 w-4" />
                Start Processing ({selectedCount} rows)
              </button>
            ) : (
              <>
                {!isPaused ? (
                  <button
                    onClick={pauseProcessing}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center gap-2"
                    data-testid="pause-processing-button"
                  >
                    <Pause className="h-4 w-4" />
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={resumeProcessing}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                    data-testid="resume-processing-button"
                  >
                    <Play className="h-4 w-4" />
                    Resume
                  </button>
                )}
                <button
                  onClick={stopProcessing}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
                  data-testid="stop-processing-button"
                >
                  <Square className="h-4 w-4" />
                  Stop
                </button>
              </>
            )}
          </div>

          {/* Progress Display */}
          {isProcessing && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress: {progress.completed + progress.failed} / {progress.total}</span>
                <span>
                  Completed: {progress.completed} | Failed: {progress.failed}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${progress.total > 0 ? ((progress.completed + progress.failed) / progress.total) * 100 : 0}%`
                  }}
                />
              </div>
              {progress.current && (
                <p className="text-sm text-gray-600 mt-2" data-testid="current-progress">
                  {progress.current}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Data Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Select
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              {headers.map(header => (
                <th
                  key={header}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    header === qrField ? 'bg-blue-100' : ''
                  }`}
                >
                  {header}
                  {header === qrField && (
                    <span className="ml-1 text-blue-600 font-bold">*</span>
                  )}
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Preview
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayRows.map((row) => (
              <tr
                key={row.id}
                className={`${row.selected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                data-testid={`row-${row.originalIndex}`}
              >
                <td className="px-4 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={row.selected}
                    onChange={() => toggleRowSelection(row.id)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    data-testid={`row-checkbox-${row.originalIndex}`}
                  />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(row.status)}
                    {row.status === 'error' && row.errorMessage && (
                      <span className="text-xs text-red-600" title={row.errorMessage}>
                        Error
                      </span>
                    )}
                  </div>
                </td>
                {headers.map(header => (
                  <td
                    key={header}
                    className={`px-4 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate ${
                      header === qrField ? 'bg-blue-50 font-medium' : ''
                    }`}
                    title={row.data[header]}
                  >
                    {row.data[header]}
                  </td>
                ))}
                <td className="px-4 py-4 whitespace-nowrap">
                  {row.qrCodeUrl && (
                    <img 
                      src={row.qrCodeUrl} 
                      alt="QR Code" 
                      className="h-8 w-8"
                      data-testid={`qr-preview-${row.originalIndex}`}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Actions */}
      <div className="mt-6 flex justify-between items-center">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          data-testid="cancel-button"
        >
          Cancel
        </button>
        
        <div className="text-sm text-gray-500">
          {!showPreview && rows.length > previewLimit && (
            <span>Showing {previewLimit} of {rows.length} rows</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CSVPreview;
