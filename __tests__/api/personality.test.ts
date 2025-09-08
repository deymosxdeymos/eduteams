import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { POST } from '@/app/api/user/personality/route';

// Mock dependencies
const mockGetSession = mock();
const mockPrismaUpdate = mock();

mock.module('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}));

mock.module('@/lib/prisma', () => ({
  default: {
    user: {
      update: mockPrismaUpdate,
    },
  },
}));

mock.module('next/headers', () => ({
  headers: mock(() => Promise.resolve({})),
}));

describe('POST /api/user/personality', () => {
  const mockUser = { id: 'user123' };

  beforeEach(() => {
    mock.restore();
    mockGetSession.mockResolvedValue({ user: mockUser });
    mockPrismaUpdate.mockResolvedValue({});
  });

  describe('Authentication', () => {
    test('should return 401 for unauthenticated users', async () => {
      mockGetSession.mockResolvedValue(null);

      const request = new Request('http://localhost/api/user/personality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: { '1': 3, '2': 4 } }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    test('should process request for authenticated users', async () => {
      const request = new Request('http://localhost/api/user/personality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: {
            '1': 3,
            '2': 4,
            '3': 2,
            '4': 5,
            '5': 1,
            '6': 3,
            '7': 2,
            '8': 4,
            '9': 3,
            '10': 1,
            '11': 5,
            '12': 2,
            '13': 4,
            '14': 2,
            '15': 5,
            '16': 3,
            '17': 1,
            '18': 4,
            '19': 3,
            '20': 5,
            '21': 2,
            '22': 1,
            '23': 4,
            '24': 3,
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.scores).toBeDefined();
      expect(mockPrismaUpdate).toHaveBeenCalledWith({
        where: { id: 'user123' },
        data: expect.objectContaining({
          ei: expect.any(Number),
          sn: expect.any(Number),
          tf: expect.any(Number),
          pj: expect.any(Number),
        }),
      });
    });
  });

  describe('Input Validation', () => {
    test('should reject invalid answer values', async () => {
      const request = new Request('http://localhost/api/user/personality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: { '1': 6, '2': 0 } }), // Invalid values
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Too big');
    });

    test('should accept valid answer format', async () => {
      const request = new Request('http://localhost/api/user/personality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: { '1': 1, '2': 2, '3': 3, '4': 4, '5': 5 },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    test('should handle empty answers object', async () => {
      const request = new Request('http://localhost/api/user/personality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: {} }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.scores).toEqual({
        ei: 0,
        sn: 0,
        tf: 0,
        pj: 0,
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      mockPrismaUpdate.mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new Request('http://localhost/api/user/personality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: { '1': 3 } }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Database connection failed');
    });

    test('should handle malformed JSON', async () => {
      const request = new Request('http://localhost/api/user/personality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Failed to parse JSON');
    });
  });

  describe('Score Calculation', () => {
    test('should calculate and save correct personality scores', async () => {
      const testAnswers = {
        '1': 1,
        '2': 2,
        '3': 3,
        '4': 4,
        '5': 5,
        '6': 1,
        '7': 2,
        '8': 3,
        '9': 4,
        '10': 5,
        '11': 1,
        '12': 2,
        '13': 3,
        '14': 4,
        '15': 5,
        '16': 1,
        '17': 2,
        '18': 3,
        '19': 4,
        '20': 5,
        '21': 1,
        '22': 2,
        '23': 3,
        '24': 4,
      };

      const request = new Request('http://localhost/api/user/personality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: testAnswers }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.scores).toBeDefined();

      // Verify scores are in valid range
      expect(data.data.scores.ei).toBeGreaterThanOrEqual(-1);
      expect(data.data.scores.ei).toBeLessThanOrEqual(1);
      expect(data.data.scores.sn).toBeGreaterThanOrEqual(-1);
      expect(data.data.scores.sn).toBeLessThanOrEqual(1);
      expect(data.data.scores.tf).toBeGreaterThanOrEqual(-1);
      expect(data.data.scores.tf).toBeLessThanOrEqual(1);
      expect(data.data.scores.pj).toBeGreaterThanOrEqual(-1);
      expect(data.data.scores.pj).toBeLessThanOrEqual(1);

      // Verify database update was called with correct data (allow extra fields)
      expect(mockPrismaUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user123' },
          data: expect.objectContaining({
            ei: data.data.scores.ei,
            sn: data.data.scores.sn,
            tf: data.data.scores.tf,
            pj: data.data.scores.pj,
          }),
        })
      );
    });
  });
});
