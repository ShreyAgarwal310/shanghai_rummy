# Shanghai Rummy

A full-stack, real-time multiplayer card game built with React, FastAPI, and Socket.IO.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | React | 19.2.0 |
| Frontend Language | TypeScript | 5.9.3 |
| Frontend Build | Vite | 7.2.4 |
| Backend Framework | FastAPI | 0.128.0 |
| Backend Language | Python | 3 |
| ASGI Server | Uvicorn | 0.40.0 |
| Real-time Comms | python-socketio / socket.io-client | 5.16.0 / 4.8.3 |
| Database & Auth | Supabase (PostgreSQL) | SDK 2.x |
| Validation | Pydantic | 2.12.5 |
| Frontend Testing | Vitest + JSDOM | 4.1.3 / 29.0.2 |
| Backend Testing | Python unittest + coverage | — |
| Dev Orchestration | concurrently | — |

## Installation & Setup

```bash
# 1. Clone the repo and install root dependencies
npm install

# 2. Install Python dependencies
cd backend && pip install -r requirements.txt

# 3. Install frontend dependencies
cd ../frontend && npm install

# 4. Set up environment variables
cp frontend/.env.example frontend/.env
```

Fill in the following values in `frontend/.env`:

```
VITE_DEMO_MODE=true
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

## Running the App

```bash
# Start both backend (port 8000) and frontend (port 5173) concurrently
npm start
```

The root start script assumes a Python virtual environment exists at `backend/venv`.

## Architecture

The frontend (React/TypeScript SPA) communicates with the backend (FastAPI/Python) over Socket.IO WebSockets on port 8000. The backend is authoritative — it holds all game state in memory, keyed by a 6-character room code, and enforces every rule. The frontend renders whatever state the server broadcasts without performing any local rule enforcement.

Supabase handles authentication, user profiles, player statistics, and leaderboard persistence. REST calls to Supabase are used only for these features; all gameplay communication runs through Socket.IO.

### Game Phases

```
lobby → draw → play → game_over
```

- **lobby** — Host creates a room, players join (min 2, max 6).
- **draw** — The active player draws from the deck or discard pile.
- **play** — The active player may lay down melds and/or add to existing melds, then must discard to end their turn.
- **game_over** — All rounds are complete; final scores are tallied.

## Socket Events

### Client → Server

| Event | Purpose |
|-------|---------|
| `create_game` | Host creates a new room |
| `join_game` | Player joins a room by code |
| `rejoin_lobby` | Player reconnects to the lobby |
| `rejoin_game` | Player reconnects to an in-progress game |
| `start_game` | Host starts the first round |
| `draw_card` | Draw from deck or discard pile |
| `lay_down` | Submit melds to meet the round contract |
| `add_to_meld` | Append cards to an existing meld on the table |
| `steal_joker` | Swap a natural card for a joker used as a wildcard in a meld |
| `discard_card` | Discard a card to end the turn |

### Server → Client

| Event | Purpose |
|-------|---------|
| `game_created` | Confirms room creation to the host |
| `player_joined` | Notifies the lobby that a new player connected |
| `player_disconnected` | Notifies the lobby that a player dropped |
| `player_reconnected` | Notifies the lobby that a dropped player returned |
| `game_started` | Signals that the host has started the game |
| `game_state` | Broadcasts the full updated game state to all players |
| `turn_started` | Notifies players whose turn it is |
| `card_drawn` | Confirms a draw action |
| `hand_updated` | Sends updated hand data to a specific player |
| `meld_laid` | Confirms melds were laid down |
| `meld_updated` | Confirms cards were added to an existing meld |
| `card_discarded` | Confirms a discard action |
| `round_over` | Signals end of a round with scoring |
| `round_started` | Signals a new round has begun |
| `game_over` | Signals the game is complete with final standings |
| `error` | Sends error details to the client |

## Game Rules

**Players:** 3–6 · **Rounds:** 10 · **Decks:** 2 standard (108 cards) · **Wildcards:** Jokers

### Round Contracts

Each round requires a specific combination of sets and runs to lay down:

| Round | Contract |
|-------|----------|
| 1 | Two Sets |
| 2 | One Set + One Run |
| 3 | Two Runs |
| 4 | Three Sets |
| 5 | Two Sets + One Run |
| 6 | One Set + Two Runs |
| 7 | Three Runs |
| 8 | Three Sets + One Run |
| 9 | One Set + Three Runs |
| 10 | Four Sets |

**Meld rules:**
- A **set** requires at least 3 cards of the same rank with at least 2 natural (non-wild) cards.
- A **run** requires at least 4 cards of the same suit in consecutive order with at least 2 natural cards. Aces can be high or low but runs do not wrap. Wildcard adjacency restrictions are enforced.

**Turn flow:** Draw → (optionally) Lay Down / Add to Melds → Discard

**Going out:** A player must have laid down their contract and emptied their hand.

**Deal size:** 11 cards per player; 13 cards in rounds 10+.

### Scoring

Scoring is penalty-based — the lowest cumulative score wins.

| Card | Points |
|------|--------|
| Joker / 2♣ | 50 |
| Ace | 20 |
| 10 / J / Q / K | 10 |
| 2–9 | Face value |

## Pages & Features

| Page | Purpose |
|------|---------|
| Home | Navigation hub |
| Host | Create a game (name, player limit, public/private) |
| Host Room | Host lobby — waiting for players |
| Join | Join by room code or browse public games |
| Game Table | Main gameplay interface |
| Rules | Rules reference and contract table |
| Stats | Per-user game statistics |
| Profile | Edit profile, avatar, and accessibility settings |
| Leaderboard | All-time, weekly, and monthly rankings |
| Login | Authentication |

**Accessibility:** high contrast mode, reduced motion, larger text, screen reader hints, color-blind friendly labels.

## Database Schema (Supabase)

- `auth.users` — managed by Supabase Auth
- `profiles` — display name, avatar URL, bio, accessibility preferences
- `player_stats` — games played, wins, average score, streaks, favorite rounds
- `leaderboard_period_stats` — weekly/monthly snapshots for rankings

Leaderboard views: `leaderboard_all_time`, `leaderboard_current_weekly`, `leaderboard_current_monthly`

Full SQL available in `docs/supabase_schema.sql`.

## Testing

```bash
# Run all tests (backend + frontend with coverage)
./run_all_tests.sh

