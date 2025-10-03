import { describe, expect, it } from 'bun:test';
import {
  getCurrentAcademicYear,
  getCurrentAcademicPeriod,
  formatAcademicPeriodLabel,
} from '@/lib/utils/period';

describe('getCurrentAcademicYear', () => {
  describe('August - December (first semester period)', () => {
    it('should return current/next year in August', () => {
      const date = new Date('2025-08-15');
      const result = getCurrentAcademicYear(date);

      expect(result.tahunAwalPeriode).toBe(2025);
      expect(result.tahunAkhirPeriode).toBe(2026);
      expect(result.label).toBe('2025/2026');
    });

    it('should return current/next year in December', () => {
      const date = new Date('2025-12-25');
      const result = getCurrentAcademicYear(date);

      expect(result.tahunAwalPeriode).toBe(2025);
      expect(result.tahunAkhirPeriode).toBe(2026);
      expect(result.label).toBe('2025/2026');
    });
  });

  describe('January - July (second semester period)', () => {
    it('should return previous/current year in January', () => {
      const date = new Date('2026-01-15');
      const result = getCurrentAcademicYear(date);

      expect(result.tahunAwalPeriode).toBe(2025);
      expect(result.tahunAkhirPeriode).toBe(2026);
      expect(result.label).toBe('2025/2026');
    });

    it('should return previous/current year in March', () => {
      const date = new Date('2026-03-20');
      const result = getCurrentAcademicYear(date);

      expect(result.tahunAwalPeriode).toBe(2025);
      expect(result.tahunAkhirPeriode).toBe(2026);
      expect(result.label).toBe('2025/2026');
    });

    it('should return previous/current year in July', () => {
      const date = new Date('2026-07-31');
      const result = getCurrentAcademicYear(date);

      expect(result.tahunAwalPeriode).toBe(2025);
      expect(result.tahunAkhirPeriode).toBe(2026);
      expect(result.label).toBe('2025/2026');
    });
  });

  describe('Edge cases', () => {
    it('should handle first day of August', () => {
      const date = new Date('2025-08-01');
      const result = getCurrentAcademicYear(date);

      expect(result.tahunAwalPeriode).toBe(2025);
      expect(result.tahunAkhirPeriode).toBe(2026);
    });

    it('should handle last day of July', () => {
      const date = new Date('2026-07-31');
      const result = getCurrentAcademicYear(date);

      expect(result.tahunAwalPeriode).toBe(2025);
      expect(result.tahunAkhirPeriode).toBe(2026);
    });
  });

  describe('Default parameter (current date)', () => {
    it('should use current date when no parameter provided', () => {
      const result = getCurrentAcademicYear();

      expect(result.tahunAwalPeriode).toBeNumber();
      expect(result.tahunAkhirPeriode).toBeNumber();
      expect(result.label).toMatch(/^\d{4}\/\d{4}$/);
      expect(result.tahunAkhirPeriode).toBe(result.tahunAwalPeriode + 1);
    });
  });
});

