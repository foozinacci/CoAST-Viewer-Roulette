# Luna & CARLO Adaptive Scaling Analysis

## Current Implementation ✅

### Luna Spawn Logic
```javascript
// 1. Roll once per spin to decide if Luna appears
const luna = forceLuna || Math.random() < lunaOdds;

// 2. If Luna spawns, pick ONE random reel (0-4)
const lunaIndex = luna ? Math.floor(Math.random()*5) : -1;

// 3. In the reel loop, place Luna at that index
if(i === lunaIndex){
  symbols.push({type:'luna'});  // Exactly 1 Luna
  continue;
}
```

**Result**: Luna appears **0 or 1 times per spin, NEVER 2+** ✅

### CARLO Letter Logic
```javascript
// For each non-Luna reel, roll for CARLO letter vs player
const roll = Math.random();
if(roll < carloLetterOdds){
  symbols.push({type:'letter', letter:letters[i]});  // C, A, R, L, or O
}else{
  // Player symbol or fallback letter
}
```

**Result**: Each reel independently decides letter vs player ✅

---

## Interaction Analysis

### How Luna and CARLO Interact

1. **Luna CANNOT trigger CARLO** ✅
   - Luna takes one reel position
   - CARLO requires all 5 positions to be letters C-A-R-L-O
   - If Luna is present, maximum possible CARLO letters = 4
   - Therefore: **Luna and CARLO are mutually exclusive**

2. **Luna and CARLO Scaling Work in Harmony** ✅
   - High player counts: Luna MORE frequent, CARLO letters LESS frequent
   - This is correct because:
     - More Luna = more wild cards to help diluted player pool
     - Fewer letters = more player symbols = higher win rates
     - They complement each other!

---

## Current Scaling Rates

### Luna Spawn Odds (Per Spin)
| Players | Odds   | Probability | Spins Between Luna |
|---------|--------|-------------|-------------------|
| 1-5     | 1/30   | 3.33%       | ~30 spins         |
| 6-10    | 1/25   | 4.00%       | ~25 spins         |
| 11-20   | 1/20   | 5.00%       | ~20 spins         |
| 21-35   | 1/15   | 6.67%       | ~15 spins         |
| 36-75   | 1/12   | 8.33%       | ~12 spins         |

### CARLO Letter Odds (Per Reel)
| Players | Odds   | Probability | Expected CARLO Jackpot |
|---------|--------|-------------|------------------------|
| 1-3     | 1/75   | 1.33%       | 1 in 2.4 billion spins |
| 4-5     | 1/85   | 1.18%       | 1 in 4.8 billion spins |
| 6-10    | 1/95   | 1.05%       | 1 in 8.6 billion spins |
| 11-20   | 1/110  | 0.91%       | 1 in 16 billion spins  |
| 21-35   | 1/130  | 0.77%       | 1 in 37 billion spins  |
| 36-75   | 1/150  | 0.67%       | 1 in 76 billion spins  |

**Note**: CARLO jackpot odds = (letter odds)^5 since all 5 reels need letters

---

## Mathematical Relationship

### Combined Effect on Game Balance

At **20 players**:
- Luna odds: 1/20 (5% per spin)
- CARLO letter odds: 1/110 per reel (0.91%)
- Player symbol odds: ~99.09% per reel (when not Luna)

**Expected spin outcome**:
- 95% of spins: No Luna → 5 reels roll letter vs player
- 5% of spins: Luna on 1 reel → 4 reels roll letter vs player

**With 1/110 CARLO letter odds**:
- Each non-Luna reel has ~99.09% chance of player symbol
- This means MORE player symbols = HIGHER 3-of-a-kind probability

**The scaling works because**:
1. Luna frequency increases → more wild cards
2. Letter odds decrease → more player symbols
3. Together: More opportunities for 3+ player matches!

---

## Potential Optimization: Complementary Scaling

Current scaling is good, but we could make it more aggressive for 20+ players:

### Option A: More Aggressive Luna (Recommended)
```javascript
function getLunaBaseOdds(activePlayerCount){
  if(activePlayerCount <= 5) return 1/30;    // 3.33%
  if(activePlayerCount <= 10) return 1/22;   // 4.55% (↑ from 4%)
  if(activePlayerCount <= 20) return 1/16;   // 6.25% (↑ from 5%)
  if(activePlayerCount <= 35) return 1/12;   // 8.33% (↑ from 6.67%)
  return 1/10;                                // 10% (↑ from 8.33%) - VERY aggressive
}
```

### Option B: Fewer CARLO Letters (Recommended)
```javascript
function getCarloLetterOdds(activePlayerCount){
  if(activePlayerCount <= 3) return 1/75;     // 1.33%
  if(activePlayerCount <= 5) return 1/90;     // 1.11% (↓ from 1.18%)
  if(activePlayerCount <= 10) return 1/110;   // 0.91% (↓ from 1.05%)
  if(activePlayerCount <= 20) return 1/140;   // 0.71% (↓ from 0.91%)
  if(activePlayerCount <= 35) return 1/180;   // 0.56% (↓ from 0.77%)
  return 1/200;                                // 0.50% (↓ from 0.67%) - Very few letters
}
```

### Option C: Both (Most Aggressive)
Combine both adjustments for maximum player engagement at high counts.

---

## Recommendation

**Current implementation is CORRECT** ✅

The logic properly ensures:
1. Luna appears 0 or 1 times per spin (never 2+)
2. Luna and CARLO cannot both occur
3. Scaling is harmonious and complementary

**Should we adjust scaling?**

Based on simulation results showing 20 players still at only 5.25% win rate, I recommend **Option C (Both)** for more aggressive scaling at high player counts.

This would improve 20+ player experience without affecting 1-10 player balance.
