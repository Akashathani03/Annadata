#!/bin/bash
# Reusable test script for the new auth integration step.
# Usage: bash scripts/test-auth-flow.sh [port]
set -e

PORT="${1:-8123}"
BASE_URL="http://localhost:$PORT/api/v1"
PHONE="9876500000"

echo "== 1. Send OTP (mocked - always succeeds) =="
curl -s -X POST "$BASE_URL/auth/otp/send" -H "Content-Type: application/json" \
  -d "{\"phone\":\"$PHONE\"}"
echo ""

echo ""
echo "== 2. Verify with the WRONG otp - should fail cleanly =="
curl -s -X POST "$BASE_URL/auth/otp/verify" -H "Content-Type: application/json" \
  -d "{\"phone\":\"$PHONE\",\"otp\":\"0000\"}"
echo ""

echo ""
echo "== 3. Verify with the correct mock otp (4821) - should return a real user + real token =="
VERIFY_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/otp/verify" -H "Content-Type: application/json" \
  -d "{\"phone\":\"$PHONE\",\"otp\":\"4821\"}")
echo "$VERIFY_RESPONSE"

TOKEN=$(echo "$VERIFY_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
USER_ID=$(echo "$VERIFY_RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo ""
echo "Extracted userId: $USER_ID"

echo ""
echo "== 4. Use the REAL issued token against the whoami diagnostic route =="
curl -s "$BASE_URL/whoami" -H "Authorization: Bearer $TOKEN"
echo ""

echo ""
echo "== 5. Use the REAL issued token to actually create an Agro AI message =="
curl -s -X POST "$BASE_URL/agro-ai/messages" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"text":"testing real auth end to end"}'
echo ""

echo ""
echo "== 6. Logging in again with the SAME phone should return the SAME userId (no duplicate user created) =="
SECOND_VERIFY=$(curl -s -X POST "$BASE_URL/auth/otp/verify" -H "Content-Type: application/json" \
  -d "{\"phone\":\"$PHONE\",\"otp\":\"4821\"}")
SECOND_USER_ID=$(echo "$SECOND_VERIFY" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "First login userId:  $USER_ID"
echo "Second login userId: $SECOND_USER_ID"
if [ "$USER_ID" == "$SECOND_USER_ID" ]; then
  echo "MATCH - same user, not duplicated."
else
  echo "MISMATCH - this would be a bug."
fi

echo ""
echo "Done."
