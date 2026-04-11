/**
 * Unit tests for GameTablePage.logic.ts
 *
 * Testing strategy
 * ----------------
 * This file is pure TypeScript with zero React, DOM, or network dependencies.
 * Every export is a deterministic function of its inputs, making it ideal for
 * unit testing in complete isolation.
 *
 * The file contains two major validators (validateSetMeld, validateRunMeld)
 * that mirror the Python backend logic, plus five utility functions.
 * We apply equivalence partitioning across all meaningful input classes
 * for each function.
 *
 * Equivalence classes tested
 * --------------------------
 * validateSetMeld : < 3 cards, exactly 3, < 2 non-wilds, mixed ranks,
 *                   wildcards (Joker + 2♣) treated as wilds
 * validateRunMeld : < 4 cards, mixed suits, consecutive, gap-of-2 with wild,
 *                   adjacent wilds (invalid), Ace-low, Ace-high, Ace-wrap
 * getRoundTypeLabel : sets+runs, sets-only, runs-only, neither
 * buildCardBacks  : below-min (clamp), normal, at-max, above-max (clamp)
 * detectMeldKind  : valid set, valid run, neither
 * getCardDescription : Joker, regular card, all suits via suitNames
 * buildMeldsByType : empty, set entry, run entry, unclassifiable meld (skipped)
 * getMeldLaneClassName : ≤2 (spacious), 3 (default), 4–5 (dense), ≥6 (ultra)
 */

import { describe, it, expect } from 'vitest'
import type { TableCard } from '../pages/GameTablePage.mock'
import type { MeldGroup } from '../pages/GameTablePage.mock'
import {
  suitSymbols,
  redSuits,
  getRoundTypeLabel,
  buildCardBacks,
  validateSetMeld,
  validateRunMeld,
  detectMeldKind,
  getCardDescription,
  buildMeldsByType,
  getMeldLaneClassName,
} from '../pages/GameTablePage.logic'

// Helpers

function card(rank: TableCard['rank'], suit: TableCard['suit'] = 'HEARTS'): TableCard {
  return { rank, suit }
}

const JOKER: TableCard = { rank: 'JOKER', suit: 'JOKER' }
const TWO_CLUBS: TableCard = { rank: '2', suit: 'CLUBS' }

// suitSymbols and redSuits (module-level constants)

describe('suitSymbols', () => {
  it('maps CLUBS to ♣', () => expect(suitSymbols.CLUBS).toBe('♣'))
  it('maps DIAMONDS to ♦', () => expect(suitSymbols.DIAMONDS).toBe('♦'))
  it('maps HEARTS to ♥', () => expect(suitSymbols.HEARTS).toBe('♥'))
  it('maps SPADES to ♠', () => expect(suitSymbols.SPADES).toBe('♠'))
  it('maps JOKER to ★', () => expect(suitSymbols.JOKER).toBe('★'))
})

describe('redSuits', () => {
  it('contains HEARTS', () => expect(redSuits.has('HEARTS')).toBe(true))
  it('contains DIAMONDS', () => expect(redSuits.has('DIAMONDS')).toBe(true))
  it('does not contain CLUBS', () => expect(redSuits.has('CLUBS')).toBe(false))
  it('does not contain SPADES', () => expect(redSuits.has('SPADES')).toBe(false))
})

// getRoundTypeLabel

describe('getRoundTypeLabel', () => {
  it('returns Hybrid when both sets and runs are required', () => {
    expect(getRoundTypeLabel(1, 1)).toBe('Hybrid (Set + Run)')
  })

  it('returns Hybrid when multiple sets and runs are required', () => {
    expect(getRoundTypeLabel(2, 3)).toBe('Hybrid (Set + Run)')
  })

  it('returns Set Focus when only sets are required', () => {
    expect(getRoundTypeLabel(2, 0)).toBe('Set Focus')
  })

  it('returns Run Focus when only runs are required', () => {
    expect(getRoundTypeLabel(0, 2)).toBe('Run Focus')
  })

  it('returns Run Focus when neither sets nor runs are required', () => {
    // Falls through both if-checks — edge case worth pinning
    expect(getRoundTypeLabel(0, 0)).toBe('Run Focus')
  })
})

