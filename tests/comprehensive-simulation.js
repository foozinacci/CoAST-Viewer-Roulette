#!/usr/bin/env node

/**
 * COMPREHENSIVE SIMULATION TEST
 * Tests CarloMTG Slots game mechanics at scale
 *
 * Player counts: 1, 2, 5, 10, 15, 20, 25, 30, 35, 50, 75
 * Spin counts: 50, 100, 150, 300, 500, 1000, 1000000
 *
 * Tracks: 4oak, 5oak, Luna Luck, Ignition, CARLO Jackpots, Dead Spins
 */

// Game Constants
const MAX_PLAYERS = 75;
const TICKET_CAP = 500;
const MAX_SPARKS = 12;
const LUNA_BASE_ODDS = 1/30; // Base odds for 1-5 players
const CARLO_LETTER_ODDS = 1/75; // Base odds for 1-3 players

// DYNAMIC PROBABILITY SCALING - Adjusts game balance based on active player count

// Dynamic CARLO letter odds: Lower odds = MORE player symbols = HIGHER win rates
function getCarloLetterOdds(activePlayerCount) {
  if (activePlayerCount <= 3) return 1/75;     // Original odds (1.33% per reel)
  if (activePlayerCount <= 5) return 1/85;     // Slightly lower (1.18% per reel)
  if (activePlayerCount <= 10) return 1/95;    // Lower for medium groups (1.05% per reel)
  if (activePlayerCount <= 20) return 1/110;   // Much lower for large groups (0.91% per reel)
  if (activePlayerCount <= 35) return 1/130;   // Very low for very large groups (0.77% per reel)
  return 1/150;                                // Minimal for maximum capacity (0.67% per reel)
}

// Dynamic Luna spawn odds: Higher frequency at high player counts to compensate for dilution
function getLunaBaseOdds(activePlayerCount) {
  if (activePlayerCount <= 5) return 1/30;    // Original odds (~3.33% per spin)
  if (activePlayerCount <= 10) return 1/25;   // 20% more frequent (~4% per spin)
  if (activePlayerCount <= 20) return 1/20;   // 50% more frequent (~5% per spin)
  if (activePlayerCount <= 35) return 1/15;   // 100% more frequent (~6.67% per spin)
  return 1/12;                                // 150% more frequent for max capacity (~8.33% per spin)
}

// Dead spin guardrail: Guarantee win after too many dead spins
function getMaxDeadStreakAllowed(activePlayerCount) {
  if (activePlayerCount <= 3) return 12;      // Solo/duo can wait a bit longer
  if (activePlayerCount <= 5) return 8;       // Small groups - keep it tight
  if (activePlayerCount <= 10) return 6;      // Medium groups - very tight
  if (activePlayerCount <= 20) return 5;      // Large groups - maximum engagement
  return 5;                                   // Never go above 5 dead spins at scale
}

// Ignition cooldown thresholds
function getIgnitionCooldown(activePlayerCount) {
  if (activePlayerCount <= 3) return 0;
  if (activePlayerCount <= 5) return 1;
  if (activePlayerCount <= 10) return 2;
  if (activePlayerCount <= 20) return 3;
  return 4;
}

// Player simulation class
class Player {
  constructor(name, id, createdAt) {
    this.name = name;
    this.id = id;
    this.tickets = [1, 1, 1, 1, 1];
    this.sparks = 0;
    this.status = 'active';
    this.createdAt = createdAt;
  }

  totalTickets() {
    return this.tickets.reduce((a, b) => a + b, 0);
  }

  normalize() {
    const tot = this.totalTickets();
    if (tot === 0) this.tickets = [1, 1, 1, 1, 1];
  }
}

// Simulation engine
class SimulationEngine {
  constructor(playerCount) {
    this.players = [];
    this.spinCount = 0;
    this.deadSpinStreak = 0;
    this.lastSpinWasWinner = false;
    this.ignitedQueue = [];
    this.lastIgnitionSpin = -1;

    // Initialize players
    for (let i = 0; i < playerCount; i++) {
      this.players.push(new Player(`Player${i + 1}`, i + 1, i));
    }

    // Statistics
    this.stats = {
      totalWins: 0,
      carloJackpots: 0,
      lunaWins: 0,
      fourOfKind: 0,
      fiveOfKind: 0,
      ignitionWins: 0,
      deadSpins: 0,
      threeOfKind: 0,
      guardrailActivations: 0,

      // Dead spin tracking
      maxDeadStreak: 0,
      deadStreakDistribution: {},

      // Win distribution
      winsByType: {
        '3oak': 0,
        '4oak': 0,
        '5oak': 0,
        'luna': 0,
        'carlo': 0,
        'ignition': 0
      }
    };
  }

