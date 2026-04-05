

# Temporary CTA Redirect to /app

While waiting for the MTN billing URL, update all `#subscribe-link` placeholders to navigate to `/app` instead, so the buttons are functional.

## Changes

### 1. `src/components/landing/LandingNav.tsx`
- Change `href="#subscribe-link"` → `href="/app"`

### 2. `src/components/landing/HeroSection.tsx`
- Change `href="#subscribe-link"` on the primary CTA → `href="/app"`

### 3. `src/components/landing/CTASection.tsx`
- Change `href="#subscribe-link"` → `href="/app"`

Three simple find-and-replace edits. When the real MTN billing URL is ready, swap `/app` for it.

