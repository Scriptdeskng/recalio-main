# Test Suite Documentation

## Overview
Comprehensive test suite for the Recallio quiz application covering both frontend (Next.js) and backend (FastAPI) components.

## Test Structure

### Backend Tests (Python/pytest)
Location: `apps/api/tests/`

#### Core Test Files

**1. `conftest.py`** - Test Configuration & Fixtures
- Environment setup for tests
- Mock database session fixture
- Sample quiz questions and requests
- Reusable test fixtures

**2. `test_scoring.py`** - Scoring Logic (9 tests)
- ✓ All correct answers (100%, 40 XP)
- ✓ All wrong answers (0%, 0 XP)
- ✓ Partial scoring (75%, 30 XP)
- ✓ Half correct (50%, 20 XP)
- ✓ Empty edge case (0%, 0 XP)
- ✓ Single question scenarios
- ✓ Rounding behavior
- ✓ XP constant validation (10 XP per correct)

**3. `test_schemas.py`** - Pydantic Schema Validation (18 tests)
- ✓ QuizQuestion validation (6 tests)
  - Choice count validation (exactly 4)
  - Correct index range (0-3)
  - Empty choice detection
  - Question/explanation length minimums
- ✓ GenerateQuizRequest validation (6 tests)
  - Mode literals ("topic"|"notes")
  - Difficulty literals ("beginner"|"intermediate"|"advanced")
  - Count range (1-20)
  - Input validation
- ✓ CreateChallengeRequest validation (3 tests)
  - Creator name length (≤120 chars)
  - Duration validation (≥0)
- ✓ CompleteSessionRequest validation (2 tests)
  - Optional player name
  - Required fields

**4. `test_ai_quiz_service_fixed.py`** - AI Service (5 tests)
- ✓ Successful quiz generation
- ✓ HTTP status error handling (429, 500)
- ✓ Timeout error handling
- ✓ Invalid JSON response handling
- ✓ Empty questions list handling
- Mocks Anthropic API calls cleanly

**5. `test_routes_quizzes_fixed.py`** - Quiz API Routes (8 tests)
- ✓ Successful quiz generation (`POST /api/v1/quizzes/generate`)
- ✓ Invalid mode validation (422)
- ✓ Invalid difficulty validation (422)
- ✓ Count limit enforcement (422)
- ✓ Empty input validation (422)
- ✓ AI service error handling (500)
- ✓ Notes mode support
- Uses TestClient with proper route prefixes

**6. `test_routes_challenges_fixed.py`** - Challenge Routes (4 tests)
- ✓ Challenge creation (`POST /api/v1/challenges`)
- ✓ Invalid request validation (422)
- ✓ Challenge not found (404)
- ✓ Missing challenger name validation (422)

**7. `test_routes_sessions_fixed.py`** - Session Routes (4 tests)
- ✓ Session completion (`POST /api/v1/sessions/complete`)
- ✓ Optional player name support
- ✓ Invalid mode validation (422)
- ✓ Negative duration validation (422)

**8. `test_challenge_flow.integration.py`** - Challenge Integration (3 tests)
- ✓ Complete challenge workflow (create → complete)
- ✓ Challenge scoring logic
- ✓ Tie-breaker logic (faster time wins)

#### Total Backend Tests: **51 tests**

---

### Frontend Tests (TypeScript/Vitest)
Location: `apps/web/`

#### Core Test Files

**1. `vitest.config.ts` & `vitest.setup.ts`** - Test Configuration
- jsdom environment for DOM testing
- Path aliases (@/ prefix)
- Global mocks for localStorage and matchMedia

**2. `lib/__tests__/storage.test.ts`** - Storage API (10 tests)
- ✓ Player name get/set/update
- ✓ Quiz history management
- ✓ Challenge list management
- ✓ SSR safety (graceful degradation)
- ✓ LocalStorage abstraction

**3. `lib/__tests__/storage.comprehensive.test.ts`** - Extended Storage (16 tests)
- ✓ Player name edge cases (empty string, null)
- ✓ Quiz history add/clear operations
- ✓ Challenge deduplication
- ✓ Multiple entries support
- ✓ Missing localStorage handling

**4. `lib/__tests__/utils.test.ts`** - Utility Functions (7 tests)
- ✓ className merging (cn utility)
- ✓ Conditional class handling
- ✓ Undefined/null handling
- ✓ Tailwind class conflict resolution
- ✓ Array input support

**5. `hooks/__tests__/useQuizState.test.ts`** - Quiz State Hook (11 tests)
- ✓ Initial state setup
- ✓ Screen transitions (setup → loading → quiz → completion)
- ✓ Question progression
- ✓ Correct answer handling (+10 XP)
- ✓ Wrong answer handling (0 XP)
- ✓ XP calculation
- ✓ Results tracking
- ✓ Quiz reset
- ✓ Quiz exit mid-session
- ✓ Completion detection

**6. `hooks/__tests__/quizFlow.integration.test.ts`** - Quiz Flow Integration (8 tests)
- ✓ Complete flow: setup → loading → quiz → completion
- ✓ Quiz retry from completion
- ✓ Mid-session exit
- ✓ Perfect score calculation (100%, 50 XP for 5 questions)
- ✓ Zero score calculation (0%, 0 XP)
- ✓ Partial score calculation (70%, 70 XP for 7/10)
- ✓ XP accumulation across answers