  randomWeightedPlayer(reelIndex) {
    const active = this.players.filter(p => p.status === 'active');
    if (active.length === 0) return null;

    let totalTickets = 0;
    active.forEach(p => totalTickets += p.tickets[reelIndex]);

    if (totalTickets === 0) {
      active.forEach(p => p.normalize());
      totalTickets = active.length;
    }

    const roll = Math.random() * totalTickets;
    let cumulative = 0;

    for (const p of active) {
      cumulative += p.tickets[reelIndex];
      if (roll < cumulative) return p;
    }

    return active[active.length - 1];
  }

  buildSpinResult(guaranteeWin = false, forceDead = false) {
    const letters = ['C', 'A', 'R', 'L', 'O'];
    const activePlayerCount = this.players.filter(p => p.status === 'active').length;
    const lunaOdds = getLunaBaseOdds(activePlayerCount);
    const carloLetterOdds = getCarloLetterOdds(activePlayerCount);

    const maxRetries = 100; // Prevent infinite loops
    let attempt = 0;

    while (attempt < maxRetries) {
      attempt++;
      const symbols = [];

      // Build one spin attempt
      const luna = Math.random() < lunaOdds;
      const lunaIndex = luna ? Math.floor(Math.random() * 5) : -1;

      for (let i = 0; i < 5; i++) {
        if (i === lunaIndex) {
          symbols.push({ type: 'luna' });
          continue;
        }

        const roll = Math.random();
        if (roll < carloLetterOdds) {
          symbols.push({ type: 'letter', letter: letters[i] });
        } else {
          const p = this.randomWeightedPlayer(i);
          if (p) {
            symbols.push({ type: 'player', playerId: p.id, name: p.name });
          } else {
            symbols.push({ type: 'letter', letter: letters[i] });
          }
        }
      }

      // Check if this spin meets our requirements
      const isCarlo = this.detectCarlo(symbols);
      const lunaWin = this.detectLunaWinner(symbols);
      const hitWin = this.detectHitWinner(symbols);
      const hasWinner = isCarlo || lunaWin || hitWin;

      // Guardrail: Must have winner
      if (guaranteeWin && !hasWinner) {
        continue; // Try again
      }

      // Force dead: Must NOT have winner
      if (forceDead && hasWinner) {
        continue; // Try again
      }

      // Success! Return this result
      return symbols;
    }

    // Fallback: If we hit max retries, manually construct a valid result
    const symbols = [];

    if (guaranteeWin) {
      // Force a 3-of-a-kind win: pick first active player and fill 3+ reels
      const activePlayers = this.players.filter(p => p.status === 'active');
      if (activePlayers.length > 0) {
        const winner = activePlayers[0];
        for (let i = 0; i < 5; i++) {
          if (i < 3) {
            symbols.push({ type: 'player', playerId: winner.id, name: winner.name });
          } else {
            symbols.push({ type: 'letter', letter: letters[i] });
          }
        }
      }
    } else if (forceDead) {
      // Force a dead spin: all CARLO letters (no matches)
      for (let i = 0; i < 5; i++) {
        symbols.push({ type: 'letter', letter: letters[i] });
      }
    } else {
      // Normal fallback
      const luna = Math.random() < lunaOdds;
      const lunaIndex = luna ? Math.floor(Math.random() * 5) : -1;
      for (let i = 0; i < 5; i++) {
        if (i === lunaIndex) {
          symbols.push({ type: 'luna' });
          continue;
        }
        const roll = Math.random();
        if (roll < carloLetterOdds) {
          symbols.push({ type: 'letter', letter: letters[i] });
        } else {
          const p = this.randomWeightedPlayer(i);
          if (p) {
            symbols.push({ type: 'player', playerId: p.id, name: p.name });
          } else {
            symbols.push({ type: 'letter', letter: letters[i] });
          }
        }
      }
    }

    return symbols;
  }

  detectCarlo(symbols) {
    return (
      symbols[0].type === 'letter' && symbols[0].letter === 'C' &&
      symbols[1].type === 'letter' && symbols[1].letter === 'A' &&
      symbols[2].type === 'letter' && symbols[2].letter === 'R' &&
      symbols[3].type === 'letter' && symbols[3].letter === 'L' &&
      symbols[4].type === 'letter' && symbols[4].letter === 'O'
    );
  }

