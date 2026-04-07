# Subscription & Payment Integration

This document outlines the subscription and payment system implementation.

## Overview

The subscription system supports:
- **Daily Plan**: ₦70/day (MTN Airtime only)
- **Weekly Plan**: ₦200/week (MTN Airtime or Card)
- **Monthly Plan**: ₦600/month (Card only)

## Backend Setup

### 1. Environment Variables

Add to `apps/api/.env`:

```bash
# Payment Settings
PAYSTACK_SECRET_KEY=sk_test_your_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key

# IntelliHQ Settings (for airtime payments)
INTELLIHQ_API_KEY=your_intellihq_api_key
INTELLIHQ_SERVICE_ID=1
```

### 2. Run Database Migration

```bash
make db-migrate
```

This will:
- Create `subscription_plans` table
- Create `subscriptions` table
- Seed the 3 default plans (Daily, Weekly, Monthly)

### 3. Verify Tables

```bash
make db-shell
```

Then run:
```sql
SELECT * FROM subscription_plans;
SELECT * FROM subscriptions;
```

## Frontend Setup

### 1. Environment Variables

Add to `apps/web/.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key
```

### 2. Restart Dev Server

```bash
make down && make dev
```

## Payment Flows

### Airtime Payment (MTN)

1. User clicks "Pay with airtime" on `/subscribe`
2. Redirects to IntelliHQ web promo page
3. User completes payment on IntelliHQ
4. IntelliHQ sends webhook to `/api/v1/webhooks/intellihq`
5. Backend creates subscription record

### Card Payment (Paystack)

1. User selects Weekly or Monthly plan
2. Enters phone and email
3. Clicks "Pay ₦200/week →"
4. Backend creates pending subscription
5. Paystack popup opens for payment
6. User completes payment
7. Frontend verifies payment with backend
8. Backend activates subscription and saves authorization code
9. User redirected to `/main-app`

## API Endpoints

### Get Plans
```
GET /api/v1/subscriptions/plans
```

### Initiate Card Payment
```
POST /api/v1/subscriptions/initiate-card-payment
{
  "msisdn": "08012345678",
  "email": "user@example.com",
  "plan_period": "weekly"
}
```

### Verify Payment
```
POST /api/v1/subscriptions/verify-payment
{
  "reference": "paystack_reference"
}
```

### Get Active Subscription
```
GET /api/v1/subscriptions/active/{msisdn}
```

### IntelliHQ Webhook (Airtime Subscriptions)
```
POST /api/v1/webhooks/intellihq
{
  "type": "SYNC_NOTIFICATION",
  "telco": "MTN",
  "action": "NONE",
  "shortcode": null,
  "product": {
    "id": "product_id",
    "name": "Product Name",
    "identity": "product_id",
    "type": "SUBSCRIPTION",
    "subscription_type": "ONETIME_AND_RECURRING",
    "status": "LIVE"
  },
  "details": {
    "phone": "2348012345678",
    "amount": 70.0,
    "channel": "Evina",
    "date": "2026-04-06 12:00:00",
    "expiry": "2026-04-07",
    "auto_renewal": true,
    "telco_status_code": "0",
    "telco_ref": "reference_string",
    "sequence_no": "12345"
  }
}
```

**Notification Types:**
- `SYNC_NOTIFICATION` - New subscription created
- `RENEWAL_NOTIFICATION` - Subscription renewed (extends expiry)
- `UNSUBSCRIPTION_NOTIFICATION` - Subscription cancelled

## Database Models

### subscription_plans
- `id` - Plan ID
- `name` - Plan name (e.g., "Weekly Plan")
- `period` - daily, weekly, or monthly
- `price` - Price in kobo (e.g., 20000 = ₦200)
- `allowed_payment_methods` - Comma-separated (e.g., "airtime,card")

### subscriptions
- `id` - Subscription ID
- `player_id` - Foreign key to players
- `plan_id` - Foreign key to subscription_plans
- `status` - pending, active, grace, suspended, churned, cancelled
- `provider` - intellihq or paystack
- `payment_reference` - Payment reference from provider
- `authorization_code` - Saved card authorization for recurring charges
- `starts_at` - Subscription start date
- `ends_at` - Subscription end date
- `auto_renew` - Boolean for auto-renewal

## Recurring Charges

For card subscriptions, the `authorization_code` is saved on first payment. We don't use Paystack subscription plans - instead, we manage subscriptions in our backend and manually trigger recurring charges.

### How It Works

1. **Initial Payment:**
   - User subscribes via `/subscribe` page
   - Backend creates PENDING subscription with subscription_id
   - Calls Paystack initialize with metadata including `subscription_id` and `payment_type=initial`
   - User completes payment, authorization_code is saved
   - Backend activates subscription via verify endpoint
   - Webhook confirms with subscription_id in payload

2. **Recurring Charges:**
   - Cron job runs daily (`apps/api/scripts/process_renewals.py`)
   - Finds subscriptions expiring within 1 day
   - Calls Paystack `charge_authorization()` with metadata:
     ```python
     {
       "subscription_id": 123,
       "payment_type": "renewal",
       "plan_id": 2,
       "renewal_date": "2026-04-08T09:00:00Z"
     }
     ```
   - Paystack charges the saved card
   - Webhook receives `charge.success` with subscription_id
   - Backend extends subscription period

