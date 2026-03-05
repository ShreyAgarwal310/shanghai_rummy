import { useMemo, useState } from 'react'
import { getHostedGameById, isDemoModeEnabled } from '../services/gameService'
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

function HostRoomPage({ gameId }: HostRoomPageProps) {
  const game = useMemo(() => getHostedGameById(gameId), [gameId])
  const [players, setPlayers] = useState<HostedGamePlayer[]>(() => game?.players ?? [])
  const [copied, setCopied] = useState(false)
  const isDemoMode = isDemoModeEnabled()

  const handleBackClick = () => {
    window.location.assign('/host')
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
    window.location.assign('/')
  }

  const handleStartGame = () => {
    if (!game || !canStart) {
      return
    }
    window.location.assign(`/game/${game.id}`)
  }

  const handleAddDemoPlayer = () => {
    if (!game || players.length >= game.maxPlayers) {
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
    if (players.length <= 1) {
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
        <button
          type="button"
          className="host-room-page__back"
          onClick={handleBackClick}
          data-a11y-description="Return to host setup for this table."
        >
          ← Back to Host Setup
        </button>
        <section className="host-room-card host-room-card--empty">
          <h1 className="host-room-card__title">Room Not Found</h1>
          <p className="host-room-card__text">Create a new demo game to preview this flow.</p>
        </section>
      </main>
    )
  }

  const openSeats = Math.max(game.maxPlayers - players.length, 0)
  const canStart = players.length >= 3
  const seatPositions = seatLayouts[game.maxPlayers] ?? seatLayouts[6]
  const tableSeats = seatPositions.map((position, index) => ({
    position,
    player: players[index],
  }))

  return (
    <main className="host-room-page" aria-label="Host waiting room">
      <button
        type="button"
        className="host-room-page__back"
        onClick={handleBackClick}
        data-a11y-description="Return to host setup for this table."
      >
        ← Back to Host Setup
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
              {copied ? 'Copied' : 'Copy Code'}
            </button>
          </div>

          <section className="host-room-card__players" aria-label="Current players">
            <h2 className="host-room-card__subtitle">
              Seats ({players.length}/{game.maxPlayers})
            </h2>
            <div className="host-room-table">
              <div className="host-room-table__felt" aria-hidden="true">
                <p className="host-room-table__felt-title">Waiting Room</p>
                <p className="host-room-table__felt-subtitle">{openSeats} open seats</p>
              </div>
              <ul className="host-room-table__seats">
                {tableSeats.map((seat, index) => {
                  const seatKey = seat.player ? seat.player.name : `open-seat-${index}`

                  return (
                    <li key={seatKey} className={`host-room-seat host-room-seat--${seat.position}`}>
                      <div
                        className={`host-room-seat__avatar ${seat.player ? 'host-room-seat__avatar--occupied' : 'host-room-seat__avatar--empty'}`}
                        aria-hidden="true"
                      />
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
            <h2 className="host-room-card__subtitle">Lobby Controls</h2>
            {isDemoMode ? (
              <p className="host-room-card__tag" data-a11y-label="Environment">
                Demo Mode
              </p>
            ) : null}
          </header>

          <p className="host-room-card__detail">Minimum players to start: 3</p>
          <p className="host-room-card__detail">Open seats: {openSeats}</p>

          {isDemoMode ? (
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
            Share the game code with friends. The start button unlocks once three players are seated.
          </p>

          <div className="host-room-card__actions">
            <button
              type="button"
              className="host-room-card__btn"
              disabled={!canStart}
              onClick={handleStartGame}
              data-a11y-description="Start game becomes available at three or more players."
            >
              Start Game
            </button>
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
