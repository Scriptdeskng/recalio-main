# IntelliHQ Product ID Mapping

## Overview

When users select a plan and choose to pay with MTN airtime, they're redirected to IntelliHQ's landing page. The redirect URL must include the correct product ID so IntelliHQ knows which subscription plan to activate.

---

## Current Implementation

### Frontend: SubscribePage.tsx

```typescript
const handleMTN = () => {
  // Map plan period to IntelliHQ product IDs
  const productIdMap: Record<SKU, string> = {
    weekly: "weekly_product_id",  // Replace with actual IntelliHQ product ID
    monthly: "monthly_product_id" // Replace with actual IntelliHQ product ID
  };
  
  const productId = productIdMap[sku];
  
  // Redirect to IntelliHQ with selected product
  const redirectUrl = `http://api.intellihq.net/api/v1/service/1/test-web-promo/?marketer=bluemount&telco=MTN&antifraud=mfilter&product_id=${productId}`;
  window.location.href = redirectUrl;
};
```

---

## Setup Instructions

### Step 1: Get Product IDs from IntelliHQ Dashboard

1. Log in to your IntelliHQ dashboard
2. Navigate to **Products** or **Subscription Plans**
3. Find your configured products:
   - **Weekly Plan** (₦200/week)
   - **Monthly Plan** (₦600/month)
4. Copy the Product ID or Product Identity for each

**Example Product IDs:**
- Weekly: `prod_12345_weekly` or `weekly_200`
- Monthly: `prod_12345_monthly` or `monthly_600`

### Step 2: Update Frontend Code

Edit `apps/web/pages/SubscribePage.tsx`:

```typescript
const productIdMap: Record<SKU, string> = {
  weekly: "YOUR_ACTUAL_WEEKLY_PRODUCT_ID",   // Replace this
  monthly: "YOUR_ACTUAL_MONTHLY_PRODUCT_ID"  // Replace this
};
```

### Step 3: Verify Backend Mapping

The webhook handler matches IntelliHQ products to your database plans. Ensure the mapping works:

**File:** `apps/api/app/services/webhook_service.py`

```python
# When IntelliHQ sends a webhook, it includes:
payload.product.id          # e.g., "weekly_200"
payload.product.identity    # e.g., "prod_12345_weekly"
payload.product.name        # e.g., "Weekly Plan"

# The service matches this to your database plan by:
# 1. Product name contains "weekly" → matches weekly plan
# 2. Product name contains "monthly" → matches monthly plan
# 3. Falls back to price comparison if name matching fails
```

### Step 4: Configure IntelliHQ Products

Ensure your IntelliHQ dashboard has products configured with:

| IntelliHQ Product | Name | Price | Period | Status |
|-------------------|------|-------|--------|--------|
| `weekly_product_id` | Weekly Plan | ₦200 | 7 days | Active |
| `monthly_product_id` | Monthly Plan | ₦600 | 30 days | Active |

**Important Settings:**
- ✅ Auto-renewal enabled (if you want recurring)
- ✅ Webhook URL configured: `https://yourdomain.com/api/v1/webhooks/intellihq`
- ✅ Notification types enabled: SYNC, RENEWAL, UNSUBSCRIPTION

---

## URL Parameter Reference

The IntelliHQ redirect URL structure:

```
http://api.intellihq.net/api/v1/service/{service_id}/test-web-promo/
  ?marketer={your_marketer_code}
  &telco={MTN|GLO|AIRTEL|9MOBILE}
  &antifraud={mfilter|none}
  &product_id={product_identifier}
```

**Parameters:**
- `service_id`: Your IntelliHQ service ID (e.g., `1`)
- `marketer`: Your marketer code (e.g., `bluemount`)
- `telco`: Network provider (e.g., `MTN`)
- `antifraud`: Fraud filter type (e.g., `mfilter`)
- `product_id`: The product the user selected (e.g., `weekly_200`)