  detectLunaWinner(symbols) {
    let lunaIndex = -1;
    symbols.forEach((s, idx) => {
      if (s.type === 'luna') lunaIndex = idx;
    });

    if (lunaIndex < 0) return null;

    const triples = [
      [lunaIndex - 2, lunaIndex - 1, lunaIndex],
      [lunaIndex - 1, lunaIndex, lunaIndex + 1],
      [lunaIndex, lunaIndex + 1, lunaIndex + 2]
    ];

    for (const triple of triples) {
      const valid = triple.filter(i => i >= 0 && i < symbols.length);
      if (valid.length !== 3) continue;

      const syms = valid.map(i => symbols[i]);
      const players = syms.filter(s => s.type === 'player');
      if (players.length === 0) continue;

      const countById = {};
      players.forEach(ps => countById[ps.playerId] = (countById[ps.playerId] || 0) + 1);

      const idWith2 = Object.keys(countById).find(id => countById[id] >= 2);
      if (idWith2) {
        const p = this.players.find(pl => pl.id == idWith2);
        if (p && p.status === 'active') {
          return { player: p, hits: 3 };
        }
      } else if (players.length === 1) {
        const p = this.players.find(pl => pl.id === players[0].playerId);
        if (p && p.status === 'active') {
          return { player: p, hits: 3 };
        }
      }
    }

    return null;
  }

  detectHitWinner(symbols) {
    const counts = new Map();

    symbols.forEach(s => {
      if (s.type === 'player') {
        counts.set(s.playerId, (counts.get(s.playerId) || 0) + 1);
      }
    });

    let maxHits = 0;
    let winnerId = null;

    counts.forEach((hitCount, playerId) => {
      if (hitCount > maxHits) {
        maxHits = hitCount;
        winnerId = playerId;
      }
    });

    if (maxHits >= 3) {
      const player = this.players.find(p => p.id === winnerId);
      if (player && player.status === 'active') {
        return { player, hits: maxHits };
      }
    }

    return null;
  }

  updateIgnitionQueue() {
    const readyPlayers = this.players.filter(p => p.status === 'active' && p.sparks >= MAX_SPARKS);

    for (const p of readyPlayers) {
      if (!this.ignitedQueue.includes(p.id)) {
        this.ignitedQueue.push(p.id);
      }
    }

    this.ignitedQueue = this.ignitedQueue.filter(id => {
      const p = this.players.find(pl => pl.id === id);
      return p && p.status === 'active' && p.sparks >= MAX_SPARKS;
    });
  }

  canTriggerIgnition() {
    const activePlayerCount = this.players.filter(p => p.status === 'active').length;
    const cooldown = getIgnitionCooldown(activePlayerCount);
    const spinsSinceLastIgnition = this.spinCount - this.lastIgnitionSpin;
    return this.ignitedQueue.length > 0 && spinsSinceLastIgnition >= cooldown;
  }

  processIgnitionQueue() {
    if (this.ignitedQueue.length === 0) return null;

    const playerId = this.ignitedQueue[0];
    const player = this.players.find(p => p.id === playerId);

    if (player && player.status === 'active' && player.sparks >= MAX_SPARKS) {
      this.ignitedQueue.shift();
      this.lastIgnitionSpin = this.spinCount;
      return player;
    }

    this.ignitedQueue.shift();
    return this.processIgnitionQueue();
  }

