import { describe, it, expect } from 'vitest';
import { cn } from '../lib/utils';

describe('utils', () => {
  describe('cn function', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      const condition = true;
      expect(cn('base', condition && 'active')).toBe('base active');
    });

    it('should filter out falsy values', () => {
      expect(cn('base', false && 'hidden', null, undefined, 0, '')).toBe('base');
    });

    it('should handle empty input', () => {
      expect(cn()).toBe('');
    });

    it('should handle array inputs', () => {
      expect(cn(['class1', 'class2'])).toBe('class1 class2');
    });

    it('should handle object notation from clsx', () => {
      expect(cn({ active: true, disabled: false })).toBe('active');
    });

    it('should handle complex combinations', () => {
      expect(
        cn('base', ['class1', 'class2'], { active: true, disabled: false }, null, undefined)
      ).toBe('base class1 class2 active');
    });

    it('should handle nested arrays', () => {
      expect(cn(['base', ['nested1', 'nested2']])).toBe('base nested1 nested2');
    });

    it('should handle multiple object notations', () => {
      expect(cn({ primary: true }, { secondary: true }, { disabled: false })).toBe('primary secondary');
    });

    it('should properly merge tailwind classes with tailwind-merge', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
      expect(cn('bg-red-500 text-white', 'bg-blue-500')).toBe('text-white bg-blue-500');
    });
  });
});
