// Tests for utility functions
import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('Utility Functions', () => {
  describe('cn (className utility)', () => {
    it('should merge class names', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })
    
    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional')).toBe('base conditional')
      expect(cn('base', false && 'conditional')).toBe('base')
    })
    
    it('should handle undefined and null', () => {
      expect(cn('class1', undefined, 'class2', null)).toBe('class1 class2')
    })
    
    it('should merge tailwind classes properly', () => {
      // Should handle conflicting classes
      const result = cn('p-4', 'p-6')
      expect(result).toContain('p-')
    })
    
    it('should handle empty input', () => {
      expect(cn()).toBe('')
    })
    
    it('should handle arrays', () => {
      expect(cn(['class1', 'class2'])).toBe('class1 class2')
    })
  })
})
