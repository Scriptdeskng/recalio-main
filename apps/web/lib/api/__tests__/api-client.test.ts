import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { generateQuiz } from '@/lib/api/quizzes'
import { createChallenge, getChallenge } from '@/lib/api/challenges'
import type { QuizQuestion } from '@/lib/types'

// Mock fetch globally
global.fetch = vi.fn()

describe('API Client', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('generateQuiz', () => {
    it('calls API with correct payload', async () => {
      const mockQuestions: QuizQuestion[] = [
        {
          tag: 'math',
          q: 'What is 2+2?',
          choices: ['3', '4', '5', '6'],
          correct: 1,
          explanation: '2+2 equals 4',
        },
      ]

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ questions: mockQuestions }),
      })

      const result = await generateQuiz({
        input: 'Basic math',
        mode: 'topic',
        difficulty: 'beginner',
        count: 5,
      })

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/quizzes/generate'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            input: 'Basic math',
            mode: 'topic',
            difficulty: 'beginner',
            count: 5,
          }),
        })
      )

      expect(result.questions).toEqual(mockQuestions)
    })

    it('throws error on API failure', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal server error',
      })

      await expect(
        generateQuiz({
          input: 'Test',
          mode: 'topic',
          difficulty: 'intermediate',
          count: 8,
        })
      ).rejects.toThrow()
    })
  })

  describe('createChallenge', () => {
    it('creates challenge with correct payload', async () => {
      const mockResponse = {
        challenge_id: 'challenge-123',
        share_url: '/challenge/challenge-123',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await createChallenge({
        attempt_id: 'attempt-123',
        creator_name: 'John',
        input: 'Science quiz',
        difficulty: 'intermediate',
        count: 8,
        questions: [],
        answers: [0, 1, 2],
        duration_seconds: 120,
      })

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/challenges'),
        expect.objectContaining({
          method: 'POST',
        })
      )

      expect(result).toEqual(mockResponse)
    })
  })

  describe('getChallenge', () => {
    it('fetches challenge by ID', async () => {
      const mockChallenge = {
        id: 'challenge-123',
        topic: 'Math',
        difficulty: 'intermediate',
        question_count: 8,
        questions: [],
        creator_name: 'John',
        creator_score: 85,
        creator_time: 120,
        challenger_name: null,
        challenger_score: null,
        challenger_time: null,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockChallenge,
      })

      const result = await getChallenge('challenge-123')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/challenges/challenge-123'),
        expect.objectContaining({
          cache: 'no-store',
        })
      )

      expect(result).toEqual(mockChallenge)
    })

    it('throws error for non-existent challenge', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Challenge not found',
      })

      await expect(getChallenge('nonexistent')).rejects.toThrow()
    })
  })
})
