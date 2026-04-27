import './GameTablePage.css'
import EndGameOverlay from './GameTablePage/components/EndGameOverlay'
import GameTableHeader from './GameTablePage/components/GameTableHeader'
import GameTableSidebar from './GameTablePage/components/GameTableSidebar'
import LocalPlayerZone from './GameTablePage/components/LocalPlayerZone'
import TableCenter from './GameTablePage/components/TableCenter'
import type { GameTablePageProps } from './GameTablePage.types'
import { useGameTablePageController } from './useGameTablePageController'

function GameTablePage({ gameId }: GameTablePageProps) {
  const controller = useGameTablePageController(gameId)

  return (
    <main className="game-table-page" aria-label="Shanghai Rummy game table">
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

      <GameTableSidebar
        isLiveMode={!controller.isDemoMode}
        displayRoundNumber={controller.displayRoundNumber}
        displayContractText={controller.displayContractText}
        requirementLines={controller.requirementLines}
        pinnedScoreRows={controller.pinnedScoreRows}
        extraScoreRows={controller.extraScoreRows}
        activityFeed={controller.activityFeed}
        currentDemoRound={controller.currentDemoRound}
        demoRounds={controller.demoRounds}
        isFinalDemoRound={controller.isFinalDemoRound}
        isDemoGameComplete={controller.isDemoGameComplete}
        isDenseMeldPreview={controller.isDenseMeldPreview}
        setCount={controller.meldsByType.sets.length}
        runCount={controller.meldsByType.runs.length}
        onNextDemoRound={controller.handleNextDemoRound}
        onEndDemoGame={controller.handleEndDemoGame}
        onResetDemo={controller.handleResetDemo}
        onToggleDenseMeldPreview={controller.handleToggleDenseMeldPreview}
      />

      <div className="game-score-bar" aria-label="Player standings">
        {controller.sortedScoreRows.map((row, i) => (
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

      <GameTableHeader
        isLiveMode={!controller.isDemoMode}
        currentDemoRound={controller.currentDemoRound}
        demoRounds={controller.demoRounds}
        demoRoundIndex={controller.demoRoundIndex}
        displayRoundNumber={controller.displayRoundNumber}
        displayTotalRounds={controller.displayTotalRounds}
        displayContractText={controller.displayContractText}
        turnLabel={controller.turnLabel}
        isFinalDemoRound={controller.isFinalDemoRound}
        isDemoGameComplete={controller.isDemoGameComplete}
        isDenseMeldPreview={controller.isDenseMeldPreview}
        onBackToLobby={controller.handleBackToLobby}
        onOpenRulebook={controller.handleOpenRulebook}
        onJumpToDemoRound={controller.handleJumpToDemoRound}
        onNextDemoRound={controller.handleNextDemoRound}
        onEndDemoGame={controller.handleEndDemoGame}
        onToggleDenseMeldPreview={controller.handleToggleDenseMeldPreview}
        onResetDemo={controller.handleResetDemo}
      />

      <section className="game-table-layout">
        <div className="game-board-row">
          <section className="game-table-stage" aria-label="Main table layout">
            <TableCenter
              opponentSeats={controller.displayOpponents}
              meldsByType={controller.meldsByType}
              setLaneClassName={controller.setLaneClassName}
              runLaneClassName={controller.runLaneClassName}
              selectedCardsCount={controller.selectedCards.length}
              showBuyAction={controller.showBuyAction}
              stealJokerMode={controller.stealJokerMode}
              topDiscardCard={controller.topDiscardCard}
              deckSize={controller.liveState?.deck_size ?? 74}
              onDrawFromDeck={controller.handleDrawFromDeck}
              onDiscardPileClick={controller.handleDiscardPileClick}
              onLayoffToMeld={controller.handleLayoffToMeld}
              onStealFromMeld={controller.handleStealFromMeld}
            />

            <LocalPlayerZone
              handCards={controller.handCards}
              selectedCardIds={controller.selectedCardIds}
              showBuyAction={controller.showBuyAction}
              pendingMelds={controller.pendingMelds}
              contract={controller.contractRequirements}
              isMyTurn={controller.isDemoMode ? true : controller.isMyTurn}
              hasLaidDown={controller.hasLaidDown}
              isLiveMode={!controller.isDemoMode}
              stealJokerMode={controller.stealJokerMode}
              onHandCardClick={controller.handleHandCardClick}
              onAttemptMeld={controller.handleAttemptMeld}
              onSubmitLayDown={controller.handleSubmitLayDown}
              onDrawFromDeck={controller.handleDrawFromDeck}
              onDrawFromDiscard={controller.handleDrawFromDiscard}
              onBuyAction={controller.handleBuyAction}
              onClearSelection={controller.handleClearSelection}
              onDiscard={controller.handleDiscard}
              onToggleStealJoker={controller.handleToggleStealJoker}
            />
          </section>
        </div>
      </section>

      <EndGameOverlay
        isVisible={controller.isDemoGameComplete}
        demoWinner={controller.demoWinner}
        demoRunnerUp={controller.demoRunnerUp}
        totalRounds={controller.displayTotalRounds}
        finalContractText={
          !controller.isDemoMode
            ? controller.displayContractText
            : controller.demoRounds[controller.demoRounds.length - 1].contractText
        }
        finalLeaderboardRows={controller.finalLeaderboardRows}
        onResetDemo={controller.handleResetDemo}
        onBackToLobby={controller.handleBackToLobby}
      />
    </main>
  )
}

export default GameTablePage
