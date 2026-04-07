# StaySharp — Technical Specification (v3)

**Generated:** 2026-04-07
**Purpose:** Production handover document for CTO and development team

---

## 1. Product Overview

StaySharp is a mobile-first personalised learning service distributed as a paid VAS (Value Added Service) subscription product on MTN Nigeria, with an alternative direct payment channel via Paystack. Users enter any topic or paste their notes and receive AI-generated multiple-choice quizzes with explanations, XP tracking, challenge mode, and quiz history — all within a PWA capped at 420px max-width. Personal data (quiz history, challenges, player name) is stored in localStorage to avoid traditional account registration; subscription validity and session metering are managed server-side via Supabase database and Edge Functions. Quiz content is generated using the Anthropic API (model: `claude-haiku-4-5-20251001`).

**Core Value Proposition:** Turn any topic into a personalised quiz in seconds — learn faster, remember more, challenge friends.

**Distribution Model:**
- Primary: MTN Nigeria airtime billing via Forthsoft/DCBProtect
- Secondary: Card/bank payment via Paystack inline popup
- Top-up session packs: One-time Paystack purchases

**Tech Stack:**
- Frontend: React 18, TypeScript 5, Vite 5, Tailwind CSS v3, Framer Motion, shadcn/ui
- Backend: Supabase (PostgreSQL, Edge Functions, Realtime)
- AI: Anthropic Claude Haiku 4.5 (`claude-haiku-4-5-20251001`)
- Payments: Paystack (inline JS SDK), Forthsoft/DCBProtect (redirect)
- Libraries: date-fns, html-to-image, sonner (toast), input-otp, react-router-dom v6

---

## 2. Application Architecture

### 2.1 Route Structure

| Route | Component | Access Condition |
|---|---|---|
| `/` | `LandingPage` | Public |
| `/app` | `Index` | Subscription gated — requires `staysharp_sub` in sessionStorage with status `active` or `grace` |
| `/subscribe` | `SubscribePage` | Public |
| `/subscribe/success` | `SubscribeSuccessPage` | Public (typically redirected to after payment) |
| `/signin` | `SignInPage` | Public |
| `/challenge/:challengeId` | `ChallengePage` | Public (challenge link sharing) |
| `*` | `NotFound` | Catch-all 404 |

### 2.2 Component Tree

```
App
├── BrowserRouter
│   ├── / → LandingPage
│   │   ├── LandingNav
│   │   ├── HeroSection → HeroDemo
│   │   ├── HowItWorks
│   │   ├── FeaturesSection
│   │   ├── WhoItsFor
│   │   ├── CTASection
│   │   └── LandingFooter
│   ├── /app → Index
│   │   ├── SetupScreen
│   │   │   ├── MenuSheet
│   │   │   └── TopUpSheet
│   │   ├── LoadingScreen
│   │   ├── QuizScreen
│   │   │   ├── QuizHeader / ChallengeQuizHeader
│   │   │   ├── QuestionSession
│   │   │   │   ├── QuizCard
│   │   │   │   │   ├── AnswerChoices
│   │   │   │   │   ├── AutoAdvanceRing
│   │   │   │   │   └── ConfettiBurst
│   │   │   │   └── QuizFooter
│   │   │   └── AlertDialog (exit confirmation)
│   │   ├── CompletionScreen
│   │   ├── ChallengeCreatedScreen
│   │   ├── HistoryScreen
│   │   ├── MyChallengesScreen
│   │   ├── ProfileScreen
│   │   │   ├── SessionMeter
│   │   │   └── TopUpSheet
│   │   └── NameModal
│   ├── /subscribe → SubscribePage
│   ├── /subscribe/success → SubscribeSuccessPage
│   ├── /signin → SignInPage
│   ├── /challenge/:id → ChallengePage
│   │   ├── ChallengeLanding
│   │   ├── NameModal
│   │   ├── QuizScreen
│   │   ├── ChallengeResultScreen → ShareCard
│   │   └── Static screens (loading/expired/taken/own-link/not-found)
│   └── * → NotFound
├── Sonner (toast notifications)
└── TooltipProvider
```

### 2.3 State Management

| Type | Storage | Keys / Details |
|---|---|---|
| Quiz session state | React state (useQuizState hook) | screen, config, questions, currentIndex, results, xp |
| Quiz history | localStorage | `staysharp_history` — array of QuizHistoryEntry (max 50 entries) |
| Player name | localStorage | `staysharp_player_name` |
| My challenge IDs | localStorage | `staysharp_my_challenges` — array of challenge ID strings |
| Subscription session | sessionStorage | `staysharp_sub` — `{ status, msisdnHash, sku, sessionCredits? }` |
| Top-up email cache | sessionStorage | `staysharp_topup_email` |
| Storage migration | localStorage | One-time migration from `quizflash_*` keys to `staysharp_*` keys |

### 2.4 Supabase Tables

#### `subscribers`
| Column | Type | Nullable | Default | Purpose |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | Primary key |
| msisdn_hash | text | No | — | SHA-256 hash of phone number |
| msisdn_last4 | text | Yes | — | Last 4 digits (display only) |
| email | text | Yes | — | Subscriber email |
| channel | text | No | — | `"mtn"` or `"paystack"` |
| sku | text | No | — | `"daily"`, `"weekly"`, or `"monthly"` |
| status | text | No | `'active'` | `"active"`, `"grace"`, `"suspended"`, `"churned"` |
| paystack_customer_code | text | Yes | — | Paystack customer identifier |
| paystack_subscription_code | text | Yes | — | Paystack plan code |
| paystack_auth_code | text | Yes | — | Paystack authorization code |
| subscribed_at | timestamptz | Yes | now() | Subscription start date |
| churned_at | timestamptz | Yes | — | When subscription ended |
| grace_until | timestamptz | Yes | — | Grace period expiry |
| last_active | timestamptz | Yes | now() | Last activity timestamp |

**RLS:** Anon can INSERT. Service role has ALL access. No SELECT/UPDATE/DELETE for anon.

#### `otp_sessions`
| Column | Type | Nullable | Default | Purpose |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | Primary key |
| msisdn_hash | text | No | — | SHA-256 hash of phone number |
| code_hash | text | No | — | SHA-256 hash of OTP code |
| expires_at | timestamptz | No | — | OTP expiry (5 minutes from creation) |
| used | boolean | No | false | Whether OTP has been consumed |
| created_at | timestamptz | No | now() | Creation timestamp |

**RLS:** Anon can INSERT, SELECT, UPDATE. Service role has ALL access.

#### `session_allocations`
| Column | Type | Nullable | Default | Purpose |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | Primary key |
| subscriber_id | uuid | No | — | FK to subscribers.id |
| source | text | No | — | `"subscription"` or `"topup"` (validated by trigger) |
| sku | text | No | — | `"daily"`, `"weekly"`, `"monthly"`, `"pack_5"`, `"pack_15"`, `"pack_30"` (validated by trigger) |
| session_cap | integer | No | — | Maximum sessions in this allocation |
| sessions_used | integer | No | 0 | Sessions consumed |
| period_start | timestamptz | No | now() | Allocation start |
| period_end | timestamptz | No | — | Allocation expiry |
| paystack_ref | text | Yes | — | Paystack transaction reference (top-ups) |
| created_at | timestamptz | No | now() | Creation timestamp |

