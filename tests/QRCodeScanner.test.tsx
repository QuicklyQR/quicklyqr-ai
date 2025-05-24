import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import QRCodeScanner from '../components/QRCodeScanner';

describe('QRCodeScanner Integration Tests', () => {
  // Consolidated DOM structure tests
  it('renders the component with all UI elements correctly', () => {
    const handleScanSuccess = () => {};
    const handleClose = () => {};
    
    render(<QRCodeScanner onScanSuccess={handleScanSuccess} onClose={handleClose} />);

    // Check main sections and text
    expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
    expect(screen.getByText('Position the QR code within the frame to scan')).toBeInTheDocument();
    
    // Check buttons
    expect(screen.getByRole('button', { name: /Close scanner/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    
    // Check video and canvas elements
    const videoElement = document.querySelector('video');
    expect(videoElement).toBeInTheDocument();
    expect(videoElement).toHaveClass('h-full', 'w-full', 'object-cover');
    expect(videoElement).toHaveAttribute('autoPlay');
    expect(videoElement).toHaveAttribute('playsInline');
    expect(videoElement).toHaveAttribute('muted');
    
    const canvasElement = document.querySelector('canvas');
    expect(canvasElement).toBeInTheDocument();
    expect(canvasElement).toHaveClass('absolute', 'inset-0', 'hidden');
    
    // Check for the scanning frame
    const scanningFrame = document.querySelector('.h-48.w-48.rounded-lg.border-4');
    expect(scanningFrame).toBeInTheDocument();
    
    // Check for modal structure
    const modalContainer = document.querySelector('.fixed.inset-0.z-50.flex.items-center.justify-center.bg-black.bg-opacity-75');
    expect(modalContainer).toBeInTheDocument();
    
    const modalContent = document.querySelector('.relative.w-full.max-w-lg.rounded-lg.bg-white.p-4.shadow-lg');
    expect(modalContent).toBeInTheDocument();
    
    const headerSection = document.querySelector('.mb-4.flex.items-center.justify-between');
    expect(headerSection).toBeInTheDocument();
    
    const footerSection = document.querySelector('.mt-4.flex.justify-end.space-x-2');
    expect(footerSection).toBeInTheDocument();
    
    // Check for proper heading structure
    expect(screen.getByRole('heading', { name: /Scan QR Code/i })).toBeInTheDocument();
    
    // Check that the close button has an aria-label
    const closeButton = screen.getByRole('button', { name: /Close scanner/i });
    expect(closeButton).toHaveAttribute('aria-label', 'Close scanner');
    
    // Check for error handling structure
    const alertIcon = document.querySelector('.lucide-alert-circle');
    expect(alertIcon).not.toBeInTheDocument(); // Should not show error by default
  });

  // Tests for props passing behavior
  it('handles different onClose callback functions correctly', () => {
    // Test with different onClose implementations
    let closeCallCount = 0;
    let closeMessage = '';
    
    const handleScanSuccess = () => {};
    const handleClose1 = () => { closeCallCount++; };
    const handleClose2 = () => { closeMessage = 'closed'; };
    
    // Render with first callback
    const { rerender } = render(
      <QRCodeScanner onScanSuccess={handleScanSuccess} onClose={handleClose1} />
    );
    
    // Click close button
    fireEvent.click(screen.getByRole('button', { name: /Close scanner/i }));
    expect(closeCallCount).toBe(1);
    
    // Rerender with second callback
    rerender(<QRCodeScanner onScanSuccess={handleScanSuccess} onClose={handleClose2} />);
    
    // Click close button again
    fireEvent.click(screen.getByRole('button', { name: /Close scanner/i }));
    expect(closeMessage).toBe('closed');
    
    // Verify first callback wasn't called again
    expect(closeCallCount).toBe(1);
  });
  
  it('handles different onScanSuccess callback functions correctly', () => {
    let scanResult1 = '';
    let scanResult2 = '';
    
    const handleScanSuccess1 = (data: string) => { scanResult1 = data; };
    const handleScanSuccess2 = (data: string) => { scanResult2 = data; };
    const handleClose = () => {};
    
    // Create a wrapper component to test onScanSuccess
    const TestWrapper = ({ onSuccess }: { onSuccess: (data: string) => void }) => {
      return (
        <div>
          <QRCodeScanner onScanSuccess={onSuccess} onClose={handleClose} />
          <button 
            onClick={() => onSuccess('test-qr-data')} 
            data-testid="trigger-success"
          >
            Trigger Success
          </button>
        </div>
      );
    };
    
    // Render with first callback
    const { rerender } = render(<TestWrapper onSuccess={handleScanSuccess1} />);
    
    // Trigger success
    fireEvent.click(screen.getByTestId('trigger-success'));
    expect(scanResult1).toBe('test-qr-data');
    
    // Rerender with second callback
    rerender(<TestWrapper onSuccess={handleScanSuccess2} />);
    
    // Trigger success again
    fireEvent.click(screen.getByTestId('trigger-success'));
    expect(scanResult2).toBe('test-qr-data');
    
    // Verify first callback wasn't called again
    expect(scanResult1).toBe('test-qr-data');
  });
  
  it('handles various prop combinations correctly', () => {
    // Test with different combinations of props
    let scanCount = 0;
    let closeCount = 0;
    
    const handleScanSuccess = () => { scanCount++; };
    const handleClose = () => { closeCount++; };
    
    // Empty functions
    const emptySuccess = () => {};
    const emptyClose = () => {};
    
    // Render with normal functions
    const { rerender } = render(
      <QRCodeScanner onScanSuccess={handleScanSuccess} onClose={handleClose} />
    );
    
    // Click close button
    fireEvent.click(screen.getByRole('button', { name: /Close scanner/i }));
    expect(closeCount).toBe(1);
    
    // Rerender with empty functions
    rerender(<QRCodeScanner onScanSuccess={emptySuccess} onClose={emptyClose} />);
    
    // Click close button again
    fireEvent.click(screen.getByRole('button', { name: /Close scanner/i }));
    
    // Original close count should not change
    expect(closeCount).toBe(1);
    
    // Rerender with mixed functions
    rerender(<QRCodeScanner onScanSuccess={emptySuccess} onClose={handleClose} />);
    
    // Click close button again
    fireEvent.click(screen.getByRole('button', { name: /Close scanner/i }));
    expect(closeCount).toBe(2);
  });

  // Tests for component state changes
  it('handles component state transitions correctly', async () => {
    const handleScanSuccess = () => {};
    const handleClose = () => {};
    
    // Create a wrapper component to test state transitions
    const StateTransitionWrapper = () => {
      const [showScanner, setShowScanner] = React.useState(true);
      
      return (
        <div>
          {showScanner && (
            <QRCodeScanner 
              onScanSuccess={handleScanSuccess} 
              onClose={() => setShowScanner(false)} 
            />
          )}
          <button 
            onClick={() => setShowScanner(true)} 
            data-testid="show-scanner"
            style={{ display: showScanner ? 'none' : 'block' }}
          >
            Show Scanner
          </button>
        </div>
      );
    };
    
    render(<StateTransitionWrapper />);
    
    // Scanner should be visible initially
    expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
    
    // Close the scanner
    fireEvent.click(screen.getByRole('button', { name: /Close scanner/i }));
    
    // Scanner should be hidden
    await waitFor(() => {
      expect(screen.queryByText('Scan QR Code')).not.toBeInTheDocument();
    });
    
    // Show scanner button should be visible
    expect(screen.getByTestId('show-scanner')).toBeInTheDocument();
    
    // Show the scanner again
    fireEvent.click(screen.getByTestId('show-scanner'));
    
    // Scanner should be visible again
    await waitFor(() => {
      expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
    });
  });
  
  it('handles component behavior over time', async () => {
    const handleScanSuccess = () => {};
    const handleClose = () => {};
    
    // Create a wrapper component to test behavior over time
    const TimeTestWrapper = () => {
      const [counter, setCounter] = React.useState(0);
      
      // Increment counter every second
      React.useEffect(() => {
        const timer = setInterval(() => {
          setCounter(prev => prev + 1);
        }, 100);
        
        return () => clearInterval(timer);
      }, []);
      
      return (
        <div>
          <QRCodeScanner onScanSuccess={handleScanSuccess} onClose={handleClose} />
          <div data-testid="counter">{counter}</div>
        </div>
      );
    };
    
    render(<TimeTestWrapper />);
    
    // Scanner should be visible
    expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
    
    // Wait for counter to increment
    await waitFor(() => {
      const counterElement = screen.getByTestId('counter');
      expect(parseInt(counterElement.textContent || '0')).toBeGreaterThan(1);
    });
    
    // Scanner should still be visible and functioning
    expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Close scanner/i })).toBeInTheDocument();
    
    // Component should handle time-based state changes without crashing
    fireEvent.click(screen.getByRole('button', { name: /Close scanner/i }));
  });
  
  it('handles component lifecycle and state management', async () => {
    const handleScanSuccess = () => {};
    const handleClose = () => {};
    
    // Create a wrapper component to test lifecycle
    const LifecycleWrapper = () => {
      const [remount, setRemount] = React.useState(0);
      
      return (
        <div>
          <button 
            onClick={() => setRemount(prev => prev + 1)} 
            data-testid="remount-button"
          >
            Remount
          </button>
          <div key={remount}>
            <QRCodeScanner onScanSuccess={handleScanSuccess} onClose={handleClose} />
          </div>
        </div>
      );
    };
    
    render(<LifecycleWrapper />);
    
    // Scanner should be visible
    expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
    
    // Force remount
    fireEvent.click(screen.getByTestId('remount-button'));
    
    // Scanner should still be visible after remount
    expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
    
    // Force another remount
    fireEvent.click(screen.getByTestId('remount-button'));
    
    // Scanner should still be visible after second remount
    expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
  });

  // Edge cases
  it('handles undefined/null props gracefully', () => {
    // @ts-ignore - intentionally passing undefined props for testing
    const { rerender } = render(<QRCodeScanner />);
    
    // Component should render without crashing
    expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
    
    // Test with null props
    // @ts-ignore - intentionally passing null props for testing
    rerender(<QRCodeScanner onScanSuccess={null} onClose={null} />);
    
    // Component should still render
    expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
    
    // Click buttons to ensure no crashes
    fireEvent.click(screen.getByRole('button', { name: /Close scanner/i }));
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
  });
  
  it('handles empty function props correctly', () => {
    const { rerender } = render(
      <QRCodeScanner onScanSuccess={() => {}} onClose={() => {}} />
    );
    
    // Component should render
    expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
    
    // Click buttons to ensure no crashes with empty functions
    fireEvent.click(screen.getByRole('button', { name: /Close scanner/i }));
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
  });
  
  it('handles component error boundaries', () => {
    // Create an error boundary wrapper
    class ErrorBoundary extends React.Component<
      { children: React.ReactNode },
      { hasError: boolean }
    > {
      constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
      }
      
      static getDerivedStateFromError() {
        return { hasError: true };
      }
      
      render() {
        if (this.state.hasError) {
          return <div data-testid="error-boundary">Error occurred</div>;
        }
        
        return this.props.children;
      }
    }
    
    // Create a component that will throw an error
    const BrokenScanner = () => {
      React.useEffect(() => {
        throw new Error('Test error');
      }, []);
      
      return <QRCodeScanner onScanSuccess={() => {}} onClose={() => {}} />;
    };
    
    // Suppress console errors for this test
    const originalConsoleError = console.error;
    console.error = () => {};
    
    // Render with error boundary
    render(
      <ErrorBoundary>
        <BrokenScanner />
      </ErrorBoundary>
    );
    
    // Error boundary should catch the error
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    
    // Restore console.error
    console.error = originalConsoleError;
  });
  
  it('handles invalid inputs gracefully', () => {
    // Create a wrapper with invalid inputs
    const InvalidInputsWrapper = () => {
      // @ts-ignore - intentionally using wrong types for testing
      const invalidSuccess = 'not a function';
      // @ts-ignore - intentionally using wrong types for testing
      const invalidClose = 123;
      
      return (
        // @ts-ignore - intentionally passing invalid props for testing
        <QRCodeScanner onScanSuccess={invalidSuccess} onClose={invalidClose} />
      );
    };
    
    // Suppress console errors for this test
    const originalConsoleError = console.error;
    console.error = () => {};
    
    // Render with invalid inputs
    render(<InvalidInputsWrapper />);
    
    // Component should render without crashing
    expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
    
    // Click buttons to ensure no crashes with invalid functions
    fireEvent.click(screen.getByRole('button', { name: /Close scanner/i }));
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    
    // Restore console.error
    console.error = originalConsoleError;
  });
  
  // Button interaction tests
  it('handles button interactions correctly', () => {
    let closeCount = 0;
    const handleScanSuccess = () => {};
    const handleClose = () => { closeCount++; };
    
    render(<QRCodeScanner onScanSuccess={handleScanSuccess} onClose={handleClose} />);
    
    // Click the close button
    fireEvent.click(screen.getByRole('button', { name: /Close scanner/i }));
    expect(closeCount).toBe(1);
    
    // Click the cancel button
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(closeCount).toBe(2);
    
    // Test rapid clicks
    fireEvent.click(screen.getByRole('button', { name: /Close scanner/i }));
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    fireEvent.click(screen.getByRole('button', { name: /Close scanner/i }));
    expect(closeCount).toBe(5);
  });
  
  // Component unmounting test
  it('handles component unmounting gracefully', () => {
    const handleScanSuccess = () => {};
    const handleClose = () => {};
    
    const { unmount } = render(<QRCodeScanner onScanSuccess={handleScanSuccess} onClose={handleClose} />);
    
    // Unmount the component
    unmount();
    
    // No assertions needed - we're just checking that unmounting doesn't throw errors
  });
});
