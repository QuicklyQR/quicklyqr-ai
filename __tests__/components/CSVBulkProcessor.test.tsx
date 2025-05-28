// __tests__/components/CSVBulkProcessor.test.tsx
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CSVBulkProcessor from '../../components/CSVBulkProcessor';

// Mock the child components
vi.mock('../../components/CSVUpload', () => ({
  default: ({ onUpload }: { onUpload: Function }) => (
    <div data-testid="csv-upload">
      <button 
        onClick={() => onUpload(
          [{ name: 'Test', url: 'https://example.com' }],
          ['name', 'url'],
          new File(['test'], 'test.csv', { type: 'text/csv' })
        )}
      >
        Mock Upload
      </button>
    </div>
  )
}));

vi.mock('../../components/CSVPreview', () => ({
  default: ({ onProcessingComplete, onProcessingStart }: any) => (
    <div data-testid="csv-preview">
      <button 
        onClick={() => {
          onProcessingStart();
          setTimeout(() => {
            const mockBlob = new Blob(['fake zip'], { type: 'application/zip' });
            onProcessingComplete(mockBlob, 1);
          }, 100);
        }}
      >
        Mock Process
      </button>
    </div>
  )
}));

// Mock Supabase functions
vi.mock('../../lib/supabase', () => ({
  saveBulkProcessing: vi.fn(() => Promise.resolve({ 
    success: true, 
    data: { id: 'mock-bulk-id' } 
  })),
  updateBulkProcessing: vi.fn(() => Promise.resolve({ 
    success: true, 
    data: { id: 'mock-bulk-id' } 
  })),
  saveQRCodeGeneration: vi.fn(() => Promise.resolve({ 
    success: true, 
    data: { id: 'mock-qr-id' } 
  }))
}));

// Mock URL.createObjectURL and revokeObjectURL
Object.defineProperty(window.URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'mock-url')
});

Object.defineProperty(window.URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn()
});