# Backend only
cd backend && python -m pytest tests/

# Frontend only
cd frontend && npm test
cd frontend && npm run test:coverage
```

## Project Structure

```
/
├── backend/
│   ├── server.py              # FastAPI + Socket.IO app, CORS config
│   ├── session_manager.py     # In-memory game state helpers
│   ├── game/                  # Game.py, Round.py, Player.py
│   ├── cards/                 # Card.py, Deck.py, Hand.py, DiscardPile.py
│   ├── melds/                 # Meld.py, SetMeld.py, RunMeld.py
│   ├── rules/                 # RulesEngine.py, Contract.py
│   └── tests/                 # Python unit tests
├── frontend/
│   └── src/
│       ├── pages/             # Page components (TSX)
│       ├── components/        # Shared UI components
│       ├── context/           # React context providers
│       ├── hooks/             # Custom React hooks
│       ├── services/          # Supabase + accessibility services
│       └── __tests__/         # Vitest test files
├── docs/
│   ├── database_schema.md
│   ├── supabase_schema.sql
│   └── Frontend Docs/        # PRD, architecture, UI guidelines
├── package.json               # Root — concurrently scripts
├── run_all_tests.sh
└── Procfile / nixpacks.toml   # Deployment config
```

## Deployment

- **Backend:** Deployed via Railway using `Procfile` and `nixpacks.toml`.
- **Frontend:** Deployed via Vercel with `vercel.json` rewriting all routes to `/index.html`.
