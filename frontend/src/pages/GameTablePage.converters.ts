import type {
  CardRank,
  CardSuit,
  HandCard,
  OpponentSeat,
  ScoreRow,
  TableCard,
  MeldGroup,
} from './GameTablePage.mock'
import type { Contract, Meld as SocketMeld, PlayerInfo } from '../services/socketService'

export function toHandCards(cards: { rank: string; suit: string }[]): HandCard[] {
  return cards.map((c, i) => ({
    id: `${c.rank}-${c.suit}-${i}`,
    rank: c.rank as CardRank,
    suit: c.suit as CardSuit,
  }))
}

export function toMeldGroups(meldsOnTable: Record<string, SocketMeld[]>): MeldGroup[] {
  return Object.entries(meldsOnTable).map(([player, melds]) => ({
    player,
    melds: melds.map((m) => m.cards as TableCard[]),
  }))
}

export function toOpponentSeats(players: PlayerInfo[], myName: string): OpponentSeat[] {
  const positions: OpponentSeat['position'][] = ['north', 'north-west', 'west', 'north-east', 'east']
  return players
    .filter((p) => p.name !== myName)
    .map((p, i) => ({
      id: p.name,
      name: p.name,
      position: positions[i % positions.length],
      cardCount: p.card_count,
      score: p.total_score,
    }))
}

export function toScoreRows(totalScores: Record<string, number>, myName: string): ScoreRow[] {
  return Object.entries(totalScores)
    .sort(([, a], [, b]) => a - b)
    .map(([name, score], i) => ({
      rank: i + 1,
      player: name === myName ? 'You' : name,
      score,
      status: i === 0 ? 'Leading' : i <= 2 ? 'In Range' : 'Chasing',
    }))
}

export function toContractText(contract: Contract | null): string {
  if (!contract) return ''
  const parts: string[] = []
  if (contract.required_sets > 0) {
    parts.push(`${contract.required_sets} Set${contract.required_sets > 1 ? 's' : ''}`)
  }
  if (contract.required_runs > 0) {
    parts.push(`${contract.required_runs} Run${contract.required_runs > 1 ? 's' : ''}`)
  }
  return parts.join(' + ')
}
