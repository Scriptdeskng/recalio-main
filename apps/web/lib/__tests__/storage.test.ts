import { describe, it, expect, beforeEach, vi } from 'vitest'
import { storage } from '@/lib/storage'

describe('Storage utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('getPlayerName', () => {
    it('returns null when no name is stored', () => {
      expect(storage.getPlayerName()).toBeNull()
    })

    it('returns stored player name', () => {
      localStorage.getItem = vi.fn().mockReturnValue('John Doe')
      expect(storage.getPlayerName()).toBe('John Doe')
    })
  })

  describe('setPlayerName', () => {
    it('stores player name', () => {
      storage.setPlayerName('Jane Doe')
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'staysharp_player_name',
        'Jane Doe'
      )
    })
  })

  describe('getMyChallenges', () => {
    it('returns empty array when no challenges stored', () => {
      expect(storage.getMyChallenges()).toEqual([])
    })

    it('returns array of challenge IDs', () => {
      const ids = ['challenge-1', 'challenge-2']
      localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(ids))
      expect(storage.getMyChallenges()).toEqual(ids)
    })

    it('handles invalid JSON gracefully', () => {
      localStorage.getItem = vi.fn().mockReturnValue('invalid-json')
      expect(storage.getMyChallenges()).toEqual([])
    })

    it('handles non-array values gracefully', () => {
      localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify({ not: 'array' }))
      expect(storage.getMyChallenges()).toEqual([])
    })
  })

  describe('addMyChallenge', () => {
    it('adds challenge ID to empty list', () => {
      storage.addMyChallenge('challenge-1')
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'staysharp_my_challenges',
        JSON.stringify(['challenge-1'])
      )
    })

    it('adds challenge ID to existing list', () => {
      // Mock existing challenges
      const existing = ['challenge-1']
      localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(existing))
      
      storage.addMyChallenge('challenge-2')
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'staysharp_my_challenges',
        JSON.stringify(['challenge-1', 'challenge-2'])
      )
    })

    it('does not add duplicate challenge ID', () => {
      const existing = ['challenge-1']
      localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(existing))
      
      storage.addMyChallenge('challenge-1')
      
      // Should not call setItem if already exists
      expect(localStorage.setItem).not.toHaveBeenCalled()
    })
  })

  describe('getQuizHistory', () => {
    it('returns empty array when no history', () => {
      expect(storage.getQuizHistory()).toEqual([])
    })

    it('returns quiz history array', () => {
      const history = [{ id: '1', topic: 'Math', xp: 100 }]
      localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(history))
      expect(storage.getQuizHistory()).toEqual(history)
    })
  })

  describe('setQuizHistory', () => {
    it('stores quiz history', () => {
      const history = [{ id: '1', topic: 'Science' }]
      storage.setQuizHistory(history)
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'staysharp_history',
        JSON.stringify(history)
      )
    })
  })

  describe('clearQuizHistory', () => {
    it('removes quiz history', () => {
      storage.clearQuizHistory()
      expect(localStorage.removeItem).toHaveBeenCalledWith('staysharp_history')
    })
  })
})
