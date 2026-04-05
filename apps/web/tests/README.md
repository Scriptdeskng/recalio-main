# Frontend Test Suite

## Overview
Comprehensive test coverage for critical Recallio frontend flows using Vitest and React Testing Library.

## Setup

Install dependencies:
```bash
npm install
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm test -- --watch
```

## Test Structure

### Unit Tests

#### `/lib/__tests__/storage.test.ts`
- Tests SSR-safe localStorage wrapper
- Validates player name storage
- Tests challenge ID management
- Verifies quiz history operations
- **Coverage**: All storage utility functions

#### `/hooks/__tests__/useQuizState.test.ts`
- Tests quiz state management
- Validates answer recording & XP calculation
- Tests question navigation
- Verifies quiz completion flow
- Tests retry and reset functionality
- **Coverage**: Complete quiz flow state machine

#### `/lib/api/__tests__/api-client.test.ts`
- Tests API client integration
- Validates quiz generation requests
- Tests challenge creation & retrieval
- Verifies error handling
- **Coverage**: All API endpoints

## Test Coverage Areas

### ✅ Covered
- Storage utilities (SSR-safe localStorage)
- Quiz state management hook
- API client (quizzes, challenges, sessions)
- XP calculation logic
- Answer validation
- Quiz progression flow

### 🔄 Recommended Additional Tests
- Component integration tests (SetupScreen, QuizScreen, etc.)
- Challenge timer hook tests
- Quiz history hook tests
- Error boundary tests
- Landing page component tests
- Challenge flow integration tests

## Mocking

### Global Mocks (vitest.setup.ts)
- `localStorage` - Fully mocked with vi.fn()
- `window.matchMedia` - Mocked for responsive hooks
- Automatic cleanup after each test

### API Mocking
Tests use `vi.fn()` to mock `fetch` calls, allowing:
- Response validation
- Error scenario testing
- Network failure simulation

##Writing New Tests

Example test structure:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'

describe('YourFeature', () => {
  beforeEach(() => {
    // Setup
  })

  it('should behave correctly', () => {
    // Arrange
    // Act
    // Assert
    expect(result).toBe(expected)
  })
})
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Automatically handled by vitest.setup.ts
3. **Descriptive names**: Use clear, behavior-focused test names
4. **Arrange-Act-Assert**: Follow AAA pattern
5. **Mock sparingly**: Only mock external dependencies

## CI/CD Integration

Add to your CI pipeline:
```yaml
- name: Run tests
  run: npm test -- --run

- name: Check coverage
  run: npm run test:coverage -- --run
```

## Troubleshooting

### Tests fail with "localStorage is not defined"
- Ensure vitest.setup.ts is properly configured
- Check that `setupFiles` is set in vitest.config.ts

### Import errors
- Verify path aliases in vitest.config.ts match tsconfig.json
- Ensure `@` alias points to project root

### Mock warnings
- Clear mocks between tests with `vi.clearAllMocks()`
- Reset modules if needed with `vi.resetModules()`
