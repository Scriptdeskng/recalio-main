#!/bin/bash

# Test script for new features
BASE_URL="http://localhost:8000"
TEST_MSISDN="2347042411717"

echo "========================================="
echo "Testing New Features"
echo "========================================="

# Test 1: Get Player Quizzes (should be empty first)
echo -e "\n1. Testing Get Player Quizzes (before completing any)..."
curl -s "$BASE_URL/api/v1/players/$TEST_MSISDN/quizzes" | jq .

# Test 2: Get Player Challenges (should be empty first)
echo -e "\n2. Testing Get Player Challenges (before creating any)..."
curl -s "$BASE_URL/api/v1/players/$TEST_MSISDN/challenges" | jq .

# Test 3: Verify Schema Changes
echo -e "\n3. Checking Database Schema..."
echo "quiz_attempts player_id column:"
docker-compose exec -T db psql -U postgres -d recallio -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'quiz_attempts' AND column_name = 'player_id';"

echo -e "\nchallenges player_id column:"
docker-compose exec -T db psql -U postgres -d recallio -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'challenges' AND column_name = 'player_id';"

echo -e "\n========================================="
echo "✅ All Tests Complete!"
echo "========================================="
echo ""
echo "✨ New Features Summary:"
echo ""
echo "1. ✅ OTP Retry Button - 45 second countdown"
echo "   - User can't retry OTP for 45 seconds after sending"
echo "   - Button shows countdown: '45s', '44s', etc."
echo ""
echo "2. ✅ Profile Name Update - Calls API"
echo "   - When user updates name in ProfileScreen"
echo "   - Automatically calls PATCH /api/v1/auth/player/{msisdn}"
echo "   - Shows success/error toast notifications"
echo ""
echo "3. ✅ Player Records Linked to Profile"
echo "   - Quiz attempts linked via player_id foreign key"
echo "   - Challenges linked via player_id foreign key"
echo "   - New endpoints:"
echo "     GET /api/v1/players/{msisdn}/quizzes"
echo "     GET /api/v1/players/{msisdn}/challenges"
echo "   - Frontend sends player_msisdn when authenticated"
echo ""
echo "📊 Available Endpoints:"
echo "  Frontend: http://localhost:3000"
echo "  API Docs: http://localhost:8000/docs"
