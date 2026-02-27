import Button from '../components/common/Button'
import AppLayout from '../layout/AppLayout'
import './HomePage.css'

type HomeAction = {
  label: 'Join' | 'Host' | 'Rules' | 'Stats'
  symbol: string
  onClick: () => void
}

function HomePage() {
  const handleJoinClick = () => {
    window.location.assign('/join')
  }

  const handleHostClick = () => {
    window.location.assign('/host')
  }

  const handleRulesClick = () => {
    window.location.assign('/rules')
  }

  const handleStatsClick = () => {
    window.location.assign('/stats')
  }

  const handleProfileClick = () => {
    window.location.assign('/profile')
  }

  const handleLeaderboardClick = () => {
    window.location.assign('/leaderboard')
  }

  const actions: HomeAction[] = [
    { label: 'Join', symbol: '⍟', onClick: handleJoinClick },
    { label: 'Host', symbol: '♛', onClick: handleHostClick },
    { label: 'Rules', symbol: '☷', onClick: handleRulesClick },
    { label: 'Stats', symbol: '⌁', onClick: handleStatsClick },
  ]

  return (
    <AppLayout onProfileClick={handleProfileClick} onLeaderboardClick={handleLeaderboardClick}>
      <main className="home-page" aria-label="Shanghai Rummy landing page">
        <section className="home-title-block" aria-labelledby="home-title">
          <h1 id="home-title" className="home-title">
            Shanghai Rummy
          </h1>
          <p className="home-subtitle">The Grand Shanghai Club</p>
        </section>

        <section className="home-actions" aria-label="Primary home actions">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="gold"
              className="home-action-btn"
              onClick={action.onClick}
              aria-label={action.label}
            >
              <span className="home-action-btn__icon" aria-hidden="true">
                {action.symbol}
              </span>
              <span className="home-action-btn__label">{action.label}</span>
            </Button>
          ))}
        </section>
      </main>
    </AppLayout>
  )
}

export default HomePage
