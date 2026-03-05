import { useMemo, useState } from 'react'
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
import TopPanels from './GameTablePage/components/TopPanels'

function GameTablePage({ gameId }: GameTablePageProps) {
  const [demoRoundIndex, setDemoRoundIndex] = useState(0)
  const [isDemoGameComplete, setIsDemoGameComplete] = useState(false)
  const [isDenseMeldPreview, setIsDenseMeldPreview] = useState(false)
  const [handCards, setHandCards] = useState<HandCard[]>(createInitialHandCards)
  const [meldGroups, setMeldGroups] = useState<MeldGroup[]>(createInitialMeldGroups)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [topDiscardCard, setTopDiscardCard] = useState<TableCard>(discardTopCard)
  const [showBuyAction, setShowBuyAction] = useState(false)
  const [drawIndex, setDrawIndex] = useState(0)
  const [activityFeed, setActivityFeed] = useState<string[]>(['Demo mode active. Select one card, then choose a target.'])

  const selectedCard = useMemo(() => {
    if (!selectedCardId) {
      return null
    }
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

  const pinnedScoreRows = useMemo(() => {
    const leaderRow = scoreRows[0]
    const secondRow = scoreRows[1]
    const rows: ScoreRow[] = [leaderRow]
    if (secondRow && secondRow.player !== leaderRow.player) {
      rows.push(secondRow)
    }
    if (!rows.some((row) => row.player === yourScoreRow.player)) {
      rows.push(yourScoreRow)
    }
    return rows
  }, [yourScoreRow])

  const extraScoreRows = useMemo(
    () => scoreRows.filter((row) => !pinnedScoreRows.some((pinnedRow) => pinnedRow.player === row.player)),
    [pinnedScoreRows],
  )

  const meldsByType = useMemo(() => buildMeldsByType(meldGroups), [meldGroups])
  const setLaneClassName = getMeldLaneClassName(meldsByType.sets.length)
  const runLaneClassName = getMeldLaneClassName(meldsByType.runs.length)

  const appendActivity = (message: string) => {
    setActivityFeed((currentFeed) => [message, ...currentFeed.slice(0, 5)])
  }

  const clearSelection = () => {
    setSelectedCardId(null)
  }

  const resetTablePreviewState = () => {
    setIsDenseMeldPreview(false)
    setHandCards(createInitialHandCards())
    setMeldGroups(createInitialMeldGroups())
    setSelectedCardId(null)
    setTopDiscardCard(discardTopCard)
    setShowBuyAction(false)
    setDrawIndex(0)
  }

  const handleBackToLobby = () => {
    window.location.assign('/')
  }

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
    if (isDemoGameComplete) {
      appendActivity('Demo game is complete. Press Reset Demo to continue testing.')
      return
    }
    setSelectedCardId((currentSelectedId) => (currentSelectedId === cardId ? null : cardId))
    setShowBuyAction(false)
  }

  const handleDrawFromDeck = () => {
    if (isDemoGameComplete) {
      appendActivity('Demo game is complete. Press Reset Demo to continue testing.')
      return
    }
    const drawnCard = mockDrawSequence[drawIndex % mockDrawSequence.length]
    setDrawIndex((currentIndex) => currentIndex + 1)
    setHandCards((currentCards) => [...currentCards, createHandCard(drawnCard)])
    appendActivity(`Intent sent: DRAW_FROM_DECK -> ${getCardDescription(drawnCard)} added (demo preview).`)
    setShowBuyAction(false)
  }

  const handleDrawFromDiscard = () => {
    if (isDemoGameComplete) {
      appendActivity('Demo game is complete. Press Reset Demo to continue testing.')
      return
    }
    appendActivity(`Intent sent: REQUEST_DRAW_FROM_DISCARD -> ${getCardDescription(topDiscardCard)}.`)
    setShowBuyAction(true)
  }

  const handleDiscardPileClick = () => {
    if (isDemoGameComplete) {
      appendActivity('Demo game is complete. Press Reset Demo to continue testing.')
      return
    }
    if (selectedCards.length === 0) {
      handleDrawFromDiscard()
      return
    }

    const [cardToDiscard] = selectedCards
    setTopDiscardCard({ rank: cardToDiscard.rank, suit: cardToDiscard.suit })
    setHandCards((currentCards) => currentCards.filter((card) => card.id !== cardToDiscard.id))
    clearSelection()
    setShowBuyAction(false)
    appendActivity(`Intent sent: DISCARD -> ${getCardDescription(cardToDiscard)} to discard pile.`)
  }

  const handleBuyAction = () => {
    if (isDemoGameComplete) {
      appendActivity('Demo game is complete. Press Reset Demo to continue testing.')
      return
    }
    appendActivity(`Intent sent: BUY -> contesting ${getCardDescription(topDiscardCard)}.`)
    setShowBuyAction(false)
  }

  const removeSelectedCardsFromHand = (cardsToRemove: HandCard[]) => {
    const removeIds = new Set(cardsToRemove.map((card) => card.id))
    setHandCards((currentCards) => currentCards.filter((card) => !removeIds.has(card.id)))
  }

  const handleAttemptMeld = () => {
    if (isDemoGameComplete) {
      appendActivity('Demo game is complete. Press Reset Demo to continue testing.')
      return
    }
    if (selectedCards.length === 0) {
      appendActivity('Select a card first, then press Attempt Meld.')
      return
    }

    const meldCards: TableCard[] = selectedTableCards
    const meldKind = detectMeldKind(meldCards)
    if (!meldKind) {
      appendActivity('Invalid meld: selected cards must form a legal set or run.')
      return
    }

    setMeldGroups((currentGroups) => {
      const yourGroupIndex = currentGroups.findIndex((group) => group.player === 'You')
      if (yourGroupIndex < 0) {
        return [{ player: 'You', melds: [meldCards] }, ...currentGroups]
      }

      return currentGroups.map((group, groupIndex) =>
        groupIndex === yourGroupIndex ? { ...group, melds: [...group.melds, meldCards] } : group,
      )
    })
    removeSelectedCardsFromHand(selectedCards)
    clearSelection()
    setShowBuyAction(false)
    appendActivity(`Intent sent: ATTEMPT_MELD (${meldKind}) -> ${selectedCards.map(getCardDescription).join(', ')}.`)
  }

  const handleLayoffToMeld = (groupIndex: number, meldIndex: number) => {
    if (isDemoGameComplete) {
      appendActivity('Demo game is complete. Press Reset Demo to continue testing.')
      return
    }
    if (selectedCards.length === 0) {
      appendActivity('Select a card first, then click a meld target to lay off.')
      return
    }

    const targetGroup = meldGroups[groupIndex]
    const targetMeld = targetGroup?.melds[meldIndex]
    if (!targetGroup || !targetMeld) {
      appendActivity('Unable to target meld. Please try again.')
      return
    }

    const cardsToLayoff: TableCard[] = selectedTableCards
    const targetMeldKind = detectMeldKind(targetMeld)
    if (!targetMeldKind) {
      appendActivity('That target meld is not valid. Layoff was canceled.')
      return
    }

    const combinedMeld = [...targetMeld, ...cardsToLayoff]
    const combinedValid = targetMeldKind === 'set' ? validateSetMeld(combinedMeld) : validateRunMeld(combinedMeld)
    if (!combinedValid) {
      const ruleHint =
        targetMeldKind === 'set' ? 'Set layoff must match meld rank (or use wildcard).' : 'Run layoff must preserve suit and sequence.'
      appendActivity(`Invalid layoff: ${ruleHint}`)
      return
    }

    setMeldGroups((currentGroups) =>
      currentGroups.map((group, currentGroupIndex) =>
        currentGroupIndex === groupIndex
          ? {
              ...group,
              melds: group.melds.map((meld, currentMeldIndex) =>
                currentMeldIndex === meldIndex ? [...meld, ...cardsToLayoff] : meld,
              ),
            }
          : group,
      ),
    )
    removeSelectedCardsFromHand(selectedCards)
    clearSelection()
    setShowBuyAction(false)
    appendActivity(
      `Intent sent: LAYOFF -> ${selectedCards
        .map(getCardDescription)
        .join(', ')} onto ${targetGroup.player} meld ${meldIndex + 1}.`,
    )
  }

  const handleClearSelection = () => {
    clearSelection()
    appendActivity('Selection cleared.')
  }

  const handleNextDemoRound = () => {
    if (isDemoGameComplete) {
      appendActivity('Demo game is complete. Press Reset Demo to return to Round 1.')
      return
    }
    if (isFinalDemoRound) {
      appendActivity('Final round reached. Use End Game to preview post-game state.')
      return
    }

    const nextRoundIndex = demoRoundIndex + 1
    setDemoRoundIndex(nextRoundIndex)
    resetTablePreviewState()
    appendActivity(`Demo mode: moved to round ${demoRounds[nextRoundIndex].roundNumber} (${demoRounds[nextRoundIndex].contractText}).`)
  }

  const handleEndDemoGame = () => {
    if (!isFinalDemoRound) {
      return
    }
    setIsDemoGameComplete(true)
    clearSelection()
    setShowBuyAction(false)
    appendActivity('Demo mode: game ended. Final summary unlocked.')
  }

  const handleResetDemo = () => {
    setDemoRoundIndex(0)
    setIsDemoGameComplete(false)
    resetTablePreviewState()
    setActivityFeed(['Demo mode reset to Round 1. Select one card, then choose a target.'])
  }

  const handleToggleDenseMeldPreview = () => {
    if (isDemoGameComplete) {
      appendActivity('Close end-game preview or reset demo before toggling dense meld mode.')
      return
    }

    setIsDenseMeldPreview((currentValue) => {
      const nextValue = !currentValue
      setMeldGroups(nextValue ? createDenseMeldGroups() : createInitialMeldGroups())
      clearSelection()
      setShowBuyAction(false)
      appendActivity(nextValue ? 'Dense table preview enabled: 6 sets and 6 runs loaded.' : 'Dense table preview disabled.')
      return nextValue
    })
  }

  return (
    <main className="game-table-page" aria-label="Shanghai Rummy game table">
      <header className="game-table-header">
        <button
          type="button"
          className="game-table-header__btn game-table-header__btn--back"
          onClick={handleBackToLobby}
          data-a11y-description="Leave the table and return to the lobby."
        >
          Leave Table
        </button>

        <div className="game-table-header__meta">
          <p className="game-table-header__chip">Table ID: {gameId}</p>
          <p className="game-table-header__chip">
            Round {currentDemoRound.roundNumber} of {demoRounds.length}
          </p>
          <p className="game-table-header__chip game-table-header__chip--turn">{isDemoGameComplete ? 'Game complete' : 'Your turn'}</p>
          <p className="game-table-header__chip">Demo Mode</p>
        </div>

        <button
          type="button"
          className="game-table-header__btn game-table-header__btn--rules"
          onClick={handleOpenRulebook}
          data-a11y-description="Open the rulebook page in one click."
        >
          Open Rulebook
        </button>
      </header>

      <section className="game-table-layout">
        <TopPanels
          currentDemoRound={currentDemoRound}
          pinnedScoreRows={pinnedScoreRows}
          extraScoreRows={extraScoreRows}
          activityFeed={activityFeed}
        />

        <div className="game-board-row">
          <section className="game-table-stage" aria-label="Main table layout">
            <TableCenter
              opponentSeats={opponentSeats}
              meldsByType={meldsByType}
              setLaneClassName={setLaneClassName}
              runLaneClassName={runLaneClassName}
              selectedCardsCount={selectedCards.length}
              showBuyAction={showBuyAction}
              topDiscardCard={topDiscardCard}
              onDrawFromDeck={handleDrawFromDeck}
              onDiscardPileClick={handleDiscardPileClick}
              onLayoffToMeld={handleLayoffToMeld}
            />

            <LocalPlayerZone
              handCards={handCards}
              selectedCardId={selectedCardId}
              showBuyAction={showBuyAction}
              onHandCardClick={handleHandCardClick}
              onAttemptMeld={handleAttemptMeld}
              onDrawFromDeck={handleDrawFromDeck}
              onDrawFromDiscard={handleDrawFromDiscard}
              onBuyAction={handleBuyAction}
              onClearSelection={handleClearSelection}
            />
          </section>
        </div>

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
