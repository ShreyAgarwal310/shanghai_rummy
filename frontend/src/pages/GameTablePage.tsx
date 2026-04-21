import { useMemo, useRef, useState } from 'react'
import './GameTablePage.css'
import {
  createDenseMeldGroups,
  createInitialHandCards,
  createInitialMeldGroups,
  demoRounds,
  discardTopCard,
  mockDrawSequence,
  opponentSeats,
  scoreRows,
  type HandCard,
  type MeldGroup,
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

function GameTablePage({ gameId }: GameTablePageProps) {
  const [demoRoundIndex, setDemoRoundIndex] = useState(0)
  const [isDemoGameComplete, setIsDemoGameComplete] = useState(false)
  const [isDenseMeldPreview, setIsDenseMeldPreview] = useState(false)
  const [handCards, setHandCards] = useState<HandCard[]>(createInitialHandCards)
  const [meldGroups, setMeldGroups] = useState<MeldGroup[]>(createInitialMeldGroups)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [topDiscardCard, setTopDiscardCard] = useState<TableCard>(discardTopCard)
  const [showBuyAction, setShowBuyAction] = useState(false)
  const [stealJokerMode, setStealJokerMode] = useState(false)
  const [drawIndex, setDrawIndex] = useState(0)
  const [activityFeed, setActivityFeed] = useState<string[]>(['Demo mode active. Select one card, then choose a target.'])

  // Sidebar drawer open/close
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Dropdowns
  const roundDropdown = useDropdown()
  const actionsDropdown = useDropdown()

  const selectedCard = useMemo(() => {
    if (!selectedCardId) return null
    return handCards.find((card) => card.id === selectedCardId) ?? null
  }, [handCards, selectedCardId])
  const selectedCards = useMemo(() => (selectedCard ? [selectedCard] : []), [selectedCard])
  const selectedTableCards = useMemo(() => selectedCards.map(({ rank, suit }) => ({ rank, suit })), [selectedCards])

  const currentDemoRound = demoRounds[demoRoundIndex]
  const isFinalDemoRound = demoRoundIndex === demoRounds.length - 1
  const demoWinner = scoreRows[0]
  const demoRunnerUp = scoreRows[1]
  const finalLeaderboardRows = useMemo(() => [...scoreRows].sort((a, b) => a.score - b.score), [])
  const yourScoreRow = scoreRows.find((row) => row.player === 'You') ?? scoreRows[0]

  // Score bar: cumulative totals sorted ascending (lower = better)
  const sortedScoreRows = useMemo(() => [...scoreRows].sort((a, b) => a.score - b.score), [])

  const pinnedScoreRows = useMemo(() => {
    const leaderRow = scoreRows[0]
    const secondRow = scoreRows[1]
    const rows: ScoreRow[] = [leaderRow]
    if (secondRow && secondRow.player !== leaderRow.player) rows.push(secondRow)
    if (!rows.some((row) => row.player === yourScoreRow.player)) rows.push(yourScoreRow)
    return rows
  }, [yourScoreRow])

  const extraScoreRows = useMemo(
    () => scoreRows.filter((row) => !pinnedScoreRows.some((p) => p.player === row.player)),
    [pinnedScoreRows],
  )

  const meldsByType = useMemo(() => buildMeldsByType(meldGroups), [meldGroups])
  const setLaneClassName = getMeldLaneClassName(meldsByType.sets.length)
  const runLaneClassName = getMeldLaneClassName(meldsByType.runs.length)

  const appendActivity = (message: string) => {
    setActivityFeed((feed) => [message, ...feed.slice(0, 5)])
  }
  const clearSelection = () => setSelectedCardId(null)

  const resetTablePreviewState = () => {
    setIsDenseMeldPreview(false)
    setHandCards(createInitialHandCards())
    setMeldGroups(createInitialMeldGroups())
    setSelectedCardId(null)
    setTopDiscardCard(discardTopCard)
    setShowBuyAction(false)
    setStealJokerMode(false)
    setDrawIndex(0)
  }

  const handleBackToLobby = () => { window.location.assign('/') }
  const handleOpenRulebook = () => {
    const returnPath = encodeURIComponent(`/game/${gameId}`)
    window.location.assign(`/rules?returnTo=${returnPath}`)
  }

  const createHandCard = (card: TableCard): HandCard => ({
    id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    rank: card.rank,
    suit: card.suit,
  })

  const handleHandCardClick = (cardId: string) => {
    if (isDemoGameComplete) { appendActivity('Demo complete. Press Reset Demo to continue.'); return }
    setSelectedCardId((cur) => (cur === cardId ? null : cardId))
    setShowBuyAction(false)
  }

  const handleDrawFromDeck = () => {
    if (isDemoGameComplete) { appendActivity('Demo complete. Press Reset Demo to continue.'); return }
    const drawnCard = mockDrawSequence[drawIndex % mockDrawSequence.length]
    setDrawIndex((i) => i + 1)
    setHandCards((cards) => [...cards, createHandCard(drawnCard)])
    appendActivity(`Drew: ${getCardDescription(drawnCard)}.`)
    setShowBuyAction(false)
  }

  const handleDrawFromDiscard = () => {
    if (isDemoGameComplete) { appendActivity('Demo complete. Press Reset Demo to continue.'); return }
    appendActivity(`Requested discard: ${getCardDescription(topDiscardCard)}.`)
    setShowBuyAction(true)
  }

  const handleDiscardPileClick = () => {
    if (isDemoGameComplete) { appendActivity('Demo complete. Press Reset Demo to continue.'); return }
    if (selectedCards.length === 0) { handleDrawFromDiscard(); return }
    const [card] = selectedCards
    setTopDiscardCard({ rank: card.rank, suit: card.suit })
    setHandCards((cards) => cards.filter((c) => c.id !== card.id))
    clearSelection()
    setShowBuyAction(false)
    appendActivity(`Discarded: ${getCardDescription(card)}.`)
  }

  const handleBuyAction = () => {
    if (isDemoGameComplete) { appendActivity('Demo complete. Press Reset Demo to continue.'); return }
    appendActivity(`Buy: contesting ${getCardDescription(topDiscardCard)}.`)
    setShowBuyAction(false)
  }

  const removeSelectedCardsFromHand = (cards: HandCard[]) => {
    const ids = new Set(cards.map((c) => c.id))
    setHandCards((cur) => cur.filter((c) => !ids.has(c.id)))
  }

  const handleAttemptMeld = () => {
    if (isDemoGameComplete) { appendActivity('Demo complete.'); return }
    if (selectedCards.length === 0) { appendActivity('Select a card first.'); return }
    const kind = detectMeldKind(selectedTableCards)
    if (!kind) { appendActivity('Invalid meld: selected cards must form a legal set or run.'); return }
    setMeldGroups((groups) => {
      const idx = groups.findIndex((g) => g.player === 'You')
      if (idx < 0) return [{ player: 'You', melds: [selectedTableCards] }, ...groups]
      return groups.map((g, i) => i === idx ? { ...g, melds: [...g.melds, selectedTableCards] } : g)
    })
    removeSelectedCardsFromHand(selectedCards)
    clearSelection()
    setShowBuyAction(false)
    appendActivity(`Meld (${kind}): ${selectedCards.map(getCardDescription).join(', ')}.`)
  }

  const handleToggleStealJoker = () => {
    if (isDemoGameComplete) { appendActivity('Demo complete. Press Reset Demo to continue.'); return }
    setStealJokerMode((cur) => {
      if (!cur) appendActivity('Steal Joker mode on. Select a card from your hand, then click a meld containing a wildcard.')
      else appendActivity('Steal Joker mode cancelled.')
      return !cur
    })
    clearSelection()
  }

  const handleStealFromMeld = (groupIndex: number, meldIndex: number) => {
    if (isDemoGameComplete) { appendActivity('Demo complete.'); return }
    if (!selectedCard) { appendActivity('Select a replacement card from your hand first.'); return }
    const targetGroup = meldGroups[groupIndex]
    const targetMeld = targetGroup?.melds[meldIndex]
    if (!targetGroup || !targetMeld) { appendActivity('Unable to target meld.'); return }
    const wildcardIdx = canReplaceWildcardInMeld(selectedCard, targetMeld)
    if (wildcardIdx === -1) {
      appendActivity(`${getCardDescription(selectedCard)} cannot replace any wildcard in that meld.`)
      return
    }
    const stolenCard = targetMeld[wildcardIdx]
    setMeldGroups((groups) =>
      groups.map((g, gi) =>
        gi === groupIndex
          ? { ...g, melds: g.melds.map((m, mi) => mi === meldIndex ? m.map((c, ci) => ci === wildcardIdx ? { rank: selectedCard.rank, suit: selectedCard.suit } : c) : m) }
          : g,
      ),
    )
    setHandCards((cards) => {
      const filtered = cards.filter((c) => c.id !== selectedCard.id)
      return [...filtered, createHandCard(stolenCard)]
    })
    clearSelection()
    setStealJokerMode(false)
    setShowBuyAction(false)
    appendActivity(`Stole ${getCardDescription(stolenCard)} from ${targetGroup.player}'s meld using ${getCardDescription(selectedCard)}.`)
  }

  const handleLayoffToMeld = (groupIndex: number, meldIndex: number) => {
    if (isDemoGameComplete) { appendActivity('Demo complete.'); return }
    if (selectedCards.length === 0) { appendActivity('Select a card first, then click a meld to lay off.'); return }
    const targetGroup = meldGroups[groupIndex]
    const targetMeld = targetGroup?.melds[meldIndex]
    if (!targetGroup || !targetMeld) { appendActivity('Unable to target meld.'); return }
    const kind = detectMeldKind(targetMeld)
    if (!kind) { appendActivity('Target meld is invalid.'); return }
    const combined = [...targetMeld, ...selectedTableCards]
    const valid = kind === 'set' ? validateSetMeld(combined) : validateRunMeld(combined)
    if (!valid) {
      appendActivity(kind === 'set' ? 'Invalid layoff: rank must match.' : 'Invalid layoff: must preserve suit/sequence.')
      return
    }
    setMeldGroups((groups) =>
      groups.map((g, gi) =>
        gi === groupIndex
          ? { ...g, melds: g.melds.map((m, mi) => mi === meldIndex ? [...m, ...selectedTableCards] : m) }
          : g,
      ),
    )
    removeSelectedCardsFromHand(selectedCards)
    clearSelection()
    setShowBuyAction(false)
    appendActivity(`Laid off: ${selectedCards.map(getCardDescription).join(', ')} onto ${targetGroup.player} meld ${meldIndex + 1}.`)
  }

  const handleClearSelection = () => { clearSelection(); appendActivity('Selection cleared.') }

  const handleNextDemoRound = () => {
    if (isDemoGameComplete) { appendActivity('Demo complete. Reset to continue.'); return }
    if (isFinalDemoRound) { appendActivity('Final round reached. Use End Game to preview.'); return }
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
    setActivityFeed(['Demo reset to Round 1. Select one card, then choose a target.'])
  }

  const handleToggleDenseMeldPreview = () => {
    if (isDemoGameComplete) { appendActivity('Reset demo before toggling dense meld mode.'); return }
    setIsDenseMeldPreview((cur) => {
      const next = !cur
      setMeldGroups(next ? createDenseMeldGroups() : createInitialMeldGroups())
      clearSelection()
      setShowBuyAction(false)
      appendActivity(next ? 'Dense preview: 6 sets + 6 runs loaded.' : 'Dense preview disabled.')
      return next
    })
  }

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

      {/* ── Sidebar drawer overlay (closes on outside click) ── */}
      <div
        className={`game-side-drawer-overlay${isSidebarOpen ? ' is-open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* ── Sidebar tab (always visible, left edge) ── */}
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

      {/* ── Sidebar drawer ── */}
      <aside
        className={`game-side-drawer${isSidebarOpen ? ' is-open' : ''}`}
        aria-label="Game information panel"
        aria-hidden={!isSidebarOpen}
      >
        {/* Drawer header */}
        <div className="game-side-drawer__close">
          <span className="game-side-drawer__title">Game Info</span>
          <button
            type="button"
            className="game-side-drawer__close-btn"
            onClick={() => setIsSidebarOpen(false)}
          >
            ✕ Close
          </button>
        </div>

        {/* Contract */}
        <div className="game-panel-card">
          <div className="game-panel-card__title-row">
            <h2 className="game-panel-card__title">Contract</h2>
            <span className="game-panel-card__subtitle">Round {currentDemoRound.roundNumber}</span>
          </div>
          <p className="game-panel-card__contract">{currentDemoRound.contractText}</p>
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
        </div>

        {/* Cumulative scores (finished rounds only — note for backend: these are end-of-round totals) */}
        <div className="game-panel-card">
          <div className="game-panel-card__title-row">
            <h2 className="game-panel-card__title">Scores</h2>
            <span className="game-panel-card__subtitle">Cumulative</span>
          </div>
          <div className="game-score-pinned">
            {pinnedScoreRows.map((row, i) => (
              <div
                key={row.player}
                className={`game-score-pinned-row${i === 0 ? ' is-leader' : ''}`}
              >
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

        {/* Demo Rail inside drawer */}
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
      </aside>

      {/* ── Score Bar — cumulative totals, no in-round scores ── */}
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

      {/* ── Header: controls ── */}
      <header className="game-table-header">
        <div className="game-table-header__left">
          <button
            type="button"
            className="game-table-header__btn game-table-header__btn--back"
            onClick={handleBackToLobby}
          >
            ← Leave
          </button>

          {/* Round dropdown */}
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
        </div>

        {/* Center: contract + turn */}
        <div className="game-table-header__center">
          <p className="game-table-header__chip game-table-header__chip--contract">
            {currentDemoRound.contractText}
          </p>
          <p className="game-table-header__chip game-table-header__chip--turn">
            {isDemoGameComplete ? 'Game Complete' : 'Your Turn'}
          </p>
        </div>

        {/* Right: Actions dropdown + Rulebook */}
        <div className="game-table-header__right">
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

          <button
            type="button"
            className="game-table-header__btn game-table-header__btn--rules"
            onClick={handleOpenRulebook}
          >
            Rulebook
          </button>
        </div>
      </header>

      {/* ── Main layout — full width, no sidebar column ── */}
      <section className="game-table-layout">
        <div className="game-board-row">
          <section className="game-table-stage" aria-label="Main table layout">
            <TableCenter
              opponentSeats={opponentSeats}
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
              selectedCardId={selectedCardId}
              showBuyAction={showBuyAction}
              stealJokerMode={stealJokerMode}
              onHandCardClick={handleHandCardClick}
              onAttemptMeld={handleAttemptMeld}
              onDrawFromDeck={handleDrawFromDeck}
              onDrawFromDiscard={handleDrawFromDiscard}
              onBuyAction={handleBuyAction}
              onClearSelection={handleClearSelection}
              onToggleStealJoker={handleToggleStealJoker}
            />
          </section>
        </div>
      </section>

      <EndGameOverlay
        isVisible={isDemoGameComplete}
        demoWinner={demoWinner}
        demoRunnerUp={demoRunnerUp}
        totalRounds={demoRounds.length}
        finalContractText={demoRounds[demoRounds.length - 1].contractText}
        finalLeaderboardRows={finalLeaderboardRows}
        onResetDemo={handleResetDemo}
        onBackToLobby={handleBackToLobby}
      />
    </main>
  )
}

export default GameTablePage
