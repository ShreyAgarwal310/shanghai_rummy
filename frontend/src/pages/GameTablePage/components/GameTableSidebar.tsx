import { useState } from 'react'
import type { DemoRound, ScoreRow } from '../../GameTablePage.mock'
import DemoRail from './DemoRail'

type GameTableSidebarProps = {
  isLiveMode: boolean
  displayRoundNumber: number
  displayContractText: string
  requirementLines: string[]
  pinnedScoreRows: ScoreRow[]
  extraScoreRows: ScoreRow[]
  activityFeed: string[]
  currentDemoRound: DemoRound
  demoRounds: DemoRound[]
  isFinalDemoRound: boolean
  isDemoGameComplete: boolean
  isDenseMeldPreview: boolean
  setCount: number
  runCount: number
  onNextDemoRound: () => void
  onEndDemoGame: () => void
  onResetDemo: () => void
  onToggleDenseMeldPreview: () => void
}

function GameTableSidebar({
  isLiveMode,
  displayRoundNumber,
  displayContractText,
  requirementLines,
  pinnedScoreRows,
  extraScoreRows,
  activityFeed,
  currentDemoRound,
  demoRounds,
  isFinalDemoRound,
  isDemoGameComplete,
  isDenseMeldPreview,
  setCount,
  runCount,
  onNextDemoRound,
  onEndDemoGame,
  onResetDemo,
  onToggleDenseMeldPreview,
}: GameTableSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div
        className={`game-side-drawer-overlay${isOpen ? ' is-open' : ''}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <button
        type="button"
        className={`game-sidebar-tab${isOpen ? ' is-open' : ''}`}
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
        aria-expanded={isOpen}
      >
        <span className="game-sidebar-tab__caret">▲</span>
        <span className="game-sidebar-tab__label">Info</span>
        <span className="game-sidebar-tab__caret">▲</span>
      </button>

      <aside
        className={`game-side-drawer${isOpen ? ' is-open' : ''}`}
        aria-label="Game information panel"
        aria-hidden={!isOpen}
      >
        <div className="game-side-drawer__close">
          <span className="game-side-drawer__title">Game Info</span>
          <button type="button" className="game-side-drawer__close-btn" onClick={() => setIsOpen(false)}>
            ✕ Close
          </button>
        </div>

        <div className="game-panel-card">
          <div className="game-panel-card__title-row">
            <h2 className="game-panel-card__title">Contract</h2>
            <span className="game-panel-card__subtitle">Round {displayRoundNumber}</span>
          </div>
          <p className="game-panel-card__contract">{displayContractText}</p>
          <div className="game-requirements">
            {requirementLines.map((line) => (
              <p key={line} className="game-requirements__item">
                {line}
              </p>
            ))}
          </div>
        </div>

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

        {!isLiveMode && (
          <DemoRail
            currentDemoRound={currentDemoRound}
            totalRounds={demoRounds.length}
            isFinalDemoRound={isFinalDemoRound}
            isDemoGameComplete={isDemoGameComplete}
            isDenseMeldPreview={isDenseMeldPreview}
            setCount={setCount}
            runCount={runCount}
            onNextDemoRound={onNextDemoRound}
            onEndDemoGame={onEndDemoGame}
            onResetDemo={onResetDemo}
            onToggleDenseMeldPreview={onToggleDenseMeldPreview}
          />
        )}
      </aside>
    </>
  )
}

export default GameTableSidebar
