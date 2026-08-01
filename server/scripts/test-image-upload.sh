#!/bin/bash
# Reusable test script for Step 5's image upload.
# Usage: bash scripts/test-image-upload.sh [port]
set -e

PORT="${1:-8123}"
BASE_URL="http://localhost:$PORT/api/v1/agro-ai"

echo "== Generating a test token =="
TOKEN=$(node scripts/generate-test-token.js 507f1f77bcf86cd799439011)
echo "Token generated."

echo ""
echo "== Creating a tiny valid test JPEG (test-image.jpg) =="
# A minimal, valid 1x1 pixel JPEG, base64-decoded to a real file -
# no external image tools needed.
echo "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=" | base64 -d > test-image.jpg
echo "Created test-image.jpg ($(stat -c%s test-image.jpg 2>/dev/null || stat -f%z test-image.jpg) bytes)"

echo ""
echo "== Uploading it as a new message (no sessionId - creates a fresh session) =="
RESPONSE=$(curl -s -X POST "$BASE_URL/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@test-image.jpg;type=image/jpeg" \
  -F "text=Here is a test photo")
echo "$RESPONSE"

echo ""
echo "== Extracting sessionId and photoUrl =="
SESSION_ID=$(echo "$RESPONSE" | grep -o '"sessionId":"[^"]*"' | head -1 | cut -d'"' -f4)
PHOTO_URL=$(echo "$RESPONSE" | grep -o '"photoUrl":"[^"]*"' | cut -d'"' -f4)
echo "sessionId: $SESSION_ID"
echo "photoUrl:  $PHOTO_URL"

echo ""
echo "== Fetching the uploaded image back over HTTP =="
curl -s -o /dev/null -w "HTTP status for GET $PHOTO_URL: %{http_code}\n" \
  "http://localhost:$PORT$PHOTO_URL"

echo ""
echo "== Confirming the message is retrievable via GET /messages =="
curl -s "$BASE_URL/messages?sessionId=$SESSION_ID" -H "Authorization: Bearer $TOKEN"
echo ""

rm -f test-image.jpg
echo ""
echo "Done."