// buildCardBacks

describe('buildCardBacks', () => {
  it('clamps count of 0 up to 1 visible card', () => {
    expect(buildCardBacks(0)).toHaveLength(1)
  })

  it('negative count is clamped to 1', () => {
    expect(buildCardBacks(-5)).toHaveLength(1)
  })

  it('count of 3 returns 3 entries', () => {
    expect(buildCardBacks(3)).toHaveLength(3)
  })

  it('count of 6 returns 6 entries', () => {
    expect(buildCardBacks(6)).toHaveLength(6)
  })

  it('clamps count above 6 to 6 visible cards', () => {
    expect(buildCardBacks(20)).toHaveLength(6)
  })

  it('each entry is a string with the format count-index', () => {
    const result = buildCardBacks(3)
    expect(result[0]).toBe('3-0')
    expect(result[1]).toBe('3-1')
    expect(result[2]).toBe('3-2')
  })
})

// validateSetMeld

describe('validateSetMeld', () => {
  it('rejects fewer than 3 cards', () => {
    expect(validateSetMeld([card('7'), card('7')])).toBe(false)
  })

  it('accepts 3 cards of the same rank', () => {
    expect(validateSetMeld([
      card('7', 'HEARTS'),
      card('7', 'SPADES'),
      card('7', 'CLUBS'),
    ])).toBe(true)
  })

  it('accepts 4 cards of the same rank', () => {
    expect(validateSetMeld([
      card('K', 'HEARTS'),
      card('K', 'SPADES'),
      card('K', 'CLUBS'),
      card('K', 'DIAMONDS'),
    ])).toBe(true)
  })

  it('rejects cards with mixed ranks', () => {
    expect(validateSetMeld([
      card('7', 'HEARTS'),
      card('8', 'SPADES'),
      card('7', 'CLUBS'),
    ])).toBe(false)
  })

  it('accepts set with one Joker wildcard', () => {
    expect(validateSetMeld([
      card('Q', 'HEARTS'),
      card('Q', 'SPADES'),
      JOKER,
    ])).toBe(true)
  })

  it('accepts set with 2-of-Clubs wildcard', () => {
    expect(validateSetMeld([
      card('J', 'HEARTS'),
      card('J', 'DIAMONDS'),
      TWO_CLUBS,
    ])).toBe(true)
  })

  it('rejects when fewer than 2 non-wild cards (only wildcards)', () => {
    // 1 non-wild + 2 wildcards → can not determine a base rank
    expect(validateSetMeld([
      card('Q', 'HEARTS'),
      JOKER,
      TWO_CLUBS,
    ])).toBe(false)
  })

  it('rejects all-wildcard hand', () => {
    expect(validateSetMeld([JOKER, JOKER, TWO_CLUBS])).toBe(false)
  })

  it('accepts Ace as a valid rank in a set', () => {
    expect(validateSetMeld([
      card('A', 'HEARTS'),
      card('A', 'SPADES'),
      card('A', 'DIAMONDS'),
    ])).toBe(true)
  })
})

// validateRunMeld

