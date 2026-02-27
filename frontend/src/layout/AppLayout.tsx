import type { ReactNode } from 'react'
import Header from './Header'
import './AppLayout.css'

type AppLayoutProps = {
  children: ReactNode
  onProfileClick?: () => void
  onLeaderboardClick?: () => void
}

function AppLayout({ children, onProfileClick, onLeaderboardClick }: AppLayoutProps) {
  return (
    <div className="app-layout">
      <Header onProfileClick={onProfileClick} onLeaderboardClick={onLeaderboardClick} />
      <div className="app-layout__content">{children}</div>
    </div>
  )
}

export default AppLayout
