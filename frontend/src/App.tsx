import { useEffect, useState } from 'react'
import HomePage from './pages/HomePage'
import HostPage from './pages/HostPage'
import HostRoomPage from './pages/HostRoomPage'
import JoinPage from './pages/JoinPage'
import LeaderboardPage from './pages/LeaderboardPage'
import GameTablePage from './pages/GameTablePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import RulesPage from './pages/RulesPage'
import StatsPage from './pages/StatsPage'
import { applyAccessibilityPreferences, getAccessibilityPreferences } from './services/accessibilityService'

function App() {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    applyAccessibilityPreferences(getAccessibilityPreferences())
    const onPopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  if (path.startsWith('/host/game/')) {
    const gameId = path.replace('/host/game/', '')
    return <HostRoomPage gameId={gameId} />
  }

  if (path === '/host') {
    return <HostPage />
  }

  if (path === '/join') {
    return <JoinPage />
  }

  if (path.startsWith('/game/')) {
    const gameId = path.replace('/game/', '') || 'demo-table'
    return <GameTablePage gameId={gameId} />
  }

  if (path === '/rules') {
    return <RulesPage />
  }

  if (path === '/stats') {
    return <StatsPage />
  }

  if (path === '/login') {
    return <LoginPage />
  }

  if (path === '/profile') {
    return <ProfilePage />
  }

  if (path === '/leaderboard') {
    return <LeaderboardPage />
  }

  return <HomePage />
}

export default App
