// Mock data source for GameTablePage.
// Backend integration should update/remove values in this file first.

export type CardSuit = 'CLUBS' | 'DIAMONDS' | 'HEARTS' | 'SPADES' | 'JOKER'
export type CardRank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | 'JOKER'

export type TableCard = {
  rank: CardRank
  suit: CardSuit
}

export type HandCard = TableCard & {
  id: string
}

export type OpponentSeat = {
  id: string
  name: string
  position: 'north' | 'north-east' | 'east' | 'west' | 'north-west'
  cardCount: number
  score: number
}

export type ScoreRow = {
  rank: number
  player: string
  score: number
  status: string
}

export type MeldGroup = {
  player: string
  melds: TableCard[][]
}

export type DemoRound = {
  roundNumber: number
  contractText: string
  requiredSets: number
  requiredRuns: number
  setSize: number
  runSize: number
}

export const opponentSeats: OpponentSeat[] = [
  { id: 'p2', name: 'Avery', position: 'north-west', cardCount: 10, score: 42 },
  { id: 'p3', name: 'Jordan', position: 'north', cardCount: 8, score: 31 },
  { id: 'p4', name: 'Kai', position: 'north-east', cardCount: 9, score: 37 },
  { id: 'p5', name: 'Morgan', position: 'east', cardCount: 11, score: 48 },
  { id: 'p6', name: 'Parker', position: 'west', cardCount: 7, score: 29 },
]

export const scoreRows: ScoreRow[] = [
  { rank: 1, player: 'Jordan', score: 31, status: 'Leading' },
  { rank: 2, player: 'You', score: 34, status: 'In Range' },
  { rank: 3, player: 'Kai', score: 37, status: 'In Range' },
  { rank: 4, player: 'Avery', score: 42, status: 'Chasing' },
  { rank: 5, player: 'Morgan', score: 48, status: 'Chasing' },
  { rank: 6, player: 'Parker', score: 52, status: 'Chasing' },
]

export const demoRounds: DemoRound[] = [
  { roundNumber: 1, contractText: '2 sets of 3', requiredSets: 2, requiredRuns: 0, setSize: 3, runSize: 4 },
  { roundNumber: 2, contractText: '1 set of 3 + 1 run of 4', requiredSets: 1, requiredRuns: 1, setSize: 3, runSize: 4 },
  { roundNumber: 3, contractText: '2 runs of 4', requiredSets: 0, requiredRuns: 2, setSize: 3, runSize: 4 },
  { roundNumber: 4, contractText: '3 sets of 3', requiredSets: 3, requiredRuns: 0, setSize: 3, runSize: 4 },
  { roundNumber: 5, contractText: '2 sets of 3 + 1 run of 4', requiredSets: 2, requiredRuns: 1, setSize: 3, runSize: 4 },
  { roundNumber: 6, contractText: '1 set of 3 + 2 runs of 4', requiredSets: 1, requiredRuns: 2, setSize: 3, runSize: 4 },
  { roundNumber: 7, contractText: '3 runs of 4', requiredSets: 0, requiredRuns: 3, setSize: 3, runSize: 4 },
]

export const discardTopCard: TableCard = { rank: '9', suit: 'HEARTS' }

export const mockDrawSequence: TableCard[] = [
  { rank: '4', suit: 'DIAMONDS' },
  { rank: 'A', suit: 'HEARTS' },
  { rank: '9', suit: 'SPADES' },
  { rank: 'JOKER', suit: 'JOKER' },
  { rank: '2', suit: 'CLUBS' },
]

const tableMelds: MeldGroup[] = [
  {
    player: 'You',
    melds: [
      [
        { rank: '7', suit: 'HEARTS' },
        { rank: '7', suit: 'SPADES' },
        { rank: '7', suit: 'DIAMONDS' },
      ],
      [
        { rank: '8', suit: 'CLUBS' },
        { rank: '9', suit: 'CLUBS' },
        { rank: '10', suit: 'CLUBS' },
        { rank: 'J', suit: 'CLUBS' },
      ],
    ],
  },
  {
    player: 'Jordan',
    melds: [
      [
        { rank: 'Q', suit: 'HEARTS' },
        { rank: 'Q', suit: 'CLUBS' },
        { rank: 'Q', suit: 'DIAMONDS' },
      ],
    ],
  },
  {
    player: 'Kai',
    melds: [
      [
        { rank: '4', suit: 'SPADES' },
        { rank: '5', suit: 'SPADES' },
        { rank: '6', suit: 'SPADES' },
        { rank: '7', suit: 'SPADES' },
      ],
    ],
  },
]