describe('validateRunMeld', () => {
  it('rejects fewer than 4 cards', () => {
    expect(validateRunMeld([card('5'), card('6'), card('7')])).toBe(false)
  })

  it('accepts 4 consecutive same-suit cards', () => {
    expect(validateRunMeld([
      card('4', 'SPADES'), card('5', 'SPADES'),
      card('6', 'SPADES'), card('7', 'SPADES'),
    ])).toBe(true)
  })

  it('accepts 5 consecutive same-suit cards', () => {
    expect(validateRunMeld([
      card('3', 'CLUBS'), card('4', 'CLUBS'), card('5', 'CLUBS'),
      card('6', 'CLUBS'), card('7', 'CLUBS'),
    ])).toBe(true)
  })

  it('rejects mixed suits among non-wild cards', () => {
    expect(validateRunMeld([
      card('5', 'HEARTS'), card('6', 'SPADES'),
      card('7', 'HEARTS'), card('8', 'HEARTS'),
    ])).toBe(false)
  })

  it('accepts run with a Joker filling an internal gap', () => {
    expect(validateRunMeld([
      card('4', 'DIAMONDS'), JOKER,
      card('6', 'DIAMONDS'), card('7', 'DIAMONDS'),
    ])).toBe(true)
  })

  it('accepts run with 2-of-Clubs filling a gap', () => {
    expect(validateRunMeld([
      card('6', 'HEARTS'), TWO_CLUBS,
      card('8', 'HEARTS'), card('9', 'HEARTS'),
    ])).toBe(true)
  })

  it('rejects two adjacent wildcards internally', () => {
    expect(validateRunMeld([
      card('4', 'HEARTS'), JOKER,
      TWO_CLUBS, card('7', 'HEARTS'),
    ])).toBe(false)
  })

  it('accepts wildcard at the start of the run', () => {
    expect(validateRunMeld([
      JOKER, card('5', 'CLUBS'),
      card('6', 'CLUBS'), card('7', 'CLUBS'),
    ])).toBe(true)
  })

  it('accepts wildcard at the end of the run', () => {
    expect(validateRunMeld([
      card('5', 'CLUBS'), card('6', 'CLUBS'),
      card('7', 'CLUBS'), JOKER,
    ])).toBe(true)
  })

  it('accepts wildcards at both ends (non-adjacent)', () => {
    expect(validateRunMeld([
      JOKER, card('5', 'CLUBS'),
      card('6', 'CLUBS'), card('7', 'CLUBS'), JOKER,
    ])).toBe(true)
  })

  it('accepts Ace-low run (A-2-3-4)', () => {
    expect(validateRunMeld([
      card('A', 'HEARTS'), card('2', 'HEARTS'),
      card('3', 'HEARTS'), card('4', 'HEARTS'),
    ])).toBe(true)
  })

  it('accepts Ace-high run (J-Q-K-A)', () => {
    expect(validateRunMeld([
      card('J', 'SPADES'), card('Q', 'SPADES'),
      card('K', 'SPADES'), card('A', 'SPADES'),
    ])).toBe(true)
  })

  it('rejects Ace wrap-around (Q-K-A-2)', () => {
    expect(validateRunMeld([
      card('Q', 'HEARTS'), card('K', 'HEARTS'),
      card('A', 'HEARTS'), card('2', 'HEARTS'),
    ])).toBe(false)
  })

  it('rejects run with fewer than 2 non-wild cards', () => {
    expect(validateRunMeld([card('7', 'HEARTS'), JOKER, JOKER, JOKER])).toBe(false)
  })

  it('rejects all-wildcard hand', () => {
    expect(validateRunMeld([JOKER, JOKER, JOKER, JOKER])).toBe(false)
  })
})

// detectMeldKind

describe('detectMeldKind', () => {
  it('returns "set" for a valid set', () => {
    expect(detectMeldKind([
      card('8', 'HEARTS'), card('8', 'SPADES'), card('8', 'CLUBS'),
    ])).toBe('set')
  })

  it('returns "run" for a valid run', () => {
    expect(detectMeldKind([
      card('3', 'DIAMONDS'), card('4', 'DIAMONDS'),
      card('5', 'DIAMONDS'), card('6', 'DIAMONDS'),
    ])).toBe('run')
  })

  it('returns null for cards that are neither a valid set nor run', () => {
    expect(detectMeldKind([
      card('3', 'HEARTS'), card('7', 'SPADES'), card('J', 'CLUBS'),
    ])).toBeNull()
  })

  it('returns null for an empty array', () => {
    expect(detectMeldKind([])).toBeNull()
  })
})

// getCardDescription

describe('getCardDescription', () => {
  it('returns "Joker" for a Joker card', () => {
    expect(getCardDescription(JOKER)).toBe('Joker')
  })

  it('formats a number card as "rank of Suit"', () => {
    expect(getCardDescription(card('7', 'HEARTS'))).toBe('7 of Hearts')
  })

  it('formats a face card correctly', () => {
    expect(getCardDescription(card('Q', 'SPADES'))).toBe('Q of Spades')
  })

  it('formats Clubs suit correctly', () => {
    expect(getCardDescription(card('A', 'CLUBS'))).toBe('A of Clubs')
  })

  it('formats Diamonds suit correctly', () => {
    expect(getCardDescription(card('10', 'DIAMONDS'))).toBe('10 of Diamonds')
  })
})