3. **Failed Renewal:**
   - If charge fails, webhook receives `invoice.payment_failed`
   - Subscription moved to `grace` status
   - User has grace period to update payment method
   - Retry can be triggered manually or by cron

### Running the Renewal Cron Job

```bash
# Run manually for testing
python -m apps.api.scripts.process_renewals

# Add to crontab (run daily at 9 AM)
0 9 * * * cd /path/to/recalio && python -m apps.api.scripts.process_renewals
```

### Manual Renewal Trigger (for testing)

You can manually trigger renewal for a specific subscription:

```python
from app.services.recurring_charge_service import RecurringChargeService

# In your test or API endpoint
result = await RecurringChargeService.charge_specific_subscription(
    db=db,
    subscription_id=123
)
```

## Testing

### Test Cards (Paystack)

- Success: `4084084084084081`
- Decline: `4084080000000408`
- CVV: Any 3 digits
- Expiry: Any future date
- PIN: `0000`

## IntelliHQ Webhook Integration

### Webhook URL

Configure this URL in your IntelliHQ dashboard:
```
https://your-domain.com/api/v1/webhooks/intellihq
```

For local testing with ngrok:
```
https://your-ngrok-url.ngrok.io/api/v1/webhooks/intellihq
```

### Webhook Flow

1. **New Subscription (`SYNC_NOTIFICATION`)**
   - Creates new subscription record
   - Sets status to `active`
   - Updates player's `has_active_subscription` flag

2. **Renewal (`RENEWAL_NOTIFICATION`)**
   - Finds existing subscription by player phone
   - Updates `ends_at` and `next_billing_at` dates
   - Maintains `active` status

3. **Unsubscription (`UNSUBSCRIPTION_NOTIFICATION`)**
   - Finds existing subscription by player phone
   - Sets status to `cancelled`
   - Sets `auto_renew` to `false`
   - Updates player's `has_active_subscription` flag

### Response Format

```json
{
  "success": true,
  "message": "SYNC_NOTIFICATION processed successfully",
  "subscription_id": 123
}
```

### Error Handling

- `400 Bad Request` - Invalid payload or validation error
- `500 Internal Server Error` - Processing error

## Paystack Webhook Integration

### Webhook URL

Configure this URL in your Paystack dashboard:
```
https://your-domain.com/api/v1/webhooks/paystack
```

Go to **Settings → Webhooks** and add the URL.

### Security

Paystack webhooks include an `x-paystack-signature` header containing a HMAC SHA512 signature of the payload. The webhook endpoint automatically verifies this signature using your secret key.

### Supported Events

1. **`charge.success`** - Successful charge (recurring subscription payment)
   - Updates subscription `ends_at` date based on plan period
   - Maintains `active` status
   - Logs charge details in subscription metadata

2. **`invoice.update`** - Invoice updated (subscription successfully charged)
   - Similar handling to `charge.success`
   - Used for subscription-based invoices

3. **`invoice.payment_failed`** - Failed subscription payment
   - Moves subscription to `grace` period
   - Updates player status with failure info
   - Allows user to continue using service temporarily

### Webhook Payload Example

```json
{
  "event": "charge.success",
  "data": {
    "id": 4099260516,
    "status": "success",
    "reference": "recurring_ref_123",
    "amount": 20000,
    "currency": "NGN",
    "paid_at": "2026-04-07T12:00:00.000Z",
    "metadata": {
      "subscription_id": 1,
      "renewal": true
    },
    "customer": {
      "email": "user@example.com"
    },
    "authorization": {
      "authorization_code": "AUTH_xxxxx"
    }
  }
}
```

### Recurring Charge Flow

1. Paystack automatically charges saved authorization code on renewal date
2. Sends webhook to your endpoint with `charge.success` event
3. Your system:
   - Verifies webhook signature
   - Finds subscription by ID in metadata
   - Extends subscription based on plan period
   - Updates player's subscription status

### Response Format

Always returns `200 OK` to prevent retries:

```json
{
  "success": true,
  "message": "charge.success processed successfully",
  "subscription_id": 123
}
```

### Testing Webhooks

Use the test script:

```bash
# Test IntelliHQ webhooks
./test-webhook.sh intellihq sync      # New subscription
./test-webhook.sh intellihq renewal   # Renewal
./test-webhook.sh intellihq unsub     # Cancellation

# Test Paystack webhooks (requires disabling signature check for local testing)
./test-webhook.sh paystack charge     # Recurring charge
./test-webhook.sh paystack invoice    # Invoice update
./test-webhook.sh paystack failed     # Failed payment
```

## Next Steps

1. ✅ Implement IntelliHQ webhook handler for airtime payments
2. ✅ Implement Paystack webhook handler for recurring billing
3. ✅ Create recurring charge service
4. ✅ Create cron job script for renewals
5. ⏳ Set up cron job in production
6. ⏳ Implement grace period expiry checks
7. ⏳ Add subscription status checks to quiz endpoints
8. ⏳ Add subscription management UI (cancel, view details)
9. ⏳ Configure webhook URLs in production dashboards