const denseMelds: MeldGroup[] = [
  {
    player: 'You',
    melds: [
      [
        { rank: '7', suit: 'HEARTS' },
        { rank: '7', suit: 'SPADES' },
        { rank: '7', suit: 'DIAMONDS' },
      ],
      [
        { rank: '8', suit: 'CLUBS' },
        { rank: '9', suit: 'CLUBS' },
        { rank: '10', suit: 'CLUBS' },
        { rank: 'J', suit: 'CLUBS' },
      ],
    ],
  },
  {
    player: 'Jordan',
    melds: [
      [
        { rank: 'Q', suit: 'HEARTS' },
        { rank: 'Q', suit: 'CLUBS' },
        { rank: 'Q', suit: 'DIAMONDS' },
      ],
      [
        { rank: '3', suit: 'HEARTS' },
        { rank: '4', suit: 'HEARTS' },
        { rank: '5', suit: 'HEARTS' },
        { rank: '6', suit: 'HEARTS' },
      ],
    ],
  },
  {
    player: 'Kai',
    melds: [
      [
        { rank: '5', suit: 'CLUBS' },
        { rank: '5', suit: 'DIAMONDS' },
        { rank: '5', suit: 'SPADES' },
      ],
      [
        { rank: '4', suit: 'SPADES' },
        { rank: '5', suit: 'SPADES' },
        { rank: '6', suit: 'SPADES' },
        { rank: '7', suit: 'SPADES' },
      ],
    ],
  },
  {
    player: 'Avery',
    melds: [
      [
        { rank: '9', suit: 'HEARTS' },
        { rank: '9', suit: 'CLUBS' },
        { rank: '9', suit: 'DIAMONDS' },
      ],
      [
        { rank: '10', suit: 'DIAMONDS' },
        { rank: 'J', suit: 'DIAMONDS' },
        { rank: 'Q', suit: 'DIAMONDS' },
        { rank: 'K', suit: 'DIAMONDS' },
      ],
    ],
  },
  {
    player: 'Morgan',
    melds: [
      [
        { rank: 'K', suit: 'CLUBS' },
        { rank: 'K', suit: 'HEARTS' },
        { rank: 'K', suit: 'SPADES' },
      ],
      [
        { rank: '2', suit: 'SPADES' },
        { rank: '3', suit: 'SPADES' },
        { rank: '4', suit: 'SPADES' },
        { rank: '5', suit: 'SPADES' },
      ],
    ],
  },
  {
    player: 'Parker',
    melds: [
      [
        { rank: 'A', suit: 'DIAMONDS' },
        { rank: 'A', suit: 'CLUBS' },
        { rank: 'A', suit: 'SPADES' },
      ],
      [
        { rank: '6', suit: 'CLUBS' },
        { rank: '7', suit: 'CLUBS' },
        { rank: '8', suit: 'CLUBS' },
        { rank: '9', suit: 'CLUBS' },
      ],
    ],
  },
]

const initialLocalHandCards: HandCard[] = [
  { id: 'h1', rank: '3', suit: 'HEARTS' },
  { id: 'h2', rank: '6', suit: 'CLUBS' },
  { id: 'h3', rank: '9', suit: 'HEARTS' },
  { id: 'h4', rank: '10', suit: 'DIAMONDS' },
  { id: 'h5', rank: 'J', suit: 'HEARTS' },
  { id: 'h6', rank: '2', suit: 'CLUBS' },
  { id: 'h7', rank: 'A', suit: 'SPADES' },
  { id: 'h8', rank: '8', suit: 'DIAMONDS' },
  { id: 'h9', rank: '5', suit: 'HEARTS' },
  { id: 'h10', rank: 'K', suit: 'CLUBS' },
  { id: 'h11', rank: 'JOKER', suit: 'JOKER' },
]

export function createInitialHandCards() {
  return initialLocalHandCards.map((card) => ({ ...card }))
}

export function createInitialMeldGroups() {
  return tableMelds.map((group) => ({
    player: group.player,
    melds: group.melds.map((meld) => meld.map((card) => ({ ...card }))),
  }))
}

export function createDenseMeldGroups() {
  return denseMelds.map((group) => ({
    player: group.player,
    melds: group.melds.map((meld) => meld.map((card) => ({ ...card }))),
  }))
}
