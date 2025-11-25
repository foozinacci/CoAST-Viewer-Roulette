# CoAST Viewer - Slot Machine

A streamer-style probability-based slot machine for community game selection with player queue management, meta-tracking, and comprehensive diagnostics.

---

## Table of Contents

- [Overview](#overview)
- [Core Concepts](#core-concepts)
  - [Queue & Player Selection](#queue--player-selection)
  - [Sparks / Tickets / Ignition](#sparks--tickets--ignition)
  - [Simulation & Stress Test Modes](#simulation--stress-test-modes)
  - [Deck & Player Diagnostics](#deck--player-diagnostics)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the App](#running-the-app)
- [Developer Notes](#developer-notes)
  - [File Structure](#file-structure)
  - [Tests & Utilities](#tests--utilities)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

CoAST Viewer is a **simulation and diagnostics tool** for managing:
- A **player queue** system for streamers or playgroups
- A **slot-machine-style randomizer** with five themed reels
- **Meta-tracking** for decks and color matchups
- **Stress testing** and simulations to verify system behavior under load

The goal is to make community game selection more engaging, transparent, and fair while providing detailed analytics and diagnostics.

---

## Core Concepts

### Queue & Player Selection

- Players join a **queue** with one or more decks
- A **5-reel slot-style selector** picks players using probability-weighted mechanics rather than simple random draws
- The system scales up to handle multiple players while maintaining fair odds
- Visual feedback through reel animations, glow effects, and theme customization

### Sparks / Tickets / Ignition

> **Note**: Fill in specific mechanics for your implementation

- **Tickets**: The basic currency/entries used to participate in spins
- **Sparks**: A progression or pity-style resource that accumulates when players participate but don't get selected, helping smooth out variance
- **Ignition**: A threshold state triggered when a player's sparks reach a certain cap, granting priority or special selection rules

**Key mechanics:**
- How sparks are earned per participation
- What ignition threshold means for selection probability
- How tickets are spent and refunded
- Pity system mechanics to prevent extreme bad luck

### Simulation & Stress Test Modes

The app includes comprehensive testing tools to **simulate many runs** without real players:

- **Verify odds and probabilities** behave as designed
- **Stress-test performance** with many players and decks in the system
- **Explore edge cases** including:
  - Multiple simultaneous ignitions
  - Long-running queues
  - Extended session behavior
  - Probability distribution validation

**Files:**
- `tests/comprehensive-simulation.js` - Full simulation suite
- `tests/run-simulation.js` - Quick simulation runner
- `tests/simulation-test.html` - Interactive simulation UI
- `tests/stress-test.js` - Load and performance testing

### Deck & Player Diagnostics

The diagnostics system tracks:
- **Decks per player** with detailed statistics
- **Matchups by color identity** (Azorius, Rakdos, 5-color, colorless, etc.)
- **Match results tracking**:
  - Best-of-1 / Best-of-3 / Best-of-5 formats
  - Wins/losses per matchup
  - Win rates and performance analytics

**Use cases:**
- Fix misreported results with manual controls
- Correct opponent color tags
- Review complete history for each deck and player
- Analyze meta trends and matchup performance

---

## Features

### 🎰 Five-Reel Probability System
- Themed spinning reels with smooth animations
- Dynamic glow effects (idle and active states)
- Probability scaling based on active player count
- Visual feedback for selection results

### 🎨 Theme System
- **White Theme**: Clean, high-contrast yellow/white palette
- **Blue Theme**: Cool blue tones with sky-blue accents
- **Black Theme**: Dark purple/violet aesthetic
- **Red Theme**: Warm red/orange color scheme
- **Green Theme**: Nature-inspired green palette
- Custom CSS variables for easy theme extension

### 📊 Leaderboard & History
- Real-time leaderboard with calculated odds display
- Comprehensive history log with accordion-style layout
- Win/loss tracking per session
- Collapsible details for space efficiency

### 🧪 Simulation & Stress Testing
- Run synthetic sessions without real players
- Validate probability distributions
- Test spark/ignition mechanics at scale
- Performance benchmarking tools

### 🧠 Deck & Player Diagnostics
- Per-deck statistics by color matchup
- Multi-format tracking (Bo1, Bo3, Bo5)
- Manual correction tools for data accuracy
- Color identity validation and fixing

### 🆘 Help System
- Built-in "How It Works" documentation
- Compact overview of all game mechanics
- Ticket, spark, and ignition explanations
- Meta-tracking toggle and controls

---

## Tech Stack

- **Frontend**: Vanilla JavaScript (single HTML file architecture)
- **Styling**: Custom CSS with CSS variables for theming
- **Fonts**: Google Fonts (Cinzel)
- **Animation**: CSS transforms and transitions
- **Testing**: Custom JavaScript simulation framework
- **Deployment**: Static hosting compatible (Vercel, Netlify, GitHub Pages)

---

## Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Optional: Local web server for development (Python SimpleHTTPServer, Node http-server, etc.)

### Installation

```bash
# Clone the repository
git clone https://github.com/<USERNAME>/coast-viewer-roulette.git
cd coast-viewer-roulette
```

### Running the App

**Option 1: Direct file open**
```bash
# Simply open index.html in your browser
open index.html
# or
firefox index.html
```

**Option 2: Local web server (recommended for development)**
```bash
# Python 3
python -m http.server 8000

# Node.js http-server
npx http-server -p 8000

# Then visit http://localhost:8000
```

**For running simulations:**
```bash
# Open simulation test UI
open tests/simulation-test.html

# Or run command-line simulations
node tests/run-simulation.js
node tests/comprehensive-simulation.js
node tests/stress-test.js
```

---

## Developer Notes

### File Structure

```
.
├── index.html                      # Main application (all-in-one)
├── package.json                    # Project metadata and scripts
├── LICENSE                         # MIT License
├── README.md                       # This file
├── docs/                           # Documentation
│   ├── BALANCE_IMPROVEMENTS.md     # Balance analysis and recommendations
│   ├── LUNA_CARLO_SCALING_ANALYSIS.md  # Scaling mechanics documentation
│   └── SIMULATION_ANALYSIS.md      # Simulation results and findings
└── tests/                          # Test and simulation tools
    ├── simulation-test.html        # Interactive simulation UI
    ├── comprehensive-simulation.js # Full simulation test suite
    ├── run-simulation.js           # Quick simulation runner
    └── stress-test.js              # Performance/load testing
```

### Tests & Utilities

**Run comprehensive simulation:**
```bash
node tests/comprehensive-simulation.js
```
- Tests probability distributions
- Validates spark/ignition mechanics
- Generates statistical reports

**Run quick stress test:**
```bash
node tests/stress-test.js
```
- Tests with high player counts
- Measures performance metrics
- Identifies bottlenecks

**Interactive simulation:**
Open `tests/simulation-test.html` in your browser for a visual interface to:
- Configure player counts
- Run multiple iterations
- View real-time results
- Export data for analysis

### Branching & Workflow

For the new clean repository:
- `main` — Production-ready, stable code
- Feature branches: `feature/description`
- Bug fixes: `bugfix/description`
- Experiments: `experiment/description`

**Commit message format:**
- `FEATURE: Description` - New functionality
- `FIX: Description` - Bug fixes
- `IMPROVE: Description` - Enhancements
- `REFACTOR: Description` - Code restructuring
- `DOCS: Description` - Documentation updates

---

## Roadmap

- [ ] Mobile UI optimization for leaderboard and history
- [ ] Enhanced border animations and theme transitions
- [ ] Mana curve visualizations for deck diagnostics
- [ ] Admin panel for meta-tracking configuration
- [ ] Session data export/import functionality
- [ ] Multi-language support
- [ ] Accessibility improvements (ARIA labels, keyboard navigation)
- [ ] API integration for persistent storage
- [ ] Real-time multiplayer synchronization
- [ ] Advanced statistics dashboard

---

## Documentation

Additional documentation can be found in the `docs/` directory:
- `docs/BALANCE_IMPROVEMENTS.md` - Detailed balance analysis and tuning recommendations
- `docs/LUNA_CARLO_SCALING_ANALYSIS.md` - Mathematical analysis of scaling mechanics
- `docs/SIMULATION_ANALYSIS.md` - Comprehensive simulation test results

---

## License

MIT License - See LICENSE file for details

---

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (including simulation tests)
5. Submit a pull request with clear description

---

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Include browser/environment details
- Provide steps to reproduce any bugs
- Share simulation results if relevant

---

**Built for the CoAST community** 🎰✨
