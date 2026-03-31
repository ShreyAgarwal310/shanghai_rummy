import Button from '../components/common/Button'
import AppLayout from '../layout/AppLayout'
import { navigateTo } from '../utils/navigate'
import './HomePage.css'

type HomeAction = {
  label: 'Join' | 'Host' | 'Rules' | 'Stats'
  symbol: string
  description: string
  onClick: () => void
}

function HomePage() {
  const handleJoinClick = () => {
    navigateTo('/join')
  }

  const handleHostClick = () => {
    navigateTo('/host')
  }

  const handleRulesClick = () => {
    navigateTo('/rules')
  }

  const handleStatsClick = () => {
    navigateTo('/stats')
  }

  const handleProfileClick = () => {
    navigateTo('/profile')
  }

  const handleLeaderboardClick = () => {
    navigateTo('/leaderboard')
  }

  const actions: HomeAction[] = [
    { label: 'Join', symbol: '♠', description: 'Find a Table', onClick: handleJoinClick },
    { label: 'Host', symbol: '♥', description: 'Open a Club', onClick: handleHostClick },
    { label: 'Rules', symbol: '♣', description: 'Learn the Game', onClick: handleRulesClick },
    { label: 'Stats', symbol: '♦', description: 'Your Record', onClick: handleStatsClick },
  ]

  return (
    <AppLayout onProfileClick={handleProfileClick} onLeaderboardClick={handleLeaderboardClick}>
      <main className="home-page" aria-label="Shanghai Rummy landing page">

        {/* Decorative border frame */}
        <div className="home-frame" aria-hidden="true">
          <span className="home-frame__corner home-frame__corner--tl" />
          <span className="home-frame__corner home-frame__corner--tr" />
          <span className="home-frame__corner home-frame__corner--bl" />
          <span className="home-frame__corner home-frame__corner--br" />
          <span className="home-frame__mid home-frame__mid--top">◆</span>
          <span className="home-frame__mid home-frame__mid--right">◆</span>
          <span className="home-frame__mid home-frame__mid--bottom">◆</span>
          <span className="home-frame__mid home-frame__mid--left">◆</span>
        </div>

        {/* Atmospheric background suits */}
        <div className="home-bg-suits" aria-hidden="true">
          <span className="home-bg-suit home-bg-suit--spade">♠</span>
          <span className="home-bg-suit home-bg-suit--heart">♥</span>
          <span className="home-bg-suit home-bg-suit--club">♣</span>
          <span className="home-bg-suit home-bg-suit--diamond">♦</span>
        </div>

        <div className="home-content">
          {/* Top utility nav — repositioned inside the frame */}
          <nav className="home-nav" aria-label="Utility navigation">
            <button className="home-nav__btn" onClick={handleProfileClick} aria-label="Open Profile">
              <svg viewBox="0 0 24 24" className="home-nav__icon" aria-hidden="true">
                <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.3 0-6 2.13-6 4.75a1 1 0 0 0 2 0C8 17.29 9.79 16 12 16s4 1.29 4 2.75a1 1 0 0 0 2 0C18 16.13 15.3 14 12 14Z" />
              </svg>
              <span>Profile</span>
            </button>
            <button className="home-nav__btn" onClick={handleLeaderboardClick} aria-label="Open Leaderboard">
              <svg viewBox="0 0 24 24" className="home-nav__icon" aria-hidden="true">
                <path d="M4 19V5a1 1 0 0 1 2 0v14h12a1 1 0 0 1 0 2H5a1 1 0 0 1-1-1Zm5-2V9a1 1 0 1 1 2 0v8a1 1 0 1 1-2 0Zm4 0V5a1 1 0 1 1 2 0v12a1 1 0 1 1-2 0Zm4 0v-6a1 1 0 0 1 2 0v6a1 1 0 1 1-2 0Z" />
              </svg>
              <span>Leaderboard</span>
            </button>
          </nav>

          {/* Title */}
          <section className="home-title-block" aria-labelledby="home-title">
            <div className="home-pretitle" aria-hidden="true">
              <span className="home-pretitle__line" />
              <span className="home-pretitle__gem">◆</span>
              <span className="home-pretitle__line" />
            </div>
            <p className="home-subtitle">The Grand Shanghai Club</p>
            <h1 id="home-title" className="home-title">
              Shanghai Rummy
            </h1>
            <div className="home-title-ornament" aria-hidden="true">
              <span className="home-title-ornament__line" />
              <span className="home-title-ornament__gem">◈</span>
              <span className="home-title-ornament__gem home-title-ornament__gem--main">◆</span>
              <span className="home-title-ornament__gem">◈</span>
              <span className="home-title-ornament__line" />
            </div>
          </section>

          {/* Action buttons — 2×2 for symmetry */}
          <section className="home-actions" aria-label="Primary home actions">
            {actions.map((action) => (
              <Button
                key={action.label}
                variant="gold"
                className="home-action-btn"
                onClick={action.onClick}
                aria-label={action.label}
              >
                <span className="home-action-btn__bg-suit" aria-hidden="true">
                  {action.symbol}
                </span>
                <span className="home-action-btn__icon" aria-hidden="true">
                  {action.symbol}
                </span>
                <span className="home-action-btn__label">{action.label}</span>
                <span className="home-action-btn__desc">{action.description}</span>
              </Button>
            ))}
          </section>
        </div>
      </main>
    </AppLayout>
  )
}

export default HomePage