**RLS:** Service role only (ALL access). No anon access.

**Validation Triggers:**
- `validate_session_allocation_source`: Ensures source is `"subscription"` or `"topup"`
- `validate_session_allocation_sku`: Ensures sku is one of `daily`, `weekly`, `monthly`, `pack_5`, `pack_15`, `pack_30`

#### `session_logs`
| Column | Type | Nullable | Default | Purpose |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | Primary key |
| subscriber_id | uuid | No | — | FK to subscribers.id |
| allocation_id | uuid | No | — | FK to session_allocations.id |
| topic | text | Yes | — | Quiz topic |
| cache_hit | boolean | No | false | Whether quiz was served from cache |
| started_at | timestamptz | No | now() | Session start time |

**RLS:** Service role only (ALL access).

#### `challenges`
| Column | Type | Nullable | Default | Purpose |
|---|---|---|---|---|
| id | text | No | gen_random_uuid()::text | Primary key |
| topic | text | No | — | Quiz topic |
| difficulty | text | No | — | Difficulty level |
| question_count | integer | No | — | Number of questions |
| questions | jsonb | No | — | Full question array |
| creator_name | text | No | — | Creator's display name |
| creator_score | integer | No | — | Creator's score percentage |
| creator_time | integer | No | — | Creator's time in seconds |
| challenger_name | text | Yes | — | Challenger's display name |
| challenger_score | integer | Yes | — | Challenger's score percentage |
| challenger_time | integer | Yes | — | Challenger's time in seconds |
| created_at | timestamptz | Yes | now() | Creation timestamp |
| expires_at | timestamptz | Yes | now() + 7 days | Challenge expiry |

**RLS:** Anon can INSERT, SELECT, UPDATE. No DELETE.

### 2.5 Edge Functions

| Function | Trigger | Purpose | Returns |
|---|---|---|---|
| `generate-quiz` | Client POST | Generates AI quiz questions via Anthropic API. Validates session allocation if provided. Shuffles answer positions. | `{ questions: QuizQuestion[] }` |
| `send-otp` | Client POST | Generates OTP, hashes phone + code, stores in otp_sessions | `{ success, last4 }` |
| `verify-otp` | Client POST | Verifies OTP against otp_sessions, looks up subscriber | `{ success, subscriber, msisdn_hash }` |
| `check-session` | Client POST | Checks session allocation eligibility for a subscriber | `{ eligible, allocation_id, sessions_remaining, session_cap, ... }` |
| `consume-session` | Client POST | Decrements sessions_used on allocation, creates session_log | `{ success, sessions_remaining }` |
| `verify-paystack` | Client POST | Verifies Paystack transaction, creates subscriber record | `{ success }` |
| `purchase-topup` | Client POST | Verifies Paystack payment, creates session_allocation for top-up pack | `{ success, sessions_total, expires_at, allocation_id }` |
| `webhooks-forthsoft` | Forthsoft POST | Handles MTN subscription lifecycle events (renewal_success, renewal_failed, subscription_cancelled) | `{ ok }` |
| `webhooks-paystack` | Paystack POST | Handles Paystack webhook events (charge.success, invoice.payment_failed, subscription.disable). Verifies HMAC-SHA512 signature. | `{ ok }` |

### 2.6 Webhook Endpoints

#### Forthsoft Webhook (`/functions/v1/webhooks-forthsoft`)
**Expected Payload:**
```json
{
  "event": "renewal_success" | "renewal_failed" | "subscription_cancelled",
  "msisdn": "2348012345678"
}
```
**Note:** Signature validation is TODO (marked in code).

#### Paystack Webhook (`/functions/v1/webhooks-paystack`)
**Expected Payload:**
```json
{
  "event": "charge.success" | "invoice.payment_failed" | "subscription.disable",
  "data": {
    "customer": { "customer_code": "CUS_xxx" },
    ...
  }
}
```
**Signature:** Validated via `x-paystack-signature` header using HMAC-SHA512 with `PAYSTACK_SECRET_KEY`.

---

## 3. Authentication & Access Control

### 3.1 Authentication Method

Phone-based OTP sign-in. No Supabase Auth is used. The system:
1. User enters Nigerian phone number (format: `0[789]XXXXXXXXX`)
2. Server generates OTP (currently hardcoded `"0000"` for development), hashes phone and code with SHA-256
3. OTP session stored in `otp_sessions` table with 5-minute expiry
4. User enters 4-digit code
5. Server verifies code hash against stored session
6. On success, subscriber record is looked up by msisdn_hash
7. If subscriber exists with `active` or `grace` status, session info is stored in sessionStorage and user is redirected to `/app`

### 3.2 Access Gating Table

| Status | Screen Shown | Actions Available |
|---|---|---|
| `active` | Full app (`/app`) | All features, quizzes, challenges |
| `grace` | Full app with renewal banner: "Your subscription needs renewal. Renew now" | All features, quizzes, challenges |
| `suspended` | Redirected to `/subscribe`. Sign-in result shows: "Subscription paused" with "Renew subscription →" CTA | Can renew subscription |
| `churned` | Redirected to `/subscribe`. Sign-in result shows: "Subscription ended" with "Subscribe again →" CTA | Can re-subscribe |
| No record | Redirected to `/subscribe`. Sign-in result shows: "No subscription found" with "Subscribe now →" CTA | Can subscribe |
| No sessionStorage | Redirected to `/subscribe` on `/app` route mount | Must sign in or subscribe |

### 3.3 Session Management

- Subscription status stored in `sessionStorage` under key `staysharp_sub`
- Value: `{ status: string, msisdnHash: string, sku: string, sessionCredits?: SessionCredits }`
- Checked on every `/app` route mount via `useEffect`
- Session credits (remaining quiz sessions) fetched from `check-session` Edge Function on mount
- Session is browser-tab scoped (sessionStorage) — closing tab requires re-authentication

---

## 4. Subscription Flows

### 4.1 MTN Airtime Subscription (DCBProtect Redirect Flow)

1. **Entry:** User taps "Pay with airtime" on `/subscribe`
2. **Action:** `window.location.href = FORTHSOFT_CHECKOUT_URL` — full redirect to DCBProtect hosted checkout
3. **DCBProtect flow:** User confirms airtime billing on MTN's hosted page
4. **Return:** DCBProtect redirects back to a configured return URL (placeholder)
5. **Subscription creation:** Handled by Forthsoft webhook (`webhooks-forthsoft`) — not by client
6. **Session provisioning:** `renewal_success` webhook creates session_allocation

**Note:** The `FORTHSOFT_CHECKOUT_URL` is currently a placeholder: `http://checkout.mtn-ng.dcbprotect.com/v3/lp/mtn-ng/SERVICE_ID/SERVICE_SLUG`

### 4.2 Paystack Subscription (Inline Popup Flow)

1. **Entry:** User taps "Pay by card instead →" on `/subscribe`, which reveals the Paystack form
2. **SKU selection:** User picks Weekly (₦300/week) or Monthly (₦800/month)
3. **Input fields:**
   - Phone number: type=tel, placeholder="08012345678", no explicit validation on client
   - Email: type=email, placeholder="you@example.com"
