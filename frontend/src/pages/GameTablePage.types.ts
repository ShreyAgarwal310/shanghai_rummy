import type { TableCard } from './GameTablePage.mock'

export type GameTablePageProps = {
  gameId: string
}

export type MeldKind = 'set' | 'run'

export type MeldDisplayEntry = {
  groupIndex: number
  meldIndex: number
  player: string
  kind: MeldKind
  cards: TableCard[]
}

export type MeldsByType = {
  sets: MeldDisplayEntry[]
  runs: MeldDisplayEntry[]
}

export type PlayingCardSize = 'hand' | 'meld' | 'pile'
