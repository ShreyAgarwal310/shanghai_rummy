import type { ScoreRow } from '../../GameTablePage.mock'

type EndGameOverlayProps = {
  isVisible: boolean
  demoWinner: ScoreRow
  demoRunnerUp: ScoreRow
  totalRounds: number
  finalContractText: string
  finalLeaderboardRows: ScoreRow[]
  onResetDemo: () => void
  onBackToLobby: () => void
}

function EndGameOverlay({
  isVisible,
  demoWinner,
  demoRunnerUp,
  totalRounds,
  finalContractText,
  finalLeaderboardRows,
  onResetDemo,
  onBackToLobby,
}: EndGameOverlayProps) {
  if (!isVisible) {
    return null
  }

  return (
    <section className="game-end-overlay" role="dialog" aria-modal="true" aria-labelledby="game-end-title">
      <div className="game-end-overlay__backdrop" />
      <article className="game-end-card">
        <header className="game-end-card__hero">
          <p className="game-end-card__label">Shanghai Rummy Winner</p>
          <h2 id="game-end-title" className="game-end-card__winner">
            {demoWinner.player}
          </h2>
          <p className="game-end-card__subtitle">Victory with {demoWinner.score} points. Lowest score on the table wins.</p>
        </header>

        <section className="game-end-card__stats" aria-label="End game highlights">
          <article className="game-end-stat">
            <h3>Runner-Up</h3>
            <p>{demoRunnerUp.player}</p>
            <span>{demoRunnerUp.score} pts</span>
          </article>
          <article className="game-end-stat">
            <h3>Rounds Played</h3>
            <p>{totalRounds}</p>
            <span>Demo flow complete</span>
          </article>
          <article className="game-end-stat">
            <h3>Final Contract</h3>
            <p>{finalContractText}</p>
            <span>Round {totalRounds}</span>
          </article>
        </section>

        <section className="game-end-card__leaderboard-wrap" aria-label="Final leaderboard">
          <h3 className="game-end-card__leaderboard-title">Final Leaderboard</h3>
          <table className="game-end-card__leaderboard">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Final Score</th>
              </tr>
            </thead>
            <tbody>
              {finalLeaderboardRows.map((row, index) => (
                <tr key={row.player} className={index === 0 ? 'is-winner' : ''}>
                  <td>{index + 1}</td>
                  <td>{row.player}</td>
                  <td>{row.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <footer className="game-end-card__actions">
          <button type="button" className="game-end-card__btn game-end-card__btn--primary" onClick={onResetDemo}>
            Play Demo Again
          </button>
          <button type="button" className="game-end-card__btn game-end-card__btn--secondary" onClick={onBackToLobby}>
            Back to Lobby
          </button>
        </footer>
      </article>
    </section>
  )
}

export default EndGameOverlay
