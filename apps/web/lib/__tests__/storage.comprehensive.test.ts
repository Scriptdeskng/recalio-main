// Tests for storage utilities
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { storage } from '@/lib/storage'

describe('Storage Utilities', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  
  afterEach(() => {
    localStorage.clear()
  })
  
  describe('Player Name', () => {
    it('should get null when no name is set', () => {
      expect(storage.getPlayerName()).toBeNull()
    })
    
    it('should set and get player name', () => {
      storage.setPlayerName('Alice')
      expect(storage.getPlayerName()).toBe('Alice')
    })
    
    it('should update existing player name', () => {
      storage.setPlayerName('Alice')
      storage.setPlayerName('Bob')
      expect(storage.getPlayerName()).toBe('Bob')
    })
    
    it('should handle empty string', () => {
      storage.setPlayerName('')
      expect(storage.getPlayerName()).toBe('')
    })
  })
  
  describe('Quiz History', () => {
    it('should get empty array when no history', () => {
      expect(storage.getQuizHistory()).toEqual([])
    })
    
    it('should add quiz to history', () => {
      const quiz = {
        id: 'quiz-1',
        topic: 'Science',
        difficulty: 'beginner' as const,
        score: 80,
        xp: 40,
        total_questions: 5,
        timestamp: new Date().toISOString()
      }
      
      storage.setQuizHistory([quiz])
      const history = storage.getQuizHistory()
      
      expect(history).toHaveLength(1)
      expect(history[0].topic).toBe('Science')
    })
    
    it('should maintain multiple quiz entries', () => {
      const quiz1 = {
        id: 'quiz-1',
        topic: 'Math',
        difficulty: 'intermediate' as const,
        score: 70,
        xp: 35,
        total_questions: 5,
        timestamp: new Date().toISOString()
      }
      
      const quiz2 = {
        id: 'quiz-2',
        topic: 'Science',
        difficulty: 'beginner' as const,
        score: 90,
        xp: 45,
        total_questions: 5,
        timestamp: new Date().toISOString()
      }
      
      storage.setQuizHistory([quiz1, quiz2])
      expect(storage.getQuizHistory()).toHaveLength(2)
    })
    
    it('should clear quiz history', () => {
      storage.setQuizHistory([
        {
          id: 'quiz-1',
          topic: 'Test',
          difficulty: 'beginner' as const,
          score: 80,
          xp: 40,
          total_questions: 5,
          timestamp: new Date().toISOString()
        }
      ])
      
      storage.clearQuizHistory()
      expect(storage.getQuizHistory()).toEqual([])
    })
  })
  
  describe('My Challenges', () => {
    it('should get empty array when no challenges', () => {
      expect(storage.getMyChallenges()).toEqual([])
    })
    
    it('should add challenge', () => {
      storage.addMyChallenge('challenge-123')
      expect(storage.getMyChallenges()).toContain('challenge-123')
    })
    
    it('should not add duplicate challenges', () => {
      storage.addMyChallenge('challenge-123')
      storage.addMyChallenge('challenge-123')
      
      const challenges = storage.getMyChallenges()
      expect(challenges).toHaveLength(1)
    })
    
    it('should maintain multiple challenges', () => {
      storage.addMyChallenge('challenge-1')
      storage.addMyChallenge('challenge-2')
      storage.addMyChallenge('challenge-3')
      
      const challenges = storage.getMyChallenges()
      expect(challenges).toHaveLength(3)
      expect(challenges).toContain('challenge-1')
      expect(challenges).toContain('challenge-2')
      expect(challenges).toContain('challenge-3')
    })
  })
  
  describe('SSR Safety', () => {
    it('should handle missing localStorage gracefully', () => {
      const originalLocalStorage = global.localStorage
      // @ts-ignore
      delete global.localStorage
      
      expect(storage.getPlayerName()).toBeNull()
      expect(storage.getQuizHistory()).toEqual([])
      expect(storage.getMyChallenges()).toEqual([])
      
      global.localStorage = originalLocalStorage
    })
  })
})
