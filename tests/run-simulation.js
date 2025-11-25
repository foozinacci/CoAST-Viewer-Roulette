#!/usr/bin/env node

const TICKET_CAP = 500;
const LUNA_ODDS = 1/30;
const CARLO_LETTER_ODDS = 1/75;

// Scenario Configurations
const scenarios = [
  {
    name: "CURRENT SYSTEM",
    pityMax: 7,
    deadSpinBehavior: "double",
    winSpinBehavior: "double",
    reentryBehavior: "double",
    pityReentryBehavior: "double",
    overflowDivisor: 500
  },
  {
    name: "PITY 10 + NO PITY RE-ENTRY DOUBLE",
    pityMax: 10,
    deadSpinBehavior: "double",
    winSpinBehavior: "double",
    reentryBehavior: "double",
    pityReentryBehavior: "none",
    overflowDivisor: 500
  },
  {
    name: "PITY 12 + NO PITY RE-ENTRY DOUBLE",
    pityMax: 12,
    deadSpinBehavior: "double",
    winSpinBehavior: "double",
    reentryBehavior: "double",
    pityReentryBehavior: "none",
    overflowDivisor: 500
  },
  {
    name: "PITY 15 + NO PITY RE-ENTRY DOUBLE",
    pityMax: 15,
    deadSpinBehavior: "double",
    winSpinBehavior: "double",
    reentryBehavior: "double",
    pityReentryBehavior: "none",
    overflowDivisor: 500
  },
  {
    name: "HALVE+1 + PITY 10 + NO PITY DOUBLE",
    pityMax: 10,
    deadSpinBehavior: "halve",
    winSpinBehavior: "double",
    reentryBehavior: "double",
    pityReentryBehavior: "none",
    overflowDivisor: 500
  },
  {
    name: "HALVE+1 + PITY 12 + NO PITY DOUBLE",
    pityMax: 12,
    deadSpinBehavior: "halve",
    winSpinBehavior: "double",
    reentryBehavior: "double",
    pityReentryBehavior: "none",
    overflowDivisor: 500
  },
  {
    name: "HALVE+1 + PITY 15 + NO PITY DOUBLE",
    pityMax: 15,
    deadSpinBehavior: "halve",
    winSpinBehavior: "double",
    reentryBehavior: "double",
    pityReentryBehavior: "none",
    overflowDivisor: 500
  },
  {
    name: "CONSERVATIVE: PITY 10 + OVERFLOW 600",
    pityMax: 10,
    deadSpinBehavior: "double",
    winSpinBehavior: "double",
    reentryBehavior: "double",
    pityReentryBehavior: "none",
    overflowDivisor: 600
  },
  {
    name: "AGGRESSIVE: HALVE + PITY 15 + 750",
    pityMax: 15,
    deadSpinBehavior: "halve",
    winSpinBehavior: "double",
    reentryBehavior: "double",
    pityReentryBehavior: "none",
    overflowDivisor: 750
  },
  {
    name: "ADAPTIVE: 5 + playerCount",
    pityMax: "adaptive_base5",
    deadSpinBehavior: "double",
    winSpinBehavior: "double",
    reentryBehavior: "double",
    pityReentryBehavior: "none",
    overflowDivisor: 500
  },
  {
    name: "ADAPTIVE: 7 + floor(playerCount/2)",
    pityMax: "adaptive_half",
    deadSpinBehavior: "double",
    winSpinBehavior: "double",
    reentryBehavior: "double",
    pityReentryBehavior: "none",
    overflowDivisor: 500
  },
  {
    name: "ADAPTIVE: 5 + playerCount + HALVE",
    pityMax: "adaptive_base5",
    deadSpinBehavior: "halve",
    winSpinBehavior: "double",
    reentryBehavior: "double",
    pityReentryBehavior: "none",
    overflowDivisor: 500
  }
];

