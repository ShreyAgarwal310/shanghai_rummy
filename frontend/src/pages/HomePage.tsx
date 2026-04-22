import { useAuth } from '../hooks/useAuth'
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
  const { user, profile } = useAuth()

  const handleJoinClick = () => navigateTo('/join')
  const handleHostClick = () => navigateTo('/host')
  const handleRulesClick = () => navigateTo('/rules')
  const handleStatsClick = () => navigateTo('/stats')
  const handleProfileClick = () => navigateTo(user ? '/profile' : '/login')
  const handleLeaderboardClick = () => navigateTo('/leaderboard')

  const actions: HomeAction[] = [
    { label: 'Join', symbol: '♠', description: 'Find a Table', onClick: handleJoinClick },
    { label: 'Host', symbol: '♥', description: 'Open a Club', onClick: handleHostClick },
    { label: 'Rules', symbol: '♣', description: 'Learn the Game', onClick: handleRulesClick },
    { label: 'Stats', symbol: '♦', description: 'Your Record', onClick: handleStatsClick },
  ]

  return (
    <AppLayout onProfileClick={handleProfileClick} onLeaderboardClick={handleLeaderboardClick}>
      <main className="home-page" aria-label="Shanghai Rummy landing page">
        
        {/* Decorative Corners */}
        <div className="corner top-left" />
        <div className="corner top-right" />
        <div className="corner bottom-left" />
        <div className="corner bottom-right" />

        <div className="home-content">
          {/* 1. TITLE BLOCK FIRST */}
          <section className="home-title-block">
            <p className="home-subtitle">The Grand Shanghai Club</p>
            <h1 className="home-title">Shanghai Rummy</h1>
          </section>

          {/* 2. NAV BUTTONS SECOND (Thin Rectangles) */}
          <nav className="home-nav">
            <button className="home-nav__btn" onClick={handleProfileClick}>
              <span>{profile?.display_name ?? user?.email?.split('@')[0] ?? 'Profile'}</span>
            </button>
            <button className="home-nav__btn" onClick={handleLeaderboardClick}>
              <span>Leaderboard</span>
            </button>
          </nav>

          {/* 3. ACTION TILES THIRD (Large Squares) */}
          <section className="home-actions">
            {actions.map((action) => (
              <button
                key={action.label}
                className="home-action-btn"
                onClick={action.onClick}
              >
                <span className="home-action-btn__label">{action.label}</span>
                <span className="home-action-btn__desc">{action.description}</span>
              </button>
            ))}
          </section>
        </div>
      </main>
    </AppLayout>
  )
}

export default HomePage