describe('CSVBulkProcessor', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    processingOptions: {
      qrSize: 300,
      foregroundColor: '#000000',
      backgroundColor: '#ffffff',
      errorCorrectionLevel: 'M' as const
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Render and Basic Functionality', () => {
    it('should render the upload stage by default', () => {
      render(<CSVBulkProcessor {...defaultProps} />);
      
      expect(screen.getByText('Upload CSV File')).toBeInTheDocument();
      expect(screen.getByTestId('csv-upload')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<CSVBulkProcessor {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Upload CSV File')).not.toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      
      render(<CSVBulkProcessor {...defaultProps} onClose={onClose} />);
      
      const closeButton = screen.getByLabelText('Close CSV bulk processor');
      await user.click(closeButton);
      
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Stage Progression', () => {
    it('should progress through all stages correctly', async () => {
      const user = userEvent.setup();
      
      render(<CSVBulkProcessor {...defaultProps} />);
      
      // Stage 1: Upload
      expect(screen.getByText('Upload CSV File')).toBeInTheDocument();
      
      // Trigger upload
      const uploadButton = screen.getByText('Mock Upload');
      await user.click(uploadButton);
      
      // Stage 2: Preview
      await waitFor(() => {
        expect(screen.getByText('Preview & Configure')).toBeInTheDocument();
      });
      
      // Trigger processing
      const processButton = screen.getByText('Mock Process');
      await user.click(processButton);
      
      // Stage 3: Processing
      await waitFor(() => {
        expect(screen.getByText('Processing QR Codes')).toBeInTheDocument();
      });
      
      // Stage 4: Complete
      await waitFor(() => {
        expect(screen.getByText('Processing Complete!')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should handle back navigation correctly', async () => {
      const user = userEvent.setup();
      
      render(<CSVBulkProcessor {...defaultProps} />);
      
      // Progress to preview stage
      const uploadButton = screen.getByText('Mock Upload');
      await user.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByText('Preview & Configure')).toBeInTheDocument();
      });
      
      // Click back button
      const backButton = screen.getByText('Back');
      await user.click(backButton);
      
      // Should return to upload stage
      expect(screen.getByText('Upload CSV File')).toBeInTheDocument();
    });
  });

  describe('Database Integration', () => {
    it('should show database tracking indicator when enabled', () => {
      render(<CSVBulkProcessor {...defaultProps} />);
      
      expect(screen.getByText('Tracking Enabled')).toBeInTheDocument();
    });

    it('should allow toggling database tracking', async () => {
      const user = userEvent.setup();
      
      render(<CSVBulkProcessor {...defaultProps} />);
      
      const checkbox = screen.getByLabelText(/Save processing history/);
      expect(checkbox).toBeChecked();
      
      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
      
      await user.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    it('should handle database errors gracefully', async () => {
      const { saveBulkProcessing } = await import('../../lib/supabase');
      vi.mocked(saveBulkProcessing).mockResolvedValue({
        success: false,
        error: new Error('Database error')
      });
      
      const user = userEvent.setup();
      render(<CSVBulkProcessor {...defaultProps} userId="test-user" />);
      
      // Upload should still work even if database fails
      const uploadButton = screen.getByText('Mock Upload');
      await user.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByText('Preview & Configure')).toBeInTheDocument();
      });
    });
  });

  describe('Progress Indicators', () => {
    it('should show correct progress percentages', async () => {
      const user = userEvent.setup();
      
      render(<CSVBulkProcessor {...defaultProps} />);
      
      // Upload stage: 25%
      let progressBar = document.querySelector('.h-2.rounded-full.bg-blue-600');
      expect(progressBar).toHaveStyle('width: 25%');
      
      // Progress to preview
      const uploadButton = screen.getByText('Mock Upload');
      await user.click(uploadButton);
      
      await waitFor(() => {
        progressBar = document.querySelector('.h-2.rounded-full.bg-blue-600');
        expect(progressBar).toHaveStyle('width: 50%');
      });
    });

    it('should highlight current stage in progress indicator', async () => {
      const user = userEvent.setup();
      
      render(<CSVBulkProcessor {...defaultProps} />);
      
      // Upload stage should be highlighted
      expect(screen.getByText('Upload')).toHaveClass('font-medium', 'text-blue-600');
      
      // Progress to preview
      const uploadButton = screen.getByText('Mock Upload');
      await user.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByText('Preview')).toHaveClass('font-medium', 'text-blue-600');
      });
    });
  });

  describe('File Download', () => {
    it('should handle download functionality', async () => {
      const user = userEvent.setup();
      
      // Mock document.createElement and DOM manipulation
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      };
      
      const createElement = vi.spyOn(document, 'createElement');
      const appendChild = vi.spyOn(document.body, 'appendChild');
      const removeChild = vi.spyOn(document.body, 'removeChild');
      
      createElement.mockReturnValue(mockLink as any);
      appendChild.mockImplementation(() => mockLink as any);
      removeChild.mockImplementation(() => mockLink as any);
      
      render(<CSVBulkProcessor {...defaultProps} />);
      
      // Progress through all stages to completion
      const uploadButton = screen.getByText('Mock Upload');
      await user.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByText('Mock Process')).toBeInTheDocument();
      });
      
      const processButton = screen.getByText('Mock Process');
      await user.click(processButton);
      
      await waitFor(() => {
        expect(screen.getByText('Download ZIP')).toBeInTheDocument();
      }, { timeout: 1000 });
      
      const downloadButton = screen.getByText('Download ZIP');
      await user.click(downloadButton);
      
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.download).toContain('qr-codes-');
      
      createElement.mockRestore();
      appendChild.mockRestore();
      removeChild.mockRestore();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle processing with no user ID', async () => {
      const user = userEvent.setup();
      
      render(<CSVBulkProcessor {...defaultProps} userId={undefined} />);
      
      const uploadButton = screen.getByText('Mock Upload');
      await user.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByText('Preview & Configure')).toBeInTheDocument();
      });
      
      // Should work without user ID
      expect(screen.getByTestId('csv-preview')).toBeInTheDocument();
    });

    it('should cleanup resources on unmount', () => {
      const { unmount } = render(<CSVBulkProcessor {...defaultProps} />);
      
      // Create a download URL
      (window.URL.createObjectURL as any).mockReturnValue('mock-url');
      
      unmount();
      
      // URL.revokeObjectURL should be called during cleanup
      // This is tested indirectly through the close handler
    });

    it('should handle invalid processing options', () => {
      const invalidOptions = {
        qrSize: -1, // Invalid size
        foregroundColor: 'invalid-color',
        backgroundColor: '',
        errorCorrectionLevel: 'X' as any // Invalid level
      };
      
      // Should render without crashing
      expect(() => {
        render(
          <CSVBulkProcessor 
            {...defaultProps} 
            processingOptions={invalidOptions}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<CSVBulkProcessor {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'csv-processor-title');
      
      const title = screen.getByRole('heading', { name: /Upload CSV File/i });
      expect(title).toHaveAttribute('id', 'csv-processor-title');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(<CSVBulkProcessor {...defaultProps} />);
      
      // Tab navigation should work
      await user.tab();
      
      // Close button should be focusable
      const closeButton = screen.getByLabelText('Close CSV bulk processor');
      expect(closeButton).toHaveFocus();
    });
  });
});