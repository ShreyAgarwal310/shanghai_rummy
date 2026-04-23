import type { CardRank, CardSuit, MeldGroup, TableCard } from './GameTablePage.mock'
import type { MeldDisplayEntry, MeldKind, MeldsByType } from './GameTablePage.types'
import type { GameState } from '../services/socketService'

export const suitSymbols: Record<CardSuit, string> = {
  CLUBS: '♣',
  DIAMONDS: '♦',
  HEARTS: '♥',
  SPADES: '♠',
  JOKER: '★',
}

const suitNames: Record<CardSuit, string> = {
  CLUBS: 'Clubs',
  DIAMONDS: 'Diamonds',
  HEARTS: 'Hearts',
  SPADES: 'Spades',
  JOKER: 'Joker',
}

export const redSuits = new Set<CardSuit>(['HEARTS', 'DIAMONDS'])

export function getRoundTypeLabel(requiredSets: number, requiredRuns: number) {
  if (requiredSets > 0 && requiredRuns > 0) {
    return 'Hybrid (Set + Run)'
  }
  if (requiredSets > 0) {
    return 'Set Focus'
  }
  return 'Run Focus'
}

export function buildCardBacks(count: number) {
  const visibleCards = Math.min(Math.max(count, 1), 6)
  return Array.from({ length: visibleCards }, (_, index) => `${count}-${index}`)
}

export function isWildcard(card: TableCard) {
  return card.rank === 'JOKER' || (card.rank === '2' && card.suit === 'CLUBS')
}

export function meldHasWildcard(meld: TableCard[]): boolean {
  return meld.some(isWildcard)
}

function getNonWildCards(cards: TableCard[]) {
  return cards.filter((card) => !isWildcard(card))
}

export function validateSetMeld(cards: TableCard[]) {
  if (cards.length < 3 || cards.length > 4) {
    return false
  }

  const nonWildCards = getNonWildCards(cards)
  if (nonWildCards.length < 2) {
    return false
  }

  const baseRank = nonWildCards[0].rank
  return nonWildCards.every((card) => card.rank === baseRank)
}

function getRunRankOptions(rank: CardRank) {
  const rankMap: Record<Exclude<CardRank, 'JOKER'>, number[]> = {
    '2': [2],
    '3': [3],
    '4': [4],
    '5': [5],
    '6': [6],
    '7': [7],
    '8': [8],
    '9': [9],
    '10': [10],
    J: [11],
    Q: [12],
    K: [13],
    A: [1, 14],
  }

  if (rank === 'JOKER') {
    return []
  }
  return rankMap[rank]
}

function expandRankAssignments(rankOptions: number[][]) {
  let assignments: number[][] = [[]]
  for (const options of rankOptions) {
    const nextAssignments: number[][] = []
    for (const prefix of assignments) {
      for (const option of options) {
        nextAssignments.push([...prefix, option])
      }
    }
    assignments = nextAssignments
  }
  return assignments
}

function isRunSequencePossible(sortedRanks: number[], wildCount: number, totalCards: number) {
  let requiredWild = 0
  for (let index = 0; index < sortedRanks.length - 1; index += 1) {
    const gap = sortedRanks[index + 1] - sortedRanks[index]
    if (gap <= 0) {
      return false
    }
    if (gap > 2) {
      return false
    }
    if (gap === 2) {
      requiredWild += 1
    }
  }

  if (requiredWild > wildCount) {
    return false
  }

  const nonWildCount = sortedRanks.length
  const slotCapacity = nonWildCount + 1
  const remainingCapacity = slotCapacity - requiredWild
  const extraWild = wildCount - requiredWild
  if (extraWild > remainingCapacity) {
    return false
  }

  return nonWildCount + wildCount === totalCards
}

