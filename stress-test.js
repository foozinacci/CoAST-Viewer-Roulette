#!/usr/bin/env node

/**
 * CARLO Slot Stress Test
 * Tests balance at 5, 10, 25, and 50 users
 */

const MAX_PITY_TOKENS = 12;
const TICKET_CAP = 500;
const LUNA_BASE_ODDS = 1/30;
const CARLO_LETTER_ODDS = 1/75;

function simulateStressTest(playerCount, spins = 300) {
  const players = [];
  for (let i = 0; i < playerCount; i++) {
    players.push({
      name: `Player${i+1}`,
      tickets: [1,1,1,1,1],
      pityTokens: 0,
      createdAt: Date.now() + i,
      wins: 0
    });
  }

  function randomPlayer(idx, arr) {
    let tot = 0;
    arr.forEach(p => tot += p.tickets[idx]);
    const r = Math.random() * tot;
    let x = r;
    for (const p of arr) {
      if (x < p.tickets[idx]) return p;
      x -= p.tickets[idx];
    }
    return arr[arr.length-1];
  }

  function normTickets() {
    players.forEach(p => {
      const tot = p.tickets.reduce((a,b) => a+b, 0);
      if (tot === 0) p.tickets = [1,1,1,1,1];
    });
  }

  function applyOverflow(player, overflow) {
    if (overflow <= 0) return;
    let pityFromOverflow = overflow < 500 ? 1 : Math.floor(overflow / 500);
    player.pityTokens = Math.min(player.pityTokens + pityFromOverflow, MAX_PITY_TOKENS);
  }

  normTickets();
  let wins = 0, carlo = 0, luna = 0, fourKind = 0, fiveKind = 0, pityWins = 0, deadSpins = 0;
  const winDistribution = {};
  players.forEach(p => winDistribution[p.name] = 0);

  for (let spin = 0; spin < spins; spin++) {
    // Pity check
    const candPity = players.filter(p => p.pityTokens >= MAX_PITY_TOKENS);
    if (candPity.length > 0) {
      candPity.sort((a,b) => a.createdAt - b.createdAt);
      const p = candPity[0];
      wins++; pityWins++; p.wins++; p.pityTokens = 0;
      winDistribution[p.name]++;
      continue;
    }

    const symbols = [];
    let lunaIndex = -1;
    if (Math.random() < LUNA_BASE_ODDS) {
      lunaIndex = Math.floor(Math.random() * 5);
    }
    const letters = ['C','A','R','L','O'];
    for (let i = 0; i < 5; i++) {
      if (i === lunaIndex) {
        symbols.push({type:'luna'});
        continue;
      }
      if (Math.random() < CARLO_LETTER_ODDS) {
        symbols.push({type:'letter', letter:letters[i]});
      } else {
        const p = randomPlayer(i, players);
        symbols.push({type:'player', name:p.name});
      }
    }

    // CARLO check
    if (symbols.every((s,i) => s.type==='letter' && s.letter===letters[i])) {
      carlo++;
      continue;
    }

    // Luna winner
    let lunaWinner = null;
    if (lunaIndex !== -1) {
      for (let i = -2; i <= 0; i++) {
        const idx = lunaIndex + i;
        if (idx < 0 || idx + 2 >= 5) continue;
        const triple = symbols.slice(idx, idx + 3);
        const ps = triple.filter(x => x.type === 'player');
        if (ps.length === 0) continue;
        const cts = {};
        ps.forEach(x => cts[x.name] = (cts[x.name] || 0) + 1);
        const candidate = Object.keys(cts).find(n => cts[n] >= 2);
        if (candidate) {
          lunaWinner = candidate;
          break;
        } else if (ps.length === 1) {
          lunaWinner = ps[0].name;
          break;
        }
      }
    }

    if (lunaWinner) {
      luna++; wins++;
      const winner = players.find(p => p.name === lunaWinner);
      if (winner) {
        winner.wins++;
        winDistribution[winner.name]++;
      }
      continue;
    }

    // Normal hit check
    const hits = {};
    let hitPlayer = null;
    let hitCount = 0;
    symbols.forEach(s => {
      if (s.type === 'player') {
        hits[s.name] = (hits[s.name] || 0) + 1;
        if (hits[s.name] > hitCount) {
          hitPlayer = s.name;
          hitCount = hits[s.name];
        }
      }
    });

    if (hitCount >= 3) {
      wins++;
      const winner = players.find(p => p.name === hitPlayer);
      if (winner) {
        winner.wins++;
        winDistribution[winner.name]++;
      }
      if (hitCount === 4) fourKind++;
      if (hitCount === 5) fiveKind++;

      // Handle tickets for win
      const reelPlayers = [];
      symbols.forEach((s, idx) => {
        if (s.type === 'player') {
          reelPlayers.push({index: idx, name: s.name});
        }
      });

      players.forEach(p => {
        if (p.name === hitPlayer) {
          // Winner resets to 1
          for (let i = 0; i < 5; i++) p.tickets[i] = 1;
        } else {
          // Non-winners
          const appeared = reelPlayers.some(rp => rp.name === p.name);
          if (appeared) {
            // Spend 1 ticket on reels they appeared
            reelPlayers.forEach(rp => {
              if (rp.name === p.name) {
                p.tickets[rp.index] = Math.max(1, p.tickets[rp.index] - 1);
              }
            });
          } else {
            // Double all tickets
            for (let i = 0; i < 5; i++) {
              let newVal = p.tickets[i] * 2;
              if (newVal > TICKET_CAP) {
                const overflow = newVal - TICKET_CAP;
                p.tickets[i] = TICKET_CAP;
                applyOverflow(p, overflow);
              } else {
                p.tickets[i] = newVal;
              }
            }
          }
        }
      });
    } else {
      // Dead spin
      deadSpins++;
      const reelPlayers = [];
      symbols.forEach((s, idx) => {
        if (s.type === 'player') {
          reelPlayers.push({index: idx, name: s.name});
        }
      });

      players.forEach(p => {
        const appeared = reelPlayers.some(rp => rp.name === p.name);
        if (appeared) {
          // Spend 1 ticket
          reelPlayers.forEach(rp => {
            if (rp.name === p.name) {
              p.tickets[rp.index] = Math.max(1, p.tickets[rp.index] - 1);
            }
          });
        } else {
          // Halve +1
          for (let i = 0; i < 5; i++) {
            let newVal = Math.ceil(p.tickets[i] / 2) + 1;
            if (newVal > TICKET_CAP) {
              const overflow = newVal - TICKET_CAP;
              p.tickets[i] = TICKET_CAP;
              applyOverflow(p, overflow);
            } else {
              p.tickets[i] = newVal;
            }
          }
        }
      });
    }
  }

  // Calculate distribution stats
  const winCounts = Object.values(winDistribution);
  const avgWins = winCounts.reduce((a,b) => a+b, 0) / playerCount;
  const maxWins = Math.max(...winCounts);
  const minWins = Math.min(...winCounts);
  const stdDev = Math.sqrt(winCounts.reduce((sum, w) => sum + Math.pow(w - avgWins, 2), 0) / playerCount);

  return {
    playerCount,
    wins,
    carlo,
    luna,
    fourKind,
    fiveKind,
    pityWins,
    deadSpins,
    winRate: ((wins / spins) * 100).toFixed(1),
    pityRate: ((pityWins / spins) * 100).toFixed(1),
    avgWinsPerPlayer: avgWins.toFixed(2),
    minWins,
    maxWins,
    stdDev: stdDev.toFixed(2),
    fairness: (stdDev / avgWins).toFixed(3) // Lower is more fair
  };
}

