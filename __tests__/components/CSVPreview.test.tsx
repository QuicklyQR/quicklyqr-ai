import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CSVPreview, { CSVPreviewProps, ProcessingResult } from '../../components/CSVPreview';
import { getDefaultQROptions } from '../../lib/qr-utils';

// Real test data
const testHeaders = ['name', 'email', 'url'];
const testData = [
  { name: 'John Doe', email: 'john@example.com', url: 'https://john.example.com' },
  { name: 'Jane Smith', email: 'jane@example.com', url: 'https://jane.example.com' },
  { name: 'Bob Johnson', email: 'bob@example.com', url: 'https://bob.example.com' },
  { name: 'Alice Brown', email: 'alice@example.com', url: 'https://alice.example.com' },
  { name: 'Charlie Wilson', email: 'charlie@example.com', url: 'https://charlie.example.com' },
];

const smallTestData = [
  { name: 'Test User', email: 'test@example.com', url: 'https://test.example.com' },
  { name: 'Demo User', email: 'demo@example.com', url: 'https://demo.example.com' },
];

const emptyValueData = [
  { name: '', email: '', url: '' },
  { name: 'Valid User', email: 'valid@example.com', url: 'https://valid.example.com' },
];

const textOnlyData = [
  { name: 'Text User', email: 'textuser@example.com', url: 'Just plain text content' },
  { name: 'Another Text', email: 'another@example.com', url: 'More plain text here' },
];

