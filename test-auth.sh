#!/bin/bash

# Test script for authentication endpoints
BASE_URL="http://localhost:8000"

echo "==================================="
echo "Testing Authentication Endpoints"
echo "==================================="

# Test 1: Health Check
echo -e "\n1. Testing Health Endpoint..."
curl -s "$BASE_URL/health" | jq .

# Test 2: Send OTP (will fail without real credentials, but shows endpoint works)
echo -e "\n2. Testing Send OTP Endpoint..."
curl -s -X POST "$BASE_URL/api/v1/auth/send-otp" \
  -H "Content-Type: application/json" \
  -d '{
    "msisdn": "2348012345678",
    "telco": "MTN"
  }' | jq .

# Test 3: Check API docs are available
echo -e "\n3. Checking API Documentation..."
echo "API Docs available at: http://localhost:8000/docs"
echo "OpenAPI JSON available at: http://localhost:8000/openapi.json"

# Test 4: List all auth endpoints
echo -e "\n4. Available Auth Endpoints:"
curl -s "$BASE_URL/openapi.json" | jq -r '.paths | keys[] | select(startswith("/api/v1/auth"))'

echo -e "\n==================================="
echo "Test Complete!"
echo "==================================="
echo ""
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
echo "Database: PostgreSQL on localhost:5432"
