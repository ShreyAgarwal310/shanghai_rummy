export type HostedGamePlayer = {
  name: string
  isHost?: boolean
}

export type HostedGame = {
  id: string
  code: string
  name: string
  maxPlayers: number
  players: HostedGamePlayer[]
  status: 'waiting' | 'active'
}

