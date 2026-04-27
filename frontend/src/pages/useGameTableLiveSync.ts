import { useEffect } from 'react'
import type { Dispatch, MutableRefObject, SetStateAction } from 'react'
import type { HandCard, MeldGroup, TableCard } from './GameTablePage.mock'
import { applyMeldLaid, getCardDescription } from './GameTablePage.logic'
import { toContractText, toHandCards, toMeldGroups } from './GameTablePage.converters'
import {
  emitRejoinGame,
  onCardDiscarded,
  onCardDrawn,
  onError,
  onGameOver,
  onGameState,
  onHandUpdated,
  onMeldLaid,
  onMeldUpdated,
  onRoundOver,
  onRoundStarted,
  onTurnStarted,
  socket,
  type GameState,
} from '../services/socketService'

type PendingMeld = { type: 'set' | 'run'; cards: TableCard[] }

type UseGameTableLiveSyncParams = {
  appendActivity: (message: string) => void
  gameCode: string
  isDemo: boolean
  myName: string
  pendingMeldsRef: MutableRefObject<PendingMeld[]>
  setHandCards: Dispatch<SetStateAction<HandCard[]>>
  setIsDemoGameComplete: Dispatch<SetStateAction<boolean>>
  setLiveState: Dispatch<SetStateAction<GameState | null>>
  setMeldGroups: Dispatch<SetStateAction<MeldGroup[]>>
  setPendingMelds: Dispatch<SetStateAction<PendingMeld[]>>
  setSelectedCardIds: Dispatch<SetStateAction<string[]>>
  setShowBuyAction: Dispatch<SetStateAction<boolean>>
  setTopDiscardCard: Dispatch<SetStateAction<TableCard>>
}

