import { useMemo, useState } from 'react'
import './GameTablePage.css'
import {
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
  getMeldLaneClassName,
  validateRunMeld,
  validateSetMeld,
} from './GameTablePage.logic'
import type { GameTablePageProps } from './GameTablePage.types'
import EndGameOverlay from './GameTablePage/components/EndGameOverlay'
import LocalPlayerZone from './GameTablePage/components/LocalPlayerZone'
import TableCenter from './GameTablePage/components/TableCenter'
import TopPanels from './GameTablePage/components/TopPanels'

function GameTablePage({ gameId }: GameTablePageProps) {
  const [demoRoundIndex, setDemoRoundIndex] = useState(0)
  const [isDemoGameComplete, setIsDemoGameComplete] = useState(false)
  const [handCards, setHandCards] = useState<HandCard[]>(createInitialHandCards)
  const [meldGroups, setMeldGroups] = useState<MeldGroup[]>(createInitialMeldGroups)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [topDiscardCard, setTopDiscardCard] = useState<TableCard>(discardTopCard)
  const [showBuyAction, setShowBuyAction] = useState(false)
  const [drawIndex, setDrawIndex] = useState(0)

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

  const clearSelection = () => {
    setSelectedCardId(null)
  }

  const resetTablePreviewState = () => {
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
    if (isDemoGameComplete) return
    setSelectedCardId((currentSelectedId) => (currentSelectedId === cardId ? null : cardId))
    setShowBuyAction(false)
  }

  const handleDrawFromDeck = () => {
    if (isDemoGameComplete) return
    const drawnCard = mockDrawSequence[drawIndex % mockDrawSequence.length]
    setDrawIndex((currentIndex) => currentIndex + 1)
    setHandCards((currentCards) => [...currentCards, createHandCard(drawnCard)])
    setShowBuyAction(false)
  }

  const handleDrawFromDiscard = () => {
    if (isDemoGameComplete) return
    setShowBuyAction(true)
  }

  const handleDiscardPileClick = () => {
    if (isDemoGameComplete) return
    if (selectedCards.length === 0) {
      handleDrawFromDiscard()
      return
    }

    const [cardToDiscard] = selectedCards
    setTopDiscardCard({ rank: cardToDiscard.rank, suit: cardToDiscard.suit })
    setHandCards((currentCards) => currentCards.filter((card) => card.id !== cardToDiscard.id))
    clearSelection()
    setShowBuyAction(false)
  }

  const handleBuyAction = () => {
    if (isDemoGameComplete) return
    setShowBuyAction(false)
  }

  const removeSelectedCardsFromHand = (cardsToRemove: HandCard[]) => {
    const removeIds = new Set(cardsToRemove.map((card) => card.id))
    setHandCards((currentCards) => currentCards.filter((card) => !removeIds.has(card.id)))
  }

  const handleAttemptMeld = () => {
    if (isDemoGameComplete || selectedCards.length === 0) return

    const meldCards: TableCard[] = selectedTableCards
    const meldKind = detectMeldKind(meldCards)
    if (!meldKind) return

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
  }

  const handleLayoffToMeld = (groupIndex: number, meldIndex: number) => {
    if (isDemoGameComplete || selectedCards.length === 0) return

    const targetGroup = meldGroups[groupIndex]
    const targetMeld = targetGroup?.melds[meldIndex]
    if (!targetGroup || !targetMeld) return

    const cardsToLayoff: TableCard[] = selectedTableCards
    const targetMeldKind = detectMeldKind(targetMeld)
    if (!targetMeldKind) return

    const combinedMeld = [...targetMeld, ...cardsToLayoff]
    const combinedValid = targetMeldKind === 'set' ? validateSetMeld(combinedMeld) : validateRunMeld(combinedMeld)
    if (!combinedValid) return

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
  }

  const handleClearSelection = () => {
    clearSelection()
  }

  const handleResetDemo = () => {
    setDemoRoundIndex(0)
    setIsDemoGameComplete(false)
    resetTablePreviewState()
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

      <header className="game-table-header">
        <button
          type="button"
          className="game-table-header__btn game-table-header__btn--back"
          onClick={handleBackToLobby}
          data-a11y-description="Leave the table and return to the lobby."
        >
          ← Leave
        </button>

        <div className="game-table-header__meta">
          <p className="game-table-header__chip">
            Round {currentDemoRound.roundNumber} / {demoRounds.length}
          </p>
          <p className="game-table-header__chip game-table-header__chip--contract">
            {currentDemoRound.contractText}
          </p>
          <p className="game-table-header__chip game-table-header__chip--turn">
            {isDemoGameComplete ? 'Game Complete' : 'Your Turn'}
          </p>
        </div>

        <button
          type="button"
          className="game-table-header__btn game-table-header__btn--rules"
          onClick={handleOpenRulebook}
          data-a11y-description="Open the rulebook page in one click."
        >
          Rulebook
        </button>
      </header>

      <section className="game-table-layout">
        <TopPanels
          currentDemoRound={currentDemoRound}
          pinnedScoreRows={pinnedScoreRows}
          extraScoreRows={extraScoreRows}
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
