import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useQuizState } from '@/hooks/useQuizState'
import type { QuizQuestion } from '@/lib/types'

const mockQuestions: QuizQuestion[] = [
  {
    tag: 'science',
    q: 'What is H2O?',
    choices: ['Water', 'Oxygen', 'Hydrogen', 'Carbon'],
    correct: 0,
    explanation: 'H2O is the chemical formula for water',
  },
  {
    tag: 'science',
    q: 'What is CO2?',
    choices: ['Water', 'Carbon Dioxide', 'Oxygen', 'Nitrogen'],
    correct: 1,
    explanation: 'CO2 is carbon dioxide',
  },
]

describe('useQuizState', () => {
  it('initializes with setup screen', () => {
    const { result } = renderHook(() => useQuizState())
    expect(result.current.screen).toBe('setup')
    expect(result.current.questions).toEqual([])
    expect(result.current.results).toEqual([])
    expect(result.current.xp).toBe(0)
  })

  it('starts quiz with questions', () => {
    const { result } = renderHook(() => useQuizState())
    
    act(() => {
      result.current.startQuiz(mockQuestions)
    })

    expect(result.current.screen).toBe('quiz')
    expect(result.current.questions).toEqual(mockQuestions)
    expect(result.current.currentIndex).toBe(0)
    expect(result.current.results).toEqual([])
  })

  it('records correct answer and awards XP', () => {
    const { result } = renderHook(() => useQuizState())
    
    act(() => {
      result.current.startQuiz(mockQuestions)
    })

    act(() => {
      const isCorrect = result.current.answerQuestion(0) // Correct answer
      expect(isCorrect).toBe(true)
    })

    expect(result.current.results).toHaveLength(1)
    expect(result.current.results[0].isCorrect).toBe(true)
    expect(result.current.xp).toBe(10) // XP_PER_CORRECT
  })

  it('records incorrect answer without XP', () => {
    const { result } = renderHook(() => useQuizState())
    
    act(() => {
      result.current.startQuiz(mockQuestions)
    })

    act(() => {
      const isCorrect = result.current.answerQuestion(1) // Wrong answer
      expect(isCorrect).toBe(false)
    })

    expect(result.current.results).toHaveLength(1)
    expect(result.current.results[0].isCorrect).toBe(false)
    expect(result.current.xp).toBe(0)
  })

  it('advances to next question', () => {
    const { result } = renderHook(() => useQuizState())
    
    act(() => {
      result.current.startQuiz(mockQuestions)
    })

    expect(result.current.currentIndex).toBe(0)

    act(() => {
      result.current.answerQuestion(0)
    })

    act(() => {
      result.current.nextQuestion()
    })

    expect(result.current.currentIndex).toBe(1)
    expect(result.current.screen).toBe('quiz')
  })

  it('moves to complete screen after last question', () => {
    const { result } = renderHook(() => useQuizState())
    
    act(() => {
      result.current.startQuiz(mockQuestions)
    })

    // Answer first question
    act(() => {
      result.current.answerQuestion(0)
      result.current.nextQuestion()
    })

    // Answer second question
    act(() => {
      result.current.answerQuestion(1)
      result.current.nextQuestion()
    })

    expect(result.current.screen).toBe('complete')
  })

  it('resets to setup correctly', () => {
    const { result } = renderHook(() => useQuizState())
    
    act(() => {
      result.current.startQuiz(mockQuestions)
      result.current.answerQuestion(0)
    })

    act(() => {
      result.current.resetToSetup()
    })

    expect(result.current.screen).toBe('setup')
    expect(result.current.questions).toEqual([])
    expect(result.current.results).toEqual([])
    expect(result.current.xp).toBe(0)
    expect(result.current.currentIndex).toBe(0)
    expect(result.current.config.input).toBe('')
  })

  it('retries quiz correctly', () => {
    const { result } = renderHook(() => useQuizState())
    
    act(() => {
      result.current.startQuiz(mockQuestions)
      result.current.answerQuestion(0)
      result.current.nextQuestion()
    })

    const questionsBeforeRetry = result.current.questions

    act(() => {
      result.current.retryQuiz()
    })

    expect(result.current.screen).toBe('quiz')
    expect(result.current.currentIndex).toBe(0)
    expect(result.current.results).toEqual([])
    expect(result.current.xp).toBe(0)
    expect(result.current.questions).toEqual(questionsBeforeRetry) // Same questions
  })

  it('updates config correctly', () => {
    const { result } = renderHook(() => useQuizState())
    
    act(() => {
      result.current.setConfig({
        input: 'Math problems',
        difficulty: 'advanced',
        count: 10,
      })
    })

    expect(result.current.config.input).toBe('Math problems')
    expect(result.current.config.difficulty).toBe('advanced')
    expect(result.current.config.count).toBe(10)
  })
})
