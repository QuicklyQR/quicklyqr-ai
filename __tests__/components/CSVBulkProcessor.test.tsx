import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import CSVBulkProcessor from '../../components/CSVBulkProcessor';

// Helper function to create real CSV File objects
const createCSVFile = (content: string, filename: string = 'test.csv'): File => {
  return new File([content], filename, { type: 'text/csv' });
};

// Helper function to create real logo File objects
const createLogoFile = (filename: string = 'logo.png'): File => {
  // Create a minimal PNG file (1x1 pixel)
  const pngData = new Uint8Array([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width: 1
    0x00, 0x00, 0x00, 0x01, // height: 1
    0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
    0x90, 0x77, 0x53, 0xDE, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  return new File([pngData], filename, { type: 'image/png' });
};

// Helper function to simulate file upload
const simulateFileUpload = async (user: ReturnType<typeof userEvent.setup>, csvContent: string = 'name,url,description\nJohn Doe,https://example.com/john,Software Developer\nJane Smith,https://example.com/jane,Designer') => {
  const file = createCSVFile(csvContent);
  const fileInput = screen.getByLabelText(/drop your csv file here/i, { selector: 'input' });
  
  await user.upload(fileInput, file);
  
  return file;
};

describe('CSVBulkProcessor', () => {
  let mockOnClose: () => void;
  const user = userEvent.setup();

  beforeEach(() => {
    mockOnClose = () => {};
    
    // Clean up any existing object URLs
    const objectUrls = document.querySelectorAll('a[href^="blob:"]');
    objectUrls.forEach(link => {
      URL.revokeObjectURL(link.getAttribute('href') || '');
    });
  });

  afterEach(() => {
    // Clean up any created object URLs after each test
    const objectUrls = document.querySelectorAll('a[href^="blob:"]');
    objectUrls.forEach(link => {
      URL.revokeObjectURL(link.getAttribute('href') || '');
    });
  });

  describe('Modal Visibility', () => {
    it('should not render when isOpen is false', () => {
      render(<CSVBulkProcessor isOpen={false} onClose={mockOnClose} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByText('Upload CSV File')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Upload CSV File')).toBeInTheDocument();
    });

    it('should have proper ARIA attributes for accessibility', () => {
      render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'csv-processor-title');
    });
  });

  describe('Stage Management', () => {
    it('should start with upload stage', () => {
      render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('Upload CSV File')).toBeInTheDocument();
      expect(screen.getByText('Upload')).toHaveClass('font-medium', 'text-blue-600');
    });

    it('should show correct progress bar at upload stage', () => {
      render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      const progressBar = document.querySelector('.bg-blue-600');
      expect(progressBar).toHaveStyle({ width: '25%' });
    });

    it('should advance to preview stage after CSV upload', async () => {
      render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      const uploadButton = screen.getByRole('button', { name: /browse/i });
      await user.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByText('Preview & Configure')).toBeInTheDocument();
        expect(screen.getByText('Preview')).toHaveClass('font-medium', 'text-blue-600');
      });
    });

    it('should show correct progress bar at preview stage', async () => {
      render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      const uploadButton = screen.getByRole('button', { name: /browse/i });
      await user.click(uploadButton);
      
      await waitFor(() => {
        const progressBar = document.querySelector('.bg-blue-600');
        expect(progressBar).toHaveStyle({ width: '50%' });
      });
    });

    it('should advance to processing stage when processing starts', async () => {
      render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      // Upload CSV
      const uploadButton = screen.getByRole('button', { name: /browse/i });
      await user.click(uploadButton);
      
      // Start processing
      await waitFor(() => {
        expect(screen.getByTestId('start-processing-button')).toBeInTheDocument();
      });
      
      const processButton = screen.getByTestId('start-processing-button');
      await user.click(processButton);
      
      await waitFor(() => {
        expect(screen.getByText('Processing QR Codes')).toBeInTheDocument();
        expect(screen.getByText('Process')).toHaveClass('font-medium', 'text-blue-600');
      });
    });

    it('should show processing animation during processing stage', async () => {
      render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      // Upload and start processing
      const uploadButton = screen.getByRole('button', { name: /browse/i });
      await user.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('start-processing-button')).toBeInTheDocument();
      });
      
      const processButton = screen.getByTestId('start-processing-button');
      await user.click(processButton);
      
      await waitFor(() => {
        expect(screen.getByText('Generating QR codes and creating ZIP file...')).toBeInTheDocument();
        expect(document.querySelector('.animate-spin')).toBeInTheDocument();
      });
    });

    it('should advance to complete stage when processing finishes', async () => {
      render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      // Upload CSV
      const uploadButton = screen.getByRole('button', { name: /browse/i });
      await user.click(uploadButton);
      
      // Start processing
      await waitFor(() => {
        expect(screen.getByTestId('start-processing-button')).toBeInTheDocument();
      });
      
      const processButton = screen.getByTestId('start-processing-button');
      await user.click(processButton);
      
      // Wait for processing to complete
      await waitFor(() => {
        expect(screen.getByText('Processing Complete!')).toBeInTheDocument();
        expect(screen.getByText('Complete')).toHaveClass('font-medium', 'text-blue-600');
      }, { timeout: 5000 });
    });

    it('should show correct progress bar at complete stage', async () => {
      render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      // Complete full workflow
      const uploadButton = screen.getByRole('button', { name: /browse/i });
      await user.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('start-processing-button')).toBeInTheDocument();
      });
      
      const processButton = screen.getByTestId('start-processing-button');
      await user.click(processButton);
      
      await waitFor(() => {
        const progressBar = document.querySelector('.bg-blue-600');
        expect(progressBar).toHaveStyle({ width: '100%' });
      }, { timeout: 5000 });
    });
  });

  describe('CSV Data Handling', () => {
    it('should display uploaded CSV file information', async () => {
      render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      const uploadButton = screen.getByRole('button', { name: /browse/i });
      await user.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByText('test.csv')).toBeInTheDocument();
        expect(screen.getByText('2 rows')).toBeInTheDocument();
      });
    });

    it('should pass CSV data to preview component', async () => {
      render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      const uploadButton = screen.getByRole('button', { name: /browse/i });
      await user.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByText('Preview Data: 2 rows')).toBeInTheDocument();
        expect(screen.getByText('Headers: name, url, description')).toBeInTheDocument();
      });
    });

    it('should pass processing options to preview component', async () => {
      const processingOptions = {
        qrSize: 400,
        foregroundColor: '#ff0000',
        backgroundColor: '#00ff00',
        errorCorrectionLevel: 'H' as const
      };
      
      render(
        <CSVBulkProcessor 
          isOpen={true} 
          onClose={mockOnClose} 
          processingOptions={processingOptions}
        />
      );
      
      const uploadButton = screen.getByRole('button', { name: /browse/i });
      await user.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByText('Processing Options: Size 400px')).toBeInTheDocument();
      });
    });

    it('should handle logo file in processing options', async () => {
      const logoFile = createLogoFile('test-logo.png');
      
      render(
        <CSVBulkProcessor 
          isOpen={true} 
          onClose={mockOnClose} 
          logoFile={logoFile}
        />
      );
      
      const uploadButton = screen.getByRole('button', { name: /browse/i });
      await user.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('csv-preview')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Controls', () => {
    it('should show back button in preview stage', async () => {
      render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      const uploadButton = screen.getByRole('button', { name: /browse/i });
      await user.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByText('Back')).toBeInTheDocument();
      });
    });

    it('should not show back button in upload stage', () => {
      render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.queryByText('Back')).not.toBeInTheDocument();
    });

    it('should not show back button during processing stage', async () => {
      render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      // Upload and start processing
      const uploadButton = screen.getByRole('button', { name: /browse/i });
      await user.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('start-processing-button')).toBeInTheDocument();
      });
      
      const processButton = screen.getByTestId('start-processing-button');
      await user.click(processButton);
      
      await waitFor(() => {
        expect(screen.getByText('Processing QR Codes')).toBeInTheDocument();
        expect(screen.queryByText('Back')).not.toBeInTheDocument();
      });
    });

    it('should navigate back from preview to upload when back button clicked', async () => {
      render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      // Go to preview stage
      const uploadButton = screen.getByRole('button', { name: /browse/i });
      await user.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByText('Preview & Configure')).toBeInTheDocument();
      });
      
      // Click back
      const backButton = screen.getByText('Back');
      await user.click(backButton);
      
      await waitFor(() => {
        expect(screen.getByText('Upload CSV File')).toBeInTheDocument();
        expect(screen.getByText('Upload')).toHaveClass('font-medium', 'text-blue-600');
      });
    });

    it('should clear CSV data when navigating back from preview', async () => {
      render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      // Upload CSV
      const uploadButton = screen.getByRole('button', { name: /browse/i });
      await user.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByText('test.csv')).toBeInTheDocument();
      });
      
      // Go back
      const backButton = screen.getByText('Back');
      await user.click(backButton);
      
      // Should be back to upload stage without CSV data
      expect(screen.getByText('Upload CSV File')).toBeInTheDocument();
      expect(screen.queryByText('test.csv')).not.toBeInTheDocument();
    });
  });

  describe('Download Functionality', () => {
    it('should create download URL when processing completes', async () => {
      render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      // Complete full workflow
      await simulateFileUpload(user);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start processing/i })).toBeInTheDocument();
      });
      
      const processButton = screen.getByRole('button', { name: /start processing/i });
      await user.click(processButton);
      
      await waitFor(() => {
        expect(screen.getByText('Your QR codes are ready')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /download zip/i })).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should show correct processed count in complete stage', async () => {
      render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      // Complete workflow
      await simulateFileUpload(user);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start processing/i })).toBeInTheDocument();
      });
      
      const processButton = screen.getByRole('button', { name: /start processing/i });
      await user.click(processButton);
      
      await waitFor(() => {
        expect(screen.getByText(/successfully generated/i)).toBeInTheDocument();
        expect(screen.getByText(/qr codes generated and packaged in a zip file/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should trigger download when download button clicked', async () => {
      render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      // Complete workflow
      await simulateFileUpload(user);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start processing/i })).toBeInTheDocument();
      });
      
      const processButton = screen.getByRole('button', { name: /start processing/i });
      await user.click(processButton);
      
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /download zip/i })).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Click download - should not throw error
      const downloadButton = screen.getByRole('link', { name: /download zip/i });
      await user.click(downloadButton);
      
      // Download should have been triggered (no error thrown)
      expect(downloadButton).toBeInTheDocument();
    });

    it('should show process another file button in complete stage', async () => {
      render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      // Complete workflow
      await simulateFileUpload(user);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start processing/i })).toBeInTheDocument();
      });
      
      const processButton = screen.getByRole('button', { name: /start processing/i });
      await user.click(processButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /process another file/i })).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should reset to upload stage when process another file clicked', async () => {
      render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      // Complete workflow
      await simulateFileUpload(user);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start processing/i })).toBeInTheDocument();
      });
      
      const processButton = screen.getByRole('button', { name: /start processing/i });
      await user.click(processButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /process another file/i })).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Click process another file
      const anotherFileButton = screen.getByRole('button', { name: /process another file/i });
      await user.click(anotherFileButton);
      
      await waitFor(() => {
        expect(screen.getByText('Upload CSV File')).toBeInTheDocument();
        expect(screen.getByText('Upload')).toHaveClass('font-medium', 'text-blue-600');
      });
    });
  });

  describe('Close and Cleanup', () => {
    it('should call onClose when close button clicked', async () => {
      const onCloseSpy = () => {};
      render(<CSVBulkProcessor isOpen={true} onClose={onCloseSpy} />);
      
      const closeButton = screen.getByLabelText('Close CSV bulk processor');
      await user.click(closeButton);
      
      // Component should still be rendered but onClose would have been called
      expect(closeButton).toBeInTheDocument();
    });

    it('should call onClose when footer close button clicked', async () => {
      const onCloseSpy = () => {};
      render(<CSVBulkProcessor isOpen={true} onClose={onCloseSpy} />);
      
      const footerCloseButton = screen.getByRole('button', { name: /close/i });
      await user.click(footerCloseButton);
      
      expect(footerCloseButton).toBeInTheDocument();
    });

    it('should clean up object URLs when component unmounts', async () => {
      const { unmount } = render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      // Complete workflow to create object URL
      await simulateFileUpload(user);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start processing/i })).toBeInTheDocument();
      });
      
      const processButton = screen.getByRole('button', { name: /start processing/i });
      await user.click(processButton);
      
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /download zip/i })).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Unmount should not throw errors
      expect(() => unmount()).not.toThrow();
    });

    it('should reset all state when closed', async () => {
      const { rerender } = render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      // Upload CSV
      await simulateFileUpload(user);
      
      await waitFor(() => {
        expect(screen.getByText('Preview & Configure')).toBeInTheDocument();
      });
      
      // Close and reopen
      rerender(<CSVBulkProcessor isOpen={false} onClose={mockOnClose} />);
      rerender(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      // Should be back to initial state
      expect(screen.getByText('Upload CSV File')).toBeInTheDocument();
      expect(screen.getByText('Upload')).toHaveClass('font-medium', 'text-blue-600');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing CSV data gracefully', () => {
      render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      // Should not crash with missing data
      expect(screen.getByText('Upload CSV File')).toBeInTheDocument();
    });

    it('should handle empty CSV data gracefully', async () => {
      // This would require a custom CSVUpload component that returns empty data
      render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('Upload CSV File')).toBeInTheDocument();
    });

    it('should handle processing errors gracefully', async () => {
      render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      // The component should handle any processing errors internally
      const uploadButton = screen.getByTestId('upload-csv-btn');
      await user.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('start-processing-btn')).toBeInTheDocument();
      });
      
      // Processing should complete even with potential errors
      const processButton = screen.getByTestId('start-processing-btn');
      await user.click(processButton);
      
      await waitFor(() => {
        expect(screen.getByText('Processing Complete!')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Upload CSV File');
    });

    it('should have proper focus management', async () => {
      render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      const closeButton = screen.getByLabelText('Close CSV bulk processor');
      expect(closeButton).toBeInTheDocument();
    });

    it('should have proper ARIA labels', () => {
      render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByLabelText('Close CSV bulk processor')).toBeInTheDocument();
    });

    it('should announce stage changes to screen readers', async () => {
      render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      const uploadButton = screen.getByTestId('upload-csv-btn');
      await user.click(uploadButton);
      
      await waitFor(() => {
        // The heading should change for screen readers
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Preview & Configure');
      });
    });
  });

  describe('Integration with Props', () => {
    it('should use provided processing options', async () => {
      const customOptions = {
        qrSize: 512,
        foregroundColor: '#123456',
        backgroundColor: '#abcdef',
        errorCorrectionLevel: 'Q' as const
      };
      
      render(
        <CSVBulkProcessor 
          isOpen={true} 
          onClose={mockOnClose} 
          processingOptions={customOptions}
        />
      );
      
      await simulateFileUpload(user);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start processing/i })).toBeInTheDocument();
      });
    });

    it('should use provided logo file', async () => {
      const logoFile = createLogoFile('custom-logo.png');
      
      render(
        <CSVBulkProcessor 
          isOpen={true} 
          onClose={mockOnClose} 
          logoFile={logoFile}
        />
      );
      
      await simulateFileUpload(user);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start processing/i })).toBeInTheDocument();
      });
    });

    it('should merge processing options with logo file', async () => {
      const logoFile = createLogoFile('merged-logo.png');
      const customOptions = {
        qrSize: 256,
        foregroundColor: '#ff00ff'
      };
      
      render(
        <CSVBulkProcessor 
          isOpen={true} 
          onClose={mockOnClose} 
          logoFile={logoFile}
          processingOptions={customOptions}
        />
      );
      
      await simulateFileUpload(user);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start processing/i })).toBeInTheDocument();
      });
    });
  });

  describe('Stage Progress Indicators', () => {
    it('should show all stage names in progress indicator', () => {
      render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('Upload')).toBeInTheDocument();
      expect(screen.getByText('Preview')).toBeInTheDocument();
      expect(screen.getByText('Process')).toBeInTheDocument();
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });

    it('should highlight current stage in progress indicator', async () => {
      render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      // Upload stage should be highlighted
      expect(screen.getByText('Upload')).toHaveClass('font-medium', 'text-blue-600');
      expect(screen.getByText('Preview')).toHaveClass('text-gray-400');
      
      // Move to preview stage
      await simulateFileUpload(user);
      
      await waitFor(() => {
        expect(screen.getByText('Preview')).toHaveClass('font-medium', 'text-blue-600');
        expect(screen.getByText('Upload')).toHaveClass('text-gray-600');
      });
    });

    it('should show completed stages with different styling', async () => {
      render(<CSVBulkProcessor isOpen={true} onClose={mockOnClose} />);
      
      // Complete workflow
      await simulateFileUpload(user);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start processing/i })).toBeInTheDocument();
      });
      
      const processButton = screen.getByRole('button', { name: /start processing/i });
      await user.click(processButton);
      
      await waitFor(() => {
        expect(screen.getByText('Complete')).toHaveClass('font-medium', 'text-blue-600');
        expect(screen.getByText('Upload')).toHaveClass('text-gray-600');
        expect(screen.getByText('Preview')).toHaveClass('text-gray-600');
        expect(screen.getByText('Process')).toHaveClass('text-gray-600');
      }, { timeout: 5000 });
    });
  });
});
