// Integration tests for quiz flow
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useQuizState } from '@/hooks/useQuizState'
import type { QuizQuestion } from '@/lib/types'

const createMockQuestions = (count: number): QuizQuestion[] => {
  return Array.from({ length: count }, (_, i) => ({
    tag: 'test',
    q: `Question ${i + 1}?`,
    choices: ['A', 'B', 'C', 'D'],
    correct: 0,
    explanation: `Explanation ${i + 1}`
  }))
}

describe('Quiz Flow Integration', () => {
  describe('Complete Quiz Flow', () => {
    it('should complete full quiz flow: setup -> loading -> quiz -> completion', () => {
      const { result } = renderHook(() => useQuizState())
      
      // Start in setup
      expect(result.current.screen).toBe('setup')
      
      // Move to loading
      act(() => {
        result.current.setScreen('loading')
      })
      expect(result.current.screen).toBe('loading')
      
      // Start quiz with questions
      const questions = createMockQuestions(3)
      act(() => {
        result.current.setQuestions(questions)
        result.current.setScreen('quiz')
      })
      expect(result.current.screen).toBe('quiz')
      expect(result.current.questions).toHaveLength(3)
      
      // Answer all questions
      act(() => {
        result.current.handleAnswer(0) // Q1: correct
        result.current.handleNext()
        result.current.handleAnswer(1) // Q2: wrong
        result.current.handleNext()
        result.current.handleAnswer(0) // Q3: correct
        result.current.handleNext()
      })
      
      // Should show completion
      expect(result.current.screen).toBe('completion')
      expect(result.current.results).toHaveLength(3)
      expect(result.current.xp).toBe(20) // 2 correct * 10 XP
    })
    
    it('should handle quiz retry from completion', () => {
      const { result } = renderHook(() => useQuizState())
      
      const questions = createMockQuestions(2)
      act(() => {
        result.current.setQuestions(questions)
        result.current.setScreen('quiz')
        result.current.handleAnswer(0)
        result.current.handleNext()
        result.current.handleAnswer(0)
        result.current.handleNext()
      })
      
      expect(result.current.screen).toBe('completion')
      
      // Reset for retry
      act(() => {
        result.current.reset()
      })
      
      expect(result.current.screen).toBe('setup')
      expect(result.current.currentIndex).toBe(0)
      expect(result.current.results).toHaveLength(0)
      expect(result.current.xp).toBe(0)
    })
    
    it('should handle quiz exit mid-session', () => {
      const { result } = renderHook(() => useQuizState())
      
      const questions = createMockQuestions(5)
      act(() => {
        result.current.setQuestions(questions)
        result.current.setScreen('quiz')
        result.current.handleAnswer(0)
        result.current.handleNext()
        result.current.handleAnswer(0)
      })
      
      // Exit in the middle
      act(() => {
        result.current.handleExit()
      })
      
      expect(result.current.screen).toBe('setup')
    })
  })
  
  describe('XP and Scoring', () => {
    it('should calculate perfect score', () => {
      const { result } = renderHook(() => useQuizState())
      
      const questions = createMockQuestions(5)
      act(() => {
        result.current.setQuestions(questions)
        result.current.setScreen('quiz')
        
        // Answer all correctly
        questions.forEach(() => {
          result.current.handleAnswer(0)
          result.current.handleNext()
        })
      })
      
      expect(result.current.xp).toBe(50) // 5 * 10 XP
      expect(result.current.results.every((r: any) => r.isCorrect)).toBe(true)
    })
    
    it('should calculate zero score', () => {
      const { result } = renderHook(() => useQuizState())
      
      const questions = createMockQuestions(5)
      act(() => {
        result.current.setQuestions(questions)
        result.current.setScreen('quiz')
        
        // Answer all wrong
        questions.forEach(() => {
          result.current.handleAnswer(1)
          result.current.handleNext()
        })
      })
      
      expect(result.current.xp).toBe(0)
      expect(result.current.results.every((r: any) => !r.isCorrect)).toBe(true)
    })
    
    it('should calculate partial score correctly', () => {
      const { result } = renderHook(() => useQuizState())
      
      const questions = createMockQuestions(10)
      act(() => {
        result.current.setQuestions(questions)
        result.current.setScreen('quiz')
        
        // Answer 7 correctly, 3 wrong
        for (let i = 0; i < 10; i++) {
          result.current.handleAnswer(i < 7 ? 0 : 1)
          result.current.handleNext()
        }
      })
      
      expect(result.current.xp).toBe(70) // 7 * 10 XP
      const correctCount = result.current.results.filter((r: any) => r.isCorrect).length
      expect(correctCount).toBe(7)
    })
  })
})
