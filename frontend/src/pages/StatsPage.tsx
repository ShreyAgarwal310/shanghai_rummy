import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { PlayerStatsRow } from '../types/database'
import { navigateTo } from '../utils/navigate'
import './StatsPage.css'

type MetricCard = {
  label: string
  note: string
  icon: string
  accent: 'amber' | 'green' | 'blue' | 'violet' | 'gold' | 'red'
  value: (stats: PlayerStatsRow | null) => string
}

function formatPercent(value: number, total: number) {
  if (!total) {
    return '--'
  }

  return `${Math.round((value / total) * 100)}%`
}

function formatAverage(value: number) {
  return Number.isFinite(value) ? value.toFixed(1) : '--'
}

function StatsPage() {
  const { user, profile, loading } = useAuth()
  const [stats, setStats] = useState<PlayerStatsRow | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    if (!user || !supabase) {
      setStatsLoading(false)
      return
    }

    const supabaseClient = supabase

    const loadStats = async () => {
      setStatsLoading(true)
      const { data, error } = await supabaseClient.from('player_stats').select('*').eq('user_id', user.id).maybeSingle()

      if (!error) {
        setStats(data)
      }

      setStatsLoading(false)
    }

    void loadStats()
  }, [user])

  const metricCards: MetricCard[] = [
    { label: 'Total Games', note: 'Completed matches', icon: '◎', accent: 'amber', value: (nextStats) => String(nextStats?.games_played ?? '--') },
    { label: 'Wins', note: 'Tables conquered', icon: '♕', accent: 'green', value: (nextStats) => String(nextStats?.wins ?? '--') },
    { label: 'Win Rate', note: 'Across all rounds', icon: '↗', accent: 'blue', value: (nextStats) => (nextStats ? formatPercent(nextStats.wins, nextStats.games_played) : '--') },
    { label: 'Avg Score', note: 'Lower is better', icon: '☆', accent: 'violet', value: (nextStats) => (nextStats ? formatAverage(nextStats.average_score) : '--') },
    { label: 'Best Score', note: 'Personal record', icon: '🏆', accent: 'gold', value: (nextStats) => String(nextStats?.best_score ?? '--') },
    { label: 'Current Streak', note: 'Wins in a row', icon: '⚡', accent: 'red', value: (nextStats) => String(nextStats?.current_streak ?? '--') },
  ]

  const detailRows = [
    { label: 'Losses', value: stats?.losses ?? '--' },
    { label: 'Worst Score', value: stats?.worst_score ?? '--' },
    { label: 'Longest Streak', value: stats?.longest_streak ?? '--' },
    { label: 'Total Melds', value: stats?.total_melds ?? '--' },
    { label: 'Perfect Rounds', value: stats?.perfect_rounds ?? '--' },
  ]

  const handleBackClick = () => {
    navigateTo('/')
  }

  if (loading) {
    return (
      <main className="stats-page" aria-label="Player statistics">
        <section className="stats-page__content">
          <header className="stats-page__title-card">
            <h1 className="stats-page__title">Loading statistics...</h1>
          </header>
        </section>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="stats-page" aria-label="Player statistics">
        <button type="button" className="stats-page__back-btn" onClick={handleBackClick}>
          ← Back to Lobby
        </button>
        <section className="stats-page__content">
          <header className="stats-page__title-card">
            <p className="stats-page__player-name">Authentication required</p>
            <h1 className="stats-page__title">Your Statistics</h1>
            <p className="stats-page__favorite-note">Sign in first to view your Supabase-backed player stats.</p>
          </header>
        </section>
      </main>
    )
  }

  return (
    <main className="stats-page" aria-label="Player statistics">
      <div className="stats-frame" aria-hidden="true">
        <span className="stats-frame__corner stats-frame__corner--tl" />
        <span className="stats-frame__corner stats-frame__corner--tr" />
        <span className="stats-frame__corner stats-frame__corner--bl" />
        <span className="stats-frame__corner stats-frame__corner--br" />
        <span className="stats-frame__mid stats-frame__mid--top">◆</span>
        <span className="stats-frame__mid stats-frame__mid--right">◆</span>
        <span className="stats-frame__mid stats-frame__mid--bottom">◆</span>
        <span className="stats-frame__mid stats-frame__mid--left">◆</span>
      </div>

      <button
        type="button"
        className="stats-page__back-btn"
        onClick={handleBackClick}
        data-a11y-description="Return to the home lobby screen."
      >
        ← Back to Lobby
      </button>

      <section className="stats-page__content">
        <header className="stats-page__title-card">
          <div className="stats-page__pretitle" aria-hidden="true">
            <span className="stats-page__ornament-line" />
            <span className="stats-page__ornament-gem">◆</span>
            <span className="stats-page__ornament-line" />
          </div>
          <p className="stats-page__player-name">{profile?.display_name ?? user.email ?? 'Player'}</p>
          <h1 className="stats-page__title">Your Statistics</h1>
          <div className="stats-page__title-ornament" aria-hidden="true">
            <span className="stats-page__ornament-line" />
            <span className="stats-page__ornament-gem">◈</span>
            <span className="stats-page__ornament-gem stats-page__ornament-gem--main">◆</span>
            <span className="stats-page__ornament-gem">◈</span>
            <span className="stats-page__ornament-line" />
          </div>
        </header>

        <section className="stats-page__metrics-grid" aria-label="Primary statistics">
          {metricCards.map((card) => (
            <article key={card.label} className={`stats-card stats-card--${card.accent}`}>
              <header className="stats-card__header">
                <span className="stats-card__icon" aria-hidden="true">
                  {card.icon}
                </span>
                <h2 className="stats-card__label">{card.label}</h2>
              </header>
              <p className="stats-card__value">{statsLoading ? '--' : card.value(stats)}</p>
              <p className="stats-card__note">{card.note}</p>
            </article>
          ))}
        </section>

        <section className="stats-page__bottom-grid">
          <article className="stats-panel">
            <h2 className="stats-panel__title">Game Details</h2>
            <dl className="stats-panel__list">
              {detailRows.map((row) => (
                <div key={row.label} className="stats-panel__row">
                  <dt>{row.label}:</dt>
                  <dd>{statsLoading ? '--' : row.value}</dd>
                </div>
              ))}
            </dl>
          </article>

          <article className="stats-panel stats-panel--favorite">
            <h2 className="stats-panel__title">Favorite Round</h2>
            <div className="stats-panel__favorite-content">
              <span className="stats-panel__favorite-icon" aria-hidden="true">
                ☆
              </span>
              <p className="stats-panel__favorite-round">{stats?.favorite_round ?? '--'}</p>
              <p className="stats-panel__favorite-note">
                {stats ? 'Pulled from public.player_stats.' : 'No data yet.'}
              </p>
            </div>
          </article>
        </section>
      </section>
    </main>
  )
}

export default StatsPage
