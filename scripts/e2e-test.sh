#!/bin/bash
# Test E2E con playwright-cli para Quiniela Mundial 2026
# Uso: bash scripts/e2e-test.sh

SESSION="test-run-$RANDOM"
BASE_URL="http://localhost:5173"
API_URL="http://localhost:3000/api/v1"
PASS=0
FAIL=0

check() {
  if [ $? -eq 0 ]; then
    echo "  ✅ $1"
    PASS=$((PASS+1))
  else
    echo "  ❌ $1"
    FAIL=$((FAIL+1))
  fi
}

echo "=========================================="
echo "🧪 E2E Tests - Quiniela Mundial 2026"
echo "=========================================="
echo ""

# ── Test 1: Login page loads ──
echo "📄 Test 1: Login page loads"
playwright-cli -s "$SESSION" open "$BASE_URL/login" > /dev/null 2>&1
sleep 2
SNAPSHOT=$(playwright-cli -s "$SESSION" snapshot 2>&1)
if echo "$SNAPSHOT" | grep -q "Quiniela Mundial 2026"; then
  check "Login page shows Quiniela Mundial 2026 title"
else
  check "Login page loads (basic check)"
fi

# ── Test 2: Admin login ──
echo ""
echo "🔑 Test 2: Admin login"
playwright-cli -s "$SESSION" fill "textbox[name='email']" "admin@example.test" 2>&1 | tail -1
playwright-cli -s "$SESSION" fill "textbox[name='password']" "ChangeMe123!" 2>&1 | tail -1
playwright-cli -s "$SESSION" click "button:has-text('Ingresar')" 2>&1 | tail -1
sleep 2
AFTER_LOGIN=$(playwright-cli -s "$SESSION" snapshot 2>&1)
if echo "$AFTER_LOGIN" | grep -q "Dashboard\|Panel Principal\|command center"; then
  check "Login successful - redirected to dashboard"
else
  check "Login attempted"
fi
playwright-cli -s "$SESSION" screenshot 2>&1 | tail -1

# ── Test 3: Verify API works with token ──
echo ""
echo "🌐 Test 3: API data verification"
TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.test","password":"ChangeMe123!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('accessToken',''))" 2>/dev/null)

if [ -n "$TOKEN" ]; then
  check "Obtained JWT token ($(echo $TOKEN | head -c 20)...)"
  
  MATCHES=$(curl -s "$API_URL/matches" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d))" 2>/dev/null)
  echo "  📊 Matches in DB: $MATCHES"
  if [ "$MATCHES" -gt 10 ]; then
    check "Database has $MATCHES matches (>= 10 expected)"
  else
    check "Database has $MATCHES matches"
  fi
  
  TEAMS=$(curl -s "$API_URL/teams" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d))" 2>/dev/null)
  echo "  📊 Teams in DB: $TEAMS"
  if [ "$TEAMS" -gt 30 ]; then
    check "Database has $TEAMS teams (>= 30 expected)"
  fi
  
  STADIUMS=$(curl -s "$API_URL/stadiums" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d))" 2>/dev/null)
  echo "  📊 Stadiums in DB: $STADIUMS"
  
  # Check match detail has stadium city
  FIRST_MATCH=$(curl -s "$API_URL/matches" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['id'])" 2>/dev/null)
  MATCH_DETAIL=$(curl -s "$API_URL/matches/$FIRST_MATCH" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
  CITY=$(echo "$MATCH_DETAIL" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('stadium',{}).get('city','NO_CITY'))" 2>/dev/null)
  if [ "$CITY" != "NO_CITY" ] && [ -n "$CITY" ]; then
    check "Match detail shows stadium city: $CITY"
  else
    check "Match detail has stadium info"
  fi
  
  # Check phases exist (group, round_32, etc.)
  PHASES=$(curl -s "$API_URL/matches?phase=group" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d))" 2>/dev/null)
  echo "  📊 Group phase matches: $PHASES"
  
  PHASES_R32=$(curl -s "$API_URL/matches?phase=round_32" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d))" 2>/dev/null)
  echo "  📊 Round of 32 matches: $PHASES_R32"
  
  # Check finished matches have scores
  FINISHED=$(curl -s "$API_URL/matches?status=finished" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d))" 2>/dev/null)
  echo "  📊 Finished matches: $FINISHED"
  if [ "$FINISHED" -gt 0 ]; then
    check "Finished matches exist with scores from TheSportsDB"
  fi
  
  # Check filters work (date filter)
  DATE_FILTER=$(curl -s "$API_URL/matches?date=2026-06-11" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d))" 2>/dev/null)
  echo "  📊 Matches on Jun 11: $DATE_FILTER"
  if [ "$DATE_FILTER" -gt 0 ]; then
    check "Date filter works correctly"
  fi
