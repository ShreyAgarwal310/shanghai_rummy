import { useState } from 'react'
import './LeaderboardPage.css'

const leaderboardTimeframes = ['All Time', 'Monthly', 'Weekly'] as const

type LeaderboardTimeframe = (typeof leaderboardTimeframes)[number]

type LeaderboardEntry = {
  rank: number
  player: string
  wins: string
  winRate: string
  avgScore: string
  streak: string
}

const placeholderEntries: LeaderboardEntry[] = Array.from({ length: 10 }, (_, index) => ({
  rank: index + 1,
  player: '--',
  wins: '--',
  winRate: '--',
  avgScore: '--',
  streak: '--',
}))

function LeaderboardPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<LeaderboardTimeframe>('All Time')

  const handleBackClick = () => {
    window.location.assign('/')
  }

  return (
    <main className="leaderboard-page" aria-label="Global leaderboard">
      <button
        type="button"
        className="leaderboard-page__back-btn"
        onClick={handleBackClick}
        data-a11y-description="Return to the home lobby screen."
      >
        ← Back to Lobby
      </button>

      <section className="leaderboard-page__content">
        <header className="leaderboard-page__title-card">
          <h1 className="leaderboard-page__title">Global Leaderboard</h1>
          <p className="leaderboard-page__subtitle">Rankings update when backend match results are connected.</p>
        </header>

        <section className="leaderboard-page__timeframe-row" aria-label="Leaderboard timeframe">
          {leaderboardTimeframes.map((timeframe) => (
            <button
              key={timeframe}
              type="button"
              className={`leaderboard-page__timeframe-btn ${selectedTimeframe === timeframe ? 'is-active' : ''}`}
              onClick={() => setSelectedTimeframe(timeframe)}
              data-a11y-description={`Show ${timeframe} leaderboard rankings.`}
            >
              {timeframe}
            </button>
          ))}
        </section>

        <section className="leaderboard-podium" aria-label="Top ranked players">
          <article className="leaderboard-podium__card leaderboard-podium__card--second">
            <p className="leaderboard-podium__rank">#2</p>
            <p className="leaderboard-podium__player">--</p>
            <p className="leaderboard-podium__metric">Wins: --</p>
          </article>

          <article className="leaderboard-podium__card leaderboard-podium__card--first">
            <p className="leaderboard-podium__rank">#1</p>
            <p className="leaderboard-podium__player">--</p>
            <p className="leaderboard-podium__metric">Wins: --</p>
          </article>

          <article className="leaderboard-podium__card leaderboard-podium__card--third">
            <p className="leaderboard-podium__rank">#3</p>
            <p className="leaderboard-podium__player">--</p>
            <p className="leaderboard-podium__metric">Wins: --</p>
          </article>
        </section>

        <section className="leaderboard-table-card">
          <p className="leaderboard-table-card__note">Data placeholder mode. Backend can populate rows from leaderboard API.</p>
          <div className="leaderboard-table-wrap">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Wins</th>
                  <th>Win Rate</th>
                  <th>Avg Score</th>
                  <th>Streak</th>
                </tr>
              </thead>
              <tbody>
                {placeholderEntries.map((entry) => (
                  <tr key={entry.rank}>
                    <td>{entry.rank}</td>
                    <td>{entry.player}</td>
                    <td>{entry.wins}</td>
                    <td>{entry.winRate}</td>
                    <td>{entry.avgScore}</td>
                    <td>{entry.streak}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  )
}

export default LeaderboardPage