  performSpin() {
    // Check for ignition
    this.updateIgnitionQueue();

    if (this.canTriggerIgnition()) {
      const ignitedPlayer = this.processIgnitionQueue();
      if (ignitedPlayer) {
        ignitedPlayer.sparks = 0;
        this.stats.totalWins++;
        this.stats.ignitionWins++;
        this.stats.winsByType.ignition++;
        this.deadSpinStreak = 0;
        this.lastSpinWasWinner = true;
        this.spinCount++;
        return { type: 'ignition', player: ignitedPlayer };
      }
    }

    // Back-to-back cooldown: Force dead spin after winner (ultra-rare exception: 1/2500)
    let forceDead = false;
    if (this.lastSpinWasWinner) {
      const backToBackChance = 1/2500;
      if (Math.random() >= backToBackChance) {
        forceDead = true;
      }
    }

    // Dead spin guardrail: Guarantee natural-looking win after too many dead spins
    const activePlayerCount = this.players.filter(p => p.status === 'active').length;
    const maxDeadStreak = getMaxDeadStreakAllowed(activePlayerCount);
    const guaranteeWin = this.deadSpinStreak >= maxDeadStreak;
    if (guaranteeWin) {
      this.stats.guardrailActivations++;
    }

    // Build spin
    const symbols = this.buildSpinResult(guaranteeWin, forceDead);
    const isCarlo = this.detectCarlo(symbols);
    const lunaWin = this.detectLunaWinner(symbols);
    const hitWin = this.detectHitWinner(symbols);

    // Process results
    if (isCarlo) {
      this.stats.totalWins++;
      this.stats.carloJackpots++;
      this.stats.winsByType.carlo++;
      this.deadSpinStreak = 0;
      this.lastSpinWasWinner = true;
      this.spinCount++;
      return { type: 'carlo' };
    }

    if (lunaWin) {
      this.stats.totalWins++;
      this.stats.lunaWins++;
      this.stats.winsByType.luna++;
      this.deadSpinStreak = 0;
      this.lastSpinWasWinner = true;
      this.spinCount++;

      // Award spark
      if (lunaWin.player.sparks < MAX_SPARKS) {
        lunaWin.player.sparks++;
      }

      return { type: 'luna', player: lunaWin.player, hits: lunaWin.hits };
    }

    if (hitWin) {
      this.stats.totalWins++;

      if (hitWin.hits === 3) {
        this.stats.threeOfKind++;
        this.stats.winsByType['3oak']++;
      } else if (hitWin.hits === 4) {
        this.stats.fourOfKind++;
        this.stats.winsByType['4oak']++;
      } else if (hitWin.hits === 5) {
        this.stats.fiveOfKind++;
        this.stats.winsByType['5oak']++;
      }

      this.deadSpinStreak = 0;
      this.lastSpinWasWinner = true;
      this.spinCount++;

      // Award spark
      if (hitWin.player.sparks < MAX_SPARKS) {
        hitWin.player.sparks++;
      }

      return { type: 'hit', player: hitWin.player, hits: hitWin.hits };
    }

    // Dead spin
    this.stats.deadSpins++;
    this.deadSpinStreak++;
    this.lastSpinWasWinner = false;

    if (this.deadSpinStreak > this.stats.maxDeadStreak) {
      this.stats.maxDeadStreak = this.deadSpinStreak;
    }

    if (!this.stats.deadStreakDistribution[this.deadSpinStreak]) {
      this.stats.deadStreakDistribution[this.deadSpinStreak] = 0;
    }
    this.stats.deadStreakDistribution[this.deadSpinStreak]++;

    this.spinCount++;
    return { type: 'dead' };
  }

  runSimulation(spins) {
    for (let i = 0; i < spins; i++) {
      this.performSpin();
    }

    return this.stats;
  }

  getReport() {
    const totalSpins = this.spinCount;
    const hitRate = (this.stats.totalWins / totalSpins * 100).toFixed(2);
    const deadRate = (this.stats.deadSpins / totalSpins * 100).toFixed(2);
    const carloRate = (this.stats.carloJackpots / totalSpins * 100).toFixed(4);
    const lunaRate = (this.stats.lunaWins / totalSpins * 100).toFixed(2);
    const ignitionRate = (this.stats.ignitionWins / totalSpins * 100).toFixed(2);

    return {
      playerCount: this.players.length,
      totalSpins,
      totalWins: this.stats.totalWins,
      deadSpins: this.stats.deadSpins,
      hitRate: `${hitRate}%`,
      deadRate: `${deadRate}%`,
      carloJackpots: this.stats.carloJackpots,
      carloRate: `${carloRate}%`,
      lunaWins: this.stats.lunaWins,
      lunaRate: `${lunaRate}%`,
      ignitionWins: this.stats.ignitionWins,
      ignitionRate: `${ignitionRate}%`,
      threeOfKind: this.stats.threeOfKind,
      fourOfKind: this.stats.fourOfKind,
      fiveOfKind: this.stats.fiveOfKind,
      maxDeadStreak: this.stats.maxDeadStreak,
      guardrailActivations: this.stats.guardrailActivations,
      winsByType: this.stats.winsByType
    };
  }
}