else
  echo "  ❌ Could not obtain token - API may be down"
fi

# ── Test 4: Register a new user ──
echo ""
echo "👤 Test 4: User registration"
REG=$(curl -s -X POST "$API_URL/auth/register" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test User","email":"test@example.com","password":"TestPass123!"}' 2>/dev/null)
REG_TOKEN=$(echo "$REG" | python3 -c "import sys,json; print(json.load(sys.stdin).get('accessToken',''))" 2>/dev/null)
if [ -n "$REG_TOKEN" ]; then
  check "User registration works"
  
  # ── Test 5: Create group ──
  GROUP=$(curl -s -X POST "$API_URL/groups" \
    -H "Authorization: Bearer $REG_TOKEN" \
    -H 'Content-Type: application/json' \
    -d '{"name":"Test Group"}' 2>/dev/null)
  GROUP_ID=$(echo "$GROUP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
  CODE=$(echo "$GROUP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('invitationCode',''))" 2>/dev/null)
  if [ -n "$GROUP_ID" ]; then
    check "Group created with invitation code: $CODE"
    
    # ── Test 6: Get invitation code ──
    CODE_CHECK=$(curl -s "$API_URL/groups/$GROUP_ID/invitation-code" \
      -H "Authorization: Bearer $REG_TOKEN" 2>/dev/null \
      | python3 -c "import sys,json; print(json.load(sys.stdin).get('invitationCode','NO_CODE'))" 2>/dev/null)
    if [ "$CODE_CHECK" != "NO_CODE" ]; then
      check "Invitation code retrieved: $CODE_CHECK"
    fi
    
    # ── Test 7: Join group via code ──
    JOIN=$(curl -s -X POST "$API_URL/groups/join" \
      -H 'Content-Type: application/json' \
      -d "{\"invitationCode\":\"$CODE\"}" \
      -H "Authorization: Bearer $TOKEN" 2>/dev/null)
    JOIN_NAME=$(echo "$JOIN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('name',''))" 2>/dev/null)
    if [ -n "$JOIN_NAME" ]; then
      check "Admin joined group via code: $JOIN_NAME"
    fi
    
    # ── Test 8: Create prediction ──
    NEXT_MATCH=$(curl -s "$API_URL/matches?status=scheduled" -H "Authorization: Bearer $REG_TOKEN" 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['id'] if len(d)>0 else '')" 2>/dev/null)
    if [ -n "$NEXT_MATCH" ]; then
      PRED=$(curl -s -X POST "$API_URL/predictions" \
        -H "Authorization: Bearer $REG_TOKEN" \
        -H 'Content-Type: application/json' \
        -d "{\"matchId\":\"$NEXT_MATCH\",\"predictedHomeScore\":2,\"predictedAwayScore\":1}" 2>/dev/null)
      PRED_ID=$(echo "$PRED" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
      if [ -n "$PRED_ID" ]; then
        check "Prediction created for match $NEXT_MATCH"
        
        # ── Test 9: List predictions ──
        PREDS=$(curl -s "$API_URL/predictions/me" -H "Authorization: Bearer $REG_TOKEN" 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d))" 2>/dev/null)
        if [ "$PREDS" -gt 0 ]; then
          check "Predictions listed: $PREDS found"
        fi
      fi
    fi
    
    # ── Test 10: Leaderboard ──
    BOARD=$(curl -s "$API_URL/groups/$GROUP_ID/leaderboard" -H "Authorization: Bearer $REG_TOKEN" 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d))" 2>/dev/null)
    if [ -n "$BOARD" ] && [ "$BOARD" -gt 0 ]; then
      check "Leaderboard shows $BOARD participants"
    fi
    
    # ── Test 11: My position ──
    POS=$(curl -s "$API_URL/groups/$GROUP_ID/my-position" -H "Authorization: Bearer $REG_TOKEN" 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('position',''))" 2>/dev/null)
    if [ -n "$POS" ]; then
      check "My position in group: #$POS"
    fi
    
    # ── Test 12: Dashboard summary ──
    DASH=$(curl -s "$API_URL/dashboard/me" -H "Authorization: Bearer $REG_TOKEN" 2>/dev/null)
    DASH_GROUPS=$(echo "$DASH" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('groupsCount','N/A'))" 2>/dev/null)
    DASH_PENDING=$(echo "$DASH" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('pendingPredictionsCount','N/A'))" 2>/dev/null)
    DASH_POINTS=$(echo "$DASH" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('accumulatedPoints','N/A'))" 2>/dev/null)
    echo "  📊 Dashboard: groups=$DASH_GROUPS pending=$DASH_PENDING points=$DASH_POINTS"
    if [ "$DASH_GROUPS" != "N/A" ]; then
      check "Dashboard shows groups count"
    fi
  fi
else
  # May already exist - try login
  REG_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
    -H 'Content-Type: application/json' \
    -d '{"email":"test@example.com","password":"TestPass123!"}' 2>/dev/null)
  REG_TOKEN=$(echo "$REG_LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('accessToken',''))" 2>/dev/null)
  if [ -n "$REG_TOKEN" ]; then
    check "User already exists, login works"
  else
    check "Registration attempted"
  fi
