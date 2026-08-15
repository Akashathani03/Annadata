#!/bin/bash
# Complete Listing lifecycle test, per the requested test plan.
# Requires: server running (npm run dev), MongoDB connected,
# scripts/seed-market-prices.js and scripts/seed-animal-catalog.js
# already run (needs real 'onion' and 'cow' catalog items to exist).
#
# Usage: bash scripts/test-listings-lifecycle.sh

BASE="http://localhost:8123/api/v1"
PASS=0
FAIL=0

check() {
  local name="$1" expected="$2" actual="$3"
  if [ "$expected" == "$actual" ]; then
    echo "PASS: $name (got $actual)"
    PASS=$((PASS+1))
  else
    echo "FAIL: $name (expected $expected, got $actual)"
    FAIL=$((FAIL+1))
  fi
}

json_get() {
  python3 -c "import json,sys; d=json.load(sys.stdin); print(d$1)" 2>/dev/null
}

echo "=== Generating test tokens (two different users, for ownership tests) ==="
TOKEN_A=$(node scripts/generate-test-token.js 507f1f77bcf86cd799439011)
TOKEN_B=$(node scripts/generate-test-token.js 507f1f77bcf86cd799439022)

echo ""
echo "=== 1. Create a draft crop listing ==="
RESP=$(curl -s -X POST "$BASE/listings" -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" \
  -d '{"category":"crop","itemId":"onion","itemName":"Onion","quantity":100,"unit":"Kg","price":18,"phone":"9876543210"}')
LISTING_ID=$(echo "$RESP" | json_get "['data']['listing']['id']")
STATUS=$(echo "$RESP" | json_get "['data']['listing']['status']")
check "draft created" "draft" "$STATUS"
echo "  listing id: $LISTING_ID"

echo ""
echo "=== 2. Update the draft ==="
RESP=$(curl -s -X PATCH "$BASE/listings/$LISTING_ID" -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" \
  -d '{"price":20}')
PRICE=$(echo "$RESP" | json_get "['data']['listing']['price']")
check "draft price updated" "20" "$PRICE"

echo ""
echo "=== 3. Publish the listing ==="
RESP=$(curl -s -X PATCH "$BASE/listings/$LISTING_ID" -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" \
  -d '{"status":"published"}')
STATUS=$(echo "$RESP" | json_get "['data']['listing']['status']")
check "listing published" "published" "$STATUS"

echo ""
echo "=== 4. Browse public listings ==="
RESP=$(curl -s "$BASE/listings?category=crop")
FOUND=$(echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print('yes' if any(l['id']=='$LISTING_ID' for l in d['data']['listings']) else 'no')")
check "published listing appears in public browse" "yes" "$FOUND"

echo ""
echo "=== 5. View listing details ==="
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/listings/$LISTING_ID")
check "public detail view succeeds" "200" "$STATUS_CODE"

echo ""
echo "=== 6. Edit a published listing ==="
RESP=$(curl -s -X PATCH "$BASE/listings/$LISTING_ID" -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" \
  -d '{"price":22}')
PRICE=$(echo "$RESP" | json_get "['data']['listing']['price']")
check "published listing edited" "22" "$PRICE"

echo ""
echo "=== 7. Mark the listing as closed (sold) ==="
RESP=$(curl -s -X PATCH "$BASE/listings/$LISTING_ID/sold" -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" \
  -d '{"quantitySold":100,"saleAmount":2200,"buyerName":"Ravi Traders"}')
STATUS=$(echo "$RESP" | json_get "['data']['listing']['status']")
check "listing closed" "closed" "$STATUS"

echo ""
echo "=== 8. Verify it appears in Sales History ==="
RESP=$(curl -s "$BASE/listings/sales" -H "Authorization: Bearer $TOKEN_A")
FOUND=$(echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print('yes' if any(l['id']=='$LISTING_ID' for l in d['data']['sales']) else 'no')")
check "closed listing appears in sales history" "yes" "$FOUND"

echo ""
echo "=== 9. Verify it no longer appears in public published listings ==="
RESP=$(curl -s "$BASE/listings?category=crop")
FOUND=$(echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print('yes' if any(l['id']=='$LISTING_ID' for l in d['data']['listings']) else 'no')")
check "closed listing no longer in public browse" "no" "$FOUND"

echo ""
echo "=== 10. Delete the listing ==="
RESP=$(curl -s -X DELETE "$BASE/listings/$LISTING_ID" -H "Authorization: Bearer $TOKEN_A")
DELETED=$(echo "$RESP" | json_get "['data']['deleted']")
check "listing deleted" "True" "$DELETED"

echo ""
echo "=== 11. Verify it no longer exists ==="
RESP=$(curl -s "$BASE/listings/$LISTING_ID")
LISTING=$(echo "$RESP" | json_get "['data']['listing']")
check "deleted listing returns null" "None" "$LISTING"

echo ""
echo "=== Additional: Animal listing creation ==="
RESP=$(curl -s -X POST "$BASE/listings" -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" \
  -d '{"category":"animal","itemId":"cow","itemName":"Cow","quantity":1,"unit":"Head","price":30000,"phone":"9876543210"}')
STATUS_CODE_CHECK=$(echo "$RESP" | json_get "['success']")
ANIMAL_LISTING_ID=$(echo "$RESP" | json_get "['data']['listing']['id']")
check "animal listing created" "True" "$STATUS_CODE_CHECK"

echo ""
echo "=== Additional: Unauthorized access ==="
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/listings/mine")
check "GET /listings/mine without token -> 401" "401" "$CODE"

echo ""
echo "=== Additional: Ownership checks (User B tries to edit User A's listing) ==="
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/listings/$ANIMAL_LISTING_ID" -H "Authorization: Bearer $TOKEN_B" -H "Content-Type: application/json" -d '{"price":1}')
check "non-owner PATCH -> 404 (never confirms it exists)" "404" "$CODE"

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/listings/$ANIMAL_LISTING_ID" -H "Authorization: Bearer $TOKEN_B")
check "non-owner DELETE -> 404" "404" "$CODE"

echo ""
echo "=== Additional: Invalid ObjectId handling ==="
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/listings/not-a-real-id")
check "malformed id -> 400, not a raw 500" "400" "$CODE"

echo ""
echo "=== Additional: Invalid category/unit validation ==="
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/listings" -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" \
  -d '{"category":"equipment","itemId":"onion","itemName":"x","quantity":1,"unit":"Kg","price":1,"phone":"1"}')
check "invalid category -> 400" "400" "$CODE"

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/listings" -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" \
  -d '{"category":"crop","itemId":"onion","itemName":"x","quantity":1,"unit":"Head","price":1,"phone":"1"}')
check "invalid unit for category -> 400" "400" "$CODE"

echo ""
echo "=== Additional: Missing required fields ==="
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/listings" -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" \
  -d '{"category":"crop"}')
check "missing required fields -> 400 (not a raw 500)" "400" "$CODE"

echo ""
echo "=== Additional: Image upload ==="
echo "fake image bytes" > /tmp/test-listing-photo.jpg
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/listings" -H "Authorization: Bearer $TOKEN_A" \
  -F "category=crop" -F "itemId=onion" -F "itemName=Onion" -F "quantity=10" -F "unit=Kg" -F "price=15" -F "phone=9876543210" \
  -F "photo=@/tmp/test-listing-photo.jpg;type=image/jpeg")
check "listing with image upload -> 201" "201" "$CODE"
rm -f /tmp/test-listing-photo.jpg

echo ""
echo "=== Additional: Draft visibility rules ==="
RESP=$(curl -s -X POST "$BASE/listings" -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" \
  -d '{"category":"crop","itemId":"onion","itemName":"Onion","quantity":10,"unit":"Kg","price":15,"phone":"9876543210"}')
DRAFT_ID=$(echo "$RESP" | json_get "['data']['listing']['id']")

CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/listings/$DRAFT_ID")
check "detail request for a draft still returns 200 (with null data, checked next)" "200" "$CODE"
RESP=$(curl -s "$BASE/listings/$DRAFT_ID")
LISTING=$(echo "$RESP" | json_get "['data']['listing']")
check "anonymous viewer gets null for a draft, not the real data" "None" "$LISTING"

RESP=$(curl -s "$BASE/listings/$DRAFT_ID" -H "Authorization: Bearer $TOKEN_A")
LISTING=$(echo "$RESP" | json_get "['data']['listing']")
check "owner CAN see their own draft" "yes" "$([ "$LISTING" != "None" ] && echo yes || echo no)"

RESP=$(curl -s "$BASE/listings/$DRAFT_ID" -H "Authorization: Bearer $TOKEN_B")
LISTING=$(echo "$RESP" | json_get "['data']['listing']")
check "a different logged-in user still cannot see someone else's draft" "None" "$LISTING"

echo ""
echo "=== Additional: Pagination and filtering ==="
RESP=$(curl -s "$BASE/listings?category=crop&page=1&limit=1")
LIMIT_RETURNED=$(echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d['data']['listings']))")
check "limit=1 returns at most 1 item" "yes" "$([ "$LIMIT_RETURNED" -le 1 ] && echo yes || echo no)"
TOTAL=$(echo "$RESP" | json_get "['data']['total']")
echo "  total published crop listings: $TOTAL"

RESP=$(curl -s "$BASE/listings?category=animal")
ALL_ANIMAL=$(echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(all(l['category']=='animal' for l in d['data']['listings']))")
check "category filter returns only that category" "True" "$ALL_ANIMAL"

echo ""
echo "================================"
echo "$PASS passed, $FAIL failed"
echo "================================"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
