import Button from '../components/common/Button'
import './Header.css'

type HeaderProps = {
  onProfileClick?: () => void
  onLeaderboardClick?: () => void
}

function Header({ onProfileClick, onLeaderboardClick }: HeaderProps) {
  return (
    <header className="app-header" role="banner">
      <Button
        variant="icon"
        className="app-header__icon-btn"
        aria-label="Open Profile"
        onClick={onProfileClick}
      >
        <svg viewBox="0 0 24 24" className="app-header__icon" aria-hidden="true">
          <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.3 0-6 2.13-6 4.75a1 1 0 0 0 2 0C8 17.29 9.79 16 12 16s4 1.29 4 2.75a1 1 0 0 0 2 0C18 16.13 15.3 14 12 14Z" />
        </svg>
      </Button>

      <Button
        variant="icon"
        className="app-header__icon-btn"
        aria-label="Open Leaderboard"
        onClick={onLeaderboardClick}
      >
        <svg viewBox="0 0 24 24" className="app-header__icon" aria-hidden="true">
          <path d="M4 19V5a1 1 0 0 1 2 0v14h12a1 1 0 0 1 0 2H5a1 1 0 0 1-1-1Zm5-2V9a1 1 0 1 1 2 0v8a1 1 0 1 1-2 0Zm4 0V5a1 1 0 1 1 2 0v12a1 1 0 1 1-2 0Zm4 0v-6a1 1 0 0 1 2 0v6a1 1 0 1 1-2 0Z" />
        </svg>
      </Button>
    </header>
  )
}

export default Header
