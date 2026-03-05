import { useEffect } from 'react'
import HomePage from './pages/HomePage'
import HostPage from './pages/HostPage'
import HostRoomPage from './pages/HostRoomPage'
import JoinPage from './pages/JoinPage'
import LeaderboardPage from './pages/LeaderboardPage'
import GameTablePage from './pages/GameTablePage'
import ProfilePage from './pages/ProfilePage'
import RulesPage from './pages/RulesPage'
import StatsPage from './pages/StatsPage'
import { applyAccessibilityPreferences, getAccessibilityPreferences } from './services/accessibilityService'

function App() {
  useEffect(() => {
    applyAccessibilityPreferences(getAccessibilityPreferences())
  }, [])

  if (window.location.pathname.startsWith('/host/game/')) {
    const gameId = window.location.pathname.replace('/host/game/', '')
    return <HostRoomPage gameId={gameId} />
  }

  if (window.location.pathname === '/host') {
    return <HostPage />
  }

  if (window.location.pathname === '/join') {
    return <JoinPage />
  }

  if (window.location.pathname.startsWith('/game/')) {
    const gameId = window.location.pathname.replace('/game/', '') || 'demo-table'
    return <GameTablePage gameId={gameId} />
  }

  if (window.location.pathname === '/rules') {
    return <RulesPage />
  }

  if (window.location.pathname === '/stats') {
    return <StatsPage />
  }

  if (window.location.pathname === '/profile') {
    return <ProfilePage />
  }

  if (window.location.pathname === '/leaderboard') {
    return <LeaderboardPage />
  }

  return <HomePage />
}

export default App
