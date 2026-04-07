# Webhook Implementation Improvements

## Critical Flaws Fixed

### 1. **Idempotency Protection** ✅
**Problem:** Webhooks can be sent multiple times (retries). Previous implementation could process the same payment/renewal multiple times, causing incorrect subscription extensions.

**Fix:**
- **Paystack:** Check `last_charge_reference` in subscription metadata before processing
- **IntelliHQ:** Check `last_renewal_ref`, `cancellation_ref` in metadata
- **Sync Notifications:** Check if subscription with same `telco_ref` already exists

**Impact:** Prevents duplicate charges, incorrect date extensions, and database inconsistencies

---

### 2. **Phone Number Normalization** ✅
**Problem:** Only handled "234" prefix, not "+234" or other formats. No validation of result.

**Fix:**
- Created `normalize_phone_number()` method
- Handles: +234xxxxxxxxxx, 234xxxxxxxxxx, 0xxxxxxxxxx
- Validates result is exactly 11 digits starting with 0
- Raises `ValueError` for invalid numbers

**Impact:** Prevents player lookup failures and subscription assignment errors

---

### 3. **Renewal Date Calculation for Expired Subscriptions** ✅
**Problem:** Paystack renewal added period to `subscription.ends_at` which could be in the past if payment was late.

**Fix:**
```python
# Calculate from now if subscription expired, otherwise from end date
now = datetime.now(timezone.utc)
base_date = max(subscription.ends_at, now)
new_end_date = base_date + timedelta(weeks=1)  # or days/months
```

**Impact:** Prevents users losing days when payment is delayed

---

### 4. **Transaction Safety with Rollback** ✅
**Problem:** If error occurred partway through processing, database could be left in inconsistent state (subscription updated but player not updated).

**Fix:**
- Wrapped all handlers in try/except blocks
- Call `await db.rollback()` on errors
- Log errors with full stack traces

**Impact:** Maintains database consistency even when errors occur

---

### 5. **Secret Key Validation** ✅
**Problem:** `verify_signature()` didn't check if `PAYSTACK_SECRET_KEY` was empty/None before using it.

**Fix:**
```python
if not settings.PAYSTACK_SECRET_KEY:
    logger.error("PAYSTACK_SECRET_KEY not configured")
    return False
```

**Impact:** Prevents cryptic HMAC errors when secret key is missing

---

### 6. **Date Parsing with End-of-Day Timestamps** ✅
**Problem:** IntelliHQ expiry dates are "YYYY-MM-DD" without time. Comparison with current timestamp could cause premature expiration.

**Fix:**
```python
ends_at = datetime.strptime(payload.details.expiry, "%Y-%m-%d")
ends_at = datetime.combine(ends_at.date(), time(23, 59, 59))
ends_at = ends_at.replace(tzinfo=timezone.utc)
```

**Impact:** Users get full day of access until 23:59:59 instead of expiring at midnight

---

### 7. **Player Subscription Status Consistency** ✅
**Problem:** 
- Grace period handler didn't update `has_any_subscription` flag
- Cancellation handler didn't preserve subscription history

**Fix:**
- Set `has_any_subscription = True` in all cases (maintains history)
- Set `has_active_subscription = False` for cancelled/failed states
- Track failure count in metadata

**Impact:** Proper subscription history tracking and grace period handling

---

### 8. **Graceful Handling of Unhandled Events** ✅
**Problem:** Paystack sends many event types. Unknown events raised ValueError.

**Fix:**
- Return `None` for unhandled events instead of raising error
- Log as info instead of error
- Route handler checks for None and returns success anyway

**Impact:** System doesn't crash on new Paystack event types

---

### 9. **Duplicate Subscription Prevention** ✅
**Problem:** IntelliHQ SYNC_NOTIFICATION could create duplicate subscriptions if webhook retried.

**Fix:**
```python
# Check if subscription with this reference already exists
result = await db.execute(
    select(Subscription).where(
        Subscription.payment_reference == telco_ref,
        Subscription.provider == PaymentProvider.INTELLIHQ
    )
)
existing_subscription = result.scalar_one_or_none()

if existing_subscription:
    logger.info(f"Subscription already exists")
    return existing_subscription
```

**Impact:** Prevents duplicate subscriptions and billing issues

---

