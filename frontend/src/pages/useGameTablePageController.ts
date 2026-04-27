import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createDenseMeldGroups,
  createInitialHandCards,
  createInitialMeldGroups,
  demoRounds,
  discardTopCard,
  mockDrawSequence,
  scoreRows as demoScoreRows,
  type HandCard,
  type MeldGroup,
  type TableCard,
} from './GameTablePage.mock'
import {
  canReplaceWildcardInMeld,
  detectMeldKind,
  getCardDescription,
  sortRunCards,
  validateRunMeld,
  validateSetMeld,
} from './GameTablePage.logic'
import { emitAddToMeld, emitDiscardCard, emitDrawCard, emitLayDown, emitStealJoker, type GameState } from '../services/socketService'
import { useGameTableDerivedState } from './useGameTableDerivedState'
import { useGameTableLiveSync } from './useGameTableLiveSync'

type PendingMeld = { type: 'set' | 'run'; cards: TableCard[] }

export function useGameTablePageController(gameId: string) {
  const gameCode = useRef(gameId.trim().toUpperCase()).current
  const myName = useRef(sessionStorage.getItem('sr_player_name') ?? 'You').current
  const isDemo = !gameCode || gameCode === 'DEMO-TABLE'

  const [liveState, setLiveState] = useState<GameState | null>(null)
  const isLiveMode = liveState !== null
  const isMyTurn = isLiveMode && liveState.current_player === myName
  const livePhase = liveState?.phase ?? 'draw'
  const myInfo = liveState?.players.find((p) => p.name === myName)
  const hasLaidDown = myInfo?.has_laid_down ?? false

  const [demoRoundIndex, setDemoRoundIndex] = useState(0)
  const [isDemoGameComplete, setIsDemoGameComplete] = useState(false)
  const [isDenseMeldPreview, setIsDenseMeldPreview] = useState(false)
  const [handCards, setHandCards] = useState<HandCard[]>(createInitialHandCards)
  const [meldGroups, setMeldGroups] = useState<MeldGroup[]>(createInitialMeldGroups)
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([])
  const [topDiscardCard, setTopDiscardCard] = useState<TableCard>(discardTopCard)
  const [showBuyAction, setShowBuyAction] = useState(false)
  const [stealJokerMode, setStealJokerMode] = useState(false)
  const [drawIndex, setDrawIndex] = useState(0)
  const [activityFeed, setActivityFeed] = useState<string[]>([
    isDemo ? 'Demo mode active. Select cards, then choose a target.' : 'Connecting to game...',
  ])
  const [pendingMelds, setPendingMelds] = useState<PendingMeld[]>([])

  const pendingMeldsRef = useRef(pendingMelds)
  useEffect(() => {
    pendingMeldsRef.current = pendingMelds
  }, [pendingMelds])

  const appendActivity = useCallback((message: string) => {
    setActivityFeed((feed) => [message, ...feed.slice(0, 5)])
  }, [])

  useGameTableLiveSync({
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
  })

  const currentDemoRound = demoRounds[demoRoundIndex]
  const isFinalDemoRound = demoRoundIndex === demoRounds.length - 1
  const demoWinner = demoScoreRows[0]
  const demoRunnerUp = demoScoreRows[1]
  const {
    contractRequirements,
    displayContractText,
    displayOpponents,
    displayRoundNumber,
    displayTotalRounds,
    extraScoreRows,
    finalLeaderboardRows,
    meldsByType,
    pinnedScoreRows,
    requirementLines,
    runLaneClassName,
    selectedCards,
    setLaneClassName,
    sortedScoreRows,
    turnLabel,
  } = useGameTableDerivedState({
    currentDemoRound,
    handCards,
    isDemoGameComplete,
    isLiveMode,
    isMyTurn,
    livePhase,
    liveState,
    meldGroups,
    myName,
    selectedCardIds,
  })
  const selectedTableCards = useMemo<TableCard[]>(
    () => selectedCards.map(({ rank, suit }) => ({ rank, suit })),
    [selectedCards],
  )

  const clearSelection = () => setSelectedCardIds([])

  const resetTablePreviewState = () => {
    setIsDenseMeldPreview(false)
    setHandCards(createInitialHandCards())
    setMeldGroups(createInitialMeldGroups())
    setSelectedCardIds([])
    setTopDiscardCard(discardTopCard)
    setShowBuyAction(false)
    setStealJokerMode(false)
    setDrawIndex(0)
    setPendingMelds([])
  }

  const createHandCard = (card: TableCard): HandCard => ({
    id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    rank: card.rank,
    suit: card.suit,
  })

  const handleBackToLobby = () => {
    window.location.assign('/')
  }

  const handleOpenRulebook = () => {
    window.location.assign(`/rules?returnTo=${encodeURIComponent(`/game/${gameId}`)}`)
  }

  const handleHandCardClick = (cardId: string) => {
    if (isDemoGameComplete) {
      appendActivity('Demo complete. Press Reset to continue.')
      return
    }
    setSelectedCardIds((current) => (
      current.includes(cardId) ? current.filter((id) => id !== cardId) : [...current, cardId]
    ))
    setShowBuyAction(false)
  }

  const handleDrawFromDeck = () => {
    if (isDemoGameComplete) {
      appendActivity('Demo complete. Press Reset to continue.')
      return
    }
    if (isLiveMode) {
      if (!isMyTurn) return void appendActivity('Not your turn.')
      if (livePhase !== 'draw') return void appendActivity('You have already drawn this turn.')
      emitDrawCard(gameCode, 'deck')
      return
    }
    const drawnCard = mockDrawSequence[drawIndex % mockDrawSequence.length]
    setDrawIndex((index) => index + 1)
    setHandCards((cards) => [...cards, createHandCard(drawnCard)])
    appendActivity(`Drew: ${getCardDescription(drawnCard)}.`)
    setShowBuyAction(false)
  }

  const handleDrawFromDiscard = () => {
    if (isDemoGameComplete) {
      appendActivity('Demo complete. Press Reset to continue.')
      return
    }
    if (isLiveMode) {
      if (!isMyTurn) return void appendActivity('Not your turn.')
      if (livePhase !== 'draw') return void appendActivity('You have already drawn this turn.')
      emitDrawCard(gameCode, 'discard')
      return
    }
    appendActivity(`Requested discard: ${getCardDescription(topDiscardCard)}.`)
    setShowBuyAction(true)
  }

  const handleDiscardPileClick = () => {
    if (isDemoGameComplete) return void appendActivity('Demo complete. Press Reset to continue.')
    if (isLiveMode) {
      if (!isMyTurn) return void appendActivity('Not your turn.')
      if (livePhase === 'draw') return void handleDrawFromDiscard()
      if (selectedCards.length !== 1) return void appendActivity('Select exactly one card to discard.')
      const [card] = selectedCards
      emitDiscardCard(gameCode, { rank: card.rank, suit: card.suit })
      return
    }
    if (selectedCards.length === 0) return void handleDrawFromDiscard()
    const [card] = selectedCards
    setTopDiscardCard({ rank: card.rank, suit: card.suit })
    setHandCards((cards) => cards.filter((current) => current.id !== card.id))
    clearSelection()
    setShowBuyAction(false)
    appendActivity(`Discarded: ${getCardDescription(card)}.`)
  }

  const handleDiscard = () => {
    if (!isLiveMode) return
    if (!isMyTurn) return void appendActivity('Not your turn.')
    if (livePhase !== 'play') return void appendActivity('Draw a card first.')
    if (selectedCards.length !== 1) return void appendActivity('Select exactly one card to discard.')
    const [card] = selectedCards
    setPendingMelds([])
    emitDiscardCard(gameCode, { rank: card.rank, suit: card.suit })
  }

  const handleBuyAction = () => {
    if (isDemoGameComplete) return void appendActivity('Demo complete. Press Reset to continue.')
    appendActivity(`Buy: contesting ${getCardDescription(topDiscardCard)}.`)
    setShowBuyAction(false)
  }

  const removeSelectedCardsFromHand = (cards: HandCard[]) => {
    const ids = new Set(cards.map((card) => card.id))
    setHandCards((current) => current.filter((card) => !ids.has(card.id)))
  }

  const handleAttemptMeld = () => {
    if (isDemoGameComplete) return void appendActivity('Demo complete.')
    if (selectedCards.length === 0) return void appendActivity('Select cards first.')
    const kind = detectMeldKind(selectedTableCards)
    if (!kind) return void appendActivity('Invalid meld: must form a legal set or run.')

    const orderedCards = kind === 'run' ? sortRunCards(selectedTableCards) : selectedTableCards
    if (isLiveMode) {
      if (!isMyTurn || livePhase !== 'play') return void appendActivity('Not your turn to meld.')
      if (hasLaidDown) return void appendActivity('Already laid down — click a table meld to add cards.')
    }

    setPendingMelds((prev) => [...prev, { type: kind, cards: orderedCards }])
    removeSelectedCardsFromHand(selectedCards)
    clearSelection()
    setShowBuyAction(false)
    appendActivity(`Staged ${kind}: ${selectedCards.map(getCardDescription).join(', ')}.`)
  }

  const handleSubmitLayDown = () => {
    if (pendingMelds.length === 0) return
    if (isLiveMode) {
      emitLayDown(gameCode, pendingMelds)
      return
    }
    setMeldGroups((groups) => {
      const newMelds = pendingMelds.map((meld) => meld.cards)
      const playerGroupIndex = groups.findIndex((group) => group.player === 'You')
      if (playerGroupIndex < 0) return [{ player: 'You', melds: newMelds }, ...groups]
      return groups.map((group, index) => (
        index === playerGroupIndex ? { ...group, melds: [...group.melds, ...newMelds] } : group
      ))
    })
    setPendingMelds([])
    appendActivity(`Laid down ${pendingMelds.length} meld(s).`)
  }

  const handleToggleStealJoker = () => {
    if (isDemoGameComplete) return void appendActivity('Demo complete. Press Reset Demo to continue.')
    setStealJokerMode((current) => {
      if (!current) {
        appendActivity('Steal Joker mode on — select a replacement card, then click a meld.')
      } else {
        appendActivity('Steal Joker mode cancelled.')
        clearSelection()
      }
      return !current
    })
  }

  const handleStealFromMeld = (groupIndex: number, meldIndex: number) => {
    if (isDemoGameComplete) return void appendActivity('Demo complete.')
    if (selectedCards.length === 0) return void appendActivity('Select a replacement card from your hand first.')
    const targetGroup = meldGroups[groupIndex]
    const targetMeld = targetGroup?.melds[meldIndex]
    if (!targetGroup || !targetMeld) return void appendActivity('Unable to target meld.')

    const replacement = selectedCards[0]
    const wildcardIndex = canReplaceWildcardInMeld(replacement, targetMeld)
    if (wildcardIndex === -1) {
      appendActivity(`${getCardDescription(replacement)} cannot replace any wildcard in that meld.`)
      return
    }

    const stolenCard = targetMeld[wildcardIndex]
    if (isLiveMode) {
      if (!isMyTurn || livePhase !== 'play') return void appendActivity('Not your turn.')
      emitStealJoker(
        gameCode,
        targetGroup.player,
        meldIndex,
        { rank: replacement.rank, suit: replacement.suit },
        wildcardIndex,
      )
      clearSelection()
      setStealJokerMode(false)
      appendActivity(
        `Stealing ${getCardDescription(stolenCard as TableCard)} from ${targetGroup.player}'s meld using ${getCardDescription(replacement)}.`,
      )
      return
    }

    setMeldGroups((groups) =>
      groups.map((group, groupPosition) => (
        groupPosition === groupIndex
          ? {
              ...group,
              melds: group.melds.map((meld, position) => (
                position === meldIndex
                  ? meld.map((card, cardPosition) => (
                      cardPosition === wildcardIndex ? { rank: replacement.rank, suit: replacement.suit } : card
                    ))
                  : meld
              )),
            }
          : group
      )),
    )
    setHandCards((cards) => [...cards.filter((card) => card.id !== replacement.id), createHandCard(stolenCard)])
    clearSelection()
    setStealJokerMode(false)
    setShowBuyAction(false)
    appendActivity(`Stole ${getCardDescription(stolenCard)} from ${targetGroup.player}'s meld using ${getCardDescription(replacement)}.`)
  }

  const handleLayoffToMeld = (groupIndex: number, meldIndex: number) => {
    if (isDemoGameComplete) return void appendActivity('Demo complete.')
    if (selectedCards.length === 0) return void appendActivity('Select a card first, then click a meld.')

    if (isLiveMode) {
      if (!isMyTurn) return void appendActivity('Not your turn.')
      if (livePhase !== 'play') return void appendActivity('Draw a card before laying off.')
      if (!hasLaidDown) return void appendActivity('Lay down your contract first.')
      const targetGroup = meldGroups[groupIndex]
      if (!targetGroup) return void appendActivity('Meld target not found.')
      emitAddToMeld(gameCode, targetGroup.player, meldIndex, selectedTableCards)
      clearSelection()
      return
    }

    const targetGroup = meldGroups[groupIndex]
    const targetMeld = targetGroup?.melds[meldIndex]
    if (!targetGroup || !targetMeld) return void appendActivity('Unable to target meld.')
    const kind = detectMeldKind(targetMeld)
    if (!kind) return void appendActivity('Target meld is invalid.')

    const combined = [...targetMeld, ...selectedTableCards]
    const isValid = kind === 'set' ? validateSetMeld(combined) : validateRunMeld(combined)
    if (!isValid) {
      appendActivity(kind === 'set' ? 'Invalid: rank must match.' : 'Invalid: must preserve suit/sequence.')
      return
    }

    setMeldGroups((groups) =>
      groups.map((group, position) => (
        position === groupIndex
          ? {
              ...group,
              melds: group.melds.map((meld, meldPosition) => (
                meldPosition === meldIndex ? [...meld, ...selectedTableCards] : meld
              )),
            }
          : group
      )),
    )
    removeSelectedCardsFromHand(selectedCards)
    clearSelection()
    setShowBuyAction(false)
    appendActivity(`Laid off onto ${targetGroup.player} meld ${meldIndex + 1}.`)
  }

  const handleClearSelection = () => {
    clearSelection()
    appendActivity('Selection cleared.')
  }

  const handleNextDemoRound = () => {
    if (isDemoGameComplete || isFinalDemoRound) return
    const nextRoundIndex = demoRoundIndex + 1
    setDemoRoundIndex(nextRoundIndex)
    resetTablePreviewState()
    appendActivity(`Round ${demoRounds[nextRoundIndex].roundNumber}: ${demoRounds[nextRoundIndex].contractText}.`)
  }

  const handleEndDemoGame = () => {
    if (!isFinalDemoRound) return
    setIsDemoGameComplete(true)
    clearSelection()
    setShowBuyAction(false)
    appendActivity('Game ended. Final summary unlocked.')
  }

  const handleResetDemo = () => {
    setDemoRoundIndex(0)
    setIsDemoGameComplete(false)
    resetTablePreviewState()
    setLiveState(null)
    setActivityFeed(['Demo reset to Round 1. Select cards, then choose a target.'])
  }

  const handleToggleDenseMeldPreview = () => {
    if (isDemoGameComplete) return void appendActivity('Reset demo before toggling.')
    setIsDenseMeldPreview((current) => {
      const next = !current
      setMeldGroups(next ? createDenseMeldGroups() : createInitialMeldGroups())
      clearSelection()
      setShowBuyAction(false)
      appendActivity(next ? 'Dense preview: 6 sets + 6 runs loaded.' : 'Dense preview disabled.')
      return next
    })
  }

  const handleJumpToDemoRound = (index: number) => {
    setDemoRoundIndex(index)
    resetTablePreviewState()
    appendActivity(`Jumped to Round ${demoRounds[index].roundNumber}: ${demoRounds[index].contractText}.`)
  }

  return {
    contractRequirements,
    activityFeed,
    currentDemoRound,
    demoRoundIndex,
    demoRunnerUp,
    demoRounds,
    demoWinner,
    displayContractText,
    displayOpponents,
    displayRoundNumber,
    displayTotalRounds,
    extraScoreRows,
    finalLeaderboardRows,
    handCards,
    hasLaidDown,
    isDemoGameComplete,
    isDenseMeldPreview,
    isFinalDemoRound,
    isLiveMode,
    isMyTurn,
    livePhase,
    liveState,
    meldsByType,
    pendingMelds,
    pinnedScoreRows,
    requirementLines,
    runLaneClassName,
    selectedCardIds,
    selectedCards,
    setLaneClassName,
    showBuyAction,
    sortedScoreRows,
    stealJokerMode,
    topDiscardCard,
    turnLabel,
    handleAttemptMeld,
    handleBackToLobby,
    handleBuyAction,
    handleClearSelection,
    handleDiscard,
    handleDiscardPileClick,
    handleDrawFromDeck,
    handleDrawFromDiscard,
    handleEndDemoGame,
    handleHandCardClick,
    handleJumpToDemoRound,
    handleLayoffToMeld,
    handleNextDemoRound,
    handleOpenRulebook,
    handleResetDemo,
    handleStealFromMeld,
    handleSubmitLayDown,
    handleToggleDenseMeldPreview,
    handleToggleStealJoker,
  }
}
