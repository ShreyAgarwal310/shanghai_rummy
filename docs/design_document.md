# Shanghai Rummy — Design Document
## Planned vs. Built: UI Prototype & System Architecture

---

## 1. Overview

This document compares the original system design (captured in the UML Class Diagram artifact) against what was actually built and deployed. It covers the UI layer, backend architecture, data model, and rules engine — calling out where the implementation followed the plan, where it diverged, and why.

---

## 2. UI Prototype: Planned vs. Built

### 2.1 Planned UI Structure

The UML identified a strict hierarchy rooted at `GameUI`, with every sub-view talking **only** to `GameController`:

```
GameUI
├── HomeScreenUI     — hall of fame, login entry
├── LoginScreenUI    — username/password + game code
└── GameTableUI
    ├── PlayerHandUI      — hand rendering, card selection, lay-down
    ├── OpponentHandUI    — face-down card backs
    ├── DiscardPileUI     — top card, click to draw
    ├── BuyButtonUI       — buy request
    ├── MeldAreaUI        — laid-down sets & runs, lay-off targets
    └── RulesPopupUI      — rules reference
```

### 2.2 Actual UI Structure

The frontend is a React SPA deployed to Vercel. Routing is handled in-app via `window.history.pushState` + a `popstate` listener in `App.tsx` (no router library).

**Pages built:**

| Page | Route | Corresponds To |
|---|---|---|
| `HomePage` | `/` | `HomeScreenUI` |
| `LoginPage` | `/login` | `LoginScreenUI` |
| `HostPage` | `/host` | *(not in UML — host flow added)* |
| `HostRoomPage` | `/host/game/:id` | *(not in UML — lobby waiting room)* |
| `JoinPage` | `/join` | Part of `LoginScreenUI` |
| `GameTablePage` | `/game/:id` | `GameTableUI` |
| `RulesPage` | `/rules` | `RulesPopupUI` (promoted to full page) |
| `LeaderboardPage` | `/leaderboard` | `HomeScreenUI → showHallOfFame()` |
| `StatsPage` | `/stats` | *(not in UML)* |
| `ProfilePage` | `/profile` | *(not in UML)* |

**`GameTablePage` subcomponents:**

| Component | Corresponds To |
|---|---|
| `LocalPlayerZone` | `PlayerHandUI` |
| `TableCenter` | `DiscardPileUI` + `MeldAreaUI` + `BuyButtonUI` |
| `GameTableHeader` | *(not in UML — round/contract status bar)* |
| `GameTableSidebar` | *(not in UML — activity feed + score panel)* |
| Opponent seats (in `TableCenter`) | `OpponentHandUI` |

### 2.3 UI Divergences

**Added (not in original plan):**
- **Host/Join separation**: The UML assumed a single `LoginScreenUI` handling both login and game code entry. The built system splits this into `HostPage` (create), `HostRoomPage` (lobby waiting room), and `JoinPage` (join by code).
- **Demo mode**: A full offline demo using mock data lets users explore the game without a live server. Not planned in the UML.
- **Activity feed / sidebar**: A collapsible sidebar (`GameTableSidebar`) shows a live log of game actions and the current scoreboard. The UML had no equivalent.
- **Stats, Profile, Leaderboard pages**: Full pages backed by Supabase, beyond the UML's simple `showHallOfFame()`.

**Different from plan:**
- `RulesPopupUI` became a full navigable page (`/rules`) rather than an overlay, making it linkable and persistent.
- `BuyButtonUI` is not a standalone component — buy logic lives inside `TableCenter` and `LocalPlayerZone`, gated by game phase state.
- The UML specified `GameTableUI → showError(message)`. In practice, errors feed into the activity log (sidebar) rather than a modal. A `statusMessage` line was later added directly to the action bar to surface the most recent message without opening the sidebar.

**Controller pattern:**
The UML mandated "all UI talks only to the controller." This is loosely upheld: `GameTablePage.tsx` delegates to `useGameTablePageController`, which owns all action handlers. Sub-components receive only callbacks and derived props — they have no direct socket or state access. The boundary is enforced by component props, not a formal interface.

---

## 3. System Architecture: Planned vs. Built

### 3.1 Planned Class Hierarchy

The UML defined a clean OOP hierarchy:

```
GameController
├── Game
│   ├── players: List<Player>
│   ├── deck: Deck
│   ├── discardPile: DiscardPile
│   └── currentRound: Round
│       └── requirement: RoundRequirement (enum)
├── RulesEngine
│   ├── validateSet(cards)
│   ├── validateRun(cards)
│   ├── validateLayDown(player, melds, round)
│   ├── canBuy(player)
│   ├── isWild(card)
│   ├── calculateScore(hand)
│   └── canLayOff(card, meld)
└── Player
    ├── hand: Hand
    │   └── cards: List<Card>
    ├── melds: List<Meld>
    ├── score: int
    └── buysUsed: int
```

