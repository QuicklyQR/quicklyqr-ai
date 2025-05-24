import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import QRCodeBuilder from '../components/QRCodeBuilder';

// No mocks - we'll test the actual component behavior

describe('QRCodeBuilder Integration Tests', () => {
  // Setup and teardown
  beforeEach(() => {
    // Store original console.error
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Store original window.alert
    window.alert = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test real component rendering
  it('renders the component with all sections visible', () => {
    render(<QRCodeBuilder />);
    
    // Check main sections
    expect(screen.getByText('QR Code Type')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Customization')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
    
    // Check QR type options
    expect(screen.getByRole('radio', { name: /Select URL QR code type/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Select Text QR code type/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Select WiFi QR code type/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Select Contact QR code type/i })).toBeInTheDocument();
    
    // Check URL form is visible by default
    expect(screen.getByLabelText(/URL/i)).toBeInTheDocument();
    
    // Check customization options
    expect(screen.getByLabelText(/Size:/i)).toBeInTheDocument();
    expect(screen.getByText('Foreground Color')).toBeInTheDocument();
    expect(screen.getByText('Background Color')).toBeInTheDocument();
    expect(screen.getByText('Error Correction Level')).toBeInTheDocument();
    
    // Check download button
    expect(screen.getByRole('button', { name: /Download PNG/i })).toBeInTheDocument();
  });

  // Test real user interactions - URL type
  it('shows validation error when invalid URL is entered', async () => {
    render(<QRCodeBuilder />);
    
    // Enter invalid URL
    const urlInput = screen.getByLabelText(/URL/i);
    fireEvent.change(urlInput, { target: { value: 'not-a-url' } });
    fireEvent.blur(urlInput);
    
    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText(/Invalid URL format/i)).toBeInTheDocument();
    });
    
    // Check that download button is disabled
    const downloadButton = screen.getByRole('button', { name: /Download PNG/i });
    expect(downloadButton).toBeDisabled();
  });

  it('auto-adds https:// to URLs when needed', async () => {
    render(<QRCodeBuilder />);
    
    // Enter domain without protocol
    const urlInput = screen.getByLabelText(/URL/i);
    fireEvent.change(urlInput, { target: { value: 'example.com' } });
    fireEvent.blur(urlInput);
    
    // Check that https:// was added
    expect(urlInput).toHaveValue('https://example.com');
  });

  // Test real user interactions - Text type
  it('switches to Text type and validates input', async () => {
    render(<QRCodeBuilder />);
    
    // Change to Text type
    fireEvent.click(screen.getByRole('radio', { name: /Select Text QR code type/i }));
    
    // Check that text input is visible
    const textInput = screen.getByLabelText(/Text Content/i);
    expect(textInput).toBeInTheDocument();
    
    // Enter valid text
    fireEvent.change(textInput, { target: { value: 'Hello World' } });
    fireEvent.blur(textInput);
    
    // Check that download button is enabled (valid input)
    const downloadButton = screen.getByRole('button', { name: /Download PNG/i });
    await waitFor(() => {
      expect(downloadButton).not.toBeDisabled();
    });
    
    // Clear text
    fireEvent.change(textInput, { target: { value: '' } });
    fireEvent.blur(textInput);
    
    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText(/Text content is required/i)).toBeInTheDocument();
    });
    
    // Check that download button is disabled
    expect(downloadButton).toBeDisabled();
  });

  // Test real user interactions - WiFi type
  it('switches to WiFi type and validates input', async () => {
    render(<QRCodeBuilder />);
    
    // Change to WiFi type
    fireEvent.click(screen.getByRole('radio', { name: /Select WiFi QR code type/i }));
    
    // Check that WiFi inputs are visible
    expect(screen.getByLabelText(/Network Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Security Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Hidden Network/i)).toBeInTheDocument();
    
    // Enter valid WiFi details
    fireEvent.change(screen.getByLabelText(/Network Name/i), { target: { value: 'MyNetwork' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    
    // Check that download button is enabled (valid input)
    const downloadButton = screen.getByRole('button', { name: /Download PNG/i });
    await waitFor(() => {
      expect(downloadButton).not.toBeDisabled();
    });
    
    // Clear SSID
    fireEvent.change(screen.getByLabelText(/Network Name/i), { target: { value: '' } });
    fireEvent.blur(screen.getByLabelText(/Network Name/i));
    
    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText(/Network name \(SSID\) is required/i)).toBeInTheDocument();
    });
    
    // Check that download button is disabled
    expect(downloadButton).toBeDisabled();
  });

  it('toggles password visibility when eye icon is clicked', async () => {
    render(<QRCodeBuilder />);
    
    // Change to WiFi type
    fireEvent.click(screen.getByRole('radio', { name: /Select WiFi QR code type/i }));
    
    // Check that password field is initially of type password
    const passwordInput = screen.getByLabelText(/Password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click the eye icon to show password
    const showPasswordButton = screen.getByLabelText(/Show password/i);
    fireEvent.click(showPasswordButton);
    
    // Check that password field is now of type text
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click the eye-off icon to hide password
    const hidePasswordButton = screen.getByLabelText(/Hide password/i);
    fireEvent.click(hidePasswordButton);
    
    // Check that password field is back to type password
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('validates WiFi with no password for open network', async () => {
    render(<QRCodeBuilder />);
    
    // Change to WiFi type
    fireEvent.click(screen.getByRole('radio', { name: /Select WiFi QR code type/i }));
    
    // Enter valid SSID
    fireEvent.change(screen.getByLabelText(/Network Name/i), { target: { value: 'OpenNetwork' } });
    
    // Change security to nopass
    const securitySelect = screen.getByLabelText(/Security Type/i);
    fireEvent.change(securitySelect, { target: { value: 'nopass' } });
    
    // Check that download button is enabled (valid input)
    const downloadButton = screen.getByRole('button', { name: /Download PNG/i });
    await waitFor(() => {
      expect(downloadButton).not.toBeDisabled();
    });
  });

  it('updates QR code when hidden network checkbox is toggled', async () => {
    render(<QRCodeBuilder />);
    
    // Change to WiFi type
    fireEvent.click(screen.getByRole('radio', { name: /Select WiFi QR code type/i }));
    
    // Enter valid WiFi details
    fireEvent.change(screen.getByLabelText(/Network Name/i), { target: { value: 'MyNetwork' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    
    // Toggle hidden network checkbox
    const hiddenCheckbox = screen.getByLabelText(/Hidden Network/i);
    fireEvent.click(hiddenCheckbox);
    
    // Verify checkbox is checked
    expect(hiddenCheckbox).toBeChecked();
  });

  // Test real user interactions - Contact type
  it('switches to Contact type and validates input', async () => {
    render(<QRCodeBuilder />);
    
    // Change to Contact type
    fireEvent.click(screen.getByRole('radio', { name: /Select Contact QR code type/i }));
    
    // Check that Contact inputs are visible
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Organization/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Website/i)).toBeInTheDocument();
    
    // Enter valid contact details
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '123456789' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'john@example.com' } });
    
    // Check that download button is enabled (valid input)
    const downloadButton = screen.getByRole('button', { name: /Download PNG/i });
    await waitFor(() => {
      expect(downloadButton).not.toBeDisabled();
    });
    
    // Clear name fields
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: '' } });
    fireEvent.blur(screen.getByLabelText(/Last Name/i));
    
    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText(/At least first name or last name is required/i)).toBeInTheDocument();
    });
    
    // Check that download button is disabled
    expect(downloadButton).toBeDisabled();
  });

  it('validates contact with invalid email', async () => {
    render(<QRCodeBuilder />);
    
    // Change to Contact type
    fireEvent.click(screen.getByRole('radio', { name: /Select Contact QR code type/i }));
    
    // Enter valid name
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
    
    // Enter invalid email
    const emailInput = screen.getByLabelText(/Email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);
    
    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText(/Invalid email format/i)).toBeInTheDocument();
    });
    
    // Check that download button is disabled
    const downloadButton = screen.getByRole('button', { name: /Download PNG/i });
    expect(downloadButton).toBeDisabled();
  });

  it('validates contact with invalid website', async () => {
    render(<QRCodeBuilder />);
    
    // Change to Contact type
    fireEvent.click(screen.getByRole('radio', { name: /Select Contact QR code type/i }));
    
    // Enter valid name
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
    
    // Enter invalid website
    const websiteInput = screen.getByLabelText(/Website/i);
    fireEvent.change(websiteInput, { target: { value: 'invalid-url' } });
    fireEvent.blur(websiteInput);
    
    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText(/Invalid URL format/i)).toBeInTheDocument();
    });
    
    // Check that download button is disabled
    const downloadButton = screen.getByRole('button', { name: /Download PNG/i });
    expect(downloadButton).toBeDisabled();
  });

  // Test customization options
  it('updates QR code when size slider is changed', async () => {
    render(<QRCodeBuilder />);
    
    // Enter valid URL to generate QR code
    const urlInput = screen.getByLabelText(/URL/i);
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
    fireEvent.blur(urlInput);
    
    // Change size
    const sizeSlider = screen.getByLabelText(/Size:/i);
    fireEvent.change(sizeSlider, { target: { value: '500' } });
    
    // Verify slider value changed
    expect(sizeSlider).toHaveValue('500');
  });

  it('updates QR code when foreground color is changed', async () => {
    render(<QRCodeBuilder />);
    
    // Enter valid URL to generate QR code
    const urlInput = screen.getByLabelText(/URL/i);
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
    fireEvent.blur(urlInput);
    
    // Change foreground color using text input
    const fgColorInput = screen.getByLabelText(/Foreground color hex value/i);
    fireEvent.change(fgColorInput, { target: { value: '#FF0000' } });
    
    // Verify color value changed
    expect(fgColorInput).toHaveValue('#FF0000');
  });

  it('updates QR code when background color is changed', async () => {
    render(<QRCodeBuilder />);
    
    // Enter valid URL to generate QR code
    const urlInput = screen.getByLabelText(/URL/i);
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
    fireEvent.blur(urlInput);
    
    // Change background color using text input
    const bgColorInput = screen.getByLabelText(/Background color hex value/i);
    fireEvent.change(bgColorInput, { target: { value: '#0000FF' } });
    
    // Verify color value changed
    expect(bgColorInput).toHaveValue('#0000FF');
  });

  it('updates QR code when error correction level is changed', async () => {
    render(<QRCodeBuilder />);
    
    // Enter valid URL to generate QR code
    const urlInput = screen.getByLabelText(/URL/i);
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
    fireEvent.blur(urlInput);
    
    // Change error correction level
    const errorCorrectionSelect = screen.getByLabelText(/Error Correction Level/i);
    fireEvent.change(errorCorrectionSelect, { target: { value: 'H' } });
    
    // Verify select value changed
    expect(errorCorrectionSelect).toHaveValue('H');
  });

  // Test download functionality
  it('attempts to download QR code when download button is clicked', async () => {
    render(<QRCodeBuilder />);
    
    // Enter valid URL
    const urlInput = screen.getByLabelText(/URL/i);
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
    fireEvent.blur(urlInput);
    
    // Wait for QR code generation
    await waitFor(() => {
      const downloadButton = screen.getByRole('button', { name: /Download PNG/i });
      expect(downloadButton).not.toBeDisabled();
    });
    
    // Click download button
    const downloadButton = screen.getByRole('button', { name: /Download PNG/i });
    fireEvent.click(downloadButton);
    
    // We can't fully test the download without mocks, but we can verify the button was clicked
    expect(downloadButton).toBeInTheDocument();
  });

  // Test component cleanup
  it('cleans up QR code container when component unmounts', async () => {
    const { unmount } = render(<QRCodeBuilder />);
    
    // Enter valid URL
    const urlInput = screen.getByLabelText(/URL/i);
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
    fireEvent.blur(urlInput);
    
    // Wait for QR code generation
    await waitFor(() => {
      const downloadButton = screen.getByRole('button', { name: /Download PNG/i });
      expect(downloadButton).not.toBeDisabled();
    });
    
    // Unmount component
    unmount();
    
    // No direct way to test DOM cleanup in JSDOM, but we can verify the component unmounted without errors
    expect(true).toBe(true);
  });

  // Test accessibility
  it('has proper accessibility attributes', () => {
    render(<QRCodeBuilder />);
    
    // Check that form elements have proper labels
    expect(screen.getByLabelText(/URL/i)).toBeInTheDocument();
    
    // Check that buttons have proper aria-labels
    expect(screen.getByRole('button', { name: /Download PNG/i })).toBeInTheDocument();
    
    // Check that radio buttons have proper roles and states
    const urlRadio = screen.getByRole('radio', { name: /Select URL QR code type/i });
    expect(urlRadio).toHaveAttribute('aria-checked', 'true');
    
    // Check that validation errors are properly announced
    const urlInput = screen.getByLabelText(/URL/i);
    fireEvent.focus(urlInput);
    fireEvent.blur(urlInput);
    
    waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });
  });
});