console.log('╔═══════════════════════════════════════════════════╗');
console.log('║   CARLO Slot Stress Test - Balance Analysis      ║');
console.log('╚═══════════════════════════════════════════════════╝\n');

const testCases = [5, 10, 25, 50];

testCases.forEach(playerCount => {
  console.log(`\n${'='.repeat(55)}`);
  console.log(`  Testing with ${playerCount} players (300 spins)`);
  console.log('='.repeat(55));

  const result = simulateStressTest(playerCount);

  console.log(`\n📊 Win Distribution:`);
  console.log(`  Total wins: ${result.wins} (${result.winRate}%)`);
  console.log(`  CARLO jackpots: ${result.carlo}`);
  console.log(`  Luna Luck: ${result.luna}`);
  console.log(`  4-of-a-kind: ${result.fourKind}`);
  console.log(`  5-of-a-kind: ${result.fiveKind}`);
  console.log(`  Pity wins: ${result.pityWins} (${result.pityRate}%)`);
  console.log(`  Dead spins: ${result.deadSpins}`);

  console.log(`\n📈 Fairness Analysis:`);
  console.log(`  Avg wins per player: ${result.avgWinsPerPlayer}`);
  console.log(`  Min/Max wins: ${result.minWins} / ${result.maxWins}`);
  console.log(`  Standard deviation: ${result.stdDev}`);
  console.log(`  Fairness coefficient: ${result.fairness} (lower = more fair)`);

  // Thresholds
  const passWinRate = result.winRate >= 30 && result.winRate <= 40;
  const passPityRate = result.pityRate <= 10;
  const passFairness = result.fairness < 0.5;

  console.log(`\n✅ Balance Checks:`);
  console.log(`  Win rate (30-40%): ${passWinRate ? '✓ PASS' : '✗ FAIL'} (${result.winRate}%)`);
  console.log(`  Pity rate (<10%): ${passPityRate ? '✓ PASS' : '✗ FAIL'} (${result.pityRate}%)`);
  console.log(`  Fairness (<0.5): ${passFairness ? '✓ PASS' : '✗ FAIL'} (${result.fairness})`);

  if (passWinRate && passPityRate && passFairness) {
    console.log(`\n  🎉 ${playerCount} players: ALL CHECKS PASSED`);
  } else {
    console.log(`\n  ⚠️  ${playerCount} players: SOME CHECKS FAILED`);
  }
});

console.log(`\n${'='.repeat(55)}`);
console.log('Stress test complete!');
console.log('='.repeat(55) + '\n');
