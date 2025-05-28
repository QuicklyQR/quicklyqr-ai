// __tests__/lib/supabase.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  saveQRCodeGeneration, 
  saveBulkProcessing, 
  updateBulkProcessing,
  getUserQRHistory,
  getUserBulkHistory,
  testSupabaseConnection 
} from '../../lib/supabase';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn()
        }))
      })),
      limit: vi.fn()
    }))
  }))
};

// Mock the supabase module
vi.mock('../../lib/supabase', async () => {
  const actual = await vi.importActual('../../lib/supabase');
  return {
    ...actual,
    supabase: mockSupabase
  };
});

describe('Supabase Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('saveQRCodeGeneration', () => {
    it('should save QR code generation successfully', async () => {
      const mockData = {
        user_id: 'test-user-id',
        data_type: 'url' as const,
        content: 'https://example.com',
        processing_options: {
          size: 300,
          foregroundColor: '#000000',
          backgroundColor: '#ffffff',
          errorCorrectionLevel: 'M'
        }
      };

      const mockResult = { id: 'test-id', ...mockData };
      
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockResult,
        error: null
      });

      const result = await saveQRCodeGeneration(mockData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(mockSupabase.from).toHaveBeenCalledWith('qr_codes');
    });

    it('should handle database errors gracefully', async () => {
      const mockData = {
        user_id: 'test-user-id',
        data_type: 'url' as const,
        content: 'https://example.com',
        processing_options: {
          size: 300,
          foregroundColor: '#000000',
          backgroundColor: '#ffffff',
          errorCorrectionLevel: 'M'
        }
      };

      const mockError = new Error('Database connection failed');
      
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await saveQRCodeGeneration(mockData);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe('saveBulkProcessing', () => {
    it('should save bulk processing record successfully', async () => {
      const mockData = {
        user_id: 'test-user-id',
        filename: 'test.csv',
        total_rows: 100,
        processed_rows: 0,
        failed_rows: 0,
        status: 'pending' as const
      };

      const mockResult = { id: 'bulk-test-id', ...mockData };
      
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockResult,
        error: null
      });

      const result = await saveBulkProcessing(mockData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(mockSupabase.from).toHaveBeenCalledWith('bulk_processing');
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        filename: 'test.csv'
        // Missing required fields
      } as any;

      // This should handle the validation at the TypeScript level
      // but we can test runtime behavior
      const mockError = new Error('Missing required fields');
      
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await saveBulkProcessing(incompleteData);

      expect(result.success).toBe(false);
    });
  });

  describe('updateBulkProcessing', () => {
    it('should update bulk processing status', async () => {
      const testId = 'test-bulk-id';
      const updates = {
        status: 'completed' as const,
        processed_rows: 95,
        failed_rows: 5
      };

      const mockResult = { id: testId, ...updates };
      
      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: mockResult,
        error: null
      });

      const result = await updateBulkProcessing(testId, updates);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(mockSupabase.from).toHaveBeenCalledWith('bulk_processing');
    });

    it('should handle non-existent record updates', async () => {
      const testId = 'non-existent-id';
      const updates = { status: 'completed' as const };

      const mockError = new Error('Record not found');
      
      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await updateBulkProcessing(testId, updates);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe('getUserQRHistory', () => {
    it('should retrieve user QR history with default limit', async () => {
      const userId = 'test-user-id';
      const mockHistory = [
        { id: '1', content: 'https://example1.com' },
        { id: '2', content: 'https://example2.com' }
      ];
      
      mockSupabase.from().select().eq().order().limit.mockResolvedValue({
        data: mockHistory,
        error: null
      });

      const result = await getUserQRHistory(userId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockHistory);
      expect(mockSupabase.from).toHaveBeenCalledWith('qr_codes');
    });

    it('should respect custom limit parameter', async () => {
      const userId = 'test-user-id';
      const customLimit = 10;
      
      mockSupabase.from().select().eq().order().limit.mockResolvedValue({
        data: [],
        error: null
      });

      await getUserQRHistory(userId, customLimit);

      // Verify the limit was applied (implementation detail)
      expect(mockSupabase.from().select().eq().order().limit).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle network timeouts', async () => {
      const mockData = {
        user_id: 'test-user-id',
        data_type: 'url' as const,
        content: 'https://example.com',
        processing_options: {
          size: 300,
          foregroundColor: '#000000',
          backgroundColor: '#ffffff',
          errorCorrectionLevel: 'M'
        }
      };

      const timeoutError = new Error('Network timeout');
      
      mockSupabase.from().insert().select().single.mockRejectedValue(timeoutError);

      const result = await saveQRCodeGeneration(mockData);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
    });

    it('should handle malformed data gracefully', async () => {
      const malformedData = {
        // Missing required fields and wrong types
        invalid_field: 'test',
        processing_options: 'not-an-object'
      } as any;

      const validationError = new Error('Invalid data format');
      
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: validationError
      });

      const result = await saveQRCodeGeneration(malformedData);

      expect(result.success).toBe(false);
    });

    it('should handle empty user IDs', async () => {
      const result = await getUserQRHistory('');
      
      // Should handle empty user ID gracefully
      expect(result.success).toBe(false);
    });
  });

  describe('Performance Tests', () => {
    it('should handle bulk operations efficiently', async () => {
      const startTime = Date.now();
      
      // Simulate multiple concurrent operations
      const promises = Array(10).fill(null).map((_, i) => 
        saveBulkProcessing({
          user_id: 'test-user',
          filename: `test-${i}.csv`,
          total_rows: 100,
          processed_rows: 0,
          failed_rows: 0,
          status: 'pending'
        })
      );

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { id: 'test-id' },
        error: null
      });

      await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000); // 1 second
    });
  });
});