4. **CTA:** `Pay ₦{price}/{period} →` — disabled when email or phone is empty, or loading
5. **Action:** Opens Paystack inline popup via `PaystackPop.setup()`
6. **On success callback:**
   - POST to `verify-paystack` Edge Function with `{ reference, phone, email, sku }`
   - Function verifies with Paystack API, hashes phone, creates subscriber record
   - Client redirects to `/subscribe/success?sku={sku}&channel=paystack`
7. **On close (popup dismissed):** Sets loading to false. No error shown.
8. **Error handling:** If verification fails, loading is set to false (no explicit error toast)

### 4.3 Sign In (Phone + OTP Flow)

1. **Entry:** User navigates to `/signin` (linked from subscribe page: "Already subscribed? Sign in →")
2. **Step 1 — Phone entry:**
   - Input: type=tel, placeholder="08012345678"
   - Validation: `^0[789]\d{9}$` — "Enter a valid Nigerian phone number"
   - CTA: "Send code →" — disabled when loading or phone empty
   - API: POST `send-otp` with `{ phone: cleaned }`
   - On success: advances to OTP step, sets 30s countdown
3. **Step 2 — OTP entry:**
   - 4-digit OTP input (InputOTP component, 4 slots)
   - Header: "We sent a code to •••{last4}"
   - CTA: "Verify →" — disabled when loading or < 4 digits
   - Resend: "Didn't get a code? Resend →" (shown after countdown reaches 0)
   - Countdown: "Resend in {n}s"
   - Error messages:
     - `"expired"` → "Code expired. Resend to get a new one."
     - Other → "That code isn't right. Try again."
   - API: POST `verify-otp` with `{ phone, code }`
4. **Step 3 — Result:**
   - `active`/`grace`: Store in sessionStorage, redirect to `/app`
   - `suspended`: ⚠️ "Subscription paused" — "Your subscription needs renewal to continue." — "Renew subscription →"
   - `churned`: 👋 "Subscription ended" — "Re-subscribe to pick up where you left off." — "Subscribe again →"
   - `not_found`: 🔍 "No subscription found" — "We couldn't find an active subscription for this number." — "Subscribe now →"
5. **Footer link:** "Don't have an account? Subscribe"

### 4.4 Subscription Success

1. **Entry:** Redirect from Paystack flow or MTN return URL to `/subscribe/success?sku={sku}&channel={channel}`
2. **Display:**
   - Animated checkmark (spring animation)
   - Heading: "You're in. Stay Sharp."
   - Sub-text: Based on SKU — "Daily plan activated", "Weekly plan activated", "Monthly plan activated", or fallback "Subscription activated"
   - Link: "Start learning now →"
3. **Auto-redirect:** 2-second countdown, then `navigate("/app")`

### 4.5 Session Top-Up Flow

1. **Entry:** "Add more sessions →" link on SetupScreen (when depleted) or ProfileScreen
2. **TopUpSheet (bottom sheet):**
   - Title: "Get more sessions"
   - Subtitle: "Session packs are one-time purchases — no recurring charge."
   - Email input: label "Email for receipt", placeholder "you@example.com"
   - Pack options:
     - 5 sessions — ₦150 — Valid 7 days
     - 15 sessions — ₦350 — Valid 30 days — Badge: "Most popular"
     - 30 sessions — ₦600 — Valid 60 days — Badge: "Best value"
   - CTA: "Pay ₦{price} →" (or "Select a pack" if none selected, or "Processing...")
   - Disabled when: no pack selected, no email, or loading
3. **Payment:** Paystack inline popup
4. **Verification:** POST to `purchase-topup` with `{ reference, msisdn_hash, pack_type }`
5. **Success toast:** "Session pack activated — {n} sessions added"
6. **Error toast:** "Purchase failed. Please try again."

---

## 5. Screen-by-Screen Specification

### 5.1 Landing Page (`/`)

**Purpose:** Marketing landing page to convert visitors into subscribers.

**Entry points:** Direct URL, links from app

**Exit points:** `/app` ("Get started →"), `/subscribe` ("Get started →" in CTA section), `#how-it-works` anchor

**Sections:**
1. **LandingNav** — Sticky nav with logo and CTA button
2. **HeroSection** — Headline: "Turn any topic into a quiz in seconds." — Sub: "Create personalised quizzes from any topic or your own notes. Learn faster, remember more, and challenge friends." — CTAs: "Get started →" (links to /app), "How it works" (anchor link)
3. **HowItWorks** — Step-by-step explanation
4. **FeaturesSection** — Feature cards
5. **WhoItsFor** — Target audience section
6. **CTASection** — Dynamic CTA based on session state:
   - Signed in: "Your account is ready. Jump back into your quizzes." — "Open App →"
   - Not signed in: "Available on MTN Nigeria. Plans from ₦100/day — begin quizzing in seconds. Cancel anytime." — "Get started →"
7. **LandingFooter**

**Design:** Dark theme (`bg-[#0b0d12]`, text `#e8eaed`), teal accent (`#2BD4BD`), `font-landing`

### 5.2 Setup Screen (`/app` — default state)

**Purpose:** Topic input and quiz configuration.

**Layout:**
- Top bar: Profile button (User icon, left), StaySharp logo (center), Menu button (hamburger, right)
- Header: "What are you studying today?"
  - First-time user sub: "Enter any topic or paste your notes — get fresh questions instantly and learn from explanations as you go."
  - Returning user sub: "Type a topic or paste your notes — we'll handle the rest."
- Textarea: placeholder "Enter a topic, question, or paste your notes…" — auto-resizes up to 200px
- Topic chips: 6 chips (max-w 140px with CSS truncation) — either recent topics (if ≥3 unique topics in history) or defaults (🔬 Science, 📜 History, 📐 Math, ✍️ English, 🗺️ Geography, 💻 Technology). Long labels are JS-truncated at 25 chars and CSS-capped at 140px to keep chips within 2 rows on narrow viewports.
- Difficulty selector: Beginner | Intermediate | Advanced — default: Intermediate
- Question count selector: 5 | 8 | 10 | 15 — default: 8
- Generate button:
  - Has sessions: "Start Quiz" — gradient-teal background
  - No sessions: "No sessions remaining" — disabled, opacity 40%
  - Below: "Add more sessions →" link (opens TopUpSheet)

**Validation:** Input must be ≥ 2 characters (trimmed). Button disabled if invalid or no sessions.

### 5.3 Loading Screen

**Purpose:** Animated loading state while AI generates quiz.

**Elements:**
- Pulsing orb with ⚡ emoji
- Heading: "Building your quiz…"
- Bouncing dots animation (3 dots)
- Step indicators (sequenced):
  1. 🧠 "Analysing your topic"
  2. ❓ "Generating questions"
  3. ✅ "Preparing answer keys"
  4. 🎮 "Getting ready to play"
- Steps advance every ~1 second, checkmark appears for completed steps
- When API returns (`isReady=true`), jumps to step 4

### 5.4 Quiz Screen

**Purpose:** Active quiz with question display and answer selection.

**Layout:**
- Header (solo mode): topic label + XP counter with float animation on correct
- Header (challenge mode): topic + target score to beat + live timer
- Progress: "Question {n} of {total}" with animated progress bar
- QuizCard: tag badge, question text, 4 answer choices
- On answer: correct = green highlight + confetti burst + explanation + auto-advance ring (5s)
- On wrong answer: red highlight + correct answer shown in green + explanation
- Footer: "Next" or "See Results" button (appears after answering)
- Exit dialog: "Leave quiz?" / "Your progress will be lost." — Cancel | Leave

