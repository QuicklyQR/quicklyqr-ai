import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import QRCodeScanner from '../components/QRCodeScanner';

describe('QRCodeScanner Integration Tests', () => {
  it('renders the component with all expected UI elements', () => {
    const handleScanSuccess = () => {};
    const handleClose = () => {};
    
    render(<QRCodeScanner onScanSuccess={handleScanSuccess} onClose={handleClose} />);

    // Check main sections and text
    expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
    expect(screen.getByText('Position the QR code within the frame to scan')).toBeInTheDocument();
    
    // Check buttons
    expect(screen.getByRole('button', { name: /Close scanner/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    
    // Check for proper heading structure
    expect(screen.getByRole('heading', { name: /Scan QR Code/i })).toBeInTheDocument();
    
    // Check that the close button has an aria-label
    const closeButton = screen.getByRole('button', { name: /Close scanner/i });
    expect(closeButton).toHaveAttribute('aria-label', 'Close scanner');
  });

  it('calls onClose when close button is clicked', () => {
    let closeWasCalled = false;
    const handleScanSuccess = () => {};
    const handleClose = () => { closeWasCalled = true; };
    
    render(<QRCodeScanner onScanSuccess={handleScanSuccess} onClose={handleClose} />);

    // Click the close button
    fireEvent.click(screen.getByRole('button', { name: /Close scanner/i }));
    
    // Check if onClose was called
    expect(closeWasCalled).toBe(true);
  });
  
  it('calls onClose when cancel button is clicked', () => {
    let closeWasCalled = false;
    const handleScanSuccess = () => {};
    const handleClose = () => { closeWasCalled = true; };
    
    render(<QRCodeScanner onScanSuccess={handleScanSuccess} onClose={handleClose} />);

    // Click the cancel button
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    
    // Check if onClose was called
    expect(closeWasCalled).toBe(true);
  });

  it('handles component mounting and unmounting correctly', () => {
    const handleScanSuccess = () => {};
    const handleClose = () => {};
    
    // Create a wrapper component to test mounting/unmounting
    const MountingWrapper = () => {
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
    
    render(<MountingWrapper />);
    
    // Scanner should be visible initially
    expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
    
    // Close the scanner
    fireEvent.click(screen.getByRole('button', { name: /Close scanner/i }));
    
    // Scanner should be hidden and button should be visible
    expect(screen.queryByText('Scan QR Code')).not.toBeInTheDocument();
    expect(screen.getByTestId('show-scanner')).toBeInTheDocument();
  });

  it('handles error boundaries correctly', () => {
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
    
    render(
      <ErrorBoundary>
        <BrokenScanner />
      </ErrorBoundary>
    );
    
    // Error boundary should catch the error
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
  });
  
  it('handles multiple button clicks correctly', () => {
    let closeCount = 0;
    const handleScanSuccess = () => {};
    const handleClose = () => { closeCount++; };
    
    render(<QRCodeScanner onScanSuccess={handleScanSuccess} onClose={handleClose} />);
    
    // Click buttons multiple times
    fireEvent.click(screen.getByRole('button', { name: /Close scanner/i }));
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    
    // Both buttons should call onClose
    expect(closeCount).toBe(2);
  });
  
  it('unmounts without errors', () => {
    const handleScanSuccess = () => {};
    const handleClose = () => {};
    
    const { unmount } = render(<QRCodeScanner onScanSuccess={handleScanSuccess} onClose={handleClose} />);
    
    // Unmount the component
    unmount();
    
    // No assertions needed - we're just checking that unmounting doesn't throw errors
  });
});
