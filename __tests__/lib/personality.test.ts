import { describe, test, expect } from 'bun:test';
import { 
  calculatePersonalityScores, 
  getMBTIType,
  type AnswerRecord 
} from '@/lib/personality';

describe('Personality Calculation Tests', () => {
  describe('calculatePersonalityScores', () => {
    test('should calculate correct MBTI scores for extreme answers', () => {
      // All answers = 5 (strongly agree) should result in positive scores
      const allStronglyAgree: AnswerRecord = {};
      for (let i = 1; i <= 24; i++) {
        allStronglyAgree[i] = 5;
      }

      const scores = calculatePersonalityScores(allStronglyAgree);
      
      // With all 5s and considering reversed questions, we expect specific patterns
      expect(scores.ei).toBeGreaterThan(-1);
      expect(scores.ei).toBeLessThanOrEqual(1);
      expect(scores.sn).toBeGreaterThan(-1);
      expect(scores.sn).toBeLessThanOrEqual(1);
      expect(scores.tf).toBeGreaterThan(-1);
      expect(scores.tf).toBeLessThanOrEqual(1);
      expect(scores.pj).toBeGreaterThan(-1);
      expect(scores.pj).toBeLessThanOrEqual(1);
    });

    test('should handle neutral answers (all 3s)', () => {
      const allNeutral: AnswerRecord = {};
      for (let i = 1; i <= 24; i++) {
        allNeutral[i] = 3;
      }

      const scores = calculatePersonalityScores(allNeutral);
      
      // All neutral answers should result in 0 scores
      expect(scores.ei).toBe(0);
      expect(scores.sn).toBe(0);
      expect(scores.tf).toBe(0);
      expect(scores.pj).toBe(0);
    });

    test('should handle missing answers gracefully', () => {
      const partialAnswers: AnswerRecord = {
        1: 5,
        2: 4,
        7: 2,
        8: 1,
        13: 5,
        14: 4,
        19: 1,
        20: 2,
      };

      const scores = calculatePersonalityScores(partialAnswers);
      
      // Should still calculate scores for available answers
      expect(scores.ei).toBeGreaterThan(-1);
      expect(scores.ei).toBeLessThanOrEqual(1);
      expect(scores.sn).toBeGreaterThan(-1);
      expect(scores.sn).toBeLessThanOrEqual(1);
      expect(scores.tf).toBeGreaterThan(-1);
      expect(scores.tf).toBeLessThanOrEqual(1);
      expect(scores.pj).toBeGreaterThan(-1);
      expect(scores.pj).toBeLessThanOrEqual(1);
    });

    test('should calculate specific example correctly', () => {
      // Create a specific pattern to test calculation logic
      const testAnswers: AnswerRecord = {
        // EI dimension (1-6): Mix of answers
        1: 1, // strongly disagree -> reversed -> 5 -> positive I
        2: 2, // disagree -> 2 -> negative E
        3: 3, // neutral -> 3 -> neutral
        4: 4, // agree -> reversed -> 2 -> negative E
        5: 5, // strongly agree -> 5 -> positive I
        6: 1, // strongly disagree -> 1 -> negative E
        
        // SN dimension (7-12): All toward S
        7: 1, 8: 1, 9: 5, 10: 1, 11: 5, 12: 1,
        
        // TF dimension (13-18): All toward T  
        13: 1, 14: 5, 15: 5, 16: 1, 17: 5, 18: 1,
        
        // PJ dimension (19-24): All toward J
        19: 1, 20: 5, 21: 1, 22: 5, 23: 1, 24: 5,
      };

      const scores = calculatePersonalityScores(testAnswers);
      
      // Verify scores are within valid range
      expect(scores.ei).toBeGreaterThan(-1);
      expect(scores.ei).toBeLessThanOrEqual(1);
      expect(scores.sn).toBeLessThan(0); // Should lean toward S
      expect(scores.tf).toBeLessThan(0); // Should lean toward T
      expect(scores.pj).toBeLessThan(0); // Should lean toward J
    });
  });

  describe('getMBTIType', () => {
    test('should return correct MBTI type for extreme scores', () => {
      const extremeIntrovert = {
        ei: 1,   // Introvert
        sn: -1,  // Sensing
        tf: 1,   // Feeling
        pj: -1   // Judging
      };

      expect(getMBTIType(extremeIntrovert)).toBe('ISFJ');
    });

    test('should handle borderline scores correctly', () => {
      const borderlineScores = {
        ei: -0.1, // Slightly Extrovert
        sn: 0.1,  // Slightly iNtuition
        tf: -0.1, // Slightly Thinking
        pj: 0.1   // Slightly Perceiving
      };

      expect(getMBTIType(borderlineScores)).toBe('ENTP');
    });

    test('should handle zero scores (default to second letter)', () => {
      const zeroScores = {
        ei: 0,
        sn: 0,
        tf: 0,
        pj: 0
      };

      expect(getMBTIType(zeroScores)).toBe('INFP');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty answers object', () => {
      const emptyAnswers: AnswerRecord = {};
      
      const scores = calculatePersonalityScores(emptyAnswers);
      
      expect(scores.ei).toBe(0);
      expect(scores.sn).toBe(0);
      expect(scores.tf).toBe(0);
      expect(scores.pj).toBe(0);
    });

    test('should clamp extreme calculated values to [-1, 1]', () => {
      // This test ensures our clamping logic works
      const extremeAnswers: AnswerRecord = {};
      for (let i = 1; i <= 24; i++) {
        extremeAnswers[i] = i % 2 === 0 ? 1 : 5; // Alternating extreme values
      }

      const scores = calculatePersonalityScores(extremeAnswers);
      
      expect(scores.ei).toBeGreaterThanOrEqual(-1);
      expect(scores.ei).toBeLessThanOrEqual(1);
      expect(scores.sn).toBeGreaterThanOrEqual(-1);
      expect(scores.sn).toBeLessThanOrEqual(1);
      expect(scores.tf).toBeGreaterThanOrEqual(-1);
      expect(scores.tf).toBeLessThanOrEqual(1);
      expect(scores.pj).toBeGreaterThanOrEqual(-1);
      expect(scores.pj).toBeLessThanOrEqual(1);
    });
  });
});