**Auto-advance:** On correct answer, 5-second timer starts. Ring animation shows countdown. User can tap "Next" to advance early. Timer cancelled on manual advance.

### 5.5 Completion Screen

**Purpose:** Post-quiz results summary.

**Elements:**
- Tier emoji and title based on score:
  - 100%: 🏆 "Perfect Score!"
  - 80-99%: 🎉 "Excellent Work!"
  - 60-79%: 👍 "Good Job!"
  - 40-59%: 💪 "Keep Trying!"
  - 0-39%: 📚 "Study More!"
- Score text: "You scored {pct}% — {correct} of {total} correct"
- Stats cards: Correct ({n}/{total}), XP Earned ({xp}), Time ({m:ss}) — time only shown if available
- XP progress bar: "Score" label, "{xp}/{maxXp}" counter
- CTAs:
  1. "Try Again" — gradient-teal, retries same questions
  2. "🏆 Challenge a Friend" — bordered, creates challenge
  3. "Back to Home" — bordered, returns to setup

### 5.6 Challenge Created Screen

**Purpose:** Confirmation after creating a challenge, with sharing options.

**Elements:**
- 🔗 emoji
- Heading: "Challenge Created!"
- Sub: "Share the link below and see if your friend can beat your score."
- Challenge link in card: full URL displayed in mono font
- CTAs:
  1. "📋 Copy Link" / "✅ Copied!" — gradient-teal
  2. "📤 Share Challenge" (if Web Share API available) or "💬 Share on WhatsApp"
  3. "Back to Home"

**Share message format:** `I scored {score}% on {topic} — can you beat me? {url}`

### 5.7 Challenge Landing (`/challenge/:id`)

**Purpose:** Landing page when someone opens a challenge link.

**States:**
- **Loading:** "Loading challenge…"
- **Not found:** 🤷 "Challenge Not Found" — "This challenge doesn't exist or the link is invalid." — "Start Your Own Quiz"
- **Expired:** ⏰ "Challenge Expired" — "This challenge has expired. Start your own!" — "Start Your Own Quiz"
- **Taken:** 🔒 "Challenge Already Taken" — "Someone already completed this challenge. Start your own!" — "Start Your Own Quiz"
- **Own link (no result):** 👋 "This Is Your Challenge" — "Share it with a friend to see if they can beat your score!" — "📋 Copy Link" / "Back to Home"
- **Own link (has result):** Shows result — emoji (🤝/🏆/😤), title (Tie/Won/Lost), score comparison cards
- **Landing (accept):** 🏆 "You've Been Challenged!" — "{creator_name} scored {score}% on this quiz. Can you beat them?" — Topic/Difficulty/Questions cards — "Accept Challenge"
- **Name entry:** NameModal with title "Enter your name"
- **Quiz:** Standard QuizScreen with challenge header (target score + timer)
- **Result:** ChallengeResultScreen

### 5.8 Challenge Result Screen

**Purpose:** Shows win/loss/tie outcome after completing a challenge.

**Outcome determination:**
```
if challengerScore > creatorScore → "win"
if challengerScore < creatorScore → "loss"
if scores equal AND challengerTime < creatorTime → "win"
if scores equal AND challengerTime > creatorTime → "loss"
if scores equal AND times equal → "tie"
```

**Display:**
- Win: 🏆 "You Win!" — "You beat {creator_name}!" — Confetti burst
- Loss: 😤 "So Close!" — "{creator_name} keeps the crown."
- Tie: 🤝 "It's a Tie!" — "Perfectly matched!"
- Score comparison cards: Creator vs You (name, score%, time)
- CTAs: "🔄 Rematch", "📸 Share Result" (generates PNG via html-to-image), "Back to Home"

### 5.9 History Screen

**Purpose:** View all past quiz attempts.

**Elements:**
- Header: "Quiz History" with back button
- Stats banner (if quizzes > 0): Quizzes count, Total XP, Avg Score
- Empty state: 📝 "No quizzes yet" — "Complete a quiz to see your history here." — "Start a Quiz" button
- History list: Each entry shows tier emoji, topic, difficulty badge, XP, date, percentage, correct/total
- "Clear History" button with confirmation dialog: "Clear all history?" / "This can't be undone." — Cancel | Clear

### 5.10 My Challenges Screen

**Purpose:** View created and completed challenges.

**Elements:**
- Header: "My Challenges" with back button
- Loading: Spinner
- Empty state: ⚔️ "No challenges yet" — "Complete a quiz and tap 'Challenge a Friend' to get started." — "Start a Quiz"
- Sections:
  - **Pending:** Topic, difficulty, question count, creator score, relative time, "Waiting" badge, "Copy Link" button
  - **Completed:** Topic, difficulty, question count, relative time, Win/Lost/Tie badge, score comparison (You vs opponent)

**Realtime:** Subscribes to `postgres_changes` on `challenges` table for UPDATE events matching user's challenge IDs.

### 5.11 Profile Screen

**Purpose:** User profile, stats, session management.

**Elements:**
- Header: "Profile" with back button
- Avatar: 👤 emoji in gradient circle + level badge ("Lvl {n}")
- Name: Editable inline (pencil icon) — stored in `staysharp_player_name`
- XP progress bar to next level (10 levels defined)
- Empty state: 📚 "Complete your first quiz to see your stats!" — "Start a Quiz"
- Session Meter: Progress bar showing sessions remaining/cap + "Add more sessions →"
- Stats row: Quizzes count, Best Score %, Avg Score %
- Best Quiz card: Trophy icon, "Best Quiz" label, topic name, difficulty badge, percentage
  - **Weighted scoring:** `percentage × difficultyMultiplier × questionCountMultiplier`
  - Multipliers: beginner=1.0, intermediate=1.15, advanced=1.3
  - Question bonus: `1 + (totalQuestions - 5) × 0.02`
- Top Topics: "Most Played" — clickable topic chips that pre-fill setup input

**XP Levels:**
| Level | XP Range |
|---|---|
| 1 | 0–99 |
| 2 | 100–249 |
| 3 | 250–499 |
| 4 | 500–899 |
| 5 | 900–1,499 |
| 6 | 1,500–2,499 |
| 7 | 2,500–3,999 |
| 8 | 4,000–5,999 |
| 9 | 6,000–8,999 |
| 10 | 9,000+ |

### 5.12 Subscribe Page (`/subscribe`)

**Purpose:** Subscription purchase with dual payment channels.

**Layout:**
- Nav: Logo only
- Heading: "Unlock full access"
- Sub: "Plans from ₦100/day — billed to your airtime, cancel anytime"
- Feature highlights (3 cards):
  1. 🧠 "Questions built around your topic" — "Every session matches what you're actually studying."
  2. 💡 "Learn from every wrong answer" — "Clear explanations so you understand, not just memorise."
  3. 🏆 "Challenge friends and track progress" — "Share quizzes, compare scores, earn XP."
- **MTN state (default):**
  - "Pay with airtime →" button + "For MTN subscribers only" sub-label
  - "Pay by card instead →" link
  - "Already subscribed? Sign in →" link
