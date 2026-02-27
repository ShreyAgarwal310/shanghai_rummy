import type { HostedGame } from '../types/game'

type CreateGameInput = {
  gameName: string
  maxPlayers: number
  hostName?: string
}

const DEMO_HOSTED_GAME_KEY = 'shanghai_rummy_demo_hosted_game'

export function isDemoModeEnabled() {
  return import.meta.env.VITE_DEMO_MODE !== 'false'
}

function generateGameCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i += 1) {
    const index = Math.floor(Math.random() * alphabet.length)
    code += alphabet[index]
  }
  return code
}

function buildDemoHostedGame(input: CreateGameInput): HostedGame {
  const id = `demo-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000).toString(36)}`

  return {
    id,
    code: generateGameCode(),
    name: input.gameName.trim(),
    maxPlayers: input.maxPlayers,
    players: [{ name: input.hostName?.trim() || 'You', isHost: true }],
    status: 'waiting',
  }
}

export async function createGame(input: CreateGameInput): Promise<HostedGame> {
  if (!isDemoModeEnabled()) {
    throw new Error('Create game API is not connected yet. Enable VITE_DEMO_MODE=true for UI testing.')
  }

  const game = buildDemoHostedGame(input)
  sessionStorage.setItem(DEMO_HOSTED_GAME_KEY, JSON.stringify(game))
  return game
}

export function getHostedGameById(gameId: string): HostedGame | null {
  const rawValue = sessionStorage.getItem(DEMO_HOSTED_GAME_KEY)
  if (!rawValue) {
    return null
  }

  try {
    const game = JSON.parse(rawValue) as HostedGame
    if (game.id !== gameId) {
      return null
    }
    return game
  } catch {
    return null
  }
}