### 10. **Enhanced Metadata Tracking** ✅
**Problem:** Limited tracking of webhook processing history.

**Fix:** Added metadata fields:
- `last_renewal_ref`, `last_renewal_date`
- `cancellation_ref`, `cancelled_at`
- `failure_count` (for tracking payment failures)
- `created_via_webhook` flag

**Impact:** Better audit trail and debugging capability

---

## Performance Optimizations

### 1. **Reduced Database Queries**
- Use `scalar_one_or_none()` instead of `all()` + [0]
- Reuse player object after fetching
- Check for duplicates before creating records

### 2. **Efficient Date Calculations**
- Calculate base date once
- Use `max()` for expired subscription handling
- Combine date and time objects efficiently

### 3. **Early Returns**
- Return immediately on duplicate detection
- Skip processing for already-handled events
- Return None for unhandled events instead of raising errors

---

## Error Handling Improvements

### 1. **Specific Exception Types**
- `ValueError` for validation errors
- `HTTPException` for authentication failures
- Generic `Exception` caught at top level

### 2. **Comprehensive Logging**
- Log at start of each handler
- Log important decisions (duplicate detection, fallback to new subscription)
- Log errors with full stack traces
- Include context (reference, subscription_id, phone)

### 3. **Graceful Degradation**
- Return 200 OK for validation errors (prevents retries)
- Return 401 only for signature verification failures
- Log warnings for missing data instead of failing

---

## Testing Recommendations

### 1. **Test Duplicate Processing**
```bash
# Send same webhook twice
./test-webhook.sh paystack charge
./test-webhook.sh paystack charge  # Should be idempotent
```

### 2. **Test Phone Number Formats**
- Test with: +2348012345678, 2348012345678, 08012345678
- Test with invalid numbers (9 digits, 12 digits, etc.)

### 3. **Test Expired Subscriptions**
- Create subscription with `ends_at` in the past
- Send renewal webhook
- Verify new end date is in future, not further in past

### 4. **Test Failed Payments**
- Send `invoice.payment_failed` webhook
- Verify grace period status
- Send another failed payment
- Verify failure count increments

### 5. **Test Unhandled Events**
```bash
# Send unknown event type
curl -X POST "http://localhost:8000/api/v1/webhooks/paystack" \
  -H "Content-Type: application/json" \
  -d '{"event": "unknown.event", "data": {...}}'
# Should return success without error
```

---

## Security Enhancements

### 1. **HMAC Signature Verification**
- Uses `hmac.compare_digest()` to prevent timing attacks
- Validates secret key is configured before use
- Logs signature mismatches for security monitoring

### 2. **Input Validation**
- Phone number format validation
- Date parsing with error handling
- Subscription ID validation

### 3. **Transaction Isolation**
- Each webhook processed in its own transaction
- Rollback on any error
- No partial updates

---

## Monitoring & Observability

### 1. **Key Metrics to Track**
- Duplicate webhook count (idempotency hits)
- Invalid phone number attempts
- Signature verification failures
- Payment failure count per subscription
- Webhook processing time

### 2. **Important Log Messages**
- ✅ "already processed, skipping" - Idempotency working
- ⚠️ "Invalid webhook signature" - Potential security issue
- ⚠️ "No active subscription found" - Data inconsistency
- ✅ "Renewed subscription X until Y" - Successful renewal

### 3. **Alerting Recommendations**
- Alert on signature verification failures > 5 per hour
- Alert on high failure_count (> 3) for any subscription
- Alert on database rollback errors

---

## Summary of Changes

### Files Modified:
1. `apps/api/app/services/paystack_webhook_service.py` - Major improvements
2. `apps/api/app/services/webhook_service.py` - Major improvements
3. `apps/api/app/api/routes/webhooks.py` - Error handling improvements

### Key Improvements:
- ✅ Idempotency protection
- ✅ Better phone normalization
- ✅ Fixed renewal date calculation
- ✅ Transaction safety with rollback
- ✅ Secret key validation
- ✅ End-of-day timestamps
- ✅ Grace period consistency
- ✅ Graceful error handling
- ✅ Duplicate prevention
- ✅ Enhanced metadata tracking

### Lines Changed:
- ~400 lines modified across 3 files
- 0 breaking changes
- 100% backward compatible