- **Paystack state:**
  - "← Back" link
  - SKU selector (2 cards):
    - Weekly: ₦300/week
    - Monthly: ₦800/month — Badge: "Best value"
  - Phone input: label "Your phone number", helper "We'll use this to send a verification code when you sign in"
  - Email input: label "Your email", helper "For your subscription confirmation"
  - CTA: "Pay ₦{price}/{period} →" or "Processing..."
  - "Already subscribed? Sign in →" link

### 5.13 Sign In Page (`/signin`)

See Section 4.3 for full flow.

### 5.14 404 Not Found

- "404" heading
- "Oops! Page not found"
- "Return to Home" link

---

## 6. Copy Library

| Screen | Element | Copy |
|---|---|---|
| **Setup** | Header | "What are you studying today?" |
| **Setup** | Sub (first time) | "Enter any topic or paste your notes — get fresh questions instantly and learn from explanations as you go." |
| **Setup** | Sub (returning) | "Type a topic or paste your notes — we'll handle the rest." |
| **Setup** | Textarea placeholder | "Enter a topic, question, or paste your notes…" |
| **Setup** | Button (active) | "Start Quiz" |
| **Setup** | Button (depleted) | "No sessions remaining" |
| **Setup** | Top-up link | "Add more sessions →" |
| **Loading** | Heading | "Building your quiz…" |
| **Loading** | Step 1 | "🧠 Analysing your topic" |
| **Loading** | Step 2 | "❓ Generating questions" |
| **Loading** | Step 3 | "✅ Preparing answer keys" |
| **Loading** | Step 4 | "🎮 Getting ready to play" |
| **Quiz** | Progress | "Question {n} of {total}" |
| **Quiz** | Exit dialog title | "Leave quiz?" |
| **Quiz** | Exit dialog desc | "Your progress will be lost." |
| **Completion** | Score text | "You scored {pct}% — {correct} of {total} correct" |
| **Completion** | Tier 100% | 🏆 "Perfect Score!" |
| **Completion** | Tier 80% | 🎉 "Excellent Work!" |
| **Completion** | Tier 60% | 👍 "Good Job!" |
| **Completion** | Tier 40% | 💪 "Keep Trying!" |
| **Completion** | Tier 0% | 📚 "Study More!" |
| **Completion** | Retry | "Try Again" |
| **Completion** | Challenge | "🏆 Challenge a Friend" |
| **Completion** | Home | "Back to Home" |
| **Challenge Created** | Heading | "Challenge Created!" |
| **Challenge Created** | Sub | "Share the link below and see if your friend can beat your score." |
| **Challenge Created** | Copy button | "📋 Copy Link" / "✅ Copied!" |
| **Challenge Created** | Share | "📤 Share Challenge" |
| **Challenge Created** | WhatsApp | "💬 Share on WhatsApp" |
| **Challenge Landing** | Heading | "You've Been Challenged!" |
| **Challenge Landing** | Sub | "{name} scored {score}% on this quiz. Can you beat them?" |
| **Challenge Landing** | CTA | "Accept Challenge" |
| **Challenge Result** | Win | 🏆 "You Win!" — "You beat {name}!" |
| **Challenge Result** | Loss | 😤 "So Close!" — "{name} keeps the crown." |
| **Challenge Result** | Tie | 🤝 "It's a Tie!" — "Perfectly matched!" |
| **Challenge Result** | Rematch | "🔄 Rematch" |
| **Challenge Result** | Share | "📸 Share Result" / "Generating…" |
| **Challenge** | Not found heading | "Challenge Not Found" |
| **Challenge** | Not found sub | "This challenge doesn't exist or the link is invalid." |
| **Challenge** | Expired heading | "Challenge Expired" |
| **Challenge** | Expired sub | "This challenge has expired. Start your own!" |
| **Challenge** | Taken heading | "Challenge Already Taken" |
| **Challenge** | Taken sub | "Someone already completed this challenge. Start your own!" |
| **Challenge** | Own link heading | "This Is Your Challenge" |
| **Challenge** | Own link sub | "Share it with a friend to see if they can beat your score!" |
| **Challenge** | Own result win | "You Won!" |
| **Challenge** | Own result loss | "You Lost!" |
| **Challenge** | Own result tie | "It's a Tie!" |
| **History** | Title | "Quiz History" |
| **History** | Empty heading | "No quizzes yet" |
| **History** | Empty sub | "Complete a quiz to see your history here." |
| **History** | Clear button | "Clear History" |
| **History** | Clear dialog title | "Clear all history?" |
| **History** | Clear dialog desc | "This can't be undone." |
| **My Challenges** | Title | "My Challenges" |
| **My Challenges** | Empty heading | "No challenges yet" |
| **My Challenges** | Empty sub | "Complete a quiz and tap 'Challenge a Friend' to get started." |
| **My Challenges** | Pending badge | "Waiting" |
| **My Challenges** | Won badge | "Won" |
| **My Challenges** | Lost badge | "Lost" |
| **My Challenges** | Tie badge | "Tie" |
| **Profile** | Title | "Profile" |
| **Profile** | Name placeholder | "Set your name" |
| **Profile** | Empty state | "Complete your first quiz to see your stats!" |
| **Profile** | XP to next | "{n} XP to next level" |
| **Profile** | Max level | "Max level!" |
| **Profile** | Best quiz label | "Best Quiz" |
| **Profile** | Most played label | "Most Played" |
| **Profile** | No sessions | "No sessions remaining" / "Add more sessions →" |
| **Subscribe** | Heading | "Unlock full access" |
| **Subscribe** | Sub | "Plans from ₦100/day — billed to your airtime, cancel anytime" |
| **Subscribe** | MTN button | "Pay with airtime" + "For MTN subscribers only" |
| **Subscribe** | Card link | "Pay by card instead →" |
| **Subscribe** | Sign in link | "Already subscribed? Sign in →" |
| **Subscribe** | SKU heading | "Choose your plan" |
| **Subscribe** | Weekly badge | (none) |
| **Subscribe** | Monthly badge | "Best value" |
| **Subscribe** | Phone label | "Your phone number" |
| **Subscribe** | Phone helper | "We'll use this to send a verification code when you sign in" |
| **Subscribe** | Email label | "Your email" |
| **Subscribe** | Email helper | "For your subscription confirmation" |
| **Subscribe** | Pay button | "Pay ₦{price}/{period} →" / "Processing..." |
| **Success** | Heading | "You're in. Stay Sharp." |
| **Success** | Daily | "Daily plan activated" |
| **Success** | Weekly | "Weekly plan activated" |
| **Success** | Monthly | "Monthly plan activated" |
| **Success** | Fallback | "Subscription activated" |
| **Success** | Link | "Start learning now →" |
| **Sign In** | Heading (phone) | "Welcome back" |
| **Sign In** | Sub (phone) | "Enter your number to access your account" |
| **Sign In** | Phone label | "Phone number" |
| **Sign In** | Phone placeholder | "08012345678" |
| **Sign In** | Send CTA | "Send code →" |
| **Sign In** | Heading (OTP) | "Enter your code" |
| **Sign In** | OTP sub | "We sent a code to •••{last4}" |
| **Sign In** | Verify CTA | "Verify →" |
| **Sign In** | Resend countdown | "Resend in {n}s" |
| **Sign In** | Resend link | "Didn't get a code? Resend →" |
| **Sign In** | Footer | "Don't have an account? Subscribe" |
| **Sign In** | Suspended heading | "Subscription paused" |
| **Sign In** | Suspended sub | "Your subscription needs renewal to continue." |
| **Sign In** | Suspended CTA | "Renew subscription →" |
| **Sign In** | Churned heading | "Subscription ended" |
| **Sign In** | Churned sub | "Re-subscribe to pick up where you left off." |
| **Sign In** | Churned CTA | "Subscribe again →" |
| **Sign In** | Not found heading | "No subscription found" |
| **Sign In** | Not found sub | "We couldn't find an active subscription for this number." |
| **Sign In** | Not found CTA | "Subscribe now →" |
| **Grace Banner** | Text | "Your subscription needs renewal. Renew now" |
| **Top-Up Sheet** | Title | "Get more sessions" |
| **Top-Up Sheet** | Sub | "Session packs are one-time purchases — no recurring charge." |
| **Top-Up Sheet** | Email label | "Email for receipt" |
| **Top-Up Sheet** | Pack 5 badge | (none) |
| **Top-Up Sheet** | Pack 15 badge | "Most popular" |
| **Top-Up Sheet** | Pack 30 badge | "Best value" |
| **Top-Up Sheet** | CTA default | "Select a pack" |
| **Top-Up Sheet** | CTA loading | "Processing..." |
| **Top-Up Sheet** | CTA active | "Pay ₦{price} →" |
| **Top-Up Sheet** | Success toast | "Session pack activated — {n} sessions added" |
| **Top-Up Sheet** | Error toast | "Purchase failed. Please try again." |
| **Session Meter** | Label | "Sessions" |
| **Session Meter** | Count | "{n} left" |
| **Session Meter** | Link | "Add more sessions →" |
| **Menu** | Title | "Menu" |
| **Menu** | Item 1 | "My Challenges" |
| **Menu** | Item 2 | "History" |
| **Menu** | Item 3 | "Profile" |
| **Toast** | Quiz gen fail | "Failed to generate quiz. Please try again." |
| **Toast** | Session limit | "No sessions remaining. Get more sessions to continue." |
| **Toast** | Challenge fail | "Failed to create challenge. Please try again." |
| **Toast** | Rematch fail | "Failed to create rematch." |
| **Toast** | Link copied | "Link copied!" |
| **Toast** | Copy fail | "Failed to copy link" |
| **404** | Heading | "404" |
| **404** | Sub | "Oops! Page not found" |
| **404** | Link | "Return to Home" |
| **Landing Hero** | Heading | "Turn any topic into a quiz in seconds." |
| **Landing Hero** | Sub | "Create personalised quizzes from any topic or your own notes. Learn faster, remember more, and challenge friends." |
| **Landing Hero** | CTA 1 | "Get started →" |
| **Landing Hero** | CTA 2 | "How it works" |
| **Landing CTA** | Heading | "Ready to start with StaySharp?" |
| **Landing CTA** | Sub (signed out) | "Available on MTN Nigeria. Plans from ₦100/day — begin quizzing in seconds. Cancel anytime." |
| **Landing CTA** | Sub (signed in) | "Your account is ready. Jump back into your quizzes." |
| **Landing CTA** | CTA (signed out) | "Get started →" |
| **Landing CTA** | CTA (signed in) | "Open App →" |
| **Name Modal** | Solo title | "What's your name?" |
| **Name Modal** | Challenge title | "Enter your name" |