---

## Webhook Processing Flow

When a user completes payment on IntelliHQ:

```
1. User pays on IntelliHQ landing page
   ↓
2. IntelliHQ sends SYNC_NOTIFICATION webhook
   ↓
3. Backend receives webhook with product info:
   {
     "type": "SYNC_NOTIFICATION",
     "product": {
       "id": "weekly_product_id",
       "name": "Weekly Plan",
       ...
     },
     "details": {
       "phone": "08012345678",
       "amount": 200,
       "expiry": "2026-04-14"
     }
   }
   ↓
4. Backend matches product to database plan
   ↓
5. Backend creates subscription record
   ↓
6. User can now access the app
```

---

## Testing

### Test with IntelliHQ Test Environment

1. **Visit subscribe page:** `http://localhost:3000/subscribe`
2. **Select plan:** Click "Weekly" or "Monthly"
3. **Click MTN payment:** "Pay ₦200 with airtime"
4. **Check redirect URL:** Should include `&product_id=weekly_product_id`
5. **Complete test payment** on IntelliHQ landing page
6. **Verify webhook:** Check backend logs for incoming webhook
7. **Confirm subscription:** User should have active subscription in database

### Debug Checklist

If webhook processing fails:

- [ ] Product ID in URL matches IntelliHQ dashboard
- [ ] Webhook URL configured in IntelliHQ dashboard
- [ ] Backend webhook endpoint is accessible (test with curl)
- [ ] Phone number format is correct (normalized to 0xxxxxxxxxx)
- [ ] Plan exists in database with matching price/period
- [ ] Check backend logs: `grep "IntelliHQ webhook" /var/log/recalio/api.log`

---

## Alternative: Product Name Matching

If you can't get exact product IDs, the webhook handler can match by product name:

**Option 1: Name Contains Period**
```json
{
  "product": {
    "name": "StaySharp Weekly Plan"  // Contains "weekly"
  }
}
```

**Option 2: Name Contains Price**
```json
{
  "product": {
    "name": "StaySharp ₦200 Plan"  // Contains "200"
  }
}
```

The webhook service will attempt to match using:
1. Product ID/identity (exact match)
2. Product name keyword (weekly/monthly)
3. Price comparison (amount in webhook vs database plan)

---

## Production Deployment

### Before Going Live:

1. ✅ Replace placeholder product IDs in SubscribePage.tsx
2. ✅ Test both weekly and monthly flows end-to-end
3. ✅ Verify webhooks arrive and process correctly
4. ✅ Confirm subscriptions created with correct expiry dates
5. ✅ Test renewal flow (wait for expiry, check renewal webhook)
6. ✅ Update IntelliHQ webhook URL to production domain
7. ✅ Switch from test-web-promo to live landing page URL

### Update Production URL:

```typescript
// Change from test to production
const redirectUrl = `https://api.intellihq.net/api/v1/service/1/web-promo/?marketer=bluemount&telco=MTN&antifraud=mfilter&product_id=${productId}`;
// Note: Removed "test-" prefix
```

---

## Support

If you encounter issues with IntelliHQ product mapping:

1. **Check IntelliHQ documentation** for your specific integration
2. **Contact IntelliHQ support** to confirm product IDs and URL structure
3. **Review webhook payload** in backend logs to see what product info is sent
4. **Test with webhook.site** to inspect raw webhook payloads

**IntelliHQ API Docs:** https://api.intellihq.net/docs (if available)
**Support:** Contact your IntelliHQ account manager

---

## Related Files

- `apps/web/pages/SubscribePage.tsx` - Frontend payment flow
- `apps/api/app/services/webhook_service.py` - Webhook processing
- `apps/api/app/schemas/webhook.py` - IntelliHQ webhook schemas
- `apps/api/app/api/routes/webhooks.py` - Webhook endpoint
- `SUBSCRIPTION_INTEGRATION.md` - Overall subscription system docs