function doubleTickets(player, config, actualPityMax) {
  for(let i=0; i<5; i++) {
    const raw = player.tickets[i] * 2;
    if(raw <= TICKET_CAP) {
      player.tickets[i] = raw;
    } else {
      const overflow = raw - TICKET_CAP;
      const pityTokens = overflow < config.overflowDivisor ? 1 : Math.floor(overflow / config.overflowDivisor);
      player.pityTokens = Math.min(actualPityMax, player.pityTokens + pityTokens);
      let newTickets = overflow % config.overflowDivisor;
      if(newTickets === 0) newTickets = 1;
      player.tickets[i] = newTickets;
    }
  }
}

function halveTickets(player) {
  for(let i=0; i<5; i++) {
    player.tickets[i] = Math.max(1, Math.ceil(player.tickets[i] / 2) + 1);
  }
}

function totalTickets(player) {
  return player.tickets.reduce((a,b) => a+b, 0);
}

function calculateAdaptivePityMax(formula, playerCount) {
  if(formula === "adaptive_base5") {
    return 5 + playerCount;
  } else if(formula === "adaptive_half") {
    return 7 + Math.floor(playerCount / 2);
  }
  return formula; // Fixed number
}

function simulateScenario(config, spins = 300, initialPlayerCount = 5) {
  const players = [];
  for(let i=0; i<initialPlayerCount; i++) {
    players.push({
      name: `Player${i+1}`,
      tickets: [1,1,1,1,1],
      pityTokens: 0,
      wins: 0,
      createdAt: Date.now() + i
    });
  }

  let totalWins = 0;
  let carloHits = 0;
  let lunaHits = 0;
  let fourKind = 0;
  let fiveKind = 0;
  let pityWins = 0;
  let deadSpins = 0;
  let maxDeadStreak = 0;
  let currentDeadStreak = 0;

  const ticketSnapshots = [];
  const pitySnapshots = [];

  for(let spin=0; spin<spins; spin++) {
    // Snapshot every 10 spins
    if(spin % 10 === 0) {
      const avgTickets = players.reduce((sum, p) => sum + totalTickets(p), 0) / players.length;
      const avgPity = players.reduce((sum, p) => sum + p.pityTokens, 0) / players.length;
      const maxPity = Math.max(...players.map(p => p.pityTokens));
      ticketSnapshots.push(Math.round(avgTickets));
      pitySnapshots.push({avg: avgPity.toFixed(1), max: maxPity});
    }

    // Recalculate adaptive pity max based on CURRENT player count
    const currentPityMax = calculateAdaptivePityMax(config.pityMax, players.length);

    // Check pity auto-pick
    const pityPick = players.find(p => p.pityTokens >= currentPityMax);
    if(pityPick) {
      pityPick.wins++;
      pityPick.pityTokens = 0;
      pityPick.tickets = [1,1,1,1,1];
      totalWins++;
      pityWins++;
      currentDeadStreak = 0;

      // Pity re-entry behavior
      if(config.pityReentryBehavior === "double") {
        players.forEach(p => {
          if(p !== pityPick) doubleTickets(p, config, currentPityMax);
        });
      }
      continue;
    }

    // Build spin
    const symbols = [];
    const lunaIndex = Math.random() < LUNA_ODDS ? Math.floor(Math.random()*5) : -1;
    const letters = ['C','A','R','L','O'];

    for(let i=0; i<5; i++) {
      if(i === lunaIndex) {
        symbols.push({type:'luna'});
      } else if(Math.random() < CARLO_LETTER_ODDS) {
        symbols.push({type:'letter', letter: letters[i]});
      } else {
        // Weighted random selection
        const total = players.reduce((sum, p) => sum + p.tickets[i], 0);
        let r = Math.random() * total;
        let selected = players[0];
        for(const p of players) {
          r -= p.tickets[i];
          if(r <= 0) {
            selected = p;
            break;
          }
        }
        symbols.push({type:'player', player: selected});
      }
    }

    // Check CARLO
    if(symbols.every((s,i) => s.type==='letter' && s.letter===letters[i])) {
      carloHits++;
      totalWins++;
      currentDeadStreak = 0;
      continue;
    }

    // Check Luna win
    let lunaWin = false;
    if(lunaIndex !== -1) {
      for(let start=-2; start<=0; start++) {
        const idx = lunaIndex + start;
        if(idx < 0 || idx+2 >= 5) continue;
        const triple = symbols.slice(idx, idx+3);
        const playerSyms = triple.filter(s => s.type==='player');
        if(playerSyms.length >= 2) {
          const counts = {};
          playerSyms.forEach(s => counts[s.player.name] = (counts[s.player.name]||0)+1);
          const winner = Object.keys(counts).find(name => counts[name] >= 2);
          if(winner) {
            const p = players.find(x => x.name === winner);
            p.wins++;
            p.pityTokens = 0;
            p.tickets = [1,1,1,1,1];
            totalWins++;
            lunaHits++;
            lunaWin = true;
            currentDeadStreak = 0;

            // Re-entry
            const updatedPityMax = calculateAdaptivePityMax(config.pityMax, players.length);
            if(config.reentryBehavior === "double") {
              players.forEach(other => {
                if(other !== p) doubleTickets(other, config, updatedPityMax);
              });
            }
            break;
          }
        }
      }
    }
    if(lunaWin) continue;

    // Check regular wins
    const counts = {};
    const drawnPlayers = new Set();
    symbols.forEach(s => {
      if(s.type === 'player') {
        counts[s.player.name] = (counts[s.player.name]||0)+1;
        drawnPlayers.add(s.player);
      }
    });

    let winner = null;
    let hitCount = 0;
    for(const name in counts) {
      if(counts[name] >= 3 && counts[name] > hitCount) {
        winner = players.find(p => p.name === name);
        hitCount = counts[name];
      }
    }

    if(winner) {
      winner.wins++;
      winner.pityTokens = 0;
      winner.tickets = [1,1,1,1,1];
      totalWins++;
      currentDeadStreak = 0;
      if(hitCount === 4) fourKind++;
      if(hitCount === 5) fiveKind++;

      const updatedPityMax = calculateAdaptivePityMax(config.pityMax, players.length);

      // Win spin adjustments
      players.forEach(p => {
        if(p === winner) return;
        if(drawnPlayers.has(p)) {
          // Appeared but didn't win: -1 on reels
          symbols.forEach((s, idx) => {
            if(s.type === 'player' && s.player === p) {
              p.tickets[idx] = Math.max(1, p.tickets[idx] - 1);
            }
          });
        } else {
          // Didn't appear
          if(config.winSpinBehavior === "double") {
            doubleTickets(p, config, updatedPityMax);
          }
        }
      });

      // Re-entry
      if(config.reentryBehavior === "double") {
        players.forEach(p => {
          if(p !== winner) doubleTickets(p, config, updatedPityMax);
        });
      }
    } else {
      // Dead spin
      deadSpins++;
      currentDeadStreak++;
      maxDeadStreak = Math.max(maxDeadStreak, currentDeadStreak);

      const updatedPityMax = calculateAdaptivePityMax(config.pityMax, players.length);

      players.forEach(p => {
        if(drawnPlayers.has(p)) {
          // Appeared: -1 on reels
          symbols.forEach((s, idx) => {
            if(s.type === 'player' && s.player === p) {
              p.tickets[idx] = Math.max(1, p.tickets[idx] - 1);
            }
          });
        } else {
          // Didn't appear
          if(config.deadSpinBehavior === "double") {
            doubleTickets(p, config, updatedPityMax);
          } else if(config.deadSpinBehavior === "halve") {
            halveTickets(p);
          }
        }
      });
    }
  }

  const finalPityMax = calculateAdaptivePityMax(config.pityMax, players.length);
  const finalAvgTickets = players.reduce((sum, p) => sum + totalTickets(p), 0) / players.length;
  const finalAvgPity = players.reduce((sum, p) => sum + p.pityTokens, 0) / players.length;
  const playersAtMaxPity = players.filter(p => p.pityTokens >= finalPityMax).length;

  return {
    totalWins,
    carloHits,
    lunaHits,
    fourKind,
    fiveKind,
    pityWins,
    deadSpins,
    maxDeadStreak,
    finalAvgTickets: Math.round(finalAvgTickets),
    finalAvgPity: finalAvgPity.toFixed(1),
    playersAtMaxPity,
    ticketSnapshots,
    pitySnapshots,
    winDistribution: players.map(p => p.wins),
    actualPityMax: finalPityMax,
    initialPlayerCount: initialPlayerCount,
    finalPlayerCount: players.length,
    playerCount: players.length
  };
}

