import { useMemo, useState } from 'react'
import { getHostedGameById, isDemoModeEnabled } from '../services/gameService'
import { navigateTo } from '../utils/navigate'
import type { HostedGamePlayer } from '../types/game'
import './HostRoomPage.css'

type HostRoomPageProps = {
  gameId: string
}

type SeatPosition = 'north' | 'north-east' | 'east' | 'south-east' | 'south' | 'south-west' | 'west' | 'north-west'

const seatLayouts: Record<number, SeatPosition[]> = {
  3: ['north', 'south-east', 'south-west'],
  4: ['north', 'east', 'south', 'west'],
  5: ['north', 'north-east', 'south-east', 'south-west', 'north-west'],
  6: ['north', 'north-east', 'south-east', 'south', 'south-west', 'north-west'],
}

const SUITS = ['♠', '♥', '♦', '♣'] as const
const AMBIENT_SUITS = ['♠', '♥', '♦', '♣', '♠', '♥', '♦', '♣'] as const

function HostRoomPage({ gameId }: HostRoomPageProps) {
  const game = useMemo(() => getHostedGameById(gameId), [gameId])
  const [players, setPlayers] = useState<HostedGamePlayer[]>(() => game?.players ?? [])
  const [copied, setCopied] = useState(false)
  const isDemoMode = isDemoModeEnabled()
  const normalizedRouteGameId = gameId.trim().toUpperCase()
  const isJoinFlowLobby = game ? game.code.trim().toUpperCase() === normalizedRouteGameId : false

  const handleBackClick = () => {
    navigateTo(isJoinFlowLobby ? '/join' : '/host')
  }

  const handleBackToLandingClick = () => {
    navigateTo('/')
  }

  const handleCopyCode = async () => {
    if (!game) {
      return
    }

    try {
      await navigator.clipboard.writeText(game.code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const handleLeaveLobby = () => {
    navigateTo('/')
  }

  const handleStartGame = () => {
    if (!game || isJoinedDemoLobby || !canStart) {
      return
    }
    navigateTo(`/game/${game.id}`)
  }

  const handleAddDemoPlayer = () => {
    if (!game || isJoinedDemoLobby || players.length >= game.maxPlayers) {
      return
    }

    const demoNames = [
      'LuckyDragon',
      'AceKing',
      'DiamondQueen',
      'RoyalFlush',
      'CardShark88',
      'PokerFace',
      'FastDealer',
      'GoldenHand',
    ]
    const usedNames = new Set(players.map((player) => player.name))
    const nextName = demoNames.find((name) => !usedNames.has(name)) || `Guest${players.length + 1}`
    setPlayers((currentPlayers) => [...currentPlayers, { name: nextName }])
  }

  const handleRemoveDemoPlayer = () => {
    if (isJoinedDemoLobby || players.length <= 1) {
      return
    }

    let removableIndex = -1
    for (let index = players.length - 1; index >= 0; index -= 1) {
      if (!players[index].isHost) {
        removableIndex = index
        break
      }
    }

    if (removableIndex < 0) {
      return
    }

    setPlayers((currentPlayers) => currentPlayers.filter((_, index) => index !== removableIndex))
  }

  if (!game) {
    return (
      <main className="host-room-page" aria-label="Host waiting room">
        <div className="host-room-ambient" aria-hidden="true">
          {AMBIENT_SUITS.map((suit, i) => (
            <span key={i} className={`host-room-ambient__suit host-room-ambient__suit--${i + 1}`}>{suit}</span>
          ))}
        </div>
        <div className="host-room-frame" aria-hidden="true">
          <span className="host-room-frame__corner host-room-frame__corner--tl" />
          <span className="host-room-frame__corner host-room-frame__corner--tr" />
          <span className="host-room-frame__corner host-room-frame__corner--bl" />
          <span className="host-room-frame__corner host-room-frame__corner--br" />
          <span className="host-room-frame__mid host-room-frame__mid--top">◆</span>
          <span className="host-room-frame__mid host-room-frame__mid--right">◆</span>
          <span className="host-room-frame__mid host-room-frame__mid--bottom">◆</span>
          <span className="host-room-frame__mid host-room-frame__mid--left">◆</span>
        </div>
        <button
          type="button"
          className="host-room-page__back"
          onClick={handleBackToLandingClick}
          data-a11y-description="Return to the main landing page."
        >
          ← Back to Lobby
        </button>
        <section className="host-room-card host-room-card--empty">
          <h1 className="host-room-card__title">Room Not Found</h1>
          <p className="host-room-card__text">Create a new demo game to preview this flow.</p>
        </section>
      </main>
    )
  }

  const openSeats = Math.max(game.maxPlayers - players.length, 0)
  const isJoinedDemoLobby = game.id === 'demo-release-lobby'
  const canStart = players.length >= 3
  const showHostControls = !isJoinedDemoLobby
  const seatPositions = seatLayouts[game.maxPlayers] ?? seatLayouts[6]
  const tableSeats = seatPositions.map((position, index) => ({
    position,
    player: players[index],
  }))

  return (
    <main className="host-room-page" aria-label="Host waiting room" data-player-count={players.length}>

      {/* Floating ambient suit symbols */}
      <div className="host-room-ambient" aria-hidden="true">
        {AMBIENT_SUITS.map((suit, i) => (
          <span key={i} className={`host-room-ambient__suit host-room-ambient__suit--${i + 1}`}>{suit}</span>
        ))}
      </div>

      {/* Fixed gold border frame */}
      <div className="host-room-frame" aria-hidden="true">
        <span className="host-room-frame__corner host-room-frame__corner--tl" />
        <span className="host-room-frame__corner host-room-frame__corner--tr" />
        <span className="host-room-frame__corner host-room-frame__corner--bl" />
        <span className="host-room-frame__corner host-room-frame__corner--br" />
        <span className="host-room-frame__mid host-room-frame__mid--top">◆</span>
        <span className="host-room-frame__mid host-room-frame__mid--right">◆</span>
        <span className="host-room-frame__mid host-room-frame__mid--bottom">◆</span>
        <span className="host-room-frame__mid host-room-frame__mid--left">◆</span>
      </div>

      <button
        type="button"
        className="host-room-page__back"
        onClick={handleBackClick}
        data-a11y-description="Return to host setup for this table."
      >
        ← Back
      </button>

      <section className="host-room-shell">
        <section className="host-room-card host-room-card--main">
          <header className="host-room-card__header">
            <h1 className="host-room-card__title">{game.name}</h1>
            <p className="host-room-card__status" data-a11y-label="Table Status">
              {openSeats === 0 ? 'Table Full' : 'Waiting for Players'}
            </p>
          </header>

          <div className="host-room-card__code-row">
            <div>
              <p className="host-room-card__code-label">Game Code</p>
              <p className="host-room-card__code-value">{game.code}</p>
            </div>
            <button
              type="button"
              className="host-room-card__btn host-room-card__btn--secondary host-room-card__btn--inline"
              onClick={handleCopyCode}
              data-a11y-description="Copy this game code to your clipboard."
            >
              {copied ? '✓ Copied' : 'Copy Code'}
            </button>
          </div>

          <section className="host-room-card__players" aria-label="Current players">
            <h2 className="host-room-card__subtitle">
              Seats ({players.length}/{game.maxPlayers})
            </h2>
            <div className="host-room-table">
              <div className="host-room-table__felt" aria-hidden="true">
                <div className="host-room-table__felt-inner-ring" />
                <div className="host-room-table__spotlight" aria-hidden="true" />
                <span className="host-room-table__felt-watermark">♦</span>
                <span className="host-room-table__felt-suit host-room-table__felt-suit--nw">♠</span>
                <span className="host-room-table__felt-suit host-room-table__felt-suit--ne">♥</span>
                <span className="host-room-table__felt-suit host-room-table__felt-suit--sw">♦</span>
                <span className="host-room-table__felt-suit host-room-table__felt-suit--se">♣</span>
                <span className="host-room-table__felt-ornament">◆</span>
                <p className="host-room-table__felt-title">{game.name}</p>
                <p className="host-room-table__felt-label">Round 1 Contract</p>
                <p className="host-room-table__felt-contract">Two sets of 3</p>
                <span className="host-room-table__felt-ornament">◆</span>
                <div className="host-room-table__card-fan" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="host-room-table__card" />
                  ))}
                </div>
              </div>
              <ul className="host-room-table__seats">
                {tableSeats.map((seat, index) => {
                  const seatKey = seat.player ? seat.player.name : `open-seat-${index}`
                  const suit = SUITS[index % 4]
                  const isRed = suit === '♥' || suit === '♦'

                  return (
                    <li key={seatKey} className={`host-room-seat host-room-seat--${seat.position}`}>
                      <div
                        className={`host-room-seat__avatar ${seat.player ? 'host-room-seat__avatar--occupied' : 'host-room-seat__avatar--empty'}${isRed ? ' host-room-seat__avatar--red' : ''}`}
                        aria-hidden="true"
                      >
                        {seat.player ? (
                          <span className="host-room-seat__initial">{seat.player.name.charAt(0).toUpperCase()}</span>
                        ) : (
                          <span className="host-room-seat__suit-empty">{suit}</span>
                        )}
                      </div>
                      <p className="host-room-seat__name">{seat.player ? seat.player.name : 'Open Seat'}</p>
                      <p className="host-room-seat__meta">
                        {seat.player ? (seat.player.isHost ? 'Host' : 'Joined') : 'Waiting...'}
                      </p>
                    </li>
                  )
                })}
              </ul>
            </div>
          </section>
        </section>

        <aside className="host-room-card host-room-card--side">
          <header className="host-room-card__aside-header">
            <h2 className="host-room-card__subtitle">{showHostControls ? 'Lobby Controls' : 'Lobby Status'}</h2>
            {isDemoMode ? (
              <p className="host-room-card__tag" data-a11y-label="Environment">
                Demo Mode
              </p>
            ) : null}
          </header>

          <div className="host-room-card__player-pips" aria-label="Seat status">
            {Array.from({ length: game.maxPlayers }, (_, i) => (
              <span
                key={i}
                className={`host-room-card__pip${i < players.length ? ' host-room-card__pip--filled' : ''}`}
                aria-hidden="true"
              />
            ))}
          </div>
          <p className="host-room-card__detail">
            {players.length}/{game.maxPlayers} seated
            {Math.max(3 - players.length, 0) > 0
              ? ` · need ${Math.max(3 - players.length, 0)} more`
              : ' · ready to start'}
          </p>
          <hr className="host-room-card__rule" aria-hidden="true" />

          {isDemoMode && showHostControls ? (
            <div className="host-room-card__demo-tools">
              <button
                type="button"
                className="host-room-card__btn host-room-card__btn--secondary"
                onClick={handleAddDemoPlayer}
                disabled={openSeats === 0}
                data-a11y-description="Add a simulated player seat for demo testing."
              >
                Add Demo Player
              </button>
              <button
                type="button"
                className="host-room-card__btn host-room-card__btn--ghost"
                onClick={handleRemoveDemoPlayer}
                disabled={players.length <= 1}
                data-a11y-description="Remove the most recent non-host demo player."
              >
                Remove Player
              </button>
            </div>
          ) : null}

          <p className="host-room-card__note">
            {showHostControls
              ? 'Share the game code with friends. The start button unlocks once three players are seated.'
              : 'Waiting for host to start game.'}
          </p>

          <div className="host-room-card__actions">
            {showHostControls ? (
              <button
                type="button"
                className="host-room-card__btn"
                disabled={!canStart}
                onClick={handleStartGame}
                data-a11y-description="Start game becomes available at three or more players."
              >
                Start Game
              </button>
            ) : null}
            <button
              type="button"
              className="host-room-card__btn host-room-card__btn--ghost"
              onClick={handleLeaveLobby}
              data-a11y-description="Leave this lobby and return to the home screen."
            >
              Leave Lobby
            </button>
          </div>
        </aside>
      </section>
    </main>
  )
}

export default HostRoomPage