---

## 7. Error & Edge Case Handling

| Error | Trigger Condition | Message Shown | User Action | System Action |
|---|---|---|---|---|
| Invalid phone (sign-in) | Phone doesn't match `^0[789]\d{9}$` | "Enter a valid Nigerian phone number" | Fix input | — |
| OTP too short | OTP < 4 digits | "Enter the 4-digit code" | Enter full code | — |
| OTP expired | `verify-otp` returns `error: "expired"` | "Code expired. Resend to get a new one." | Tap resend | — |
| OTP wrong | `verify-otp` returns other error | "That code isn't right. Try again." | Re-enter code | — |
| Send OTP fail | Network error or function error | `err.message` or "Something went wrong" | Retry | — |
| Verify fail | Network error | `err.message` or "Verification failed" | Retry | — |
| No subscriber | `verify-otp` returns no subscriber | "No subscription found" screen | Subscribe | — |
| Quiz gen fail | `generate-quiz` throws | "Failed to generate quiz. Please try again." | Return to setup | Reset to setup screen |
| Session limit | Error contains "session_limit_reached" | "No sessions remaining. Get more sessions to continue." | Buy top-up | Reset to setup screen |
| Challenge create fail | Supabase insert error | "Failed to create challenge. Please try again." | Retry | — |
| Rematch fail | Supabase insert error | "Failed to create rematch." | — | — |
| Copy link fail | Clipboard API error | "Failed to copy link" | — | — |
| Paystack popup close | User closes popup | No message | Retry | Sets loading=false |
| Top-up purchase fail | Verification fails | "Purchase failed. Please try again." | Retry | Sets loading=false |
| Paystack verification fail | `verify-paystack` returns !success | No explicit message (sets loading=false) | Retry | — |
| No ANTHROPIC_API_KEY | Key not set in env | 500 error (server-side) | — | Logs error |
| No PAYSTACK_SECRET_KEY | Key not set in env | "Payment verification unavailable" (server-side) | — | Logs error |
| Invalid webhook signature | Paystack signature mismatch | 401 "Invalid signature" (server-side) | — | Logs warning |
| Missing webhook fields | Event or msisdn missing | 400 error (server-side) | — | — |
| Allocation expired | period_end passed | 403 "Allocation expired" (server-side) | — | — |
| Allocation exhausted | sessions_used >= session_cap | 403 "Allocation exhausted" (server-side) | — | — |

---

## 8. External Integrations

### 8.1 Forthsoft / DCBProtect (MTN Subscription)

- **Purpose:** MTN Nigeria airtime billing for subscription
- **Authentication:** Shared secret for webhook signature validation (TODO — not yet implemented)
- **Checkout URL:** `FORTHSOFT_CHECKOUT_URL` — redirect to hosted checkout page
- **Return URL:** Configured in Forthsoft dashboard (placeholder)
- **Webhook events:**
  - `renewal_success` → Set status=active, provision session allocation
  - `renewal_failed` → Set status=grace, grace_until=now+24h
  - `subscription_cancelled` → Set status=churned, churned_at=now
- **Error handling:** Unknown events are logged and skipped. DB errors return 500.
- **Test vs prod:** Checkout URL uses placeholder SERVICE_ID and SERVICE_SLUG

### 8.2 Paystack (Card/Bank Payments)

- **Purpose:** Card/bank subscription payments + one-time top-up purchases
- **Authentication:** `PAYSTACK_SECRET_KEY` (server-side), `PAYSTACK_PUBLIC_KEY` (client-side)
- **Client SDK:** `https://js.paystack.co/v1/inline.js` loaded dynamically
- **Endpoints used:**
  - `GET https://api.paystack.co/transaction/verify/{reference}` — verify transaction