function analyzeResult(result, config, spins) {
  const winRate = (result.totalWins / spins * 100).toFixed(1);
  const pityRate = (result.pityWins / result.totalWins * 100).toFixed(1);
  const actualPityMax = result.actualPityMax || config.pityMax;

  let verdict = "";
  let verdictSymbol = "";

  if(result.playersAtMaxPity >= 3) {
    verdict = "TOO EASY - Pity pile-up";
    verdictSymbol = "⚠️";
  } else if(result.pityWins / result.totalWins > 0.4) {
    verdict = "Too many pity wins";
    verdictSymbol = "⚠️";
  } else if(result.finalAvgPity > actualPityMax * 0.7) {
    verdict = "Trending toward pity cap";
    verdictSymbol = "⚠️";
  } else if(result.pityWins / result.totalWins < 0.1 && result.finalAvgPity < actualPityMax * 0.3) {
    verdict = "GOOD BALANCE";
    verdictSymbol = "✓";
  } else {
    verdict = "Moderate balance";
    verdictSymbol = "~";
  }

  return { winRate, pityRate, verdict, verdictSymbol, actualPityMax };
}

console.log("🎰 CarloMTG Slot Machine - Simulation Results (300 spins, 5 players)\n");
console.log("=".repeat(80));

scenarios.forEach((config, idx) => {
  console.log(`\n${idx + 1}. ${config.name}`);
  console.log("-".repeat(80));

  const result = simulateScenario(config, 300);
  const analysis = analyzeResult(result, config, 300);

  const pityDisplay = result.actualPityMax !== undefined
    ? `${result.actualPityMax} (5 players)`
    : config.pityMax;

  console.log(`   Config: Pity Max=${pityDisplay}, Dead=${config.deadSpinBehavior}, `);
  console.log(`           Win Re-entry=${config.reentryBehavior}, Pity Re-entry=${config.pityReentryBehavior}`);
  console.log(`           Overflow Divisor=${config.overflowDivisor}`);
  console.log();
  console.log(`   Total Wins:       ${result.totalWins} (${analysis.winRate}%)`);
  console.log(`   Pity Wins:        ${result.pityWins} (${analysis.pityRate}% of wins)`);
  console.log(`   CARLO Jackpots:   ${result.carloHits}`);
  console.log(`   Luna Wins:        ${result.lunaHits}`);
  console.log(`   4-of-a-kind:      ${result.fourKind}`);
  console.log(`   5-of-a-kind:      ${result.fiveKind}`);
  console.log(`   Dead Spins:       ${result.deadSpins}`);
  console.log(`   Max Dead Streak:  ${result.maxDeadStreak}`);
  console.log();
  console.log(`   Final Avg Tickets: ${result.finalAvgTickets}`);
  console.log(`   Final Avg Pity:    ${result.finalAvgPity} / ${analysis.actualPityMax}`);
  console.log(`   Players at Max:    ${result.playersAtMaxPity} / 5`);
  console.log();
  console.log(`   VERDICT: ${analysis.verdictSymbol} ${analysis.verdict}`);
});

console.log("\n" + "=".repeat(80));
console.log("\n🎯 SUMMARY: Look for scenarios with '✓ GOOD BALANCE' verdict");
console.log("   Good balance means: <10% pity wins, low pity accumulation, effective spinning\n");
