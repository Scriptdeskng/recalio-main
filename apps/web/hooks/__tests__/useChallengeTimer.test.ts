// Tests for challenge timer hook
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useChallengeTimer } from '@/hooks/useChallengeTimer'

describe('useChallengeTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  
  afterEach(() => {
    vi.restoreAllMocks()
  })
  
  it('should initialize at 0 seconds', () => {
    const { result } = renderHook(() => useChallengeTimer())
    expect(result.current.elapsed).toBe(0)
  })
  
  it('should increment every second when started', () => {
    const { result } = renderHook(() => useChallengeTimer())
    
    act(() => {
      result.current.start()
    })
    
    expect(result.current.elapsed).toBe(0)
    
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.elapsed).toBe(1)
    
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.elapsed).toBe(2)
    
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current.elapsed).toBe(5)
  })
  
  it('should not increment when not started', () => {
    const { result } = renderHook(() => useChallengeTimer())
    
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    
    expect(result.current.elapsed).toBe(0)
  })
  
  it('should stop incrementing when stopped', () => {
    const { result } = renderHook(() => useChallengeTimer())
    
    act(() => {
      result.current.start()
    })
    
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current.elapsed).toBe(3)
    
    // Stop the timer
    act(() => {
      result.current.stop()
    })
    
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    
    // Should still be 3
    expect(result.current.elapsed).toBe(3)
  })
  
  it('should reset to 0', () => {
    const { result } = renderHook(() => useChallengeTimer())
    
    act(() => {
      result.current.start()
    })
    
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(result.current.elapsed).toBe(5)
    
    act(() => {
      result.current.reset()
    })
    
    expect(result.current.elapsed).toBe(0)
  })
})
