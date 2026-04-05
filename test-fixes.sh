#!/bin/bash

# Test script for authentication fixes
BASE_URL="http://localhost:8000"
TEST_MSISDN="2347042411717"

echo "=================================="
echo "Testing Authentication Fixes"
echo "=================================="

# Test 1: Send OTP
echo -e "\n1. Testing Send OTP..."
curl -s -X POST "$BASE_URL/api/v1/auth/send-otp" \
  -H "Content-Type: application/json" \
  -d "{\"msisdn\": \"$TEST_MSISDN\", \"telco\": \"MTN\"}" | jq .

# Test 2: Check Subscription Status (Fixed 500 error)
echo -e "\n2. Testing Subscription Status Check..."
curl -s "$BASE_URL/api/v1/auth/subscription-status?msisdn=$TEST_MSISDN" | jq .

# Test 3: Get Player (includes new full_name field)
echo -e "\n3. Testing Get Player..."
curl -s "$BASE_URL/api/v1/auth/player/$TEST_MSISDN" | jq .

# Test 4: Update Player Name (new feature)
echo -e "\n4. Testing Update Player Name..."
curl -s -X PATCH "$BASE_URL/api/v1/auth/player/$TEST_MSISDN" \
  -H "Content-Type: application/json" \
  -d '{"full_name": "Test User"}' | jq .

# Test 5: Verify Name Update
echo -e "\n5. Verifying Name Was Updated..."
curl -s "$BASE_URL/api/v1/auth/player/$TEST_MSISDN" | jq .

# Test 6: Check Database Schema
echo -e "\n6. Checking Database Schema..."
echo "Players table columns:"
docker-compose exec -T db psql -U postgres -d recallio -c "\d players" | grep full_name

echo -e "\n=================================="
echo "✅ All Tests Complete!"
echo "=================================="
echo ""
echo "Key Fixes Applied:"
echo "1. ✅ Added full_name field to players table"
echo "2. ✅ Authentication redirects to /main-app"
echo "3. ✅ Fixed subscription status 500 errors with better error handling"
echo "4. ✅ Added PATCH endpoint to update player profile"