describe('CSVPreview Component', () => {
  let onProcessComplete: (results: ProcessingResult[]) => void;
  let onCancel: () => void;
  let completedResults: ProcessingResult[];
  let cancelCalled: boolean;

  beforeEach(() => {
    completedResults = [];
    cancelCalled = false;
    
    onProcessComplete = (results: ProcessingResult[]) => {
      completedResults = results;
    };
    
    onCancel = () => {
      cancelCalled = true;
    };
  });

  afterEach(() => {
    completedResults = [];
    cancelCalled = false;
  });

  const renderCSVPreview = (props: Partial<CSVPreviewProps> = {}) => {
    const defaultProps: CSVPreviewProps = {
      data: testData,
      headers: testHeaders,
      onProcessComplete,
      onCancel,
      qrOptions: getDefaultQROptions(),
      ...props,
    };

    return render(<CSVPreview {...defaultProps} />);
  };

  // Basic Rendering Tests
  describe('Initial Rendering', () => {
    it('renders component with correct title and description', () => {
      renderCSVPreview();
      
      expect(screen.getByText('CSV Preview & Processing')).toBeInTheDocument();
      expect(screen.getByText('Review your data and select which rows to process into QR codes')).toBeInTheDocument();
    });

    it('renders field selection dropdown with all headers', () => {
      renderCSVPreview();
      
      const select = screen.getByTestId('qr-field-select');
      expect(select).toBeInTheDocument();
      
      testHeaders.forEach(header => {
        expect(screen.getByText(header)).toBeInTheDocument();
      });
    });

    it('displays correct number of rows in table', () => {
      renderCSVPreview();
      
      // Check for data rows (excluding header row)
      testData.forEach((_, index) => {
        expect(screen.getByTestId(`row-${index}`)).toBeInTheDocument();
      });
    });

    it('shows select all checkbox with correct initial state', () => {
      renderCSVPreview();
      
      const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
      expect(selectAllCheckbox).toBeInTheDocument();
      expect(selectAllCheckbox).toBeChecked(); // All rows selected by default
    });

    it('displays correct selection count', () => {
      renderCSVPreview();
      
      expect(screen.getByText(`Select All (${testData.length} of ${testData.length} selected)`)).toBeInTheDocument();
    });

    it('renders table headers correctly', () => {
      renderCSVPreview();
      
      expect(screen.getByText('Select')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Preview')).toBeInTheDocument();
      
      testHeaders.forEach(header => {
        expect(screen.getByText(header)).toBeInTheDocument();
      });
    });

    it('highlights selected QR field in table', () => {
      renderCSVPreview();
      
      // The first header should be highlighted by default
      const headerElements = screen.getAllByText(testHeaders[0]);
      // One is in the dropdown, one is in the table header with asterisk
      expect(headerElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  // Row Selection Tests
  describe('Row Selection', () => {
    it('allows individual row selection/deselection', async () => {
      const user = userEvent.setup();
      renderCSVPreview();
      
      const firstRowCheckbox = screen.getByTestId('row-checkbox-0');
      expect(firstRowCheckbox).toBeChecked();
      
      await user.click(firstRowCheckbox);
      expect(firstRowCheckbox).not.toBeChecked();
      
      // Check selection count updated
      expect(screen.getByText(`Select All (${testData.length - 1} of ${testData.length} selected)`)).toBeInTheDocument();
      
      await user.click(firstRowCheckbox);
      expect(firstRowCheckbox).toBeChecked();
    });

    it('handles select all functionality correctly', async () => {
      const user = userEvent.setup();
      renderCSVPreview();
      
      const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
      
      // Deselect all
      await user.click(selectAllCheckbox);
      expect(selectAllCheckbox).not.toBeChecked();
      
      // Check all individual checkboxes are unchecked
      testData.forEach((_, index) => {
        const rowCheckbox = screen.getByTestId(`row-checkbox-${index}`);
        expect(rowCheckbox).not.toBeChecked();
      });
      
      expect(screen.getByText(`Select All (0 of ${testData.length} selected)`)).toBeInTheDocument();
      
      // Select all again
      await user.click(selectAllCheckbox);
      expect(selectAllCheckbox).toBeChecked();
      
      testData.forEach((_, index) => {
        const rowCheckbox = screen.getByTestId(`row-checkbox-${index}`);
        expect(rowCheckbox).toBeChecked();
      });
    });

    it('updates select all checkbox when individual selections change', async () => {
      const user = userEvent.setup();
      renderCSVPreview();
      
      const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
      expect(selectAllCheckbox).toBeChecked();
      
      // Uncheck one row
      const firstRowCheckbox = screen.getByTestId('row-checkbox-0');
      await user.click(firstRowCheckbox);
      
      // Select all should now be unchecked
      expect(selectAllCheckbox).not.toBeChecked();
    });
  });

  // Field Selection Tests
  describe('Field Selection', () => {
    it('allows changing QR field selection', async () => {
      const user = userEvent.setup();
      renderCSVPreview();
      
      const fieldSelect = screen.getByTestId('qr-field-select');
      expect(fieldSelect).toHaveValue(testHeaders[0]);
      
      await user.selectOptions(fieldSelect, testHeaders[1]);
      expect(fieldSelect).toHaveValue(testHeaders[1]);
    });

    it('updates table highlighting when field changes', async () => {
      const user = userEvent.setup();
      renderCSVPreview();
      
      const fieldSelect = screen.getByTestId('qr-field-select');
      
      // Change to email field
      await user.selectOptions(fieldSelect, 'email');
      
      // The email column should now be highlighted in the table
      const emailHeader = screen.getByText('email*'); // Should have asterisk
      expect(emailHeader).toBeInTheDocument();
    });
  });

  // Preview Toggle Tests
  describe('Preview Toggle', () => {
    it('toggles between limited and full preview', async () => {
      const user = userEvent.setup();
      // Use larger dataset to test preview limit
      renderCSVPreview({ data: [...testData, ...testData, ...testData] }); // 15 rows
      
      const toggleButton = screen.getByTestId('toggle-preview-button');
      expect(toggleButton).toHaveTextContent('Show All (15 rows)');
      
      await user.click(toggleButton);
      expect(toggleButton).toHaveTextContent('Show Less');
    });

    it('shows correct row count in footer when preview is limited', () => {
      // Use more than 10 rows to trigger preview limit
      const largeData = [...testData, ...testData, ...testData]; // 15 rows
      renderCSVPreview({ data: largeData });
      
      expect(screen.getByText('Showing 10 of 15 rows')).toBeInTheDocument();
    });
  });

  // Processing Controls Tests
  describe('Processing Controls', () => {
    it('shows start processing button when rows are selected', () => {
      renderCSVPreview();
      
      const startButton = screen.getByTestId('start-processing-button');
      expect(startButton).toBeInTheDocument();
      expect(startButton).toHaveTextContent(`Start Processing (${testData.length} rows)`);
    });

    it('hides start processing button when no rows selected', async () => {
      const user = userEvent.setup();
      renderCSVPreview();
      
      // Deselect all rows
      const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
      await user.click(selectAllCheckbox);
      
      // Start processing button should not be visible
      expect(screen.queryByTestId('start-processing-button')).not.toBeInTheDocument();
    });

    it('initiates processing when start button is clicked', async () => {
      const user = userEvent.setup();
      renderCSVPreview({ data: smallTestData });
      
      const startButton = screen.getByTestId('start-processing-button');
      await user.click(startButton);
      
      // Should show processing controls
      await waitFor(() => {
        expect(screen.getByTestId('pause-processing-button')).toBeInTheDocument();
        expect(screen.getByTestId('stop-processing-button')).toBeInTheDocument();
      });
    });

    it('shows progress information during processing', async () => {
      const user = userEvent.setup();
      renderCSVPreview({ data: smallTestData });
      
      const startButton = screen.getByTestId('start-processing-button');
      await user.click(startButton);
      
      // Should show progress
      await waitFor(() => {
        expect(screen.getByText(/Progress: \d+ \/ \d+/)).toBeInTheDocument();
        expect(screen.getByText(/Completed: \d+ \| Failed: \d+/)).toBeInTheDocument();
      });
    });

    it('can pause and resume processing', async () => {
      const user = userEvent.setup();
      renderCSVPreview({ data: smallTestData });
      
      const startButton = screen.getByTestId('start-processing-button');
      await user.click(startButton);
      
      // Wait for pause button to appear and click it
      await waitFor(() => {
        const pauseButton = screen.getByTestId('pause-processing-button');
        expect(pauseButton).toBeInTheDocument();
        return user.click(pauseButton);
      });
      
      // Should show resume button
      await waitFor(() => {
        expect(screen.getByTestId('resume-processing-button')).toBeInTheDocument();
      });
      
      const resumeButton = screen.getByTestId('resume-processing-button');
      await user.click(resumeButton);
      
      // Should show pause button again
      await waitFor(() => {
        expect(screen.getByTestId('pause-processing-button')).toBeInTheDocument();
      });
    });

    it('can stop processing', async () => {
      const user = userEvent.setup();
      renderCSVPreview({ data: smallTestData });
      
      const startButton = screen.getByTestId('start-processing-button');
      await user.click(startButton);
      
      // Wait for stop button and click it
      await waitFor(() => {
        const stopButton = screen.getByTestId('stop-processing-button');
        expect(stopButton).toBeInTheDocument();
        return user.click(stopButton);
      });
      
      // Should return to initial state
      await waitFor(() => {
        expect(screen.getByTestId('start-processing-button')).toBeInTheDocument();
      });
    });
  });

  // QR Code Generation Tests
  describe('QR Code Generation', () => {
    it('generates QR codes for URL data', async () => {
      const user = userEvent.setup();
      renderCSVPreview({ 
        data: [{ name: 'Test', email: 'test@example.com', url: 'https://example.com' }],
        headers: ['name', 'email', 'url']
      });
      
      // Select URL field
      const fieldSelect = screen.getByTestId('qr-field-select');
      await user.selectOptions(fieldSelect, 'url');
      
      const startButton = screen.getByTestId('start-processing-button');
      await user.click(startButton);
      
      // Wait for processing to complete
      await waitFor(() => {
        expect(completedResults.length).toBe(1);
      }, { timeout: 5000 });
      
      expect(completedResults[0].success).toBe(true);
      expect(completedResults[0].qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('generates QR codes for text data', async () => {
      const user = userEvent.setup();
      renderCSVPreview({ 
        data: textOnlyData,
        headers: ['name', 'email', 'url']
      });
      
      // Select URL field (which contains text in this case)
      const fieldSelect = screen.getByTestId('qr-field-select');
      await user.selectOptions(fieldSelect, 'url');
      
      const startButton = screen.getByTestId('start-processing-button');
      await user.click(startButton);
      
      // Wait for processing to complete
      await waitFor(() => {
        expect(completedResults.length).toBe(2);
      }, { timeout: 5000 });
      
      completedResults.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
      });
    });

    it('handles empty data gracefully', async () => {
      const user = userEvent.setup();
      renderCSVPreview({ 
        data: emptyValueData,
        headers: ['name', 'email', 'url']
      });
      
      const startButton = screen.getByTestId('start-processing-button');
      await user.click(startButton);
      
      // Wait for processing to complete
      await waitFor(() => {
        expect(completedResults.length).toBe(2);
      }, { timeout: 5000 });
      
      // First row should fail (empty data), second should succeed
      expect(completedResults[0].success).toBe(false);
      expect(completedResults[0].error).toContain('Empty data string');
      expect(completedResults[1].success).toBe(true);
    });

    it('updates row status during processing', async () => {
      const user = userEvent.setup();
      renderCSVPreview({ 
        data: [{ name: 'Test', email: 'test@example.com', url: 'https://example.com' }]
      });
      
      const startButton = screen.getByTestId('start-processing-button');
      await user.click(startButton);
      
      // Should show processing state
      await waitFor(() => {
        const row = screen.getByTestId('row-0');
        expect(row).toBeInTheDocument();
      });
      
      // Wait for completion
      await waitFor(() => {
        expect(completedResults.length).toBe(1);
      }, { timeout: 5000 });
    });

    it('shows QR code preview after generation', async () => {
      const user = userEvent.setup();
      renderCSVPreview({ 
        data: [{ name: 'Test', email: 'test@example.com', url: 'https://example.com' }]
      });
      
      const startButton = screen.getByTestId('start-processing-button');
      await user.click(startButton);
      
      // Wait for QR code to be generated and preview to appear
      await waitFor(() => {
        expect(screen.getByTestId('qr-preview-0')).toBeInTheDocument();
      }, { timeout: 5000 });
      
      const qrPreview = screen.getByTestId('qr-preview-0');
      expect(qrPreview).toHaveAttribute('src');
      expect(qrPreview.getAttribute('src')).toMatch(/^data:image\/png;base64,/);
    });
  });

  // Download Functionality Tests
  describe('Download Functionality', () => {
    it('shows download button after successful processing', async () => {
      const user = userEvent.setup();
      renderCSVPreview({ 
        data: [{ name: 'Test', email: 'test@example.com', url: 'https://example.com' }]
      });
      
      const startButton = screen.getByTestId('start-processing-button');
      await user.click(startButton);
      
      // Wait for processing to complete
      await waitFor(() => {
        expect(completedResults.length).toBe(1);
      }, { timeout: 5000 });
      
      // Download button should appear
      await waitFor(() => {
        expect(screen.getByTestId('download-results-button')).toBeInTheDocument();
      });
    });

    it('download button shows correct count', async () => {
      const user = userEvent.setup();
      renderCSVPreview({ data: smallTestData });
      
      const startButton = screen.getByTestId('start-processing-button');
      await user.click(startButton);
      
      // Wait for processing to complete
      await waitFor(() => {
        expect(completedResults.length).toBe(2);
      }, { timeout: 10000 });
      
      const downloadButton = screen.getByTestId('download-results-button');
      expect(downloadButton).toHaveTextContent('Download Results (2)');
    });

    it('handles download button click', async () => {
      const user = userEvent.setup();
      renderCSVPreview({ 
        data: [{ name: 'Test', email: 'test@example.com', url: 'https://example.com' }]
      });
      
      const startButton = screen.getByTestId('start-processing-button');
      await user.click(startButton);
      
      // Wait for processing to complete
      await waitFor(() => {
        expect(completedResults.length).toBe(1);
      }, { timeout: 5000 });
      
      const downloadButton = screen.getByTestId('download-results-button');
      await user.click(downloadButton);
      
      // Download should not throw errors
      // Real download testing would require more complex setup
    });
  });

  // Cancel Functionality Tests
  describe('Cancel Functionality', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderCSVPreview();
      
      const cancelButton = screen.getByTestId('cancel-button');
      await user.click(cancelButton);
      
      expect(cancelCalled).toBe(true);
    });

    it('shows cancel button at all times', () => {
      renderCSVPreview();
      
      expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    it('handles processing errors gracefully', async () => {
      const user = userEvent.setup();
      renderCSVPreview({ 
        data: [{ name: '', email: '', url: '' }] // Empty data should cause error
      });
      
      const startButton = screen.getByTestId('start-processing-button');
      await user.click(startButton);
      
      // Wait for processing to complete with error
      await waitFor(() => {
        expect(completedResults.length).toBe(1);
      }, { timeout: 5000 });
      
      expect(completedResults[0].success).toBe(false);
      expect(completedResults[0].error).toBeTruthy();
    });

    it('shows error status in table row', async () => {
      const user = userEvent.setup();
      renderCSVPreview({ 
        data: [{ name: '', email: '', url: '' }]
      });
      
      const startButton = screen.getByTestId('start-processing-button');
      await user.click(startButton);
      
      // Wait for error to be displayed
      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  // Props Handling Tests
  describe('Props Handling', () => {
    it('uses custom QR options when provided', () => {
      const customOptions = {
        ...getDefaultQROptions(),
        size: 500,
        foregroundColor: '#ff0000',
      };
      
      renderCSVPreview({ qrOptions: customOptions });
      
      // Component should render without errors with custom options
      expect(screen.getByText('CSV Preview & Processing')).toBeInTheDocument();
    });

    it('handles empty data array', () => {
      renderCSVPreview({ data: [], headers: testHeaders });
      
      expect(screen.getByText('Select All (0 of 0 selected)')).toBeInTheDocument();
    });

    it('handles single header', () => {
      renderCSVPreview({ 
        data: [{ url: 'https://example.com' }], 
        headers: ['url'] 
      });
      
      expect(screen.getByText('url')).toBeInTheDocument();
    });
  });

  // Integration Tests
  describe('Integration Tests', () => {
    it('completes full workflow: select -> process -> download', async () => {
      const user = userEvent.setup();
      renderCSVPreview({ data: smallTestData });
      
      // 1. Verify initial state
      expect(screen.getByTestId('start-processing-button')).toBeInTheDocument();
      
      // 2. Start processing
      const startButton = screen.getByTestId('start-processing-button');
      await user.click(startButton);
      
      // 3. Wait for completion
      await waitFor(() => {
        expect(completedResults.length).toBe(2);
      }, { timeout: 10000 });
      
      // 4. Verify download button appears
      expect(screen.getByTestId('download-results-button')).toBeInTheDocument();
      
      // 5. Click download
      const downloadButton = screen.getByTestId('download-results-button');
      await user.click(downloadButton);
      
      // Workflow completed without errors
      expect(completedResults.every(r => r.success)).toBe(true);
    });

    it('handles mixed success/failure scenarios', async () => {
      const user = userEvent.setup();
      const mixedData = [
        { name: 'Valid', email: 'valid@example.com', url: 'https://valid.example.com' },
        { name: 'Invalid', email: 'invalid@example.com', url: '' }, // Empty URL
        { name: 'Another Valid', email: 'another@example.com', url: 'https://another.example.com' },
      ];
      
      renderCSVPreview({ data: mixedData });
      
      const startButton = screen.getByTestId('start-processing-button');
      await user.click(startButton);
      
      await waitFor(() => {
        expect(completedResults.length).toBe(3);
      }, { timeout: 10000 });
      
      // Should have mix of successes and failures
      const successes = completedResults.filter(r => r.success);
      const failures = completedResults.filter(r => !r.success);
      
      expect(successes.length).toBe(2);
      expect(failures.length).toBe(1);
    });
  });
});
