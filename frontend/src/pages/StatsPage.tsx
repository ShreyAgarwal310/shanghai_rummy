import './StatsPage.css'

type MetricCard = {
  label: string
  note: string
  icon: string
  accent: 'amber' | 'green' | 'blue' | 'violet' | 'gold' | 'red'
}

const metricCards: MetricCard[] = [
  { label: 'Total Games', note: 'Completed matches', icon: '◎', accent: 'amber' },
  { label: 'Wins', note: 'Tables conquered', icon: '♕', accent: 'green' },
  { label: 'Win Rate', note: 'Across all rounds', icon: '↗', accent: 'blue' },
  { label: 'Avg Score', note: 'Lower is better', icon: '☆', accent: 'violet' },
  { label: 'Best Score', note: 'Personal record', icon: '🏆', accent: 'gold' },
  { label: 'Current Streak', note: 'Wins in a row', icon: '⚡', accent: 'red' },
]

const detailRows = [
  { label: 'Losses' },
  { label: 'Worst Score' },
  { label: 'Longest Streak' },
  { label: 'Total Melds' },
  { label: 'Perfect Rounds' },
]

function StatsPage() {
  const handleBackClick = () => {
    window.location.assign('/')
  }

  return (
    <main className="stats-page" aria-label="Player statistics">

      {/* Fixed gold border frame */}
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
          <p className="stats-page__player-name">Player Name</p>
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
              <p className="stats-card__value">--</p>
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
                  <dd>--</dd>
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
              <p className="stats-panel__favorite-round">--</p>
              <p className="stats-panel__favorite-note">No data yet.</p>
            </div>
          </article>
        </section>
      </section>
    </main>
  )
}

export default StatsPage
