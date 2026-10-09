# ⚔️ CODE ARENA — Real-Time Multiplayer Competitive Coding Platform

<div align="center">

```
  ____ ___  ____  _____      _    ____  _____ _   _    _    
 / ___/ _ \|  _ \| ____|    / \  |  _ \| ____| \ | |  / \   
| |  | | | | | | |  _|     / _ \ | |_) |  _| |  \| | / _ \  
| |__| |_| | |_| | |___   / ___ \|  _ <| |___| |\  |/ ___ \ 
 \____\___/|____/|_____| /_/   \_\_| \_\_____|_| \_/_/   \_\
```

**Next-Gen Real-Time Head-to-Head Algorithmic Battleground & Developer E-Sports Engine**

[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19_Concurrent-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4_PostCSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Socket.io](https://img.shields.io/badge/Socket.IO-Realtime_WebSockets-010101?style=for-the-badge&logo=socket.io)](https://socket.io/)
[![Monaco Editor](https://img.shields.io/badge/Monaco_Editor-VS_Code_Core-007ACC?style=for-the-badge&logo=visual-studio-code)](https://microsoft.github.io/monaco-editor/)
[![GSAP](https://img.shields.io/badge/GSAP-3.15_ScrollTrigger-88CE02?style=for-the-badge&logo=greensock)](https://greensock.com/)

---

</div>

## 📌 Executive Architecture & Core Vision

**CodeArena** completely re-engineers the solitary, repetitive nature of competitive programming into a synchronous, high-intensity **multiplayer e-sports experience**. Instead of solving static problems in isolation against a silent stopwatch, players enter high-stakes live duels where every keystroke, test execution, compilation error, and test case pass rate is streamed in real time.

Built on top of a **low-latency WebSocket state machine**, a **sandboxed containerized code evaluation pipeline**, and a high-performance **Neo-Brutalist UI design system**, CodeArena tests speed, algorithmic intuition, debugging composure, and memory optimization under real-time competitive pressure.

---

## 🎮 Core Game Modes & Match Formats

```
                                  ┌────────────────────────┐
                                  │   CODE ARENA LOBBY     │
                                  └───────────┬────────────┘
                                              │
         ┌──────────────────┬─────────────────┼──────────────────┬─────────────────┐
         │                  │                 │                  │                 │
         ▼                  ▼                 ▼                  ▼                 ▼
 ┌───────────────┐  ┌───────────────┐ ┌───────────────┐  ┌───────────────┐ ┌───────────────┐
 │  RANKED 1V1   │  │  CASUAL DUEL  │ │ PRIVATE ROOM  │  │ TEAM SQUAD 2V2│ │  TOURNAMENT   │
 │ Glicko-2 MMR  │  │  No Penalty   │ │ Custom Rules  │  │ Collaborative │ │ Bracket Knock │
 │ Anti-Cheat ON │  │ Open Sandbox  │ │ Spectator Mode│  │ Split Problems│ │   Final Stage │
 └───────────────┘  └───────────────┘ └───────────────┘  └───────────────┘ └───────────────┘
```

### 1. Ranked 1v1 (Competitive Ladder)
- **Matchmaking**: Automated queue pairing based on Glicko-2 MMR and region ping metrics.
- **Ruleset**: Identical problem statement delivered simultaneously upon countdown expiry.
- **Anti-Cheat Guard**: Paste-throttle detection, tab-focus loss tracking, and randomized hidden evaluation suites.
- **Stakes**: Winners claim +25 to +40 ELO; losers drop MMR proportional to rating variance.

### 2. Casual Duel (Sparring & Warmup)
- **Focus**: Practice without ladder anxiety.
- **Features**: Post-submission algorithmic hints, alternative solution breakdowns, and multi-language benchmark comparisons.
- **Zero Rating Penalty**: Perfect for exploring unfamiliar languages (e.g., transitioning from Python to Rust).

### 3. Private Custom Rooms
- **Configurability**: Custom time limits (3 to 60 mins), problem tags (Dynamic Programming, Graphs, Bit Manipulation, etc.), and difficulty tier (Easy / Medium / Hard / Nightmare).
- **Spectator Mode**: Real-time spectator links with dual-screen telemetry view and live execution feed.

### 4. Team Squad (2v2 Co-Op Battles)
- **Mechanics**: Two developers per squad sharing a synchronized algorithmic scratchpad.
- **Strategy**: Split multi-part algorithmic challenges (e.g., Parser Engine + Execution Optimizer) or pair-program complex Graph traversal logic.

---

## ⚡ Real-Time Battle Arena Architecture & Telemetry

```
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                           LIVE MATCH HUD INTERFACE                          │
  ├────────────────────────────────────────┬────────────────────────────────────┤
  │               YOU (Player A)           │        RIVAL (Player B - Live)     │
  │  Rating: 2,180 [Diamond]               │  Rating: 2,210 [Diamond]           │
  │  Current Status: 🟢 Typing Solution     │  Current Status: 🟡 Running Tests  │
  │  Live Test Score: [ 4 / 6 Passed ]     │  Live Test Score: [ 2 / 6 Passed ] │
  │  Telemetry: 142 WPM • 0 Compile Errors │  Telemetry: 98 WPM • 1 Syntax Err  │
  ├────────────────────────────────────────┴────────────────────────────────────┤
  │  [ MONACO CODE ENGINE ]                │  [ REAL-TIME TEST RUNNER CONSOLE ] │
  │  - Syntax Highlighting                 │  - Test Suite 1: PASSED (1.2ms)    │
  │  - Language Selector (8+ Runtimes)     │  - Test Suite 2: PASSED (0.8ms)    │
  │  - Keybinding Engine (Vim/Emacs/Std)   │  - Test Suite 3: WA (Expected: 42) │
  │  - Auto-format & Lint diagnostics      │  - Hidden Anti-Cheat Cases: Locked │
  └─────────────────────────────────────────────────────────────────────────────┘
```

### Synchronous State Replication
- **Keystroke Telemetry**: Streamed via binary WebSocket frames, computing real-time typing speed (WPM), line delta count, and error state without exposing raw solution code to the opponent.
- **Ghost Progress Indicator**: A dynamic visual race bar depicting opponent test suite pass percentages as they submit incremental runs.
- **Latency Compensation**: Server-side timestamp reconciliation ensures players with differing network latency are scored on absolute wall-clock duration from client trigger.

---

## 🏆 RPG Progression, ELO & Gamification Engine

The platform integrates RPG-style gamification into every facet of user progression:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              TIER PROGRESSION LADDER                            │
├─────────────┬──────────────────┬───────────────────────┬────────────────────────┤
│ TIER        │ MMR / ELO RANGE  │ TIER BADGE COLOR      │ PERKS & UNLOCKS        │
├─────────────┼──────────────────┼───────────────────────┼────────────────────────┤
│ BRONZE      │ 0 – 1,199        │ Bronze (#CD7F32)      │ Default Battle Themes  │
│ SILVER      │ 1,200 – 1,499    │ Steel Slate (#64748B) │ Ranked Queue Access    │
│ GOLD        │ 1,500 – 1,799    │ Amber Gold (#D97706)  │ Clan Creation Rights   │
│ PLATINUM    │ 1,800 – 2,099    │ Cyan Spark (#0284C7)  │ Custom Room Banners    │
│ DIAMOND     │ 2,100 – 2,399    │ Royal Blue (#2563EB)  │ Animated Avatar Frames │
│ GRANDMASTER │ 2,400+           │ Crimson Red (#DC2626) │ Global Hall of Fame    │
└─────────────┴──────────────────┴───────────────────────┴────────────────────────┘
```

### Experience (XP) & Leveling Curve
- **Formula**: Quadratic progression scale $XP_{required} = 100 \times Level^{1.5}$.
- **XP Modifiers**:
  - **First Blood Bonus**: $+150\text{ XP}$ for passing all test suites on the first submission.
  - **Complexity Mastery**: $+100\text{ XP}$ for achieving $O(N)$ optimal time/space complexity over brute force.
  - **Daily Streaks**: Up to $2.0\times$ multiplier boost for active consecutive daily matches.

---

## 🛠️ Multi-Language Execution Matrix

CodeArena supports all major competitive and production languages with uniform sandbox isolation:

| Language | Runtime / Compiler | Version | Compilation / Flags | Sandbox Memory Cap |
| :--- | :--- | :--- | :--- | :--- |
| **TypeScript** | Node.js / ts-node | v22.x | `--target ES2022 --module NodeNext` | 256 MB |
| **JavaScript** | V8 / Node.js | v22.x | Strict Mode Enabled | 256 MB |
| **Python** | CPython / PyPy3 | 3.12 | `-O (Optimization Level 1)` | 256 MB |
| **C++** | GCC / G++ | 13.2 | `-O3 -std=c++20 -Wall` | 128 MB |
| **Java** | OpenJDK JVM | 21 LTS | `-XX:+UseG1GC -Xmx192m` | 256 MB |
| **Rust** | Rustc / Cargo | 1.78 | `--release -C opt-level=3` | 128 MB |
| **Go** | Golang GC | 1.22 | `-buildmode=pie -ldflags="-s -w"` | 128 MB |

---

## 🎨 UI/UX Design System: Gamified Neo-Brutalism

The user interface adheres to a high-contrast, energetic **Gamified Neo-Brutalist** design token system:

```
┌─────────────────────────── Neo-Brutalist Design Tokens ───────────────────────────┐
│                                                                                   │
│  [ Primary Palette ]                                                              │
│  • Canvas Cream:      #FFFBF0 (Warm, zero eye-strain background)                  │
│  • Pure Pitch:        #121316 / #000000 (Crisp borders, stark typography)         │
│  • Electric Blue:     #2563EB (Primary interactive brand actions)                 │
│  • Radiant Gold:      #FBBC05 (XP badges, leaderboards, trophy states)            │
│  • Crimson Flame:     #EA4335 (Ranked cues, live countdowns, combat indicators)  │
│  • Emerald Glow:      #34A853 (Passed test suites, online status, positive MMR)   │
│                                                                                   │
│  [ Elevation & Depth ]                                                            │
│  • brutal-shadow-sm:  2px 2px 0px #000000                                         │
│  • brutal-shadow:     4px 4px 0px #000000                                         │
│  • brutal-shadow-lg:  6px 6px 0px #000000                                         │
│  • brutal-shadow-xl:  8px 8px 0px #000000                                         │
│                                                                                   │
│  [ Motion System ]                                                                │
│  • Lenis Smooth Inertia Scroll: Physics-based linear interpolation                │
│  • GSAP ScrollTrigger Timelines: Staggered batch reveals on viewport entry        │
│  • Micro-Pop Stickers: Hover-tilt angle animations with bounce dampening          │
│                                                                                   │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📡 WebSocket Event Schema & Protocol

All real-time communications flow through typed event channels:

```
[ CLIENT ]                                                         [ SERVER ]
    │                                                                  │
    │ ─── match:queue:join { mode: 'ranked', rating: 2180 } ─────────> │
    │                                                                  │
    │ <── match:found { duelId: 'd_892', opponent: { ... } } ───────── │
    │                                                                  │
    │ ─── duel:ready_ack { duelId: 'd_892' } ────────────────────────> │
    │                                                                  │
    │ <── duel:start_countdown { time: 5, seed: 'problem_482' } ────── │
    │                                                                  │
    │ ─── telemetry:keystroke { wpm: 124, lines: 45, passes: 3 } ────> │
    │                                                                  │
    │ <── telemetry:opponent_update { wpm: 92, passes: 4 } ─────────── │
    │                                                                  │
    │ ─── duel:submit_code { lang: 'typescript', code: '...' } ──────> │
    │                                                                  │
    │ <── duel:test_result { passed: 6, total: 6, execTime: 42ms } ─── │
    │                                                                  │
    │ <── duel:game_over { winner: 'player_a', deltaElo: +32 } ──────── │
    │                                                                  │
```

---

## 📂 Source Code & Modular Directory Layout

```
frontend/
├── public/                     # Static assets, sound effects, badge vector assets
└── src/
    ├── app/                    # Next.js 16 App Router (Nested Layouts & Pages)
    │   ├── (auth)/             # Authentication routes (Login, Register, OAuth)
    │   ├── (dashboard)/        # Authenticated app portal
    │   │   ├── achievements/   # Badges, unlockables, and quest completion
    │   │   ├── analytics/      # Performance metrics, speed/memory graphs, win rates
    │   │   ├── arena/          # Core live 1v1 battleground interface
    │   │   ├── clans/          # Developer squads, clan wars, group leaderboards
    │   │   ├── dashboard/      # User overview, quick queue, active quests
    │   │   ├── inventory/      # Code themes, avatars, victory animations
    │   │   ├── leaderboard/    # Global, regional, and friend rank rankings
    │   │   ├── lobby/          # Custom game creation, room browser, matchmaking
    │   │   ├── practice/       # Solo algorithm sandbox with solution hints
    │   │   ├── profile/        # Player stats, match history, ELO graphs
    │   │   ├── settings/       # Editor keybindings, audio toggles, preferences
    │   │   └── tournaments/    # Bracketed knockout championship stages
    │   ├── globals.css         # Tailwind v4 theme, fonts, custom brutal utilities
    │   ├── layout.tsx          # Root HTML layout, font loader, meta tags
    │   └── page.tsx            # High-conversion Neo-Brutalist landing experience
    │
    ├── components/             # Reusable UI component ecosystem
    │   ├── analytics/          # Win-loss charts, time complexity distribution
    │   ├── arena/              # Monaco container, dual HUD, console output, timer
    │   ├── dashboard/          # Daily streak widget, recent matches, MMR summary
    │   ├── landing/            # Landing page interactive sections:
    │   │   ├── BattleVisual.tsx    # Live animated duel showcase & syntax simulator
    │   │   ├── Community.tsx       # Developer testimonials, rivalries & clan stats
    │   │   ├── Features.tsx        # Anti-cheat, sub-20ms runner, match breakdown
    │   │   ├── FinalCTA.tsx        # Call-to-action banner with sticker accents
    │   │   ├── Footer.tsx          # Sitemap, status indicator, socials
    │   │   ├── Hero.tsx            # GSAP-choreographed bold headline & languages
    │   │   ├── HowItWorks.tsx      # 3-step interactive duel walkthrough
    │   │   ├── Intro.tsx           # Paradigm shift editorial layout
    │   │   ├── Marquee.tsx         # Infinite scrolling ticker banner
    │   │   ├── MatchTypes.tsx      # 2x2 grid of game modes & rules
    │   │   ├── Navbar.tsx          # Sticky glassmorphic navigation header
    │   │   ├── Progression.tsx     # Level HUD, XP bars, rank tier ladder
    │   │   └── SmoothScrollProvider.tsx # Lenis integration for inertial scroll
    │   ├── layout/             # Sidebar, top navigation, notification center
    │   ├── leaderboard/        # Rank tables, tier filters, avatar cards
    │   ├── lobby/              # Room card browser, filter pills, password dialog
    │   ├── profile/            # Heatmaps, radar charts, past duel replay cards
    │   └── ui/                 # Neo-Brutalist design primitives (Buttons, Badges)
    │
    ├── config/                 # Platform constants, theme definitions, routes
    ├── hooks/                  # Custom React hooks (useSocket, useTimer, useMonaco)
    ├── lib/                    # Shared client utilities
    │   ├── api.ts              # REST API client with interceptors
    │   ├── auth.ts             # Session management & token storage
    │   ├── constants.ts        # App-wide configuration values
    │   ├── socket.ts           # WebSocket connection manager & event dispatcher
    │   └── utils.ts            # Class merging (cn) and formatting helpers
    │
    └── types/                  # TypeScript interface contracts
        ├── match.ts            # Match metadata, scorecards, duel states
        ├── problem.ts          # Test cases, starter code templates, difficulty
        ├── room.ts             # Room configuration, player slots, access rules
        ├── socket.ts           # Socket event payloads & acknowledgement types
        └── user.ts             # User profile, rank tier, XP, match stats
```

---

## 🔒 Security & Sandbox Isolation Architecture

```
                      ┌────────────────────────────────────────┐
                      │        UNTRUSTED USER CODE             │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │    STATIC CODE ANALYZER (Pre-Flight)   │
                      │  - Block System Process Forks          │
                      │  - Disallow Raw Sockets / Network Calls│
                      │  - Detect Anti-Cheat Code Signatures   │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │     CONTAINERIZED MICRO-SANDBOX        │
                      │  - Non-root Execution User             │
                      │  - Strict cgroups v2 (CPU / RAM Quota) │
                      │  - Read-Only Ephemeral Filesystem      │
                      │  - Hard Wall-Clock SIGKILL Timeout     │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │       OUTPUT COMPLIANCE ENGINE         │
                      │  - Sanitize stdout / stderr Streams    │
                      │  - Evaluate Hidden vs Sample Suites    │
                      │  - Return Millisecond Benchmarks       │
                      └────────────────────────────────────────┘
```

1. **Isolation Barriers**: Every execution job runs inside a stripped, unprivileged container with memory limits (max 256MB) and strict CPU throttling to prevent denial-of-service loops.
2. **Hidden Test Suites**: Client bundles only receive public sample test cases. The official victory condition requires passing randomized server-side hidden suites, preventing hardcoded lookup hacks.
3. **Anti-Cheat Heuristics**: Dynamic keystroke velocity tracking and focus-loss event logs flag suspicious large-block code pastes or external script injections.

---

<div align="center">

**Built for Speed. Tested by Developers. Designed for the Global Arena.**

⚔️ *Step in, pick your weapon of choice, and prove your speed.*

</div>