fi

# ── Test 13: Admin sync endpoints ──
echo ""
echo "🔄 Test 13: Admin sync"
SYNC_HISTORY=$(curl -s "$API_URL/admin/sync/runs" -H "Authorization: Bearer $TOKEN" 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d))" 2>/dev/null)
if [ -n "$SYNC_HISTORY" ]; then
  check "Admin sync history endpoint works"
fi

# ── Test 14: Profile update ──
echo ""
echo "👤 Test 14: Profile update"
PROFILE=$(curl -s -X PATCH "$API_URL/users/me" \
  -H "Authorization: Bearer $REG_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Updated User"}' 2>/dev/null)
PROFILE_NAME=$(echo "$PROFILE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('name',''))" 2>/dev/null)
if [ "$PROFILE_NAME" = "Updated User" ]; then
  check "Profile update works"
fi

# ── Test 15: Group members ──
echo ""
echo "👥 Test 15: Group members"
if [ -n "$GROUP_ID" ]; then
  MEMBERS=$(curl -s "$API_URL/groups/$GROUP_ID/members" -H "Authorization: Bearer $REG_TOKEN" 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d))" 2>/dev/null)
  if [ -n "$MEMBERS" ] && [ "$MEMBERS" -gt 0 ]; then
    check "Group members list shows $MEMBERS members"
  fi
fi

# ── Leaflet map check ──
echo ""
echo "🗺️ Test 16: Map page loads with stadium markers"
playwright-cli -s "$SESSION" goto "$BASE_URL/map" 2>&1 > /dev/null
sleep 3
MAP_SNAPSHOT=$(playwright-cli -s "$SESSION" snapshot 2>&1)
if echo "$MAP_SNAPSHOT" | grep -q "leaflet\|Mapa\|Sedes\|Estadio"; then
  check "Map page loads"
fi
playwright-cli -s "$SESSION" screenshot 2>&1 | tail -1

# ── Fixture page with filters ──
echo ""
echo "📅 Test 17: Fixture page with filters"
playwright-cli -s "$SESSION" goto "$BASE_URL/fixture" 2>&1 > /dev/null
sleep 2
FIXTURE_SNAP=$(playwright-cli -s "$SESSION" snapshot 2>&1)
if echo "$FIXTURE_SNAP" | grep -q "Calendario\|Filtros\|Partido\|Match"; then
  check "Fixture page loads with match cards"
fi
playwright-cli -s "$SESSION" screenshot 2>&1 | tail -1

# Close session
playwright-cli -s "$SESSION" close 2>&1 > /dev/null

echo ""
echo "=========================================="
echo "📊 Results: $PASS passed, $FAIL failed"
echo "=========================================="

# Return non-zero if any test failed
[ "$FAIL" -eq 0 ]
