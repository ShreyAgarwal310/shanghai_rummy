import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './GameTablePage.css'
import {
  createDenseMeldGroups,
  createInitialHandCards,
  createInitialMeldGroups,
  demoRounds,
  discardTopCard,
  mockDrawSequence,
  opponentSeats as demoOpponentSeats,
  scoreRows as demoScoreRows,
  type CardRank,
  type CardSuit,
  type HandCard,
  type MeldGroup,
  type OpponentSeat,
  type ScoreRow,
  type TableCard,
} from './GameTablePage.mock'
import {
  buildMeldsByType,
  canReplaceWildcardInMeld,
  detectMeldKind,
  getCardDescription,
  getMeldLaneClassName,
  validateRunMeld,
  validateSetMeld,
} from './GameTablePage.logic'
import type { GameTablePageProps } from './GameTablePage.types'
import DemoRail from './GameTablePage/components/DemoRail'
import EndGameOverlay from './GameTablePage/components/EndGameOverlay'
import LocalPlayerZone from './GameTablePage/components/LocalPlayerZone'
import TableCenter from './GameTablePage/components/TableCenter'
import {
  socket,
  emitDrawCard,
  emitLayDown,
  emitAddToMeld,
  emitDiscardCard,
  emitStealJoker,
  emitRejoinGame,
  onGameState,
  onHandUpdated,
  onCardDrawn,
  onCardDiscarded,
  onMeldLaid,
  onMeldUpdated,
  onTurnStarted,
  onRoundOver,
  onRoundStarted,
  onGameOver,
  onError,
  type GameState,
  type Contract,
  type Meld as SocketMeld,
  type PlayerInfo,
} from '../services/socketService'

// ── Simple dropdown hook ──────────────────────────────────
function useDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const toggle = () => setIsOpen((prev) => !prev)
  const close = () => setIsOpen(false)
  const handleBlur = (e: React.FocusEvent) => {
    if (!ref.current?.contains(e.relatedTarget as Node)) close()
  }
  return { isOpen, toggle, close, ref, handleBlur }
}

// ── Socket → display type converters ─────────────────────

function toHandCards(cards: { rank: string; suit: string }[]): HandCard[] {
  return cards.map((c, i) => ({
    id: `${c.rank}-${c.suit}-${i}`,
    rank: c.rank as CardRank,
    suit: c.suit as CardSuit,
  }))
}

function toMeldGroups(meldsOnTable: Record<string, SocketMeld[]>): MeldGroup[] {
  return Object.entries(meldsOnTable).map(([player, melds]) => ({
    player,
    melds: melds.map((m) => m.cards as TableCard[]),
  }))
}