All game state would be encapsulated in typed objects; the controller would orchestrate them.

### 3.2 Actual Backend Architecture

The backend is a Python/FastAPI + Socket.IO server deployed to Railway.

#### Game State: In-Memory Dict Store

Live game state is **not** stored in class instances. It lives in a module-level dict in `session_manager.py`:

```python
# session_manager.py
games: dict[str, dict] = {}       # game_code → session dict
sid_to_game: dict[str, str] = {}  # socket_id → game_code
```

Each session dict looks like:
```python
{
  "game_code": str,
  "phase": "lobby" | "draw" | "play" | "game_over",
  "round_number": int,
  "contract": Contract,           # dataclass (IS a typed object)
  "deck": Deck,                   # class instance (IS a typed object)
  "discard_pile": DiscardPile,    # class instance (IS a typed object)
  "players": [                    # list of raw dicts (NOT Player objects)
    {
      "name": str,
      "sid": str | None,
      "hand": Hand,               # class instance (IS a typed object)
      "has_laid_down": bool,
      "score": int,
    }
  ],
  "melds_on_table": {             # dict (NOT Meld objects)
    player_name: [ [card_dict, ...], ... ]
  },
  "total_scores": dict[str, int],
  "current_player_idx": int,
}
```

**Mixed model:** some values (`Hand`, `Deck`, `DiscardPile`, `Contract`) are proper class instances; players and melds are plain dicts.

#### Event Handlers: Procedural, Not OOP

The UML's `GameController` does not exist as a class. Instead, socket events are handled by free async functions in two modules:

**`handlers/lobby.py`** — pre-game events:
- `connect`, `disconnect`, `create_game`, `join_game`, `rejoin_lobby`, `start_game`

**`handlers/turn.py`** — in-game events:
- `rejoin_game`, `draw_card`, `lay_down`, `add_to_meld`, `steal_joker`, `discard_card`
- Bot logic: `_schedule_bot_if_needed()`, `_bot_play()`, `_bot_discard()`
- Inactivity timeout: 90 s (connected), 3 s (disconnected)

Each handler reads/mutates the session dict directly, then emits Socket.IO events back to clients.

#### The OOP Layer That Exists (But Is Partially Unused Live)

The `app/` directory contains a complete OOP model:

| Class | File | Used Live? |
|---|---|---|
| `Card` | `app/cards/card.py` | Yes |
| `Deck` | `app/cards/deck.py` | Yes |
| `DiscardPile` | `app/cards/discard_pile.py` | Yes |
| `Hand` | `app/hands.py` | Yes |
| `Contract` | `app/rules/contract.py` | Yes |
| `RulesEngine` | `app/rules/rules_engine.py` | Yes (for validation) |
| `SetMeld` / `RunMeld` | `app/melds/` | Yes (for validation) |
| `Game` | `app/game.py` | No (CLI only) |
| `Round` | `app/round.py` | No (CLI only) |
| `Player` / `HumanPlayer` / `ComputerPlayer` | `app/players/` | No (CLI only) |

`Game`, `Round`, and `Player` were built for a CLI prototype and are not called by the Socket.IO handlers.

### 3.3 Architecture Comparison Table

| Planned | Built | Notes |
|---|---|---|
| `GameController` class | Procedural async functions in `handlers/` | No central controller object |
| `Game` class owns players, deck, round | Session dict in `session_manager.py` | Mixed: some fields are objects, players are dicts |
| `Player` class with `hand`, `melds`, `score` | Player as plain dict `{"name", "sid", "hand", "has_laid_down", "score"}` | `hand` field IS a `Hand` object |
| `Round` class with `requirement` | `round_number` + `Contract` dataclass in session dict | `Round` class exists but unused live |
| `RulesEngine` with all validation methods | `RulesEngine` static class — **fully built and used** | Closest class to the plan |
| `Meld` abstract class + `SetMeld`/`RunMeld` | `SetMeld` / `RunMeld` with `is_valid()` — **fully built and used** | Plan is faithfully implemented here |
| `Deck` + `DiscardPile` classes | `Deck` + `DiscardPile` — **fully built and used** | Clean match |
| `Hand` class | `Hand` — **fully built and used** | Clean match |
| Enums: `SUIT`, `RANK`, `ROUNDREQUIREMENT`, `ACTIONTYPE` | `SUIT`/`RANK` as string literals; `ROUNDREQUIREMENT` as `Contract` dataclass; `ACTIONTYPE` unused | Enums simplified to strings/dataclasses |
| Bot/computer player via `ComputerPlayer` class | Bot logic inline in `turn.py` as `_bot_play()` | `ComputerPlayer` class exists but unused |

### 3.4 Frontend Architecture

The UML did not specify a frontend technology. What was built:

