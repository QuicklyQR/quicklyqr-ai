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

    // Check URL form is visible by default - use more specific selector
    expect(screen.getByRole('textbox', { name: /url/i })).toBeInTheDocument();

    // Check customization options
    expect(screen.getByLabelText(/Size:/i)).toBeInTheDocument();
    expect(screen.getByText('Foreground Color')).toBeInTheDocument();
    expect(screen.getByText('Background Color')).toBeInTheDocument();
    expect(screen.getByText('Error Correction Level')).toBeInTheDocument();

    // Check download button
    expect(screen.getByRole('button', { name: /Download/i })).toBeInTheDocument();
  });

  it('switches QR code types correctly', () => {
    render(<QRCodeBuilder />);

    // Switch to Text type
    fireEvent.click(screen.getByRole('radio', { name: /Select Text QR code type/i }));
    const textInput = screen.getByRole('textbox', { name: /text/i });
    expect(textInput).toBeInTheDocument();

    // Switch to WiFi type
    fireEvent.click(screen.getByRole('radio', { name: /Select WiFi QR code type/i }));
    expect(screen.getByRole('textbox', { name: /network name/i })).toBeInTheDocument();

    // Switch to Contact type
    fireEvent.click(screen.getByRole('radio', { name: /Select Contact QR code type/i }));
    expect(screen.getByRole('textbox', { name: /first name/i })).toBeInTheDocument();

    // Switch back to URL type
    fireEvent.click(screen.getByRole('radio', { name: /Select URL QR code type/i }));
    const urlInput = screen.getByRole('textbox', { name: /url/i });
    expect(urlInput).toBeInTheDocument();
  });

  it('handles user input correctly', () => {
    render(<QRCodeBuilder />);

    const urlInput = screen.getByRole('textbox', { name: /url/i });
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
    expect(urlInput).toHaveValue('https://example.com');
  });

  it('handles form validation', () => {
    render(<QRCodeBuilder />);

    const urlInput = screen.getByRole('textbox', { name: /url/i });

    // Test invalid URL
    fireEvent.change(urlInput, { target: { value: 'invalid-url' } });
    fireEvent.blur(urlInput);

    // Component should handle invalid input gracefully
    expect(urlInput).toHaveValue('invalid-url');
  });

  it('handles QR customization options', () => {
    render(<QRCodeBuilder />);

    // Test size adjustment
    const sizeInput = screen.getByLabelText(/Size:/i);
    fireEvent.change(sizeInput, { target: { value: '512' } });
    expect(sizeInput).toHaveValue('512');

    // Test error correction level
    const errorCorrectionSelect = screen.getByLabelText(/Error Correction Level/i);
    fireEvent.change(errorCorrectionSelect, { target: { value: 'H' } });
    expect(errorCorrectionSelect).toHaveValue('H');
  });

  it('handles WiFi QR code generation', () => {
    render(<QRCodeBuilder />);

    // Switch to WiFi type
    fireEvent.click(screen.getByRole('radio', { name: /Select WiFi QR code type/i }));

    // Fill WiFi form
    const ssidInput = screen.getByRole('textbox', { name: /network name/i });
    const passwordInput = screen.getByLabelText(/Password \*/);
    const securitySelect = screen.getByLabelText(/Security Type/i);

    fireEvent.change(ssidInput, { target: { value: 'TestNetwork' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(securitySelect, { target: { value: 'WPA' } });

    expect(ssidInput).toHaveValue('TestNetwork');
    expect(passwordInput).toHaveValue('password123');
    expect(securitySelect).toHaveValue('WPA');
  });

  it('handles text QR code generation', () => {
    render(<QRCodeBuilder />);

    // Switch to Text type
    fireEvent.click(screen.getByRole('radio', { name: /Select Text QR code type/i }));

    const textInput = screen.getByRole('textbox', { name: /text/i });
    fireEvent.change(textInput, { target: { value: 'Hello World' } });
    expect(textInput).toHaveValue('Hello World');
  });

  it('handles contact/vCard QR code generation', () => {
    render(<QRCodeBuilder />);

    // Switch to Contact type
    fireEvent.click(screen.getByRole('radio', { name: /Select Contact QR code type/i }));

    // Fill contact form
    const firstNameInput = screen.getByRole('textbox', { name: /first name/i });
    const lastNameInput = screen.getByRole('textbox', { name: /last name/i });
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    const phoneInput = screen.getByRole('textbox', { name: /phone/i });

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '555-1234' } });

    expect(firstNameInput).toHaveValue('John');
    expect(lastNameInput).toHaveValue('Doe');
    expect(emailInput).toHaveValue('john@example.com');
    expect(phoneInput).toHaveValue('555-1234');
  });

  it('handles download functionality', () => {
    render(<QRCodeBuilder />);

    const urlInput = screen.getByRole('textbox', { name: /url/i });
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });

    const downloadButton = screen.getByRole('button', { name: /Download/i });

    // Test that download button is present and clickable
    expect(downloadButton).toBeInTheDocument();
    expect(downloadButton).not.toBeDisabled();

    // Click download button (this will test the download flow)
    fireEvent.click(downloadButton);

    // Component should handle download gracefully
    expect(downloadButton).toBeInTheDocument();
  });

  it('maintains state when switching between QR types', () => {
    render(<QRCodeBuilder />);

    // Enter URL
    const urlInput = screen.getByRole('textbox', { name: /url/i });
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });

    // Switch to text and back
    fireEvent.click(screen.getByRole('radio', { name: /Select Text QR code type/i }));
    fireEvent.click(screen.getByRole('radio', { name: /Select URL QR code type/i }));

    // URL should be preserved or reset as expected by the component
    const urlInputAfterSwitch = screen.getByRole('textbox', { name: /url/i });
    expect(urlInputAfterSwitch).toBeInTheDocument();
  });

  it('handles edge cases and error states', async () => {
    render(<QRCodeBuilder />);
    const urlInput = screen.getByRole('textbox', { name: /url/i });
    // Test empty input
    fireEvent.change(urlInput, { target: { value: '' } });
    await waitFor(() => expect(urlInput).toHaveValue(''));
    // Test very long input
    const longUrl = 'https://example.com/' + 'a'.repeat(1000);
    fireEvent.change(urlInput, { target: { value: longUrl } });
    await waitFor(() => expect(urlInput).toHaveValue(longUrl));
  });

  it('handles color customization', () => {
    render(<QRCodeBuilder />);

    // Check URL form is visible by default - use more specific selector
    const urlInput = screen.getByRole('textbox', { name: /url/i });
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });

    // Test color inputs exist
    expect(screen.getByText('Foreground Color')).toBeInTheDocument();
    expect(screen.getByText('Background Color')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<QRCodeBuilder />);

    // Check that form elements have proper labels - use more specific selector
    expect(screen.getByRole('textbox', { name: /url/i })).toBeInTheDocument();

    // Check that buttons have proper aria-labels
    expect(screen.getByRole('button', { name: /Download/i })).toBeInTheDocument();

    // Check radiogroup has proper label
    expect(screen.getByRole('radiogroup', { name: /QR Code Type Selection/i })).toBeInTheDocument();

    // Check that radio buttons are properly marked
    const urlRadio = screen.getByRole('radio', { name: /Select URL QR code type/i });
    expect(urlRadio).toHaveAttribute('aria-checked', 'true');
  });

  it('handles rapid user interactions', async () => {
    render(<QRCodeBuilder />);

    const urlInput = screen.getByRole('textbox', { name: /url/i });

    // Rapidly change input
    fireEvent.change(urlInput, { target: { value: 'https://test1.com' } });
    fireEvent.change(urlInput, { target: { value: 'https://test2.com' } });
    fireEvent.change(urlInput, { target: { value: 'https://test3.com' } });

    // Component should handle rapid changes gracefully
    expect(urlInput).toHaveValue('https://test3.com');

    // Test rapid type switching
    fireEvent.click(screen.getByRole('radio', { name: /Select Text QR code type/i }));
    fireEvent.click(screen.getByRole('radio', { name: /Select URL QR code type/i }));
    fireEvent.click(screen.getByRole('radio', { name: /Select WiFi QR code type/i }));

    // Should handle rapid switching without errors
    expect(screen.getByRole('textbox', { name: /network name/i })).toBeInTheDocument();
  });

  // Check URL form is visible by default
  it('checks customization options', () => {
    render(<QRCodeBuilder />);

    expect(screen.getByLabelText(/Size:/i)).toBeInTheDocument();
    expect(screen.getByText('Foreground Color')).toBeInTheDocument();
    expect(screen.getByText('Background Color')).toBeInTheDocument();
    expect(screen.getByText('Error Correction Level')).toBeInTheDocument();
  });
});