export function useGameTableLiveSync({
  appendActivity,
  gameCode,
  isDemo,
  myName,
  pendingMeldsRef,
  setHandCards,
  setIsDemoGameComplete,
  setLiveState,
  setMeldGroups,
  setPendingMelds,
  setSelectedCardIds,
  setShowBuyAction,
  setTopDiscardCard,
}: UseGameTableLiveSyncParams) {
  useEffect(() => {
    if (isDemo) return

    socket.connect()

    const offState = onGameState((state) => {
      setLiveState(state)
      const me = state.players.find((player) => player.name === myName)
      if (me?.hand) setHandCards(toHandCards(me.hand))
      setMeldGroups(toMeldGroups(state.melds_on_table))
      if (state.discard_top) setTopDiscardCard(state.discard_top as TableCard)
      appendActivity('Game state received.')
    })

    const offHand = onHandUpdated(({ hand }) => {
      setHandCards((prev) => {
        const stagedCounts = new Map<string, number>()
        for (const meld of pendingMeldsRef.current) {
          for (const card of meld.cards) {
            const key = `${card.rank}-${card.suit}`
            stagedCounts.set(key, (stagedCounts.get(key) ?? 0) + 1)
          }
        }

        const unstaged = hand.filter((card) => {
          const key = `${card.rank}-${card.suit}`
          const remaining = stagedCounts.get(key) ?? 0
          if (remaining > 0) {
            stagedCounts.set(key, remaining - 1)
            return false
          }
          return true
        })

        const pool = new Map<string, HandCard[]>()
        for (const card of prev) {
          const key = `${card.rank}-${card.suit}`
          const bucket = pool.get(key) ?? []
          bucket.push(card)
          pool.set(key, bucket)
        }

        return unstaged.map((card) => {
          const key = `${card.rank}-${card.suit}`
          const bucket = pool.get(key)
          if (bucket && bucket.length > 0) return bucket.shift()!
          return {
            id: `${card.rank}-${card.suit}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            rank: card.rank as HandCard['rank'],
            suit: card.suit as HandCard['suit'],
          }
        })
      })
      setSelectedCardIds([])
    })

    const offDrawn = onCardDrawn(({ player_name, source, discard_top, deck_size, card_counts }) => {
      if (discard_top) setTopDiscardCard(discard_top as TableCard)
      setLiveState((prev) => (prev ? {
        ...prev,
        phase: 'play',
        deck_size,
        players: prev.players.map((player) =>
          card_counts?.[player.name] !== undefined ? { ...player, card_count: card_counts[player.name] } : player,
        ),
      } : prev))
      if (player_name !== myName) appendActivity(`${player_name} drew from ${source}.`)
    })

    const offDiscarded = onCardDiscarded(({ player_name, card, discard_top, card_counts }) => {
      setTopDiscardCard(discard_top as TableCard)
      setShowBuyAction(false)
      setLiveState((prev) => (prev ? {
        ...prev,
        players: prev.players.map((player) =>
          card_counts?.[player.name] !== undefined ? { ...player, card_count: card_counts[player.name] } : player,
        ),
      } : prev))
      appendActivity(`${player_name} discarded ${getCardDescription(card as TableCard)}.`)
    })

    const offMeldLaid = onMeldLaid(({ player_name, melds, card_counts }) => {
      setMeldGroups((prev) => {
        const newMelds = melds.map((meld) => meld.cards as TableCard[])
        const existing = prev.find((group) => group.player === player_name)
        if (existing) {
          return prev.map((group) => (
            group.player === player_name ? { ...group, melds: [...group.melds, ...newMelds] } : group
          ))
        }
        return [...prev, { player: player_name, melds: newMelds }]
      })
      setLiveState((prev) => {
        if (!prev) return prev
        const withLaidDown = applyMeldLaid(prev, player_name)
        return {
          ...withLaidDown,
          players: withLaidDown.players.map((player) =>
            card_counts?.[player.name] !== undefined ? { ...player, card_count: card_counts[player.name] } : player,
          ),
        }
      })
      setPendingMelds([])
      appendActivity(`${player_name} laid down ${melds.length} meld(s).`)
    })

    const offMeldUpdated = onMeldUpdated(({ target_player, meld_index, meld, card_counts }) => {
      setMeldGroups((prev) =>
        prev.map((group) => (
          group.player === target_player
            ? { ...group, melds: group.melds.map((cards, i) => (i === meld_index ? (meld.cards as TableCard[]) : cards)) }
            : group
        )),
      )
      if (card_counts) {
        setLiveState((prev) => (prev ? {
          ...prev,
          players: prev.players.map((player) =>
            card_counts[player.name] !== undefined ? { ...player, card_count: card_counts[player.name] } : player,
          ),
        } : prev))
      }
    })

    const offTurn = onTurnStarted(({ current_player }) => {
      setLiveState((prev) => (prev ? { ...prev, current_player, phase: 'draw' } : prev))
      setSelectedCardIds([])
      setShowBuyAction(false)
      appendActivity(current_player === myName ? 'Your turn — draw a card.' : `${current_player}'s turn.`)
    })

    const offRoundOver = onRoundOver(({ round_number, round_scores, total_scores }) => {
      setLiveState((prev) => (prev ? { ...prev, total_scores } : prev))
      const lines = Object.entries(round_scores)
        .map(([name, score]) => `${name === myName ? 'You' : name}: +${score}`)
        .join(', ')
      appendActivity(`Round ${round_number} over! ${lines}`)
    })

    const offRoundStarted = onRoundStarted(({ round_number, contract }) => {
      setLiveState((prev) => (prev ? { ...prev, round_number, contract, phase: 'draw' } : prev))
      setPendingMelds([])
      appendActivity(`Round ${round_number}: ${toContractText(contract)}`)
    })

    const offGameOver = onGameOver(({ winner, final_scores }) => {
      setLiveState((prev) => (prev ? { ...prev, phase: 'game_over', total_scores: final_scores } : prev))
      setIsDemoGameComplete(true)
      appendActivity(`Game over! ${winner === myName ? 'You win!' : `${winner} wins!`}`)
    })

    const offSocketError = onError(({ message }) => appendActivity(`Error: ${message}`))

    emitRejoinGame(gameCode, myName)

    return () => {
      offState()
      offHand()
      offDrawn()
      offDiscarded()
      offMeldLaid()
      offMeldUpdated()
      offTurn()
      offRoundOver()
      offRoundStarted()
      offGameOver()
      offSocketError()
    }
  }, [
    appendActivity,
    gameCode,
    isDemo,
    myName,
    pendingMeldsRef,
    setHandCards,
    setIsDemoGameComplete,
    setLiveState,
    setMeldGroups,
    setPendingMelds,
    setSelectedCardIds,
    setShowBuyAction,
    setTopDiscardCard,
  ])
}
