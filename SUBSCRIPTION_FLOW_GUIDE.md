# Subscription Plan & Payment Method Flow

## Overview

The subscription system now correctly implements payment restrictions based on plan type.

---

## Plan Options & Payment Restrictions

| Plan | Price | Duration | Airtime (MTN) | Card (Paystack) |
|------|-------|----------|---------------|-----------------|
| **Daily** | ₦70 | 1 day | ✅ Yes | ❌ No |
| **Weekly** | ₦200 | 7 days | ✅ Yes | ✅ Yes |
| **Monthly** | ₦600 | 30 days | ❌ No | ✅ Yes |

### Constraints:
- Daily plan: **Airtime only** (low value, card processing fees too high)
- Weekly plan: **Both methods** (flexibility for users)
- Monthly plan: **Card only** (IntelliHQ doesn't offer monthly airtime)

---

## New User Flow

### Step 1: Choose Payment Method First

```
User lands on /subscribe
    ↓
[ Pay with airtime ]  ← Shows "MTN only • Daily or Weekly plans"
[ Pay by card ]       ← Shows "Debit/Credit card • Weekly or Monthly plans"
```

**Why payment method first?**
- Each payment method has different plan availability
- Prevents confusion (user won't see unavailable options)
- Clear value proposition for each method

### Step 2: See Available Plans

#### If Airtime Selected:
```
Choose your plan:
[ Daily - ₦70/day ]
[ Weekly - ₦200/week ]

[ Pay ₦70 with airtime → ]
```

#### If Card Selected:
```
Choose your plan:
[ Weekly - ₦200/week ]
[ Monthly - ₦600/month ] ← Best value

Enter phone: _______
Enter email: _______

[ Pay ₦200/week → ]
```

### Step 3: Complete Payment

**Airtime Flow:**
1. User clicks "Pay ₦70 with airtime"
2. Redirects to IntelliHQ landing page with product_id
3. User completes airtime payment
4. IntelliHQ sends webhook to backend
5. Subscription activated

**Card Flow:**
1. User enters phone + email
2. User clicks "Pay ₦200/week"
3. Backend creates pending subscription
4. Paystack popup opens
5. User enters card details
6. Frontend verifies payment
7. Subscription activated
8. Redirects to main app

---

## Implementation Details

### Frontend: SubscribePage.tsx

**State Management:**
```typescript
type PaymentState = "idle" | "mtn" | "paystack";
type SKU = "daily" | "weekly" | "monthly";

const [state, setState] = useState<PaymentState>("idle");
const [sku, setSku] = useState<SKU | null>(null);
```

**Plan Filtering:**
```typescript
const availablePlans = state === "idle" 
  ? SKUS 
  : SKUS.filter(s => 
      state === "mtn" 
        ? s.allowedMethods.includes("airtime")
        : s.allowedMethods.includes("card")
    );
```

**Payment Method Buttons:** (idle state)
```tsx
<button onClick={() => setState("mtn")}>
  Pay with airtime
  <span>MTN only • Daily or Weekly plans</span>
</button>

<button onClick={() => setState("paystack")}>
  Pay by card
  <span>Debit/Credit card • Weekly or Monthly plans</span>
</button>
```

### Backend: Already Configured ✅

**Database:**
- `subscription_plans` table has all three periods
- PlanPeriod enum: `DAILY`, `WEEKLY`, `MONTHLY`
- Each plan has `allowed_payment_methods` field

**API Endpoints:**
- `POST /api/v1/subscriptions/initiate-card-payment` accepts "daily" | "weekly" | "monthly"
- `POST /api/v1/webhooks/intellihq` processes all three plan types

**Webhook Processing:**
- IntelliHQ webhooks match product to plan by name/price/period
- Paystack webhooks use subscription_id in metadata

---

## IntelliHQ Product Configuration

You need to configure three products in IntelliHQ dashboard:

| Product ID | Name | Price | Period | Auto-renewal |
|------------|------|-------|--------|--------------|
| `daily_product_id` | Daily Plan | ₦70 | 1 day | Optional |
| `weekly_product_id` | Weekly Plan | ₦200 | 7 days | Recommended |
| `monthly_product_id` | Monthly Plan | ₦600 | 30 days | N/A (card only) |

**Update Frontend:**

Edit `apps/web/pages/SubscribePage.tsx` (line ~55):

```typescript
const productIdMap: Record<SKU, string> = {
  daily: "YOUR_DAILY_PRODUCT_ID",     // ← Replace
  weekly: "YOUR_WEEKLY_PRODUCT_ID",   // ← Replace
  monthly: "YOUR_MONTHLY_PRODUCT_ID"  // ← Replace (or remove if not offering)
};
```

---

## User Experience Benefits

### ✅ Clear Expectations
- Users know which plans are available before choosing payment method
- No dead ends (selecting monthly then finding out airtime isn't available)

### ✅ Optimized for Each Method
- **Airtime**: Fast, no form filling, immediate redirect
- **Card**: Requires phone/email for future sign-in and receipts

### ✅ Flexibility for Weekly Users
- Weekly plan allows both methods (user preference)
- Some users prefer airtime (no card required)
- Others prefer card (works internationally, auto-renewal)

### ✅ Business Logic Enforced
- Can't pay daily with card (fees would eat profit)
- Can't pay monthly with airtime (IntelliHQ limitation)
- Backend validates these restrictions

---

## Testing Checklist

### Test Daily Plan (Airtime Only)
- [ ] Click "Pay with airtime"
- [ ] See Daily (₦70) and Weekly (₦200) options
- [ ] Select Daily
- [ ] Click "Pay ₦70 with airtime"
- [ ] Redirects to IntelliHQ with `product_id=daily_product_id`
- [ ] Complete test payment
- [ ] Verify subscription created with 1-day expiry

### Test Weekly Plan (Both Methods)

**Via Airtime:**
- [ ] Click "Pay with airtime"
- [ ] Select Weekly (₦200)
- [ ] Click "Pay ₦200 with airtime"
- [ ] Redirects to IntelliHQ with `product_id=weekly_product_id`
- [ ] Complete test payment
- [ ] Verify subscription created with 7-day expiry

**Via Card:**
- [ ] Click "Pay by card"
- [ ] See Weekly (₦200) and Monthly (₦600) options
- [ ] Select Weekly
- [ ] Enter phone: 08012345678
- [ ] Enter email: test@example.com
- [ ] Click "Pay ₦200/week"
- [ ] Paystack popup opens
- [ ] Complete test payment (card: 4084 0840 8408 4081)
- [ ] Success toast appears
- [ ] Redirects to /main-app
- [ ] Verify subscription in database with 7-day expiry

### Test Monthly Plan (Card Only)
- [ ] Click "Pay by card"
- [ ] Select Monthly (₦600)
- [ ] Enter phone and email
- [ ] Click "Pay ₦600/month"
- [ ] Complete test payment
- [ ] Verify subscription created with 30-day expiry

### Test Restrictions
- [ ] Verify "Pay with airtime" doesn't show Monthly option
- [ ] Verify "Pay by card" doesn't show Daily option
- [ ] Verify back button resets selection properly
- [ ] Verify validation messages work

---

## Migration from Old Flow

### What Changed:

**Before:**
1. Plan selection shown first (all plans)
2. Payment method buttons always visible
3. User could select monthly then see airtime button (broken UX)
4. Daily plan missing entirely

**After:**
1. Payment method selection first (with plan hints)
2. Plans filtered based on payment method
3. Impossible to select invalid combinations
4. Daily plan included

### No Breaking Changes:
- Backend API unchanged (already supported all three periods)
- Database schema unchanged (already has daily, weekly, monthly)
- Webhook processing unchanged (already handles all plan types)
- Session storage format unchanged

---

## Edge Cases Handled

### 1. User Starts but Doesn't Complete
- **Airtime**: No issue, just redirects to IntelliHQ (no backend state)
- **Card**: Subscription created as PENDING, can retry with same data

### 2. User Switches Payment Methods
- Back button resets `state` and `sku`
- Form inputs cleared when switching to airtime
- No leftover state from previous selection

### 3. Invalid IntelliHQ Product ID
- Redirect happens (frontend doesn't validate)
- IntelliHQ shows error page
- User can come back and try again
- Fix: Update product IDs in code (see INTELLIHQ_PRODUCT_MAPPING.md)

### 4. Network Provider Mismatch
- User selects airtime but not on MTN
- IntelliHQ landing page shows error
- Alternative: Could add telco detection on frontend
- For now: Label clearly says "MTN only"

---

## Future Enhancements

### Telco Detection (Optional)
Detect user's network provider and show/hide airtime option:

```typescript
const [telco, setTelco] = useState<string | null>(null);

useEffect(() => {
  // Detect telco from phone number or API
  detectTelco(phone).then(setTelco);
}, [phone]);

// Only show airtime if MTN
{telco === "MTN" && (
  <button onClick={() => setState("mtn")}>
    Pay with airtime
  </button>
)}
```

### Dynamic Plan Loading
Load available plans from backend instead of hardcoding:

```typescript
const [plans, setPlans] = useState([]);

useEffect(() => {
  subscriptionAPI.getPlans().then(setPlans);
}, []);
```

### Plan Comparison Table
Show feature comparison before payment method selection:

```
           Daily  Weekly  Monthly
───────────────────────────────
Price      ₦70    ₦200    ₦600
Duration   1 day  7 days  30 days
Per day    ₦70    ₦29     ₦20  ← Best value
Airtime    ✅     ✅      ❌
Card       ❌     ✅      ✅
```

---

## Related Documentation

- [INTELLIHQ_PRODUCT_MAPPING.md](INTELLIHQ_PRODUCT_MAPPING.md) - How to configure IntelliHQ products
- [FRONTEND_BACKEND_INTEGRATION_REPORT.md](FRONTEND_BACKEND_INTEGRATION_REPORT.md) - Full integration status
- [SUBSCRIPTION_INTEGRATION.md](SUBSCRIPTION_INTEGRATION.md) - Original subscription system docs
- [CRON_SETUP_GUIDE.md](CRON_SETUP_GUIDE.md) - Recurring charge automation

---

## Summary

✅ **Daily plan added** (₦70/day, airtime only)  
✅ **Payment restrictions enforced** (no invalid combinations)  
✅ **UX flow improved** (payment method first, then plans)  
✅ **All backend logic ready** (no code changes needed)  
✅ **Clear user guidance** (each button explains what's available)

**Next Step:** Update IntelliHQ product IDs in SubscribePage.tsx and test all flows.