export function validateRunMeld(cards: TableCard[]) {
  if (cards.length < 4) {
    return false
  }

  const nonWildCards = getNonWildCards(cards)
  if (nonWildCards.length < 2) {
    return false
  }

  const runSuit = nonWildCards[0].suit
  if (nonWildCards.some((card) => card.suit !== runSuit)) {
    return false
  }

  const wildCount = cards.length - nonWildCards.length
  const rankOptions = nonWildCards.map((card) => getRunRankOptions(card.rank))

  for (const assignment of expandRankAssignments(rankOptions)) {
    if (new Set(assignment).size !== assignment.length) {
      continue
    }

    const sortedRanks = [...assignment].sort((a, b) => a - b)
    if (isRunSequencePossible(sortedRanks, wildCount, cards.length)) {
      return true
    }
  }

  return false
}

const RANK_VALUE: Partial<Record<string, number>> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, J: 11, Q: 12, K: 13, A: 14,
}

export function sortRunCards(cards: TableCard[]): TableCard[] {
  const naturals = cards
    .filter((c) => !isWildcard(c))
    .sort((a, b) => (RANK_VALUE[a.rank] ?? 0) - (RANK_VALUE[b.rank] ?? 0))
  const wilds = cards.filter(isWildcard)

  if (wilds.length === 0) return naturals

  // Insert each wild into the first gap of size 2 it can fill; extras go at end
  const result: TableCard[] = []
  let wildIdx = 0
  for (let i = 0; i < naturals.length; i++) {
    result.push(naturals[i])
    if (i < naturals.length - 1 && wildIdx < wilds.length) {
      const curr = RANK_VALUE[naturals[i].rank] ?? 0
      const next = RANK_VALUE[naturals[i + 1].rank] ?? 0
      if (next - curr === 2) {
        result.push(wilds[wildIdx++])
      }
    }
  }
  while (wildIdx < wilds.length) {
    result.push(wilds[wildIdx++])
  }
  return result
}

export function detectMeldKind(cards: TableCard[]): MeldKind | null {
  if (validateSetMeld(cards)) {
    return 'set'
  }
  if (validateRunMeld(cards)) {
    return 'run'
  }
  return null
}

export function canReplaceWildcardInMeld(handCard: TableCard, meld: TableCard[]): number {
  if (isWildcard(handCard)) return -1
  for (let i = 0; i < meld.length; i++) {
    if (!isWildcard(meld[i])) continue
    const replaced = [...meld.slice(0, i), handCard, ...meld.slice(i + 1)]
    if (detectMeldKind(replaced) !== null) return i
  }
  return -1
}

export function getCardDescription(card: TableCard) {
  if (card.rank === 'JOKER') {
    return 'Joker'
  }
  return `${card.rank} of ${suitNames[card.suit]}`
}

export function buildMeldsByType(meldGroups: MeldGroup[]): MeldsByType {
  const sets: MeldDisplayEntry[] = []
  const runs: MeldDisplayEntry[] = []

  meldGroups.forEach((group, groupIndex) => {
    group.melds.forEach((meld, meldIndex) => {
      const kind = detectMeldKind(meld)
      if (!kind) {
        return
      }

      const entry: MeldDisplayEntry = {
        groupIndex,
        meldIndex,
        player: group.player,
        kind,
        cards: kind === 'run' ? sortRunCards(meld) : meld,
      }

      if (kind === 'set') {
        sets.push(entry)
      } else {
        runs.push(entry)
      }
    })
  })

  return { sets, runs }
}

export function applyMeldLaid(state: GameState, playerName: string): GameState {
  return {
    ...state,
    players: state.players.map((p) =>
      p.name === playerName ? { ...p, has_laid_down: true } : p,
    ),
  }
}

export function getMeldLaneClassName(meldCount: number) {
  if (meldCount <= 2) {
    return 'table-meld-lane table-meld-lane--spacious'
  }
  if (meldCount >= 6) {
    return 'table-meld-lane table-meld-lane--ultra'
  }
  if (meldCount >= 4) {
    return 'table-meld-lane table-meld-lane--dense'
  }
  return 'table-meld-lane'
}