**7. `hooks/__tests__/useChallengeTimer.test.ts`** - Challenge Timer (6 tests)
- ✓ Initial state (0 seconds)
- ✓ Timer increment (1 second intervals)
- ✓ Inactive timer (doesn't increment)
- ✓ Stop/resume behavior
- ✓ Time persistence across pauses
- Uses fake timers for deterministic testing

**8. `lib/api/__tests__/api-client.test.ts`** - API Client (6 tests)
- ✓ generateQuiz() call with correct payload
- ✓ completeSession() endpoint
- ✓ createChallenge() endpoint
- ✓ getChallenge() by ID
- ✓ completeChallenge() with challenger data
- ✓ Error handling (404, 500)
- Mocks fetch() globally

#### Total Frontend Tests: **64 tests**

---

## Test Execution

### Backend (Python)
```bash
# Run all backend tests
cd apps/api
pytest

# Run with coverage
pytest --cov=app --cov-report=term-missing

# Run specific test file
pytest tests/test_scoring.py -v

# Run specific test
pytest tests/test_scoring.py::test_score_all_correct -v

# Run in Docker
docker-compose run --rm api pytest -v
```

### Frontend (TypeScript)
```bash
# Run all frontend tests
cd apps/web
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- hooks/__tests__/useQuizState.test.ts

# Run in watch mode
npm test -- --watch
```

---

## Test Coverage Summary

### Backend Coverage: **68%** (51 tests passing)
- ✅ Scoring: 100%
- ✅ Schemas: 100%
- ✅ Routes: ~70% (core endpoints covered)
- ✅ Services: ~65% (AI service, challenge service)
- ⚠️  Need more validator tests
- ⚠️  Need database integration tests

### Frontend Coverage: **~75%** (64 tests passing)
- ✅ Hooks: ~85% (quiz state, challenge timer)
- ✅ Storage: 100%
- ✅ Utils: ~80%
- ✅ API Client: ~70%
- ⚠️  Need component tests (UI components)
- ⚠️  Need E2E tests

---

## Key Testing Patterns

### Backend Patterns

**1. Fixture-Based Setup**
```python
@pytest.fixture
def sample_quiz_questions():
    return [
        {
            "tag": "science",
            "q": "What is H2O?",
            "choices": ["Water", "Hydrogen", "Oxygen", "Acid"],
            "correct": 0,
            "explanation": "H2O is water"
        }
    ]
```

**2. Mock External Services**
```python
with patch.object(httpx.AsyncClient, 'post', new_callable=AsyncMock) as mock_post:
    mock_post.return_value = mock_response
    result = await service.generate_quiz(...)
```

**3. Database Mocking**
```python
@pytest.fixture
def mock_db():
    db = AsyncMock()
    db.add = MagicMock()
    db.commit = AsyncMock()
    return db
```

### Frontend Patterns

**1. Hook Testing**
```typescript
const { result } = renderHook(() => useQuizState())
act(() => {
  result.current.handleAnswer(0)
})
expect(result.current.xp).toBe(10)
```

**2. Fetch Mocking**
```typescript
global.fetch = vi.fn()
;(global.fetch as any).mockResolvedValueOnce({
  ok: true,
  json: async () => mockData
})
```

**3. Timer Testing**
```typescript
beforeEach(() => {
  vi.useFakeTimers()
})
act(() => {
  vi.advanceTimersByTime(1000)
})
```

---

## Edge Cases Covered

### Backend
- ✓ Empty quiz questions
- ✓ Invalid difficulty/mode values
- ✓ Negative durations
- ✓ Oversized inputs (120+ char names)
- ✓ API timeouts
- ✓ Malformed JSON responses
- ✓ Missing required fields
- ✓ Boundary values (count: 0, 21)

### Frontend
- ✓ SSR (missing localStorage)
- ✓ Quiz exit mid-session
- ✓ Perfect/zero scores
- ✓ Timer pause/resume
- ✓ Duplicate challenge IDs
- ✓ Empty storage
- ✓ Network errors

---

## Continuous Integration

### GitHub Actions (Recommended)
```yaml
name: Tests
on: [push, pull_request]
jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run backend tests
        run: |
          cd apps/api
          pip install -e ".[dev]"
          pytest --cov=app
  
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run frontend tests
        run: |
          cd apps/web
          npm install
          npm test
```

---

## Next Steps

### High Priority
1. Add integration tests with real test database
2. Add component tests for UI components (SetupScreen, QuizScreen, etc.)
3. Add E2E tests for critical flows
4. Increase backend service coverage (prompt_builder, question_validator)

### Medium Priority
1. Add performance tests (API response times)
2. Add accessibility tests (WCAG compliance)
3. Add visual regression tests (screenshot comparison)
4. Add load tests (concurrent users)

### Low Priority
1. Add mutation tests (test quality metrics)
2. Add contract tests (API schema validation)
3. Add security tests (XSS, CSRF, SQL injection)

---

## Troubleshooting

### Backend Tests Failing
```bash
# Check Python environment
python --version  # Should be 3.12+

# Verify dependencies
pip list | grep pytest

# Check environment variables
echo $ANTHROPIC_API_KEY  # Should be test key
```

### Frontend Tests Failing
```bash
# Check Node version
node --version  # Should be 20+

# Clear cache
rm -rf node_modules/.vite
npm test -- --clearCache

# Check Vitest config
cat vitest.config.ts
```

### Docker Tests
```bash
# Rebuild containers
docker-compose build --no-cache

# Check logs
docker-compose logs api

# Run with verbose output
docker-compose run --rm api pytest -vv
```