- **React 18** SPA with TypeScript
- **No state management library** (no Redux/Zustand) — game state lives in React hooks (`useState`, `useRef`) inside `useGameTablePageController`
- **Socket.IO client** — singleton socket in `socketService.ts`, typed emit/listen helpers
- **Hook-based architecture:**
  - `useGameTablePageController` — all action handlers, live + demo state
  - `useGameTableLiveSync` — socket event listeners → state updates
  - `useGameTableDerivedState` — computed display values (memoized)
- **Demo mode** — full game playthrough using `GameTablePage.mock.ts`, zero server dependency

---

## 4. Data Model: Planned vs. Built

### 4.1 Planned

The UML implied all game state would be strongly typed via classes. Persistence was not explicitly addressed.

### 4.2 Actual

**In-memory (live game):** All active game state lives in Python dicts. Nothing is persisted to a database during gameplay. If the server restarts, all active games are lost.

**Supabase / PostgreSQL (auth + stats):** A separate persistence layer handles identity and historical data:

| Table | Purpose |
|---|---|
| `profiles` | User identity — display name, bio, avatar, accessibility preferences |
| `player_stats` | Lifetime aggregates — wins, losses, total points, streaks, melds |
| `leaderboard_period_stats` | Time-windowed stats — weekly, monthly |

Views `leaderboard_all_time`, `leaderboard_current_weekly`, `leaderboard_current_monthly` serve the leaderboard page directly.

**Current gap:** The Supabase schema is fully defined and the frontend has a Supabase client configured (`supabaseService.ts`), but the backend does not yet write game results to Supabase at round/game completion. Stats pages and leaderboards currently show placeholder or static data.

---

## 5. Rules Engine: Planned vs. Built

This is the closest the implementation gets to the original UML.

| Planned Method | Built Equivalent | Notes |
|---|---|---|
| `validateSet(cards)` | `SetMeld.is_valid()` + `RulesEngine.validate_set()` | ✓ Implemented. Min 3 cards, ≥2 non-wild, same rank. |
| `validateRun(cards)` | `RunMeld.is_valid()` + `RulesEngine.validate_run()` | ✓ Implemented. Min 4 cards, ≥2 non-wild, same suit, consecutive ranks. |
| `validateLayDown(player, melds, round)` | `RulesEngine.meets_contract()` | ✓ Implemented. Checks meld count exactly matches `required_sets + required_runs`. |
| `canBuy(player)` | Inline check in `handlers/turn.py` | Partially — buy window logic handled in handler, not extracted to RulesEngine. |
| `isWild(card)` | `RulesEngine.is_wild()` | ✓ Implemented. Jokers and 2♣ are wildcards. |
| `calculateScore(hand)` | `RulesEngine.calculate_score()` + `Hand.calculate_value()` | ✓ Implemented. |
| `canLayOff(card, meld)` | Inline in `handlers/turn.py` via `SetMeld`/`RunMeld` | ✓ Functionally present, not extracted as a named RulesEngine method. |

The frontend independently re-implements meld validation in `GameTablePage.logic.ts` (`validateSetMeld`, `validateRunMeld`) for real-time client-side feedback and demo mode. Both implementations must stay in sync when rules change.

**11-round contract progression** (from `app/rules/contract.py`):

| Round | Contract |
|---|---|
| 1 | 2 Sets |
| 2 | 1 Set + 1 Run |
| 3 | 2 Runs |
| 4 | 3 Sets |
| 5 | 2 Sets + 1 Run |
| 6 | 1 Set + 2 Runs |
| 7 | 3 Runs |
| 8 | 3 Sets + 1 Run |
| 9 | 1 Set + 3 Runs |
| 10 | 4 Sets |
| 11 | 4 Runs |

---

## 6. Summary of Key Divergences

| Area | Original Plan | What Was Built | Reason |
|---|---|---|---|
| Game state storage | Typed class instances | Mixed: classes for Card/Deck/Hand/Contract, dicts for players/melds/session | Pragmatic; handlers are easier to write against flat dicts |
| Controller | `GameController` class | Async handler functions in two modules | Event-driven Socket.IO model doesn't fit a single controller class |
| Bot players | `ComputerPlayer` class | Inline `_bot_play()` functions in `turn.py` | Bot logic is simple enough that a class added no benefit |
| UI routing | Implied single-screen hierarchy | SPA with pushState routing, 10 routes | Web delivery requires navigable URLs |
| Persistence | Implied (not specified) | In-memory live + Supabase for auth/stats | Stats DB exists but not yet wired to live game completion |
| Frontend state | Implied controller-driven | React hooks + Socket.IO listeners | No class-based frontend; React hook model used instead |
| Buy logic | `canBuy()` in RulesEngine | Inline in handler | Not extracted; low complexity |
| Duplicate validation | — | Frontend re-validates (client) + backend validates (server) | Client-side feedback requires local validation for demo mode |