function toOpponentSeats(players: PlayerInfo[], myName: string): OpponentSeat[] {
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

function toScoreRows(totalScores: Record<string, number>, myName: string): ScoreRow[] {
  return Object.entries(totalScores)
    .sort(([, a], [, b]) => a - b)
    .map(([name, score], i) => ({
      rank: i + 1,
      player: name === myName ? 'You' : name,
      score,
      status: i === 0 ? 'Leading' : i <= 2 ? 'In Range' : 'Chasing',
    }))
}

function toContractText(contract: Contract | null): string {
  if (!contract) return ''
  const parts: string[] = []
  if (contract.required_sets > 0)
    parts.push(`${contract.required_sets} Set${contract.required_sets > 1 ? 's' : ''}`)
  if (contract.required_runs > 0)
    parts.push(`${contract.required_runs} Run${contract.required_runs > 1 ? 's' : ''}`)
  return parts.join(' + ')
}

// ── Component ─────────────────────────────────────────────

function GameTablePage({ gameId }: GameTablePageProps) {
  // ── Identity (stable — derived once from props/sessionStorage) ────────────
  const gameCode = useRef(gameId.trim().toUpperCase()).current
  const myName = useRef(sessionStorage.getItem('sr_player_name') ?? 'You').current
  const isDemo = !gameCode || gameCode === 'DEMO-TABLE'

  // ── Live game state ───────────────────────────────────────
  const [liveState, setLiveState] = useState<GameState | null>(null)
  const isLiveMode = liveState !== null
  const isMyTurn = isLiveMode && liveState.current_player === myName
  const livePhase = liveState?.phase ?? 'draw'
  const myInfo = liveState?.players.find((p) => p.name === myName)
  const hasLaidDown = myInfo?.has_laid_down ?? false

  // ── Demo state ────────────────────────────────────────────
  const [demoRoundIndex, setDemoRoundIndex] = useState(0)
  const [isDemoGameComplete, setIsDemoGameComplete] = useState(false)
  const [isDenseMeldPreview, setIsDenseMeldPreview] = useState(false)

  // ── Shared interactive state ──────────────────────────────
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

  // Pending melds staged locally before submitting lay_down
  const [pendingMelds, setPendingMelds] = useState<{ type: 'set' | 'run'; cards: TableCard[] }[]>([])

  // Sidebar / dropdowns
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const roundDropdown = useDropdown()
  const actionsDropdown = useDropdown()

  // ── Activity feed ─────────────────────────────────────────
  const appendActivity = useCallback((message: string) => {
    setActivityFeed((feed) => [message, ...feed.slice(0, 5)])
  }, [])

  // ── Socket setup (live mode only) ─────────────────────────
  useEffect(() => {
    if (isDemo) return

    socket.connect()

    const offState = onGameState((state) => {
      setLiveState(state)
      const me = state.players.find((p) => p.name === myName)
      if (me?.hand) setHandCards(toHandCards(me.hand))
      setMeldGroups(toMeldGroups(state.melds_on_table))
      if (state.discard_top) setTopDiscardCard(state.discard_top as TableCard)
      appendActivity('Game state received.')
    })

    const offHand = onHandUpdated(({ hand }) => {
      setHandCards(toHandCards(hand))
      setSelectedCardIds([])
    })

    const offDrawn = onCardDrawn(({ player_name, source, discard_top }) => {
      if (discard_top) setTopDiscardCard(discard_top as TableCard)
      // Backend phase is now "play" — update liveState so discard guard passes
      setLiveState((prev) => (prev ? { ...prev, phase: 'play' } : prev))
      if (player_name !== myName) appendActivity(`${player_name} drew from ${source}.`)
    })

    const offDiscarded = onCardDiscarded(({ player_name, card, discard_top }) => {
      setTopDiscardCard(discard_top as TableCard)
      setShowBuyAction(false)
      appendActivity(`${player_name} discarded ${getCardDescription(card as TableCard)}.`)
    })

    const offMeldLaid = onMeldLaid(({ player_name, melds }) => {
      setMeldGroups((prev) => {
        const newMelds = melds.map((m) => m.cards as TableCard[])
        const existing = prev.find((g) => g.player === player_name)
        if (existing) {
          return prev.map((g) =>
            g.player === player_name ? { ...g, melds: [...g.melds, ...newMelds] } : g,
          )
        }
        return [...prev, { player: player_name, melds: newMelds }]
      })
      setLiveState((prev) =>
        prev
          ? {
              ...prev,
              players: prev.players.map((p) =>
                p.name === player_name ? { ...p, has_laid_down: true } : p,
              ),
            }
          : prev,
      )
      setPendingMelds([])
      appendActivity(`${player_name} laid down ${melds.length} meld(s).`)
    })

    const offMeldUpdated = onMeldUpdated(({ target_player, meld_index, meld }) => {
      setMeldGroups((prev) =>
        prev.map((g) =>
          g.player === target_player
            ? { ...g, melds: g.melds.map((m, i) => (i === meld_index ? (meld.cards as TableCard[]) : m)) }
            : g,
        ),
      )
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
        .map(([n, s]) => `${n === myName ? 'You' : n}: +${s}`)
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

    const offError = onError(({ message }) => {
      appendActivity(`Error: ${message}`)
    })

    // Emit rejoin AFTER all listeners are registered so game_state response is caught
    emitRejoinGame(gameCode, myName)

    return () => {
      offState(); offHand(); offDrawn(); offDiscarded()
      offMeldLaid(); offMeldUpdated(); offTurn()
      offRoundOver(); offRoundStarted(); offGameOver(); offError()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived display data ──────────────────────────────────
  const currentDemoRound = demoRounds[demoRoundIndex]
  const isFinalDemoRound = demoRoundIndex === demoRounds.length - 1
  const demoWinner = demoScoreRows[0]
  const demoRunnerUp = demoScoreRows[1]

  const displayContractText = isLiveMode
    ? toContractText(liveState.contract)
    : currentDemoRound.contractText
  const displayRoundNumber = isLiveMode ? liveState.round_number : currentDemoRound.roundNumber
  const displayTotalRounds = isLiveMode ? 10 : demoRounds.length

  const displayOpponents = useMemo(
    () => (isLiveMode ? toOpponentSeats(liveState.players, myName) : demoOpponentSeats),
    [isLiveMode, liveState],
  )

  const displayScoreRows = useMemo(
    () => (isLiveMode ? toScoreRows(liveState.total_scores, myName) : demoScoreRows),
    [isLiveMode, liveState],
  )

  const finalLeaderboardRows = useMemo(
    () => [...displayScoreRows].sort((a, b) => a.score - b.score),
    [displayScoreRows],
  )
  const yourScoreRow = displayScoreRows.find((r) => r.player === 'You') ?? displayScoreRows[0]

  const sortedScoreRows = useMemo(
    () => [...displayScoreRows].sort((a, b) => a.score - b.score),
    [displayScoreRows],
  )

  const pinnedScoreRows = useMemo(() => {
    const leader = displayScoreRows[0]
    const second = displayScoreRows[1]
    const rows: ScoreRow[] = [leader]
    if (second && second.player !== leader.player) rows.push(second)
    if (!rows.some((r) => r.player === yourScoreRow.player)) rows.push(yourScoreRow)
    return rows
  }, [displayScoreRows, yourScoreRow])

  const extraScoreRows = useMemo(
    () => displayScoreRows.filter((r) => !pinnedScoreRows.some((p) => p.player === r.player)),
    [displayScoreRows, pinnedScoreRows],
  )

  const meldsByType = useMemo(() => buildMeldsByType(meldGroups), [meldGroups])
  const setLaneClassName = getMeldLaneClassName(meldsByType.sets.length)
  const runLaneClassName = getMeldLaneClassName(meldsByType.runs.length)

  const selectedCards = useMemo(
    () => handCards.filter((c) => selectedCardIds.includes(c.id)),
    [handCards, selectedCardIds],
  )
  const selectedTableCards = useMemo(
    () => selectedCards.map(({ rank, suit }) => ({ rank, suit })),
    [selectedCards],
  )

  // ── Contract requirements (drives Lay Down enabled state) ─
  const contractRequirements = useMemo(() => {
    if (isLiveMode && liveState.contract) {
      return {
        requiredSets: liveState.contract.required_sets,
        requiredRuns: liveState.contract.required_runs,
      }
    }
    return {
      requiredSets: currentDemoRound.requiredSets,
      requiredRuns: currentDemoRound.requiredRuns,
    }
  }, [isLiveMode, liveState, currentDemoRound])

  // ── Helpers ───────────────────────────────────────────────
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

  // ── Handlers ──────────────────────────────────────────────

  const handleBackToLobby = () => { window.location.assign('/') }
  const handleOpenRulebook = () => {
    window.location.assign(`/rules?returnTo=${encodeURIComponent(`/game/${gameId}`)}`)
  }

  const handleHandCardClick = (cardId: string) => {
    if (isDemoGameComplete) { appendActivity('Demo complete. Press Reset to continue.'); return }
    setSelectedCardIds((cur) =>
      cur.includes(cardId) ? cur.filter((id) => id !== cardId) : [...cur, cardId],
    )
    setShowBuyAction(false)
  }

  const handleDrawFromDeck = () => {
    if (isDemoGameComplete) { appendActivity('Demo complete. Press Reset to continue.'); return }
    if (isLiveMode) {
      if (!isMyTurn) { appendActivity('Not your turn.'); return }
      if (livePhase !== 'draw') { appendActivity('You have already drawn this turn.'); return }
      emitDrawCard(gameCode, 'deck')
      return
    }
    const drawnCard = mockDrawSequence[drawIndex % mockDrawSequence.length]
    setDrawIndex((i) => i + 1)
    setHandCards((cards) => [...cards, createHandCard(drawnCard)])
    appendActivity(`Drew: ${getCardDescription(drawnCard)}.`)
    setShowBuyAction(false)
  }

  const handleDrawFromDiscard = () => {
    if (isDemoGameComplete) { appendActivity('Demo complete. Press Reset to continue.'); return }
    if (isLiveMode) {
      if (!isMyTurn) { appendActivity('Not your turn.'); return }
      if (livePhase !== 'draw') { appendActivity('You have already drawn this turn.'); return }
      emitDrawCard(gameCode, 'discard')
      return
    }
    appendActivity(`Requested discard: ${getCardDescription(topDiscardCard)}.`)
    setShowBuyAction(true)
  }

  const handleDiscardPileClick = () => {
    if (isDemoGameComplete) { appendActivity('Demo complete. Press Reset to continue.'); return }
    if (isLiveMode) {
      if (!isMyTurn) { appendActivity('Not your turn.'); return }
      if (livePhase === 'draw') { handleDrawFromDiscard(); return }
      // play phase — click pile with selection = discard
      if (selectedCards.length !== 1) { appendActivity('Select exactly one card to discard.'); return }
      const [card] = selectedCards
      emitDiscardCard(gameCode, { rank: card.rank, suit: card.suit })
      return
    }
    if (selectedCards.length === 0) { handleDrawFromDiscard(); return }
    const [card] = selectedCards
    setTopDiscardCard({ rank: card.rank, suit: card.suit })
    setHandCards((cards) => cards.filter((c) => c.id !== card.id))
    clearSelection()
    setShowBuyAction(false)
    appendActivity(`Discarded: ${getCardDescription(card)}.`)
  }

  const handleDiscard = () => {
    if (!isLiveMode) return
    if (!isMyTurn) { appendActivity('Not your turn.'); return }
    if (livePhase !== 'play') { appendActivity('Draw a card first.'); return }
    if (selectedCards.length !== 1) { appendActivity('Select exactly one card to discard.'); return }
    const [card] = selectedCards
    emitDiscardCard(gameCode, { rank: card.rank, suit: card.suit })
  }

  const handleBuyAction = () => {
    if (isDemoGameComplete) { appendActivity('Demo complete. Press Reset to continue.'); return }
    appendActivity(`Buy: contesting ${getCardDescription(topDiscardCard)}.`)
    setShowBuyAction(false)
  }

  const removeSelectedCardsFromHand = (cards: HandCard[]) => {
    const ids = new Set(cards.map((c) => c.id))
    setHandCards((cur) => cur.filter((c) => !ids.has(c.id)))
  }

  const handleAttemptMeld = () => {
    if (isDemoGameComplete) { appendActivity('Demo complete.'); return }
    if (selectedCards.length === 0) { appendActivity('Select cards first.'); return }
    const kind = detectMeldKind(selectedTableCards)
    if (!kind) { appendActivity('Invalid meld: must form a legal set or run.'); return }

    if (isLiveMode) {
      if (!isMyTurn || livePhase !== 'play') { appendActivity('Not your turn to meld.'); return }
      if (hasLaidDown) { appendActivity('Already laid down — click a table meld to add cards.'); return }
      // Stage the meld locally
      setPendingMelds((prev) => [...prev, { type: kind, cards: selectedTableCards }])
      removeSelectedCardsFromHand(selectedCards)
      clearSelection()
      appendActivity(`Staged ${kind}: ${selectedCards.map(getCardDescription).join(', ')}.`)
      return
    }

    // Demo mode — also stage rather than immediately commit to the table
    setPendingMelds((prev) => [...prev, { type: kind, cards: selectedTableCards }])
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
    // Demo mode — commit staged melds to the table
    setMeldGroups((groups) => {
      const newMelds = pendingMelds.map((m) => m.cards)
      const idx = groups.findIndex((g) => g.player === 'You')
      if (idx < 0) return [{ player: 'You', melds: newMelds }, ...groups]
      return groups.map((g, i) =>
        i === idx ? { ...g, melds: [...g.melds, ...newMelds] } : g,
      )
    })
    setPendingMelds([])
    appendActivity(`Laid down ${pendingMelds.length} meld(s).`)
  }

  const handleToggleStealJoker = () => {
    if (isDemoGameComplete) {
      appendActivity('Demo complete. Press Reset Demo to continue.')
      return
    }
    setStealJokerMode((cur) => {
      if (!cur) appendActivity('Steal Joker mode on...')
      else appendActivity('Steal Joker mode cancelled.')
      return !cur
    })
    clearSelection()
  }

  const handleStealFromMeld = (groupIndex: number, meldIndex: number) => {
    if (isDemoGameComplete) { appendActivity('Demo complete.'); return }
    if (selectedCards.length === 0) { appendActivity('Select a replacement card from your hand first.'); return }
    const targetGroup = meldGroups[groupIndex]
    const targetMeld = targetGroup?.melds[meldIndex]
    if (!targetGroup || !targetMeld) { appendActivity('Unable to target meld.'); return }
    const replacement = selectedCards[0]
    const wildcardIdx = canReplaceWildcardInMeld(replacement, targetMeld)
    if (wildcardIdx === -1) {
      appendActivity(`${getCardDescription(replacement)} cannot replace any wildcard in that meld.`)
      return
    }

    if (isLiveMode) {
      if (!isMyTurn || livePhase !== 'play') { appendActivity('Not your turn.'); return }
      if (!hasLaidDown) { appendActivity('Lay down your contract first.'); return }
      emitStealJoker(gameCode, targetGroup.player, meldIndex, { rank: replacement.rank, suit: replacement.suit }, wildcardIdx)
      clearSelection()
      setStealJokerMode(false)
      return
    }

    // Demo mode
    const stolenCard = targetMeld[wildcardIdx]
    setMeldGroups((groups) =>
      groups.map((g, gi) =>
        gi === groupIndex
          ? { ...g, melds: g.melds.map((m, mi) => mi === meldIndex ? m.map((c, ci) => ci === wildcardIdx ? { rank: replacement.rank, suit: replacement.suit } : c) : m) }
          : g,
      ),
    )
    setHandCards((cards) => {
      const filtered = cards.filter((c) => c.id !== replacement.id)
      return [...filtered, createHandCard(stolenCard)]
    })
    clearSelection()
    setStealJokerMode(false)
    setShowBuyAction(false)
    appendActivity(`Stole ${getCardDescription(stolenCard)} from ${targetGroup.player}'s meld using ${getCardDescription(replacement)}.`)
  }

  const handleLayoffToMeld = (groupIndex: number, meldIndex: number) => {
    if (isDemoGameComplete) { appendActivity('Demo complete.'); return }
    if (selectedCards.length === 0) { appendActivity('Select a card first, then click a meld.'); return }

    if (isLiveMode) {
      if (!isMyTurn || livePhase !== 'play') { appendActivity('Not your turn.'); return }
      if (!hasLaidDown) { appendActivity('Lay down your contract first.'); return }
      const targetGroup = meldGroups[groupIndex]
      if (!targetGroup) return
      emitAddToMeld(gameCode, targetGroup.player, meldIndex, selectedTableCards)
      clearSelection()
      return
    }

    // Demo mode
    const targetGroup = meldGroups[groupIndex]
    const targetMeld = targetGroup?.melds[meldIndex]
    if (!targetGroup || !targetMeld) { appendActivity('Unable to target meld.'); return }
    const kind = detectMeldKind(targetMeld)
    if (!kind) { appendActivity('Target meld is invalid.'); return }
    const combined = [...targetMeld, ...selectedTableCards]
    const valid = kind === 'set' ? validateSetMeld(combined) : validateRunMeld(combined)
    if (!valid) {
      appendActivity(kind === 'set' ? 'Invalid: rank must match.' : 'Invalid: must preserve suit/sequence.')
      return
    }
    setMeldGroups((groups) =>
      groups.map((g, gi) =>
        gi === groupIndex
          ? { ...g, melds: g.melds.map((m, mi) => (mi === meldIndex ? [...m, ...selectedTableCards] : m)) }
          : g,
      ),
    )
    removeSelectedCardsFromHand(selectedCards)
    clearSelection()
    setShowBuyAction(false)
    appendActivity(`Laid off onto ${targetGroup.player} meld ${meldIndex + 1}.`)
  }

  const handleClearSelection = () => { clearSelection(); appendActivity('Selection cleared.') }

  // ── Demo-only controls ────────────────────────────────────
  const handleNextDemoRound = () => {
    if (isDemoGameComplete || isFinalDemoRound) return
    const next = demoRoundIndex + 1
    setDemoRoundIndex(next)
    resetTablePreviewState()
    appendActivity(`Round ${demoRounds[next].roundNumber}: ${demoRounds[next].contractText}.`)
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
    if (isDemoGameComplete) { appendActivity('Reset demo before toggling.'); return }
    setIsDenseMeldPreview((cur) => {
      const next = !cur
      setMeldGroups(next ? createDenseMeldGroups() : createInitialMeldGroups())
      clearSelection()
      setShowBuyAction(false)
      appendActivity(next ? 'Dense preview: 6 sets + 6 runs loaded.' : 'Dense preview disabled.')
      return next
    })
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <main className="game-table-page" aria-label="Shanghai Rummy game table">

      {/* Fixed gold border frame */}
      <div className="game-table-frame" aria-hidden="true">
        <span className="game-table-frame__corner game-table-frame__corner--tl" />
        <span className="game-table-frame__corner game-table-frame__corner--tr" />
        <span className="game-table-frame__corner game-table-frame__corner--bl" />
        <span className="game-table-frame__corner game-table-frame__corner--br" />
        <span className="game-table-frame__mid game-table-frame__mid--top">◆</span>
        <span className="game-table-frame__mid game-table-frame__mid--right">◆</span>
        <span className="game-table-frame__mid game-table-frame__mid--bottom">◆</span>
        <span className="game-table-frame__mid game-table-frame__mid--left">◆</span>
      </div>

      {/* Sidebar overlay */}
      <div
        className={`game-side-drawer-overlay${isSidebarOpen ? ' is-open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar tab */}
      <button
        type="button"
        className={`game-sidebar-tab${isSidebarOpen ? ' is-open' : ''}`}
        onClick={() => setIsSidebarOpen((v) => !v)}
        aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        aria-expanded={isSidebarOpen}
      >
        <span className="game-sidebar-tab__caret">▲</span>
        <span className="game-sidebar-tab__label">Info</span>
        <span className="game-sidebar-tab__caret">▲</span>
      </button>

      {/* Sidebar drawer */}
      <aside
        className={`game-side-drawer${isSidebarOpen ? ' is-open' : ''}`}
        aria-label="Game information panel"
        aria-hidden={!isSidebarOpen}
      >
        <div className="game-side-drawer__close">
          <span className="game-side-drawer__title">Game Info</span>
          <button type="button" className="game-side-drawer__close-btn" onClick={() => setIsSidebarOpen(false)}>
            ✕ Close
          </button>
        </div>

        {/* Contract */}
        <div className="game-panel-card">
          <div className="game-panel-card__title-row">
            <h2 className="game-panel-card__title">Contract</h2>
            <span className="game-panel-card__subtitle">Round {displayRoundNumber}</span>
          </div>
          <p className="game-panel-card__contract">{displayContractText}</p>
          {!isLiveMode && (
            <div className="game-requirements">
              {currentDemoRound.requiredSets > 0 && (
                <p className="game-requirements__item">
                  {currentDemoRound.requiredSets}× Set of {currentDemoRound.setSize}
                </p>
              )}
              {currentDemoRound.requiredRuns > 0 && (
                <p className="game-requirements__item">
                  {currentDemoRound.requiredRuns}× Run of {currentDemoRound.runSize}
                </p>
              )}
            </div>
          )}
          {isLiveMode && liveState.contract && (
            <div className="game-requirements">
              {liveState.contract.required_sets > 0 && (
                <p className="game-requirements__item">{liveState.contract.required_sets}× Set of 3+</p>
              )}
              {liveState.contract.required_runs > 0 && (
                <p className="game-requirements__item">{liveState.contract.required_runs}× Run of 4+</p>
              )}
            </div>
          )}
        </div>

        {/* Scores */}
        <div className="game-panel-card">
          <div className="game-panel-card__title-row">
            <h2 className="game-panel-card__title">Scores</h2>
            <span className="game-panel-card__subtitle">Cumulative</span>
          </div>
          <div className="game-score-pinned">
            {pinnedScoreRows.map((row, i) => (
              <div key={row.player} className={`game-score-pinned-row${i === 0 ? ' is-leader' : ''}`}>
                <span className="game-score-pinned-row__badge">#{row.rank}</span>
                <span className="game-score-pinned-row__player">{row.player}</span>
                <span className="game-score-pinned-row__score">{row.score}</span>
              </div>
            ))}
          </div>
          {extraScoreRows.length > 0 && (
            <div className="game-score-extra">
              <p className="game-score-extra__title">Others</p>
              <ul className="game-score-extra__list">
                {extraScoreRows.map((row) => (
                  <li key={row.player}>
                    <span>{row.player}</span>
                    <span>{row.score}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Activity feed */}
        <div className="game-panel-card">
          <div className="game-panel-card__title-row">
            <h2 className="game-panel-card__title">Activity</h2>
          </div>
          <ul className="game-activity-feed">
            {activityFeed.map((entry, i) => (
              <li key={i}>{entry}</li>
            ))}
          </ul>
        </div>

        {/* Demo rail (only in demo mode) */}
        {!isLiveMode && (
          <DemoRail
            currentDemoRound={currentDemoRound}
            totalRounds={demoRounds.length}
            isFinalDemoRound={isFinalDemoRound}
            isDemoGameComplete={isDemoGameComplete}
            isDenseMeldPreview={isDenseMeldPreview}
            setCount={meldsByType.sets.length}
            runCount={meldsByType.runs.length}
            onNextDemoRound={handleNextDemoRound}
            onEndDemoGame={handleEndDemoGame}
            onResetDemo={handleResetDemo}
            onToggleDenseMeldPreview={handleToggleDenseMeldPreview}
          />
        )}
      </aside>

      {/* Score bar */}
      <div className="game-score-bar" aria-label="Player standings">
        {sortedScoreRows.map((row, i) => (
          <div
            key={row.player}
            className={[
              'game-score-bar__player',
              i === 0 ? 'game-score-bar__player--leader' : '',
              row.player === 'You' ? 'game-score-bar__player--you' : '',
            ].filter(Boolean).join(' ')}
          >
            <span className="game-score-bar__rank">#{i + 1}</span>
            <span className="game-score-bar__name">{row.player}</span>
            <span className="game-score-bar__score">{row.score}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="game-table-header">
        <div className="game-table-header__left">
          <button
            type="button"
            className="game-table-header__btn game-table-header__btn--back"
            onClick={handleBackToLobby}
          >
            ← Leave
          </button>

          {/* Round dropdown (demo only) */}
          {!isLiveMode && (
            <div
              className={`game-dropdown${roundDropdown.isOpen ? ' is-open' : ''}`}
              ref={roundDropdown.ref}
              onBlur={roundDropdown.handleBlur}
            >
              <button
                type="button"
                className="game-dropdown__trigger"
                onClick={roundDropdown.toggle}
                aria-haspopup="true"
                aria-expanded={roundDropdown.isOpen}
              >
                Round {currentDemoRound.roundNumber}/{demoRounds.length}
                <span className="game-dropdown__caret">▼</span>
              </button>
              <div className="game-dropdown__menu" role="menu">
                <div className="game-dropdown__section-label">All Rounds</div>
                {demoRounds.map((round, i) => (
                  <button
                    key={round.roundNumber}
                    type="button"
                    className={`game-dropdown__item${i === demoRoundIndex ? ' is-active' : ''}`}
                    role="menuitem"
                    onClick={() => {
                      setDemoRoundIndex(i)
                      resetTablePreviewState()
                      appendActivity(`Jumped to Round ${round.roundNumber}: ${round.contractText}.`)
                      roundDropdown.close()
                    }}
                  >
                    <span className="game-dropdown__item-label">Round {round.roundNumber}</span>
                    <span className="game-dropdown__item-badge">{round.contractText}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLiveMode && (
            <span className="game-table-header__chip game-table-header__chip--contract" style={{ marginLeft: '0.5rem' }}>
              Round {displayRoundNumber}/{displayTotalRounds}
            </span>
          )}
        </div>

        {/* Center: contract + turn */}
        <div className="game-table-header__center">
          <p className="game-table-header__chip game-table-header__chip--contract">
            {displayContractText}
          </p>
          <p className="game-table-header__chip game-table-header__chip--turn">
            {isDemoGameComplete
              ? 'Game Complete'
              : isLiveMode
              ? isMyTurn
                ? `Your Turn (${livePhase})`
                : `${liveState.current_player ?? '...'}'s Turn`
              : 'Your Turn'}
          </p>
        </div>

        {/* Right: Actions dropdown + Rulebook */}
        <div className="game-table-header__right">
          {!isLiveMode && (
            <div
              className={`game-dropdown${actionsDropdown.isOpen ? ' is-open' : ''}`}
              ref={actionsDropdown.ref}
              onBlur={actionsDropdown.handleBlur}
            >
              <button
                type="button"
                className="game-dropdown__trigger"
                onClick={actionsDropdown.toggle}
                aria-haspopup="true"
                aria-expanded={actionsDropdown.isOpen}
              >
                Actions
                <span className="game-dropdown__caret">▼</span>
              </button>
              <div className="game-dropdown__menu" role="menu" style={{ left: 'auto', right: 0 }}>
                <div className="game-dropdown__section-label">Demo Controls</div>
                <button
                  type="button"
                  className="game-dropdown__item game-dropdown__item--primary"
                  role="menuitem"
                  onClick={() => { handleNextDemoRound(); actionsDropdown.close() }}
                  disabled={isFinalDemoRound || isDemoGameComplete}
                >
                  <span className="game-dropdown__item-label">Next Round</span>
                  <span className="game-dropdown__item-badge">
                    {isFinalDemoRound ? 'Final' : `→ Round ${demoRoundIndex + 2}`}
                  </span>
                </button>
                <button
                  type="button"
                  className="game-dropdown__item game-dropdown__item--danger"
                  role="menuitem"
                  onClick={() => { handleEndDemoGame(); actionsDropdown.close() }}
                  disabled={!isFinalDemoRound || isDemoGameComplete}
                >
                  <span className="game-dropdown__item-label">End Game</span>
                </button>
                <div className="game-dropdown__separator" />
                <div className="game-dropdown__section-label">Table View</div>
                <button
                  type="button"
                  className={`game-dropdown__item${isDenseMeldPreview ? ' is-active' : ''}`}
                  role="menuitem"
                  onClick={() => { handleToggleDenseMeldPreview(); actionsDropdown.close() }}
                >
                  <span className="game-dropdown__item-label">
                    {isDenseMeldPreview ? 'Normal Melds' : 'Dense Melds Preview'}
                  </span>
                </button>
                <div className="game-dropdown__separator" />
                <button
                  type="button"
                  className="game-dropdown__item"
                  role="menuitem"
                  onClick={() => { handleResetDemo(); actionsDropdown.close() }}
                >
                  <span className="game-dropdown__item-label">Reset Demo</span>
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            className="game-table-header__btn game-table-header__btn--rules"
            onClick={handleOpenRulebook}
          >
            Rulebook
          </button>
        </div>
      </header>

      {/* Main layout */}
      <section className="game-table-layout">
        <div className="game-board-row">
          <section className="game-table-stage" aria-label="Main table layout">
            <TableCenter
              opponentSeats={displayOpponents}
              meldsByType={meldsByType}
              setLaneClassName={setLaneClassName}
              runLaneClassName={runLaneClassName}
              selectedCardsCount={selectedCards.length}
              showBuyAction={showBuyAction}
              stealJokerMode={stealJokerMode}
              topDiscardCard={topDiscardCard}
              onDrawFromDeck={handleDrawFromDeck}
              onDiscardPileClick={handleDiscardPileClick}
              onLayoffToMeld={handleLayoffToMeld}
              onStealFromMeld={handleStealFromMeld}
            />

            <LocalPlayerZone
              handCards={handCards}
              selectedCardIds={selectedCardIds}
              showBuyAction={showBuyAction}
              pendingMelds={pendingMelds}
              contract={contractRequirements}
              isMyTurn={isLiveMode ? isMyTurn : true}
              hasLaidDown={hasLaidDown}
              isLiveMode={isLiveMode}
              stealJokerMode={stealJokerMode}
              onHandCardClick={handleHandCardClick}
              onAttemptMeld={handleAttemptMeld}
              onSubmitLayDown={handleSubmitLayDown}
              onDrawFromDeck={handleDrawFromDeck}
              onDrawFromDiscard={handleDrawFromDiscard}
              onBuyAction={handleBuyAction}
              onClearSelection={handleClearSelection}
              onDiscard={handleDiscard}
              onToggleStealJoker={handleToggleStealJoker}
            />
          </section>
        </div>
      </section>

      <EndGameOverlay
        isVisible={isDemoGameComplete}
        demoWinner={demoWinner}
        demoRunnerUp={demoRunnerUp}
        totalRounds={displayTotalRounds}
        finalContractText={isLiveMode ? displayContractText : demoRounds[demoRounds.length - 1].contractText}
        finalLeaderboardRows={finalLeaderboardRows}
        onResetDemo={handleResetDemo}
        onBackToLobby={handleBackToLobby}
      />
    </main>
  )
}

export default GameTablePage
