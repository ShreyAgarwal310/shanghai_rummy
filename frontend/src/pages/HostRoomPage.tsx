import { useEffect, useState } from 'react'
import {
  socket,
  emitStartGame,
  emitRejoinLobby,
  onPlayerJoined,
  onPlayerDisconnected,
  onGameStarted,
  onError,
} from '../services/socketService'
import { navigateTo } from '../utils/navigate'
import './HostRoomPage.css'

type HostRoomPageProps = {
  gameId: string
}

type SeatPosition = 'north' | 'north-east' | 'east' | 'south-east' | 'south' | 'south-west' | 'west' | 'north-west'

const seatLayouts: Record<number, SeatPosition[]> = {
  1: ['south'],
  2: ['north', 'south'],
  3: ['north', 'south-east', 'south-west'],
  4: ['north', 'east', 'south', 'west'],
  5: ['north', 'north-east', 'south-east', 'south-west', 'north-west'],
  6: ['north', 'north-east', 'south-east', 'south', 'south-west', 'north-west'],
}

const SUITS = ['♠', '♥', '♦', '♣'] as const
const AMBIENT_SUITS = ['♠', '♥', '♦', '♣', '♠', '♥', '♦', '♣'] as const
const MAX_PLAYERS = 6

function HostRoomPage({ gameId }: HostRoomPageProps) {
  const gameCode = gameId.trim().toUpperCase()
  const myName = sessionStorage.getItem('sr_player_name') ?? ''
  const gameName = sessionStorage.getItem('sr_game_name') ?? gameCode
  const isHost = sessionStorage.getItem('sr_is_host') === 'true'

  const [players, setPlayers] = useState<string[]>(myName ? [myName] : [])
  const [copied, setCopied] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    socket.connect()
    // Re-enter the server room after page reload (window.location.assign resets the socket)
    if (myName) emitRejoinLobby(gameCode, myName)

    const offJoined = onPlayerJoined(({ players: updatedList }) => {
      setPlayers(updatedList)
    })

    const offDisconnected = onPlayerDisconnected(({ player_name }) => {
      setPlayers((prev) => prev.filter((p) => p !== player_name))
    })

    const offStarted = onGameStarted(() => {
      navigateTo(`/game/${gameCode}`)
    })

    const offError = onError(({ message }) => {
      setErrorMessage(message)
    })

    return () => { offJoined(); offDisconnected(); offStarted(); offError() }
  }, [gameCode])

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(gameCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const handleLeaveLobby = () => {
    socket.disconnect()
    navigateTo('/')
  }

  const handleStartGame = () => {
    if (canStart) emitStartGame(gameCode)
  }

  const canStart = players.length >= 2
  const seatLayout = seatLayouts[Math.max(players.length, 2)] ?? seatLayouts[6]
  const tableSeats = seatLayout.map((position, i) => ({
    position,
    player: players[i] ? { name: players[i], isHost: i === 0 } : undefined,
  }))

  return (
    <main className="host-room-page" aria-label="Host waiting room" data-player-count={players.length}>

      {errorMessage ? (
        <p style={{
          position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)',
          background: '#c0392b', color: '#fff', padding: '0.5rem 1.25rem',
          borderRadius: '4px', zIndex: 100, fontSize: '0.875rem',
        }}>
          {errorMessage}
        </p>
      ) : null}

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
        onClick={() => navigateTo(isHost ? '/host' : '/join')}
        data-a11y-description="Return to previous page."
      >
        ← Back
      </button>

      <section className="host-room-shell">
        <section className="host-room-card host-room-card--main">
          <header className="host-room-card__header">
            <h1 className="host-room-card__title">{gameName}</h1>
            <p className="host-room-card__status" data-a11y-label="Table Status">
              {players.length >= MAX_PLAYERS ? 'Table Full' : 'Waiting for Players'}
            </p>
          </header>

          <div className="host-room-card__code-row">
            <div>
              <p className="host-room-card__code-label">Game Code</p>
              <p className="host-room-card__code-value">{gameCode}</p>
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
              Seats ({players.length}/{MAX_PLAYERS})
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
                <p className="host-room-table__felt-title">{gameName}</p>
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
            <h2 className="host-room-card__subtitle">{isHost ? 'Lobby Controls' : 'Lobby Status'}</h2>
          </header>

          <div className="host-room-card__player-pips" aria-label="Seat status">
            {Array.from({ length: MAX_PLAYERS }, (_, i) => (
              <span
                key={i}
                className={`host-room-card__pip${i < players.length ? ' host-room-card__pip--filled' : ''}`}
                aria-hidden="true"
              />
            ))}
          </div>
          <p className="host-room-card__detail">
            {players.length}/{MAX_PLAYERS} seated
            {Math.max(2 - players.length, 0) > 0
              ? ` · need ${Math.max(2 - players.length, 0)} more`
              : ' · ready to start'}
          </p>
          <hr className="host-room-card__rule" aria-hidden="true" />

          <p className="host-room-card__note">
            {isHost
              ? 'Share the game code with friends. Start unlocks at 2+ players.'
              : 'Waiting for the host to start the game.'}
          </p>

          <div className="host-room-card__actions">
            {isHost ? (
              <button
                type="button"
                className="host-room-card__btn"
                disabled={!canStart}
                onClick={handleStartGame}
                data-a11y-description="Start game — available at 2 or more players."
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
