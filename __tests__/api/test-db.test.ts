// __tests__/api/test-db.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GET, POST } from '../../app/api/test-db/route';
import { NextRequest } from 'next/server';

// Mock the Supabase connection test
vi.mock('../../lib/supabase', () => ({
  testSupabaseConnection: vi.fn()
}));

describe('/api/test-db', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/test-db', () => {
    it('should return success when database connection works', async () => {
      const { testSupabaseConnection } = await import('../../lib/supabase');
      vi.mocked(testSupabaseConnection).mockResolvedValue({
        success: true,
        message: 'Supabase connection successful'
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Database connection successful');
      expect(data.timestamp).toBeDefined();
    });

    it('should return error when database connection fails', async () => {
      const { testSupabaseConnection } = await import('../../lib/supabase');
      vi.mocked(testSupabaseConnection).mockResolvedValue({
        success: false,
        error: new Error('Connection timeout')
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Database connection failed');
      expect(data.error).toBe('Connection timeout');
    });

    it('should handle unexpected errors gracefully', async () => {
      const { testSupabaseConnection } = await import('../../lib/supabase');
      vi.mocked(testSupabaseConnection).mockRejectedValue(new Error('Unexpected error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('API route error');
      expect(data.error).toBe('Unexpected error');
    });

    it('should include proper timestamp format', async () => {
      const { testSupabaseConnection } = await import('../../lib/supabase');
      vi.mocked(testSupabaseConnection).mockResolvedValue({
        success: true,
        message: 'Success'
      });

      const response = await GET();
      const data = await response.json();

      expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });
  });

  describe('POST /api/test-db', () => {
    it('should return method not allowed for POST requests', async () => {
      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.message).toBe('Use GET method to test database connection');
    });
  });

  describe('Edge Cases', () => {
    it('should handle environment variable issues', async () => {
      const { testSupabaseConnection } = await import('../../lib/supabase');
      vi.mocked(testSupabaseConnection).mockResolvedValue({
        success: false,
        error: new Error('Missing Supabase environment variables')
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Missing Supabase environment variables');
    });

    it('should handle network timeout scenarios', async () => {
      const { testSupabaseConnection } = await import('../../lib/supabase');
      vi.mocked(testSupabaseConnection).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});