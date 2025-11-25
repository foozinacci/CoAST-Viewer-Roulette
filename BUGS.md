# Known Bugs & Issues

## 1. Color Identity Display Issues

### Problem
- Color identity not displaying under player names in Leaderboard Odds queue
- Instead appears as hyphenated text to the right (e.g., "PlayerName - RWU")
- Scaling and positioning incorrect inside container boxes

### Expected Behavior
- Color identity should appear **under** the player name as color icons only
- No hyphenated name+code text format
- Icons should be properly sized and centered below the name

---

## 2. Report Deck Results Dialog - Opponent Color Selection - ✅ FIXED

### Status: RESOLVED
Color chips in the "Report Deck Results" dialog now have proper click handlers and interactivity.

### Fix Applied
- Added explicit inline styles (`cursor:pointer;pointer-events:auto;`) to color chips
- Added onclick handlers to toggle active state when chips are clicked
- Applied fix to both BO1 and BO3/BO5 match formats

### Previous Problem
- In "Report Deck Results" dialog, color chips could not be clicked or interacted with
- Color chips were missing onclick handlers and explicit pointer-events styling
- This prevented users from selecting opponent colors before saving results

---

## 3. Report Deck Results Dialog - Win/Loss Controls Missing

### Problem
- No +/- increment/decrement buttons for wins or losses
- No visible numeric count showing current wins/losses per match
- Cannot adjust match results at all

### Expected Behavior
- Each match row should have +/- buttons for both wins and losses
- Current win/loss counts should be clearly visible as numbers
- Buttons should increment/decrement the respective counts appropriately

---

## 4. Report Deck Results Dialog - Save Blocked

### Problem
- Save operation always triggers error: "Match 1: please select one of the opponent's colors before saving"
- Error fires even though there's no functional way to select opponent colors
- Dialog is effectively unusable - cannot save any results

### Expected Behavior
- Save should only validate after user has had opportunity to select opponent colors
- If opponent colors are required, the selection mechanism must be functional first
- Validation should check actual state values, not stale/incorrect data

---

## 5. History Log - Letter Codes Instead of Icons

### Problem
- When a player/result is logged, history shows letter codes for colors (e.g., "RWU", "GB")
- Inconsistent with how colors display elsewhere in the app
- History may also show hyphenated name-code combinations

### Expected Behavior
- History log should use the same color icon components used in queue/winner displays
- Visual consistency across all parts of the app
- No raw letter codes - icons only

---

## 6. Bulbs - Dull/Low Contrast Appearance

### Problem
- Bulbs (indicator lights above/around reels) appear flat, dull, and washed out
- Low contrast makes them hard to see as "lit" elements
- Don't stand out visually or convey "illuminated" state clearly

### Expected Behavior
- Bulbs should appear vivid and clearly lit (like real light bulbs)
- Strong glow effect, higher contrast, clear circular shape
- Should "pop" visually while staying consistent with overall theme
- Use techniques like box-shadow, radial gradients, brightness filters, etc.

---

## 7. Centering Issues

### Problem
- Multiple UI elements are visually off-center in their containers:
  - Player names
  - Color identity displays
  - Bulbs relative to reels/labels
  - Some section headers
- Affects both desktop and mobile layouts

### Expected Behavior
- All elements should be properly centered within their parent containers
- Use flexbox/grid alignment properties consistently
- Should remain centered across different screen sizes and breakpoints

---

## 8. Reel Spin Math Logic - ✅ VERIFIED CORRECT

### Status: RESOLVED
After comprehensive code review, the reel spin math **is fully implemented and mathematically correct**. All expected features are working properly.

### Verified Implementation
- ✅ **Weighted Random Selection**: `randomWeightedPlayer()` (index.html:3542) uses proper weighted probability
  - Each reel independently selects from active players based on their ticket counts
  - Algorithm: Calculate total weight, generate random 0-total, iterate subtracting weights until ≤0

- ✅ **Ticket-Based Odds System**:
  - Players start with [1,1,1,1,1] tickets (1 per reel)
  - Dead spins: Non-appearing players get ticket growth (0.6x to 1.18x based on player count)
  - Dead spins: Appearing players lose 1 ticket on their specific reel(s)
  - Wins: Winner keeps tickets, others double (if didn't appear) or lose 1 (if appeared)

- ✅ **Winner Detection**:
  - `detectHitWinner()`: 3+ matching player symbols wins
  - `detectLunaWinner()`: Krark (wildcard) + 2 matching players within 3-symbol window wins
  - `detectCarlo()`: All 5 CoAST letters = streamer's own deck plays

- ✅ **Special Outcomes**:
  - Krark/Luna: Wildcard symbol that enables wins with fewer player symbols
  - Ignition: Players at 12 sparks get guaranteed play opportunity
  - Dead spin guardrails: Prevents excessive losing streaks (varies by player count)

- ✅ **Edge Cases Handled**:
  - Tie-breaking: Highest hit count wins, then earliest creation time (oldest player)
  - Active vs AFK: Only active players eligible for selection and winning
  - Overflow protection: Tickets capped at 500, excess converts to sparks (500 tickets = 1 spark)
  - Zero tickets safety: Normalized to minimum of 1 ticket per reel

### Implementation Quality
The math is fair, follows proper probability theory, and matches slot machine behavior. No changes required.

---

## Development Strategy

Due to token limits and complex git history, fix these issues **one cluster at a time**:

1. **Leaderboard Odds** - Color identity display (Bug #1)
2. **Report Deck Results Dialog** - All issues (Bugs #2, #3, #4)
3. **History Log** - Icon rendering (Bug #5)
4. **Bulbs & Centering** - Visual/CSS fixes (Bugs #6, #7)
5. **Reel Spin Logic** - Core math implementation (Bug #8)

Each fix should be a focused commit on branch: `claude/fix-deck-results-dialog-015QXBLY4F6vaXmtHaov9Txx`