- **Webhook events:**
  - `charge.success` → Set status=active, provision session allocation
  - `invoice.payment_failed` → Set status=grace, grace_until=now+24h
  - `subscription.disable` → Set status=churned, churned_at=now
- **Signature verification:** HMAC-SHA512 using `PAYSTACK_SECRET_KEY` against raw body, compared to `x-paystack-signature` header
- **Error handling:** Invalid signatures return 401. Missing customer_code events are skipped.
- **Test vs prod:** Public key and plan codes are placeholders

### 8.3 Anthropic (AI Quiz Generation)

- **Purpose:** Generate multiple-choice quiz questions
- **Authentication:** `ANTHROPIC_API_KEY` header (`x-api-key`)
- **Model:** `claude-haiku-4-5-20251001`
- **Endpoint:** `POST https://api.anthropic.com/v1/messages`
- **Payload:**
  ```json
  {
    "model": "claude-haiku-4-5-20251001",
    "max_tokens": 4000,
    "messages": [{ "role": "user", "content": "<prompt>" }]
  }
  ```
- **Prompt template:** Requests {count} {difficulty} MCQs about topic or from notes. Requires JSON array output with tag, q, choices (4), correct (0-3), explanation.
- **Post-processing:** Choices are shuffled (Fisher-Yates) to eliminate LLM position bias. Correct index is updated accordingly.
- **Error handling:** Non-200 responses return 502. Parse failures return 500 with raw text excerpt.

### 8.4 SMS Provider (OTP Delivery — Not Yet Integrated)

- **Purpose:** Send OTP codes to user phone numbers
- **Current state:** STUB — OTP code is hardcoded as `"0000"` and logged to console instead of sent via SMS
- **Expected provider:** Termii or Twilio (not yet decided)
- **Required:** API key, sender ID configuration
- **Integration point:** `supabase/functions/send-otp/index.ts` line 27

---

## 9. Environment Variables

| Variable | Purpose | Where to Obtain | Required For |
|---|---|---|---|
| `SUPABASE_URL` | Supabase project URL | Auto-configured by Lovable Cloud | All Edge Functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Auto-configured by Lovable Cloud | All Edge Functions |
| `SUPABASE_ANON_KEY` | Supabase anon key | Auto-configured by Lovable Cloud | Client SDK |
| `VITE_SUPABASE_URL` | Supabase URL (client) | Auto-configured | Client |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key (client) | Auto-configured | Client |
| `VITE_SUPABASE_PROJECT_ID` | Project ref ID | Auto-configured | Client (Edge Function URLs) |
| `ANTHROPIC_API_KEY` | Anthropic API key | Anthropic console | generate-quiz Edge Function |
| `PAYSTACK_SECRET_KEY` | Paystack secret key | Paystack dashboard | verify-paystack, purchase-topup, webhooks-paystack |
| `LOVABLE_API_KEY` | Lovable platform key | Auto-configured | Internal |

**Client-side constants (in `src/lib/constants.ts`):**

| Constant | Current Value | Purpose |
|---|---|---|
| `FORTHSOFT_CHECKOUT_URL` | `http://checkout.mtn-ng.dcbprotect.com/v3/lp/mtn-ng/SERVICE_ID/SERVICE_SLUG` | MTN checkout redirect |
| `PAYSTACK_PUBLIC_KEY` | `pk_live_PLACEHOLDER` | Paystack client key |
| `PAYSTACK_WEEKLY_PLAN_CODE` | `PLN_WEEKLY_PLACEHOLDER` | Paystack weekly plan |
| `PAYSTACK_MONTHLY_PLAN_CODE` | `PLN_MONTHLY_PLACEHOLDER` | Paystack monthly plan |

---

## 10. Business Logic & Rules

1. **Daily SKU is MTN-only** — daily billing (₦100/day) is only available via MTN airtime. Paystack offers weekly (₦300) and monthly (₦800) only.
2. **Grace period is 24 hours** — on renewal failure, subscriber gets 24 hours of continued access (`grace_until = now + 24h`).
3. **OTP expires after 5 minutes** — `expires_at = now + 5 minutes`.
4. **OTP resend cooldown is 30 seconds** — countdown timer prevents rapid resend.
5. **OTP is currently hardcoded** — code is always `"0000"` for development. Logged to console, not sent via SMS.
6. **Paystack popup dismissal is silent** — no error shown when user closes Paystack popup.
7. **Phone number stored as SHA-256 hash** — plaintext phone never stored in database.
8. **Subscriber status checked on every /app mount** — reads from sessionStorage; redirects to /subscribe if missing or invalid.
9. **Session state held in sessionStorage** — tab-scoped, not persisted across browser sessions.
10. **Quiz history stored in localStorage** — persists across sessions, max 50 entries (FIFO).
11. **Quiz history is device-local** — not synced to server. Different devices = different history.
12. **Challenge IDs stored in localStorage** — `staysharp_my_challenges` array tracks which challenges belong to the user.
13. **Challenge expires after 7 days** — `expires_at = now() + '7 days'` default.
14. **Challenge is one-time** — once `challenger_name` is set, the challenge is "taken".
15. **Own-link detection** — if challenge ID is in user's `staysharp_my_challenges`, they see the "own link" state.
16. **Input validation** — topic input must be ≥ 2 characters (trimmed) to enable quiz generation.
17. **Long-form detection** — inputs > 100 characters are sent as "notes" mode; shorter as "topic" mode.
18. **Topic truncation** — topics longer than 40 characters are truncated to 37 + "…" for display and storage.
19. **Chip width constraint** — topic chip buttons are CSS-capped at 140px (`max-w-[140px] truncate`) to prevent overflow to a third row on 390px viewports. JS also truncates labels at 25 characters as a secondary safeguard.
19. **Answer shuffle** — AI-generated answer choices are Fisher-Yates shuffled server-side to eliminate position bias.
21. **Auto-advance on correct** — 5-second timer with visual ring animation. Cancelled if user taps Next manually.
22. **Session allocation FIFO** — when multiple allocations exist, the first-to-expire is consumed first.
23. **Session credits aggregated** — total remaining and cap are summed across all active (unexpired, not exhausted) allocations.
24. **Session consumption is two-step** — generate-quiz validates allocation, then consume-session decrements after successful generation.
25. **Session credits re-fetched on setup return** — navigating back to the setup screen triggers a fresh `check-session` call, ensuring the UI always reflects the latest allocation state from the backend.
26. **Eligible flag updated locally after consumption** — when `consume-session` returns `sessions_remaining: 0`, the client immediately sets `eligible: false` on the local `sessionCredits` state for instant UI feedback without waiting for re-fetch.
27. **Last-session top-up nudge** — when `sessionsRemaining === 1`, the CompletionScreen displays an amber banner prompting the user to top up, and the SetupScreen shows a subtle "Last session — top up for more →" hint below the Start Quiz button. When `sessionsRemaining === 0`, the CompletionScreen shows a stronger "No sessions remaining" card with a top-up CTA. Both surfaces open the `TopUpSheet` component inline.
28. **Recent topics replace default chips** — if user has ≥3 unique topics in history, recent topics (by frequency) replace the default chip suggestions.
29. **Top topics are frequency-ranked** — top 5 most-played topics shown in Profile.
30. **Best Quiz uses weighted scoring** — `percentage × difficultyMultiplier × (1 + (totalQuestions - 5) × 0.02)` — harder and longer quizzes rank higher.
31. **XP is 10 per correct answer** — `XP_PER_CORRECT = 10`.
32. **Storage migration** — one-time migration from `quizflash_*` localStorage keys to `staysharp_*` keys (brand rename).
33. **Session allocation caps by SKU:**
    - Daily: 5 sessions, expires end of day (Lagos timezone)
    - Weekly: 20 sessions, expires in 7 days
    - Monthly: 60 sessions, expires in 30 days
    - pack_5: 5 sessions, expires in 7 days
    - pack_15: 15 sessions, expires in 30 days
    - pack_30: 30 sessions, expires in 60 days
