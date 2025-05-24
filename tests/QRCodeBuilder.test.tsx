import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QRCodeBuilder from '../components/QRCodeBuilder';

describe('QRCodeBuilder', () => {
  it('should render the QR code builder form', () => {
    render(<QRCodeBuilder />);
    expect(screen.getByText(/QR Code Type/i)).toBeInTheDocument();
  });

  it('should update input field and generate QR for text', async () => {
    const user = userEvent.setup();
    render(<QRCodeBuilder />);

    // Switch to the 'Text' QR type
    const textRadio = screen.getByRole('radio', { name: /Text/i });
    await user.click(textRadio);

    const input = screen.getByLabelText(/Text Content/i);
    await user.type(input, 'Hello World');

    expect(input).toHaveValue('Hello World');
  });

  it('should switch QR types when radio buttons are clicked', async () => {
    const user = userEvent.setup();
    render(<QRCodeBuilder />);

    const urlRadio = screen.getByRole('radio', { name: /URL/i });
    const wifiRadio = screen.getByRole('radio', { name: /WiFi/i });

    await user.click(wifiRadio);
    expect(wifiRadio).toBeChecked();

    await user.click(urlRadio);
    expect(urlRadio).toBeChecked();
  });
});

it('should render WiFi QR inputs when WiFi type is selected', async () => {
  const user = userEvent.setup();
  render(<QRCodeBuilder />);

  const wifiButton = screen.getByRole('radio', { name: /WiFi/i });
  await user.click(wifiButton);

  expect(screen.getByLabelText(/Network Name/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/WiFi password/i)).toBeInTheDocument();
});
