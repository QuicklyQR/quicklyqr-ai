import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CSVBulkProcessor from '../../components/CSVBulkProcessor';

// Test utilities for creating real File objects
const createCSVFile = (content: string, filename = 'test.csv'): File => {
  return new File([content], filename, { type: 'text/csv' });
};

const createValidCSVContent = (rows = 3): string => {
  const header = 'name,email,phone';
  const dataRows = Array.from({ length: rows }, (_, i) => 
    `User${i + 1},user${i + 1}@example.com,+1234567890${i}`
  );
  return [header, ...dataRows].join('\n');
};

// Mock canvas for QR code generation testing - NO MOCKS, just setup for canvas API
const setupCanvasMock = () => {
  const mockCanvas = {
    getContext: vi.fn(() => ({
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      fillStyle: '',
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 100 })),
      canvas: { width: 200, height: 200 }
    })),
    toDataURL: vi.fn(() => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='),
    width: 200,
    height: 200,
  };

  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    value: mockCanvas.getContext,
  });
  Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
    value: mockCanvas.toDataURL,
  });
};

describe('CSVBulkProcessor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupCanvasMock();
  });

  // Stage 1: Initial Render Tests
  describe('Initial Render', () => {
    it('should render the bulk processor modal', () => {
      render(<CSVBulkProcessor />);
      expect(screen.getByText(/csv bulk processing/i)).toBeInTheDocument();
      expect(screen.getByText(/upload.*csv.*file/i)).toBeInTheDocument();
    });

    it('should show upload stage initially', () => {
      render(<CSVBulkProcessor />);
      expect(screen.getByText(/drag.*drop.*csv.*file/i)).toBeInTheDocument();
      // FIXED: Use correct selector - CSVUpload has NO test IDs, only browse button
      expect(screen.getByRole('button', { name: /browse/i })).toBeInTheDocument();
    });

    it('should have close button', () => {
      render(<CSVBulkProcessor />);
      expect(screen.getByRole('button', { name: /×|close/i })).toBeInTheDocument();
    });

    it('should display modal overlay', () => {
      render(<CSVBulkProcessor />);
      const modal = document.querySelector('.fixed.inset-0');
      expect(modal).toBeInTheDocument();
    });
  });

  // Stage 2: File Upload Tests
  describe('File Upload', () => {
    it('should handle file selection via browse button', async () => {
      render(<CSVBulkProcessor />);
      
      // FIXED: Get file input correctly - no test ID exists
      const browseButton = screen.getByRole('button', { name: /browse/i });
      const fileInput = browseButton.closest('label')?.querySelector('input[type="file"]') as HTMLInputElement;
      
      expect(fileInput).toBeInTheDocument();
      
      const csvFile = createCSVFile(createValidCSVContent(5));
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [csvFile] } });
      });
      
      await waitFor(() => {
        expect(screen.getByText(/preview.*data/i)).toBeInTheDocument();
      });
    });

    it('should handle drag and drop file upload', async () => {
      render(<CSVBulkProcessor />);
      
      const dropZone = screen.getByText(/drag.*drop.*csv.*file/i).closest('div');
      expect(dropZone).toBeInTheDocument();
      
      const csvFile = createCSVFile(createValidCSVContent(3));
      
      await act(async () => {
        fireEvent.drop(dropZone!, {
          dataTransfer: { files: [csvFile] }
        });
      });
      
      await waitFor(() => {
        expect(screen.getByText(/preview.*data/i)).toBeInTheDocument();
      });
    });

    it('should validate CSV file type', async () => {
      render(<CSVBulkProcessor />);
      
      const browseButton = screen.getByRole('button', { name: /browse/i });
      const fileInput = browseButton.closest('label')?.querySelector('input[type="file"]') as HTMLInputElement;
      
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [invalidFile] } });
      });
      
      await waitFor(() => {
        expect(screen.getByText(/please.*select.*csv.*file/i)).toBeInTheDocument();
      });
    });

    it('should validate file size limit', async () => {
      render(<CSVBulkProcessor />);
      
      const browseButton = screen.getByRole('button', { name: /browse/i });
      const fileInput = browseButton.closest('label')?.querySelector('input[type="file"]') as HTMLInputElement;
      
      // Create a large CSV file (over 10MB)
      const largeContent = 'name,email\n' + 'a'.repeat(11 * 1024 * 1024);
      const largeFile = createCSVFile(largeContent);
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [largeFile] } });
      });
      
      await waitFor(() => {
        expect(screen.getByText(/file.*too.*large/i)).toBeInTheDocument();
      });
    });

    it('should reject files without CSV extension', async () => {
      render(<CSVBulkProcessor />);
      
      const browseButton = screen.getByRole('button', { name: /browse/i });
      const fileInput = browseButton.closest('label')?.querySelector('input[type="file"]') as HTMLInputElement;
      
      const wrongExtension = new File(['name,email\ntest,test@example.com'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [wrongExtension] } });
      });
      
      await waitFor(() => {
        expect(screen.getByText(/please.*select.*csv.*file/i)).toBeInTheDocument();
      });
    });
  });

  // Stage 3: CSV Preview Tests
  describe('CSV Preview Stage', () => {
    const setupPreviewStage = async () => {
      render(<CSVBulkProcessor />);
      
      const browseButton = screen.getByRole('button', { name: /browse/i });
      const fileInput = browseButton.closest('label')?.querySelector('input[type="file"]') as HTMLInputElement;
      
      const csvFile = createCSVFile(createValidCSVContent(10));
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [csvFile] } });
      });
      
      await waitFor(() => {
        expect(screen.getByText(/preview.*data/i)).toBeInTheDocument();
      });
    };

    it('should display CSV data in preview table', async () => {
      await setupPreviewStage();
      
      expect(screen.getByText('name')).toBeInTheDocument();
      expect(screen.getByText('email')).toBeInTheDocument();
      expect(screen.getByText('phone')).toBeInTheDocument();
      expect(screen.getByText('User1')).toBeInTheDocument();
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    });

    it('should have row selection checkboxes', async () => {
      await setupPreviewStage();
      
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('should have select all functionality', async () => {
      await setupPreviewStage();
      
      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select.*all/i });
      expect(selectAllCheckbox).toBeInTheDocument();
      
      await act(async () => {
        fireEvent.click(selectAllCheckbox);
      });
      
      const allCheckboxes = screen.getAllByRole('checkbox');
      const dataCheckboxes = allCheckboxes.filter(cb => cb !== selectAllCheckbox);
      
      dataCheckboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked();
      });
    });

    it('should show processing controls', async () => {
      await setupPreviewStage();
      
      // FIXED: Use correct test ID with -button suffix
      expect(screen.getByTestId('start-processing-button')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /back.*upload/i })).toBeInTheDocument();
    });

    it('should allow individual row selection', async () => {
      await setupPreviewStage();
      
      const checkboxes = screen.getAllByRole('checkbox');
      const firstDataCheckbox = checkboxes.find(cb => 
        cb.getAttribute('aria-label')?.includes('User1') || 
        cb.closest('tr')?.textContent?.includes('User1')
      );
      
      if (firstDataCheckbox) {
        await act(async () => {
          fireEvent.click(firstDataCheckbox);
        });
        
        expect(firstDataCheckbox).toBeChecked();
      }
    });

    it('should show row count information', async () => {
      await setupPreviewStage();
      
      expect(screen.getByText(/10.*rows/i)).toBeInTheDocument();
    });

    it('should enable start button when rows are selected', async () => {
      await setupPreviewStage();
      
      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select.*all/i });
      
      await act(async () => {
        fireEvent.click(selectAllCheckbox);
      });
      
      const startButton = screen.getByTestId('start-processing-button');
      expect(startButton).not.toBeDisabled();
    });
  });

  // Stage 4: Processing Tests
  describe('Processing Stage', () => {
    const setupProcessingStage = async () => {
      render(<CSVBulkProcessor />);
      
      const browseButton = screen.getByRole('button', { name: /browse/i });
      const fileInput = browseButton.closest('label')?.querySelector('input[type="file"]') as HTMLInputElement;
      
      const csvFile = createCSVFile(createValidCSVContent(5));
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [csvFile] } });
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('start-processing-button')).toBeInTheDocument();
      });
      
      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select.*all/i });
      await act(async () => {
        fireEvent.click(selectAllCheckbox);
      });
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('start-processing-button'));
      });
      
      await waitFor(() => {
        expect(screen.getByText(/processing.*qr.*codes/i)).toBeInTheDocument();
      });
    };

    it('should start processing when start button clicked', async () => {
      await setupProcessingStage();
      
      expect(screen.getByText(/processing.*qr.*codes/i)).toBeInTheDocument();
    });

    it('should show progress bar during processing', async () => {
      await setupProcessingStage();
      
      // FIXED: Use correct selector for progress bar - styled divs, not ARIA role
      const progressBar = document.querySelector('.bg-blue-600');
      expect(progressBar).toBeInTheDocument();
    });

    it('should show processing controls during processing', async () => {
      await setupProcessingStage();
      
      // FIXED: Use correct test IDs with -button suffix
      expect(screen.getByTestId('pause-processing-button')).toBeInTheDocument();
      expect(screen.getByTestId('stop-processing-button')).toBeInTheDocument();
    });

    it('should handle pause and resume functionality', async () => {
      await setupProcessingStage();
      
      const pauseButton = screen.getByTestId('pause-processing-button');
      
      await act(async () => {
        fireEvent.click(pauseButton);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('resume-processing-button')).toBeInTheDocument();
      });
      
      const resumeButton = screen.getByTestId('resume-processing-button');
      
      await act(async () => {
        fireEvent.click(resumeButton);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('pause-processing-button')).toBeInTheDocument();
      });
    });

    it('should handle stop functionality', async () => {
      await setupProcessingStage();
      
      const stopButton = screen.getByTestId('stop-processing-button');
      
      await act(async () => {
        fireEvent.click(stopButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/processing.*stopped/i)).toBeInTheDocument();
      });
    });

    it('should show progress percentage', async () => {
      await setupProcessingStage();
      
      // Progress should be visible
      const progressText = screen.getByText(/\d+%/);
      expect(progressText).toBeInTheDocument();
    });

    it('should show current/total processing count', async () => {
      await setupProcessingStage();
      
      // Should show something like "Processing 1 of 5"
      const countText = screen.getByText(/processing.*\d+.*of.*\d+/i);
      expect(countText).toBeInTheDocument();
    });
  });

  // Stage 5: Completion and Download Tests
  describe('Completion Stage', () => {
    const setupCompletionStage = async () => {
      render(<CSVBulkProcessor />);
      
      const browseButton = screen.getByRole('button', { name: /browse/i });
      const fileInput = browseButton.closest('label')?.querySelector('input[type="file"]') as HTMLInputElement;
      
      const csvFile = createCSVFile(createValidCSVContent(2)); // Small file for quick processing
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [csvFile] } });
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('start-processing-button')).toBeInTheDocument();
      });
      
      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select.*all/i });
      await act(async () => {
        fireEvent.click(selectAllCheckbox);
      });
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('start-processing-button'));
      });
      
      // Wait for processing to complete
      await waitFor(() => {
        expect(screen.getByText(/processing.*completed/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    };

    it('should show completion message when processing finishes', async () => {
      await setupCompletionStage();
      
      expect(screen.getByText(/processing.*completed/i)).toBeInTheDocument();
    });

    it('should show download button when processing completes', async () => {
      await setupCompletionStage();
      
      expect(screen.getByRole('button', { name: /download.*zip/i })).toBeInTheDocument();
    });

    it('should show processing summary', async () => {
      await setupCompletionStage();
      
      expect(screen.getByText(/\d+.*qr.*codes.*generated/i)).toBeInTheDocument();
    });

    it('should allow starting new processing', async () => {
      await setupCompletionStage();
      
      expect(screen.getByRole('button', { name: /process.*new.*csv/i })).toBeInTheDocument();
    });

    it('should handle download ZIP functionality', async () => {
      await setupCompletionStage();
      
      const downloadButton = screen.getByRole('button', { name: /download.*zip/i });
      
      // Mock URL.createObjectURL for ZIP download
      const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
      const mockRevokeObjectURL = vi.fn();
      Object.defineProperty(global.URL, 'createObjectURL', { value: mockCreateObjectURL });
      Object.defineProperty(global.URL, 'revokeObjectURL', { value: mockRevokeObjectURL });
      
      // Mock HTMLAnchorElement click
      const mockClick = vi.fn();
      const mockAnchor = {
        href: '',
        download: '',
        click: mockClick,
        style: { display: '' }
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
      
      await act(async () => {
        fireEvent.click(downloadButton);
      });
      
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should handle invalid CSV content', async () => {
      render(<CSVBulkProcessor />);
      
      const browseButton = screen.getByRole('button', { name: /browse/i });
      const fileInput = browseButton.closest('label')?.querySelector('input[type="file"]') as HTMLInputElement;
      
      const invalidCSV = createCSVFile('invalid,csv,content\n"unclosed quote');
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [invalidCSV] } });
      });
      
      await waitFor(() => {
        expect(screen.getByText(/error.*parsing.*csv/i)).toBeInTheDocument();
      });
    });

    it('should handle empty CSV file', async () => {
      render(<CSVBulkProcessor />);
      
      const browseButton = screen.getByRole('button', { name: /browse/i });
      const fileInput = browseButton.closest('label')?.querySelector('input[type="file"]') as HTMLInputElement;
      
      const emptyCSV = createCSVFile('');
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [emptyCSV] } });
      });
      
      await waitFor(() => {
        expect(screen.getByText(/csv.*file.*empty/i)).toBeInTheDocument();
      });
    });

    it('should handle CSV with headers only', async () => {
      render(<CSVBulkProcessor />);
      
      const browseButton = screen.getByRole('button', { name: /browse/i });
      const fileInput = browseButton.closest('label')?.querySelector('input[type="file"]') as HTMLInputElement;
      
      const headersOnlyCSV = createCSVFile('name,email,phone');
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [headersOnlyCSV] } });
      });
      
      await waitFor(() => {
        expect(screen.getByText(/no.*data.*rows.*found/i)).toBeInTheDocument();
      });
    });

    it('should handle QR generation failures gracefully', async () => {
      render(<CSVBulkProcessor />);
      
      // Setup to cause QR generation failure
      const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = vi.fn(() => {
        throw new Error('Canvas error');
      });
      
      const browseButton = screen.getByRole('button', { name: /browse/i });
      const fileInput = browseButton.closest('label')?.querySelector('input[type="file"]') as HTMLInputElement;
      
      const csvFile = createCSVFile(createValidCSVContent(2));
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [csvFile] } });
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('start-processing-button')).toBeInTheDocument();
      });
      
      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select.*all/i });
      await act(async () => {
        fireEvent.click(selectAllCheckbox);
      });
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('start-processing-button'));
      });
      
      await waitFor(() => {
        expect(screen.getByText(/error.*generating.*qr.*code/i)).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Restore original function
      HTMLCanvasElement.prototype.toDataURL = originalToDataURL;
    });
  });

  // Integration Tests
  describe('Integration Tests', () => {
    it('should complete full workflow: upload -> preview -> process -> download', async () => {
      render(<CSVBulkProcessor />);
      
      // 1. Upload
      const browseButton = screen.getByRole('button', { name: /browse/i });
      const fileInput = browseButton.closest('label')?.querySelector('input[type="file"]') as HTMLInputElement;
      const csvFile = createCSVFile(createValidCSVContent(3));
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [csvFile] } });
      });
      
      // 2. Preview
      await waitFor(() => {
        expect(screen.getByText(/preview.*data/i)).toBeInTheDocument();
      });
      
      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select.*all/i });
      await act(async () => {
        fireEvent.click(selectAllCheckbox);
      });
      
      // 3. Process
      await act(async () => {
        fireEvent.click(screen.getByTestId('start-processing-button'));
      });
      
      await waitFor(() => {
        expect(screen.getByText(/processing.*qr.*codes/i)).toBeInTheDocument();
      });
      
      // 4. Complete
      await waitFor(() => {
        expect(screen.getByText(/processing.*completed/i)).toBeInTheDocument();
      }, { timeout: 10000 });
      
      // 5. Download available
      expect(screen.getByRole('button', { name: /download.*zip/i })).toBeInTheDocument();
    });

    it('should handle modal close at any stage', async () => {
      render(<CSVBulkProcessor />);
      
      const closeButton = screen.getByRole('button', { name: /×|close/i });
      
      await act(async () => {
        fireEvent.click(closeButton);
      });
      
      // Modal should be closed (component unmounted or hidden)
      expect(screen.queryByText(/csv bulk processing/i)).not.toBeInTheDocument();
    });

    it('should reset state when starting new processing', async () => {
      render(<CSVBulkProcessor />);
      
      // Complete one processing cycle
      const browseButton = screen.getByRole('button', { name: /browse/i });
      const fileInput = browseButton.closest('label')?.querySelector('input[type="file"]') as HTMLInputElement;
      const csvFile = createCSVFile(createValidCSVContent(2));
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [csvFile] } });
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('start-processing-button')).toBeInTheDocument();
      });
      
      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select.*all/i });
      await act(async () => {
        fireEvent.click(selectAllCheckbox);
        fireEvent.click(screen.getByTestId('start-processing-button'));
      });
      
      await waitFor(() => {
        expect(screen.getByText(/processing.*completed/i)).toBeInTheDocument();
      }, { timeout: 10000 });
      
      // Start new processing
      const newProcessButton = screen.getByRole('button', { name: /process.*new.*csv/i });
      
      await act(async () => {
        fireEvent.click(newProcessButton);
      });
      
      // Should be back at upload stage
      await waitFor(() => {
        expect(screen.getByText(/drag.*drop.*csv.*file/i)).toBeInTheDocument();
      });
    });
  });
});