34. **Paystack verification can be skipped** — in `purchase-topup`, if `PAYSTACK_SECRET_KEY` equals the placeholder value, verification is bypassed (development mode).
35. **Landing page CTA is context-aware** — checks sessionStorage for active session to show "Open App" vs "Get started".
36. **Player name persists in localStorage** — survives browser sessions, used for challenges.
37. **Rematch creates a new challenge** — uses the challenger's score as the new creator's score.
38. **Share card rendered off-screen** — ShareCard component is positioned at `-left-[9999px]`, rendered to PNG via `html-to-image` on demand.

---

## 11. Gamification & Scoring Logic

### 11.1 XP Calculation
- **10 XP per correct answer** (`XP_PER_CORRECT = 10`)
- No multipliers or bonuses — flat rate
- Total possible XP per quiz = `totalQuestions × 10`

### 11.2 Score Calculation
- `percentage = Math.round((correctAnswers / totalQuestions) × 100)`
- Stored in quiz history as integer percentage

### 11.3 Weighted Best Quiz Score
```
weightedScore = percentage × difficultyMultiplier × questionCountMultiplier

difficultyMultiplier:
  beginner     = 1.0
  intermediate = 1.15
  advanced     = 1.3

questionCountMultiplier = 1 + (totalQuestions - 5) × 0.02
  5 questions  = 1.0
  8 questions  = 1.06
  10 questions = 1.10
  15 questions = 1.20
```

Example: 90% on 10 Advanced questions = 90 × 1.3 × 1.10 = **128.7** (beats 100% on 5 Beginner = 100 × 1.0 × 1.0 = **100**)

### 11.4 Challenge Mode Winner Determination
```
if challengerScore > creatorScore → challenger wins
if challengerScore < creatorScore → creator wins
if scores equal:
  if challengerTime < creatorTime → challenger wins (faster)
  if challengerTime > creatorTime → creator wins
  if times equal → tie
```

### 11.5 Completion Tiers
| Min % | Emoji | Title |
|---|---|---|
| 100 | 🏆 | Perfect Score! |
| 80 | 🎉 | Excellent Work! |
| 60 | 👍 | Good Job! |
| 40 | 💪 | Keep Trying! |
| 0 | 📚 | Study More! |

### 11.6 Quiz History Storage
Per entry:
- `id`: UUID (crypto.randomUUID())
- `topic`: string (truncated to 40 chars)
- `difficulty`: "beginner" | "intermediate" | "advanced"
- `totalQuestions`: number
- `correctAnswers`: number
- `xp`: number
- `percentage`: number (0-100)
- `completedAt`: ISO timestamp

Max 50 entries, FIFO. Stored in localStorage key `staysharp_history`.

### 11.7 Progress Dots / Quiz Progress
- Progress bar: `((currentIndex + (answered ? 1 : 0)) / totalQuestions) × 100%`
- Text: "Question {currentIndex + 1} of {totalQuestions}"

### 11.8 XP Level System
10 levels with progressive XP thresholds (see Section 5.11). Level progress = `(xp - levelMin) / (levelMax - levelMin + 1) × 100%`.

---

## 12. Known Placeholders

| Placeholder | Location | What Replaces It | Who Provides It |
|---|---|---|---|
| `SERVICE_ID` in FORTHSOFT_CHECKOUT_URL | `src/lib/constants.ts` | Actual DCBProtect service ID | Forthsoft |
| `SERVICE_SLUG` in FORTHSOFT_CHECKOUT_URL | `src/lib/constants.ts` | Actual DCBProtect service slug | Forthsoft |
| `pk_live_PLACEHOLDER` | `src/lib/constants.ts` (PAYSTACK_PUBLIC_KEY) | Live Paystack public key | Paystack dashboard |
| `PLN_WEEKLY_PLACEHOLDER` | `src/lib/constants.ts` (PAYSTACK_WEEKLY_PLAN_CODE) | Paystack weekly plan code | Paystack dashboard |
| `PLN_MONTHLY_PLACEHOLDER` | `src/lib/constants.ts` (PAYSTACK_MONTHLY_PLAN_CODE) | Paystack monthly plan code | Paystack dashboard |
| `sk_test_placeholder` | `supabase/functions/purchase-topup/index.ts` | Actual Paystack secret key (via env) | Paystack dashboard |
| Hardcoded OTP `"0000"` | `supabase/functions/send-otp/index.ts` line 27 | Random 4-6 digit code generation | Developer |
| Console log instead of SMS | `supabase/functions/send-otp/index.ts` line 46 | SMS API call (Termii/Twilio) | SMS provider |
| Missing webhook signature validation | `supabase/functions/webhooks-forthsoft/index.ts` line 18 | HMAC validation of Forthsoft signature | Forthsoft |
| `staysharp-logo.png` reference | Multiple components | Actual logo file (currently using .svg in public/) | Design team |
| Forthsoft return URL | DCBProtect dashboard config | Production return URL | Engineering |
| MTN shortcode | Not in codebase | Configured in Forthsoft/MTN | Forthsoft/MTN |
| SMS provider API key | Not in codebase | Termii or Twilio API key | SMS provider dashboard |

---

## 13. Roadmap Features (Not Yet Built)

| Feature | Referenced In | Description | Dependencies |
|---|---|---|---|
| Real OTP delivery via SMS | `send-otp` Edge Function (STUB comment) | Replace hardcoded OTP with random generation and SMS delivery via Termii or Twilio | SMS provider API key, sender ID |
| Forthsoft webhook signature validation | `webhooks-forthsoft` (TODO comment) | Validate shared-secret signature from Forthsoft on incoming webhooks | Shared secret from Forthsoft |
| MTN header enrichment | SubscribePage (implied by "For MTN subscribers only") | Auto-detect phone number on MTN mobile data connections | Forthsoft/DCBProtect integration |
| Daily SKU via Paystack | Constants (daily SKU defined but not offered in Paystack flow) | Allow daily billing via card payment | Additional Paystack plan setup |
| Quiz caching | session_logs table has `cache_hit` column | Cache generated quizzes to reduce API costs and improve speed | Cache storage strategy |
| Email notifications | subscribers table has `email` column | Send subscription confirmations, renewal reminders | Email service integration |
| Profile sync across devices | Quiz history is localStorage-only | Sync quiz history, XP, and player name to server | User accounts / auth system |
| Leaderboard | Not referenced | Global or topic-based leaderboards | Server-side aggregation |
| Streak tracking | Not referenced | Track daily/weekly quiz streaks for engagement | Server-side or localStorage |
| PWA offline support | Not referenced | Service worker for offline access to cached quizzes | Service worker implementation |

---

*End of specification.*
