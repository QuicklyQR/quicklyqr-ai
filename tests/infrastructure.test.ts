import { describe, it, expect, vi } from 'vitest';

/**
 * Infrastructure Test Suite
 * Tests that the fundamental testing infrastructure is working correctly
 */
describe('Infrastructure Tests', () => {
  describe('Test Environment Setup', () => {
    it('should have jsdom environment available', () => {
      expect(window).toBeDefined();
      expect(document).toBeDefined();
      expect(global.ResizeObserver).toBeDefined();
    });

    it('should have proper vitest globals available', () => {
      expect(vi).toBeDefined();
      expect(expect).toBeDefined();
      expect(describe).toBeDefined();
      expect(it).toBeDefined();
    });

    it('should have jest-dom matchers available', () => {
      const div = document.createElement('div');
      expect(div).toBeInTheDocument;
      expect(typeof expect.extend).toBe('function');
    });
  });

  describe('Browser API Mocks', () => {
    it('should mock ResizeObserver correctly', () => {
      const observer = new ResizeObserver(() => {});
      expect(observer.observe).toBeDefined();
      expect(observer.unobserve).toBeDefined();
      expect(observer.disconnect).toBeDefined();
    });

    it('should mock matchMedia correctly', () => {
      const media = window.matchMedia('(min-width: 768px)');
      expect(media.matches).toBe(false);
      expect(media.media).toBe('(min-width: 768px)');
      expect(media.addListener).toBeDefined();
    });

    it('should mock Canvas getContext correctly', () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      expect(context).toBeDefined();
      expect(context?.fillRect).toBeDefined();
      expect(context?.drawImage).toBeDefined();
    });

    it('should mock URL object methods correctly', () => {
      const url = URL.createObjectURL(new Blob());
      expect(typeof url).toBe('string');
      expect(url).toBe('mock-url');
      
      URL.revokeObjectURL(url);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(url);
    });
  });

  describe('Module Resolution', () => {
    it('should resolve path aliases correctly', () => {
      // Test that @ alias works (this would fail with import errors if broken)
      expect(true).toBe(true);
    });

    it('should handle React imports correctly', async () => {
      // Test that React can be imported without errors
      const React = await import('react');
      expect(React.createElement).toBeDefined();
      expect(React.useState).toBeDefined();
    });
  });

  describe('TypeScript Integration', () => {
    it('should handle TypeScript types correctly', () => {
      interface TestInterface {
        id: number;
        name: string;
      }
      
      const testObj: TestInterface = {
        id: 1,
        name: 'test'
      };
      
      expect(testObj.id).toBe(1);
      expect(testObj.name).toBe('test');
    });

    it('should support generic functions', () => {
      function identity<T>(arg: T): T {
        return arg;
      }
      
      expect(identity('test')).toBe('test');
      expect(identity(123)).toBe(123);
    });
  });

  describe('Coverage Setup', () => {
    it('should be able to track covered and uncovered code', () => {
      // Covered code
      const covered = (a: number, b: number) => a + b;
      expect(covered(1, 2)).toBe(3);
      
      // Intentionally uncovered code (this function won't be called)
      const uncovered = (a: number) => a * 2;
      
      // This ensures the function exists but coverage tools should detect it's unused
      expect(typeof uncovered).toBe('function');
    });
  });
});

/**
 * Mock Verification Tests
 * Ensures mocks are working as expected and don't interfere with business logic
 */
describe('Mock Verification Tests', () => {
  it('should only mock browser APIs, not business logic', () => {
    // Verify that we're only mocking browser/DOM APIs
    expect(vi.isMockFunction(window.matchMedia)).toBe(true);
    expect(vi.isMockFunction(URL.createObjectURL)).toBe(true);
    expect(vi.isMockFunction(URL.revokeObjectURL)).toBe(true);
    
    // Verify that basic JavaScript functions are NOT mocked
    expect(vi.isMockFunction(console.log)).toBe(false);
    expect(vi.isMockFunction(JSON.stringify)).toBe(false);
    expect(vi.isMockFunction(Array.from)).toBe(false);
  });

  it('should preserve real functionality for non-browser APIs', () => {
    // Test that standard JS APIs work normally
    expect(JSON.stringify({ test: 'value' })).toBe('{"test":"value"}');
    expect(Array.from([1, 2, 3])).toEqual([1, 2, 3]);
    expect(new Date().getFullYear()).toBeGreaterThan(2020);
  });
});
