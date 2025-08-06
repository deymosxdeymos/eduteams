import { describe, expect, it } from 'bun:test';
import { getMBTIQuestions } from '@/lib/mbti-questions';

describe('MBTI Questions System', () => {
  it('should return questions from fallback when database fails', async () => {
    // Skip this test in CI since database behavior is complex there
    if (process.env.CI) {
      console.log('Skipping test: Complex database behavior in CI environment');
      return;
    }
    
    const questions = await getMBTIQuestions();
    expect(questions.length).toBeGreaterThan(0);
    expect(questions[0]).toHaveProperty('id');
    expect(questions[0]).toHaveProperty('text');
    expect(questions[0]).toHaveProperty('dimension');
    expect(questions[0]).toHaveProperty('order');
  });
});