describe('getCurrentAcademicPeriod', () => {
  describe('Ganjil semester (Odd)', () => {
    it('should detect ganjil semester in August', () => {
      const date = new Date('2025-08-15');
      const result = getCurrentAcademicPeriod(date);

      expect(result.tahunAwalPeriode).toBe(2025);
      expect(result.tahunAkhirPeriode).toBe(2026);
      expect(result.periode).toBe('ganjil');
      expect(result.label).toBe('2025/2026 Ganjil');
    });

    it('should detect ganjil semester in September', () => {
      const date = new Date('2025-09-01');
      const result = getCurrentAcademicPeriod(date);

      expect(result.tahunAwalPeriode).toBe(2025);
      expect(result.tahunAkhirPeriode).toBe(2026);
      expect(result.periode).toBe('ganjil');
    });

    it('should detect ganjil semester in October', () => {
      const date = new Date('2025-10-20');
      const result = getCurrentAcademicPeriod(date);

      expect(result.tahunAwalPeriode).toBe(2025);
      expect(result.tahunAkhirPeriode).toBe(2026);
      expect(result.periode).toBe('ganjil');
    });

    it('should detect ganjil semester in November', () => {
      const date = new Date('2025-11-30');
      const result = getCurrentAcademicPeriod(date);

      expect(result.tahunAwalPeriode).toBe(2025);
      expect(result.tahunAkhirPeriode).toBe(2026);
      expect(result.periode).toBe('ganjil');
    });

    it('should detect ganjil semester in December', () => {
      const date = new Date('2025-12-25');
      const result = getCurrentAcademicPeriod(date);

      expect(result.tahunAwalPeriode).toBe(2025);
      expect(result.tahunAkhirPeriode).toBe(2026);
      expect(result.periode).toBe('ganjil');
    });

    it('should detect ganjil semester in January (next year)', () => {
      const date = new Date('2026-01-15');
      const result = getCurrentAcademicPeriod(date);

      expect(result.tahunAwalPeriode).toBe(2025);
      expect(result.tahunAkhirPeriode).toBe(2026);
      expect(result.periode).toBe('ganjil');
      expect(result.label).toBe('2025/2026 Ganjil');
    });
  });

  describe('Genap semester (Even)', () => {
    it('should detect genap semester in February', () => {
      const date = new Date('2026-02-01');
      const result = getCurrentAcademicPeriod(date);

      expect(result.tahunAwalPeriode).toBe(2025);
      expect(result.tahunAkhirPeriode).toBe(2026);
      expect(result.periode).toBe('genap');
      expect(result.label).toBe('2025/2026 Genap');
    });

    it('should detect genap semester in March', () => {
      const date = new Date('2026-03-15');
      const result = getCurrentAcademicPeriod(date);

      expect(result.tahunAwalPeriode).toBe(2025);
      expect(result.tahunAkhirPeriode).toBe(2026);
      expect(result.periode).toBe('genap');
    });

    it('should detect genap semester in April', () => {
      const date = new Date('2026-04-20');
      const result = getCurrentAcademicPeriod(date);

      expect(result.tahunAwalPeriode).toBe(2025);
      expect(result.tahunAkhirPeriode).toBe(2026);
      expect(result.periode).toBe('genap');
    });

    it('should detect genap semester in May', () => {
      const date = new Date('2026-05-10');
      const result = getCurrentAcademicPeriod(date);

      expect(result.tahunAwalPeriode).toBe(2025);
      expect(result.tahunAkhirPeriode).toBe(2026);
      expect(result.periode).toBe('genap');
    });

    it('should detect genap semester in June', () => {
      const date = new Date('2026-06-30');
      const result = getCurrentAcademicPeriod(date);

      expect(result.tahunAwalPeriode).toBe(2025);
      expect(result.tahunAkhirPeriode).toBe(2026);
      expect(result.periode).toBe('genap');
    });

    it('should detect genap semester in July', () => {
      const date = new Date('2026-07-15');
      const result = getCurrentAcademicPeriod(date);

      expect(result.tahunAwalPeriode).toBe(2025);
      expect(result.tahunAkhirPeriode).toBe(2026);
      expect(result.periode).toBe('genap');
    });
  });

  describe('Edge cases', () => {
    it('should handle first day of August (start of ganjil)', () => {
      const date = new Date('2025-08-01');
      const result = getCurrentAcademicPeriod(date);

      expect(result.tahunAwalPeriode).toBe(2025);
      expect(result.tahunAkhirPeriode).toBe(2026);
      expect(result.periode).toBe('ganjil');
    });

    it('should handle last day of July (end of genap)', () => {
      const date = new Date('2026-07-31');
      const result = getCurrentAcademicPeriod(date);

      expect(result.tahunAwalPeriode).toBe(2025);
      expect(result.tahunAkhirPeriode).toBe(2026);
      expect(result.periode).toBe('genap');
    });

    it('should handle first day of January (still ganjil)', () => {
      const date = new Date('2026-01-01');
      const result = getCurrentAcademicPeriod(date);

      expect(result.tahunAwalPeriode).toBe(2025);
      expect(result.tahunAkhirPeriode).toBe(2026);
      expect(result.periode).toBe('ganjil');
    });

    it('should handle last day of January (still ganjil)', () => {
      const date = new Date('2026-01-31');
      const result = getCurrentAcademicPeriod(date);

      expect(result.tahunAwalPeriode).toBe(2025);
      expect(result.tahunAkhirPeriode).toBe(2026);
      expect(result.periode).toBe('ganjil');
    });

    it('should handle first day of February (start of genap)', () => {
      const date = new Date('2026-02-01');
      const result = getCurrentAcademicPeriod(date);

      expect(result.tahunAwalPeriode).toBe(2025);
      expect(result.tahunAkhirPeriode).toBe(2026);
      expect(result.periode).toBe('genap');
    });
  });

  describe('Different years', () => {
    it('should work correctly for year 2024', () => {
      const date = new Date('2024-09-15');
      const result = getCurrentAcademicPeriod(date);

      expect(result.tahunAwalPeriode).toBe(2024);
      expect(result.tahunAkhirPeriode).toBe(2025);
      expect(result.periode).toBe('ganjil');
      expect(result.label).toBe('2024/2025 Ganjil');
    });

    it('should work correctly for year 2027', () => {
      const date = new Date('2027-03-20');
      const result = getCurrentAcademicPeriod(date);

      expect(result.tahunAwalPeriode).toBe(2026);
      expect(result.tahunAkhirPeriode).toBe(2027);
      expect(result.periode).toBe('genap');
      expect(result.label).toBe('2026/2027 Genap');
    });
  });

  describe('Default parameter (current date)', () => {
    it('should use current date when no parameter provided', () => {
      const result = getCurrentAcademicPeriod();

      expect(result.tahunAwalPeriode).toBeNumber();
      expect(result.tahunAkhirPeriode).toBeNumber();
      expect(result.periode).toMatch(/^(ganjil|genap)$/);
      expect(result.label).toMatch(/^\d{4}\/\d{4} (Ganjil|Genap)$/);
      expect(result.tahunAkhirPeriode).toBeGreaterThanOrEqual(
        result.tahunAwalPeriode
      );
    });
  });
});

describe('formatAcademicPeriodLabel', () => {
  it('should format ganjil period correctly', () => {
    const result = formatAcademicPeriodLabel(2025, 2026, 'ganjil');
    expect(result).toBe('2025/2026 Ganjil');
  });

  it('should format genap period correctly', () => {
    const result = formatAcademicPeriodLabel(2025, 2026, 'genap');
    expect(result).toBe('2025/2026 Genap');
  });

  it('should capitalize first letter of period', () => {
    const ganjil = formatAcademicPeriodLabel(2024, 2025, 'ganjil');
    const genap = formatAcademicPeriodLabel(2024, 2025, 'genap');

    expect(ganjil).toContain('Ganjil');
    expect(genap).toContain('Genap');
  });

  it('should format different year ranges correctly', () => {
    const result1 = formatAcademicPeriodLabel(2020, 2021, 'ganjil');
    const result2 = formatAcademicPeriodLabel(2030, 2031, 'genap');

    expect(result1).toBe('2020/2021 Ganjil');
    expect(result2).toBe('2030/2031 Genap');
  });
});
