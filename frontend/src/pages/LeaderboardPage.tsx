import { useEffect, useState } from 'react'
import { isSupabaseConfigured } from '../lib/supabase'
import { fetchLeaderboard } from '../services/leaderboardService'
import type { LeaderboardTimeframe } from '../services/leaderboardService'
import type { LeaderboardViewRow } from '../types/database'
import { navigateTo } from '../utils/navigate'
import './LeaderboardPage.css'

const leaderboardTimeframes: LeaderboardTimeframe[] = ['All Time', 'Monthly', 'Weekly']

function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

function formatScore(value: number) {
  return Number.isFinite(value) ? value.toFixed(1) : '--'
}

function LeaderboardPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<LeaderboardTimeframe>('All Time')
  const [entries, setEntries] = useState<LeaderboardViewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoading(true)
      setError('')

      try {
        setEntries(await fetchLeaderboard(selectedTimeframe))
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : 'Unable to load leaderboard data.')
      } finally {
        setLoading(false)
      }
    }

    void loadLeaderboard()
  }, [selectedTimeframe])

  const handleBackClick = () => {
    navigateTo('/')
  }

  const podium = [entries[1], entries[0], entries[2]]

  return (
    <main className="leaderboard-page" aria-label="Global leaderboard">
      <div className="leaderboard-frame" aria-hidden="true">
        <span className="leaderboard-frame__corner leaderboard-frame__corner--tl" />
        <span className="leaderboard-frame__corner leaderboard-frame__corner--tr" />
        <span className="leaderboard-frame__corner leaderboard-frame__corner--bl" />
        <span className="leaderboard-frame__corner leaderboard-frame__corner--br" />
        <span className="leaderboard-frame__mid leaderboard-frame__mid--top">◆</span>
        <span className="leaderboard-frame__mid leaderboard-frame__mid--right">◆</span>
        <span className="leaderboard-frame__mid leaderboard-frame__mid--bottom">◆</span>
        <span className="leaderboard-frame__mid leaderboard-frame__mid--left">◆</span>
      </div>

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
          <p className="leaderboard-page__subtitle">Top players across all tables.</p>
          {!isSupabaseConfigured ? (
            <p className="leaderboard-page__subtitle">Add your Supabase env vars to load live standings.</p>
          ) : null}
          {error ? <p className="leaderboard-page__subtitle">{error}</p> : null}
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
          {podium.map((entry, index) => {
            const rank = index === 0 ? 2 : index === 1 ? 1 : 3
            const modifier = index === 0 ? 'second' : index === 1 ? 'first' : 'third'

            return (
              <article key={rank} className={`leaderboard-podium__card leaderboard-podium__card--${modifier}`}>
                <p className="leaderboard-podium__rank">#{rank}</p>
                <p className="leaderboard-podium__player">{entry?.player_name ?? '--'}</p>
                <p className="leaderboard-podium__metric">Wins: {entry?.wins ?? '--'}</p>
              </article>
            )
          })}
        </section>

        <section className="leaderboard-table-card">
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
                {loading ? (
                  <tr>
                    <td colSpan={6}>Loading leaderboard...</td>
                  </tr>
                ) : entries.length > 0 ? (
                  entries.map((entry, index) => (
                    <tr key={entry.user_id}>
                      <td>{index + 1}</td>
                      <td>{entry.player_name ?? 'Anonymous Player'}</td>
                      <td>{entry.wins}</td>
                      <td>{formatPercent(entry.win_rate)}</td>
                      <td>{formatScore(entry.average_score)}</td>
                      <td>{entry.current_streak}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>
                      {isSupabaseConfigured
                        ? 'No leaderboard rows yet. Seed player_stats or leaderboard_period_stats in Supabase.'
                        : 'Configure Supabase to replace placeholder leaderboard data.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  )
}

export default LeaderboardPage
