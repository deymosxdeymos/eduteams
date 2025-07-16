import { describe, it, expect } from 'bun:test';
import { getMBTIQuestions } from '@/lib/mbti-questions';

describe('MBTI Questions System', () => {
  it('should return questions from fallback when database fails', async () => {
    const questions = await getMBTIQuestions();
    expect(questions.length).toBeGreaterThan(0);
    expect(questions[0]).toHaveProperty('id');
    expect(questions[0]).toHaveProperty('text');
    expect(questions[0]).toHaveProperty('dimension');
    expect(questions[0]).toHaveProperty('order');
  });
});
