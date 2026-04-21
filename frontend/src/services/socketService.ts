/**
 * Socket.IO client service for Shanghai Rummy.
 *
 * Provides a single shared socket instance and typed helpers for every
 * event the backend server can send or receive.
 *
 * Usage:
 *   import { socket, emitCreateGame, onGameState, ... } from './socketService'
 *
 *   // Connect / disconnect manually when needed
 *   socket.connect()
 *   socket.disconnect()
 *
 *   // Emit an action
 *   emitCreateGame('Riya')
 *
 *   // Listen for an event (remember to return the cleanup in useEffect)
 *   const off = onGameState((state) => setGameState(state))
 *   return () => off()
 */

import { io, Socket } from 'socket.io-client'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000'

// Single shared socket — not connected until socket.connect() is called.
export const socket: Socket = io(BACKEND_URL, { autoConnect: false })

// ── Shared types ──────────────────────────────────────────────────────────────

export type Card = {
  rank: string
  suit: string
}

export type Meld = {
  type: 'set' | 'run'
  cards: Card[]
}

export type PlayerInfo = {
  name: string
  card_count: number
  has_laid_down: boolean
  total_score: number
  connected: boolean
  hand?: Card[]  // only present for the viewing player
}

export type Contract = {
  required_sets: number
  required_runs: number
}

export type GameState = {
  phase: 'lobby' | 'draw' | 'play' | 'game_over'
  round_number: number
  contract: Contract | null
  current_player: string | null
  players: PlayerInfo[]
  discard_top: Card | null
  deck_size: number
  melds_on_table: Record<string, Meld[]>
  total_scores: Record<string, number>
}

// ── Emit helpers (client → server) ───────────────────────────────────────────

export function emitCreateGame(playerName: string) {
  socket.emit('create_game', { player_name: playerName })
}

export function emitJoinGame(gameCode: string, playerName: string) {
  socket.emit('join_game', { game_code: gameCode, player_name: playerName })
}

export function emitRejoinLobby(gameCode: string, playerName: string) {
  socket.emit('rejoin_lobby', { game_code: gameCode, player_name: playerName })
}

export function emitRejoinGame(gameCode: string, playerName: string) {
  socket.emit('rejoin_game', { game_code: gameCode, player_name: playerName })
}

export function emitStartGame(gameCode: string) {
  socket.emit('start_game', { game_code: gameCode })
}

export function emitDrawCard(gameCode: string, source: 'deck' | 'discard') {
  socket.emit('draw_card', { game_code: gameCode, source })
}

export function emitLayDown(gameCode: string, melds: Meld[]) {
  socket.emit('lay_down', { game_code: gameCode, melds })
}

export function emitAddToMeld(
  gameCode: string,
  targetPlayer: string,
  meldIndex: number,
  cards: Card[],
) {
  socket.emit('add_to_meld', {
    game_code: gameCode,
    target_player: targetPlayer,
    meld_index: meldIndex,
    cards,
  })
}

export function emitDiscardCard(gameCode: string, card: Card) {
  socket.emit('discard_card', { game_code: gameCode, card })
}

// ── On helpers (server → client) ─────────────────────────────────────────────
// Each returns an unsubscribe function to use in useEffect cleanup.

function on<T>(event: string, handler: (data: T) => void) {
  socket.on(event, handler)
  return () => socket.off(event, handler)
}

// Lobby
export const onGameCreated = (cb: (data: { game_code: string; player_name: string }) => void) =>
  on('game_created', cb)

export const onPlayerJoined = (cb: (data: { player_name: string; players: string[] }) => void) =>
  on('player_joined', cb)

export const onPlayerDisconnected = (cb: (data: { player_name: string }) => void) =>
  on('player_disconnected', cb)

export const onGameStarted = (cb: (data: { round_number: number; contract: Contract }) => void) =>
  on('game_started', cb)

// Game state (sent individually to each player with their private hand)
export const onGameState = (cb: (state: GameState) => void) =>
  on('game_state', cb)

// Turn events
export const onTurnStarted = (cb: (data: { current_player: string; phase: 'draw' }) => void) =>
  on('turn_started', cb)

export const onCardDrawn = (cb: (data: {
  player_name: string
  source: 'deck' | 'discard'
  card: Card | null      // null for deck draws (private)
  deck_size: number
  discard_top: Card | null
}) => void) => on('card_drawn', cb)

export const onHandUpdated = (cb: (data: { hand: Card[] }) => void) =>
  on('hand_updated', cb)

export const onMeldLaid = (cb: (data: { player_name: string; melds: Meld[] }) => void) =>
  on('meld_laid', cb)

export const onMeldUpdated = (cb: (data: {
  target_player: string
  meld_index: number
  meld: Meld
}) => void) => on('meld_updated', cb)

export const onCardDiscarded = (cb: (data: {
  player_name: string
  card: Card
  discard_top: Card
  deck_size: number
}) => void) => on('card_discarded', cb)

// Round / game lifecycle
export const onRoundOver = (cb: (data: {
  round_number: number
  round_scores: Record<string, number>
  total_scores: Record<string, number>
}) => void) => on('round_over', cb)

export const onRoundStarted = (cb: (data: { round_number: number; contract: Contract }) => void) =>
  on('round_started', cb)

export const onGameOver = (cb: (data: {
  winner: string
  final_scores: Record<string, number>
}) => void) => on('game_over', cb)

// Errors
export const onError = (cb: (data: { message: string }) => void) =>
  on('error', cb)
