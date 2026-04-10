import { getRoundTypeLabel } from '../../GameTablePage.logic'
import type { DemoRound, ScoreRow } from '../../GameTablePage.mock'

type TopPanelsProps = {
  currentDemoRound: DemoRound
  pinnedScoreRows: ScoreRow[]
  extraScoreRows: ScoreRow[]
}

function TopPanels({ currentDemoRound, pinnedScoreRows, extraScoreRows }: TopPanelsProps) {
  return (
    <aside className="game-side-panel" aria-label="Round and score details">
      <article className="game-panel-card game-panel-card--contract">
        <h2 className="game-panel-card__title">Round Contract</h2>
        <p className="game-panel-card__contract">{currentDemoRound.contractText}</p>
        <p className="game-panel-card__text">
          Round Type: {getRoundTypeLabel(currentDemoRound.requiredSets, currentDemoRound.requiredRuns)}
        </p>
        <div className="game-requirements">
          <p className="game-requirements__item">
            {currentDemoRound.requiredSets > 0
              ? `Set: ${currentDemoRound.requiredSets} meld${currentDemoRound.requiredSets > 1 ? 's' : ''}, ${currentDemoRound.setSize} cards each`
              : 'Set: none this round'}
          </p>
          <p className="game-requirements__item">
            {currentDemoRound.requiredRuns > 0
              ? `Run: ${currentDemoRound.requiredRuns} meld${currentDemoRound.requiredRuns > 1 ? 's' : ''}, ${currentDemoRound.runSize} cards each`
              : 'Run: none this round'}
          </p>
        </div>
      </article>

      <article className="game-panel-card game-panel-card--scoreboard">
        <div className="game-panel-card__title-row">
          <h2 className="game-panel-card__title">Scoreboard</h2>
          <p className="game-panel-card__subtitle">Lower score leads</p>
        </div>
        <div className="game-score-pinned" aria-label="All ranks">
          {pinnedScoreRows.map((row) => (
            <div key={row.player} className={`game-score-pinned-row ${row.rank === 1 ? 'is-leader' : ''}`}>
              <span className="game-score-pinned-row__badge">{row.player === 'You' ? 'You' : row.rank === 1 ? 'Lead' : '2nd'}</span>
              <span className="game-score-pinned-row__player">
                {row.player} (#{row.rank})
              </span>
              <span className="game-score-pinned-row__score">{row.score}</span>
            </div>
          ))}
          {extraScoreRows.map((row) => (
            <div key={row.player} className="game-score-pinned-row">
              <span className="game-score-pinned-row__badge">#{row.rank}</span>
              <span className="game-score-pinned-row__player">{row.player}</span>
              <span className="game-score-pinned-row__score">{row.score}</span>
            </div>
          ))}
        </div>
      </article>

    </aside>
  )
}

export default TopPanels
