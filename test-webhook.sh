#!/bin/bash

# Test script for webhook endpoints
# Usage: ./test-webhook.sh [WEBHOOK_TYPE] [NOTIFICATION_TYPE]
# WEBHOOK_TYPE: intellihq | paystack
# NOTIFICATION_TYPE: 
#   For intellihq: sync | renewal | unsub
#   For paystack: charge | invoice | failed

WEBHOOK_TYPE=${1:-intellihq}
NOTIFICATION_TYPE=${2:-sync}

case $WEBHOOK_TYPE in
  intellihq)
    API_URL="http://localhost:8000/api/v1/webhooks/intellihq"
    
    case $NOTIFICATION_TYPE in
      sync)
        echo "Testing IntelliHQ SYNC_NOTIFICATION (New Subscription)..."
        curl -X POST "$API_URL" \
          -H "Content-Type: application/json" \
          -d '{
            "type": "SYNC_NOTIFICATION",
            "telco": "MTN",
            "action": "NONE",
            "shortcode": null,
            "product": {
              "id": "23410220000050905",
              "name": "StaySharp Daily Plan",
              "identity": "23410220000050905",
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
              "telco_ref": "test_ref_12345",
              "sequence_no": "12345"
            }
          }'
        ;;
      
      renewal)
        echo "Testing IntelliHQ RENEWAL_NOTIFICATION..."
        curl -X POST "$API_URL" \
          -H "Content-Type: application/json" \
          -d '{
            "type": "RENEWAL_NOTIFICATION",
            "telco": "MTN",
            "action": "NONE",
            "shortcode": null,
            "product": {
              "id": "23410220000050905",
              "name": "StaySharp Daily Plan",
              "identity": "23410220000050905",
              "type": "SUBSCRIPTION",
              "subscription_type": "ONETIME_AND_RECURRING",
              "status": "LIVE"
            },
            "details": {
              "phone": "2348012345678",
              "amount": 70.0,
              "channel": "system-renewal",
              "date": "2026-04-07 12:00:00",
              "expiry": "2026-04-08",
              "auto_renewal": true,
              "telco_status_code": "0",
              "telco_ref": "test_renewal_67890",
              "sequence_no": "12345"
            }
          }'
        ;;
      
      unsub)
        echo "Testing IntelliHQ UNSUBSCRIPTION_NOTIFICATION..."
        curl -X POST "$API_URL" \
          -H "Content-Type: application/json" \
          -d '{
            "type": "UNSUBSCRIPTION_NOTIFICATION",
            "telco": "MTN",
            "action": "NONE",
            "shortcode": null,
            "product": {
              "id": "23410220000050905",
              "name": "StaySharp Daily Plan",
              "identity": "23410220000050905",
              "type": "UNSUBSCRIPTION",
              "subscription_type": "ONETIME_AND_RECURRING",
              "status": "LIVE"
            },
            "details": {
              "phone": "2348012345678",
              "amount": 70.0,
              "channel": "USSD",
              "date": "2026-04-07 12:00:00",
              "expiry": "2026-04-08",
              "auto_renewal": false,
              "telco_status_code": "0",
              "telco_ref": "test_unsub_99999",
              "bearerId": "USSD"
            }
          }'
        ;;
      
      *)
        echo "Invalid notification type for intellihq. Use: sync | renewal | unsub"
        exit 1
        ;;
    esac
    ;;
  
  paystack)
    API_URL="http://localhost:8000/api/v1/webhooks/paystack"
    # Note: In production, Paystack will include x-paystack-signature header
    # For local testing, you may need to temporarily disable signature verification
    
    case $NOTIFICATION_TYPE in
      charge)
        echo "Testing Paystack charge.success (Recurring Charge)..."
        curl -X POST "$API_URL" \
          -H "Content-Type: application/json" \
          -H "x-paystack-signature: test_signature" \
          -d '{
            "event": "charge.success",
            "data": {
              "id": 4099260516,
              "domain": "test",
              "status": "success",
              "reference": "test_recurring_ref_123",
              "amount": 20000,
              "message": null,
              "gateway_response": "Successful",
              "paid_at": "2026-04-07T12:00:00.000Z",
              "created_at": "2026-04-07T11:55:00.000Z",
              "channel": "card",
              "currency": "NGN",
              "ip_address": "197.210.54.33",
              "metadata": {
                "subscription_id": 1,
                "renewal": true
              },
              "fees": 5000,
              "customer": {
                "id": 123456,
                "customer_code": "CUS_xxxxx",
                "email": "user@example.com",
                "first_name": "Test",
                "last_name": "User"
              },
              "authorization": {
                "authorization_code": "AUTH_xxxxx",
                "bin": "408408",
                "last4": "4081",
                "exp_month": "12",
                "exp_year": "2030",
                "channel": "card",
                "card_type": "visa",
                "bank": "TEST BANK",
                "country_code": "NG",
                "brand": "visa",
                "reusable": true
              }
            }
          }'
        ;;
      
      invoice)
        echo "Testing Paystack invoice.update..."
        curl -X POST "$API_URL" \
          -H "Content-Type: application/json" \
          -H "x-paystack-signature: test_signature" \
          -d '{
            "event": "invoice.update",
            "data": {
              "id": 4099260517,
              "domain": "test",
              "status": "success",
              "reference": "test_invoice_ref_456",
              "amount": 60000,
              "message": null,
              "gateway_response": "Successful",
              "paid_at": "2026-04-07T12:00:00.000Z",
              "created_at": "2026-04-07T11:55:00.000Z",
              "channel": "card",
              "currency": "NGN",
              "ip_address": null,
              "metadata": {
                "subscription_id": 2
              },
              "fees": 15000,
              "customer": {
                "id": 123457,
                "customer_code": "CUS_yyyyy",
                "email": "another@example.com"
              },
              "authorization": {
                "authorization_code": "AUTH_yyyyy",
                "bin": "408408",
                "last4": "4081",
                "exp_month": "12",
                "exp_year": "2030",
                "channel": "card",
                "card_type": "visa",
                "bank": "TEST BANK",
                "country_code": "NG",
                "brand": "visa",
                "reusable": true
              }
            }
          }'
        ;;
      
      failed)
        echo "Testing Paystack invoice.payment_failed..."
        curl -X POST "$API_URL" \
          -H "Content-Type: application/json" \
          -H "x-paystack-signature: test_signature" \
          -d '{
            "event": "invoice.payment_failed",
            "data": {
              "id": 4099260518,
              "domain": "test",
              "status": "failed",
              "reference": "test_failed_ref_789",
              "amount": 20000,
              "message": "Insufficient funds",
              "gateway_response": "Declined",
              "paid_at": null,
              "created_at": "2026-04-07T12:00:00.000Z",
              "channel": "card",
              "currency": "NGN",
              "ip_address": null,
              "metadata": {
                "subscription_id": 3
              },
              "fees": 0,
              "customer": {
                "id": 123458,
                "customer_code": "CUS_zzzzz",
                "email": "failed@example.com"
              },
              "authorization": {
                "authorization_code": "AUTH_zzzzz",
                "bin": "408408",
                "last4": "4081",
                "exp_month": "12",
                "exp_year": "2030",
                "channel": "card",
                "card_type": "visa",
                "bank": "TEST BANK",
                "country_code": "NG",
                "brand": "visa",
                "reusable": true
              }
            }
          }'
        ;;
      
      *)
        echo "Invalid notification type for paystack. Use: charge | invoice | failed"
        exit 1
        ;;
    esac
    ;;
  
  *)
    echo "Invalid webhook type. Use: intellihq | paystack"
    echo ""
    echo "Examples:"
    echo "  ./test-webhook.sh intellihq sync"
    echo "  ./test-webhook.sh paystack charge"
    exit 1
    ;;
esac

echo ""
echo ""
echo "Response received."