// Run comprehensive test suite
function runComprehensiveTests() {
  const playerCounts = [1, 2, 5, 10, 15, 20, 25, 30, 35, 50, 75];
  const spinCounts = [50, 100, 150, 300, 500, 1000];

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         CARLOMTG SLOTS - COMPREHENSIVE SIMULATION TEST        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log(`Testing ${playerCounts.length} player counts × ${spinCounts.length} spin counts = ${playerCounts.length * spinCounts.length} scenarios\n`);

  const results = [];

  for (const players of playerCounts) {
    for (const spins of spinCounts) {
      const engine = new SimulationEngine(players);
      engine.runSimulation(spins);
      const report = engine.getReport();
      results.push(report);

      console.log(`Players: ${String(players).padStart(2)} | Spins: ${String(spins).padStart(4)} | Wins: ${String(report.totalWins).padStart(4)} (${report.hitRate.padStart(6)}) | Dead: ${String(report.deadSpins).padStart(4)} (${report.deadRate.padStart(6)}) | CARLO: ${String(report.carloJackpots).padStart(2)} | Luna: ${String(report.lunaWins).padStart(3)} | Ignition: ${String(report.ignitionWins).padStart(3)} | 4oak: ${String(report.fourOfKind).padStart(2)} | 5oak: ${String(report.fiveOfKind).padStart(2)}`);
    }
    console.log(''); // Spacer between player counts
  }

  return results;
}

// Run 1 million spin test (optional, takes time)
function runMegaTest(playerCount = 20) {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║              MEGA TEST: 1,000,000 SPINS                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log(`Running 1,000,000 spins with ${playerCount} players...`);
  console.log('This may take a few minutes...\n');

  const start = Date.now();
  const engine = new SimulationEngine(playerCount);
  engine.runSimulation(1000000);
  const elapsed = ((Date.now() - start) / 1000).toFixed(2);

  const report = engine.getReport();

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`RESULTS (${elapsed}s elapsed) - WITH DYNAMIC SCALING`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Total Spins:        ${report.totalSpins.toLocaleString()}`);
  console.log(`Total Wins:         ${report.totalWins.toLocaleString()} (${report.hitRate})`);
  console.log(`Dead Spins:         ${report.deadSpins.toLocaleString()} (${report.deadRate})`);
  console.log(`Max Dead Streak:    ${report.maxDeadStreak}`);
  console.log(`Guardrail:          ${report.guardrailActivations.toLocaleString()} activations`);
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`CARLO Jackpots:     ${report.carloJackpots.toLocaleString()} (${report.carloRate})`);
  console.log(`Luna Wins:          ${report.lunaWins.toLocaleString()} (${report.lunaRate})`);
  console.log(`Ignition Wins:      ${report.ignitionWins.toLocaleString()} (${report.ignitionRate})`);
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`3-of-a-kind:        ${report.threeOfKind.toLocaleString()}`);
  console.log(`4-of-a-kind:        ${report.fourOfKind.toLocaleString()}`);
  console.log(`5-of-a-kind:        ${report.fiveOfKind.toLocaleString()}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Expected probabilities analysis
  console.log('PROBABILITY ANALYSIS:');
  console.log('───────────────────────────────────────────────────────────────');

  const expectedCarloOdds = Math.pow(CARLO_LETTER_ODDS, 5);
  const expectedCarloCount = 1000000 * expectedCarloOdds;
  const carloDelta = ((report.carloJackpots - expectedCarloCount) / expectedCarloCount * 100).toFixed(2);
  console.log(`CARLO Expected:     ~${expectedCarloCount.toFixed(2)} (1/${(1/expectedCarloOdds).toFixed(0)})`);
  console.log(`CARLO Actual:       ${report.carloJackpots} (${carloDelta >= 0 ? '+' : ''}${carloDelta}% variance)`);

  const expectedLunaOdds = LUNA_BASE_ODDS;
  const expectedLunaCount = 1000000 * expectedLunaOdds;
  const lunaDelta = ((report.lunaWins - expectedLunaCount) / expectedLunaCount * 100).toFixed(2);
  console.log(`Luna Expected:      ~${expectedLunaCount.toFixed(0)} (1/${(1/expectedLunaOdds).toFixed(0)})`);
  console.log(`Luna Actual:        ${report.lunaWins} (${lunaDelta >= 0 ? '+' : ''}${lunaDelta}% variance)`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  return report;
}

// Main execution
const args = process.argv.slice(2);

if (args.includes('--mega')) {
  const playerCount = parseInt(args.find(a => a.startsWith('--players='))?.split('=')[1]) || 20;
  runMegaTest(playerCount);
} else if (args.includes('--help')) {
  console.log('CarloMTG Slots - Comprehensive Simulation');
  console.log('');
  console.log('Usage:');
  console.log('  node comprehensive-simulation.js              Run standard test suite');
  console.log('  node comprehensive-simulation.js --mega       Run 1M spin test');
  console.log('  node comprehensive-simulation.js --mega --players=50   Run 1M spins with 50 players');
  console.log('');
} else {
  runComprehensiveTests();
  console.log('Standard test suite complete.');
  console.log('Run with --mega flag for 1,000,000 spin test.');
}
