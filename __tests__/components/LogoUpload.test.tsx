import { vi } from 'vitest';
import { render } from '@testing-library/react';
import LogoUpload from '../../components/LogoUpload';

describe('LogoUpload', () => {
  it('renders without crashing', () => {
    const onLogoSelect = vi.fn();
    const onLogoRemove = vi.fn();
    
    expect(() => {
      render(<LogoUpload onLogoSelect={onLogoSelect} onLogoRemove={onLogoRemove} />);
    }).not.toThrow();
  });

  it('accepts required props', () => {
    const onLogoSelect = vi.fn();
    const onLogoRemove = vi.fn();
    
    const { container } = render(
      <LogoUpload onLogoSelect={onLogoSelect} onLogoRemove={onLogoRemove} />
    );
    
    expect(container.firstChild).toBeTruthy();
  });
});