// buildMeldsByType

describe('buildMeldsByType', () => {
  it('returns empty sets and runs for an empty input', () => {
    const result = buildMeldsByType([])
    expect(result.sets).toHaveLength(0)
    expect(result.runs).toHaveLength(0)
  })

  it('classifies a valid set meld into sets', () => {
    const groups: MeldGroup[] = [{
      player: 'Alice',
      melds: [[
        card('9', 'HEARTS'), card('9', 'SPADES'), card('9', 'CLUBS'),
      ]],
    }]
    const result = buildMeldsByType(groups)
    expect(result.sets).toHaveLength(1)
    expect(result.runs).toHaveLength(0)
    expect(result.sets[0].player).toBe('Alice')
    expect(result.sets[0].kind).toBe('set')
  })

  it('classifies a valid run meld into runs', () => {
    const groups: MeldGroup[] = [{
      player: 'Bob',
      melds: [[
        card('5', 'CLUBS'), card('6', 'CLUBS'),
        card('7', 'CLUBS'), card('8', 'CLUBS'),
      ]],
    }]
    const result = buildMeldsByType(groups)
    expect(result.runs).toHaveLength(1)
    expect(result.sets).toHaveLength(0)
    expect(result.runs[0].kind).toBe('run')
  })

  it('skips melds that are neither a valid set nor run', () => {
    const groups: MeldGroup[] = [{
      player: 'Eve',
      melds: [[card('3', 'HEARTS'), card('9', 'SPADES')]],
    }]
    const result = buildMeldsByType(groups)
    expect(result.sets).toHaveLength(0)
    expect(result.runs).toHaveLength(0)
  })

  it('handles multiple players with mixed meld types', () => {
    const groups: MeldGroup[] = [
      {
        player: 'Alice',
        melds: [
          [card('K', 'HEARTS'), card('K', 'SPADES'), card('K', 'CLUBS')],
          [card('3', 'DIAMONDS'), card('4', 'DIAMONDS'), card('5', 'DIAMONDS'), card('6', 'DIAMONDS')],
        ],
      },
      {
        player: 'Bob',
        melds: [
          [card('A', 'CLUBS'), card('A', 'HEARTS'), card('A', 'SPADES')],
        ],
      },
    ]
    const result = buildMeldsByType(groups)
    expect(result.sets).toHaveLength(2)
    expect(result.runs).toHaveLength(1)
  })

  it('records correct groupIndex and meldIndex on entries', () => {
    const groups: MeldGroup[] = [
      {
        player: 'Alice',
        melds: [
          [card('7', 'HEARTS'), card('7', 'SPADES'), card('7', 'CLUBS')],
        ],
      },
    ]
    const result = buildMeldsByType(groups)
    expect(result.sets[0].groupIndex).toBe(0)
    expect(result.sets[0].meldIndex).toBe(0)
  })
})

// getMeldLaneClassName

describe('getMeldLaneClassName', () => {
  it('returns spacious class for 1 meld', () => {
    expect(getMeldLaneClassName(1)).toBe('table-meld-lane table-meld-lane--spacious')
  })

  it('returns spacious class for 2 melds', () => {
    expect(getMeldLaneClassName(2)).toBe('table-meld-lane table-meld-lane--spacious')
  })

  it('returns default class for 3 melds', () => {
    expect(getMeldLaneClassName(3)).toBe('table-meld-lane')
  })

  it('returns dense class for 4 melds', () => {
    expect(getMeldLaneClassName(4)).toBe('table-meld-lane table-meld-lane--dense')
  })

  it('returns dense class for 5 melds', () => {
    expect(getMeldLaneClassName(5)).toBe('table-meld-lane table-meld-lane--dense')
  })

  it('returns ultra class for 6 melds', () => {
    expect(getMeldLaneClassName(6)).toBe('table-meld-lane table-meld-lane--ultra')
  })

  it('returns ultra class for more than 6 melds', () => {
    expect(getMeldLaneClassName(10)).toBe('table-meld-lane table-meld-lane--ultra')
  })
})
