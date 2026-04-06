import { useState } from 'react'
import type { FormEvent } from 'react'
import { createGame, isDemoModeEnabled } from '../services/gameService'
import { navigateTo } from '../utils/navigate'
import './HostPage.css'

const AMBIENT_SUITS = ['♠', '♥', '♦', '♣', '♠', '♥', '♦', '♣'] as const

function HostPage() {
  const [gameName, setGameName] = useState('')
  const [maxPlayers, setMaxPlayers] = useState(4)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const isDemoMode = isDemoModeEnabled()

  const handleBackToLobby = () => {
    navigateTo('/')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const game = await createGame({ gameName, maxPlayers, hostName: 'You' })
      navigateTo(`/host/game/${game.id}`)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to create a game right now. Try again or enable demo mode.'
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="host-page" aria-label="Host game setup">

      {/* Floating ambient suit symbols */}
      <div className="host-ambient" aria-hidden="true">
        {AMBIENT_SUITS.map((suit, i) => (
          <span key={i} className={`host-ambient__suit host-ambient__suit--${i + 1}`}>{suit}</span>
        ))}
      </div>

      {/* Fixed gold border frame */}
      <div className="host-page-frame" aria-hidden="true">
        <span className="host-page-frame__corner host-page-frame__corner--tl" />
        <span className="host-page-frame__corner host-page-frame__corner--tr" />
        <span className="host-page-frame__corner host-page-frame__corner--bl" />
        <span className="host-page-frame__corner host-page-frame__corner--br" />
        <span className="host-page-frame__mid host-page-frame__mid--top">◆</span>
        <span className="host-page-frame__mid host-page-frame__mid--right">◆</span>
        <span className="host-page-frame__mid host-page-frame__mid--bottom">◆</span>
        <span className="host-page-frame__mid host-page-frame__mid--left">◆</span>
      </div>

      <button
        type="button"
        className="host-page__back"
        onClick={handleBackToLobby}
        data-a11y-description="Return to the home lobby without creating a game."
      >
        ← Back to Lobby
      </button>

      <section className="host-page__dialog-wrap">
        <form className="host-dialog" onSubmit={handleSubmit}>
          <button
            type="button"
            className="host-dialog__close"
            aria-label="Close"
            onClick={handleBackToLobby}
            data-a11y-description="Close create game dialog and return to lobby."
          >
            ×
          </button>

          <h1 className="host-dialog__title">Create New Game</h1>

          <label className="host-dialog__label" htmlFor="host-game-name">
            Game Name
          </label>
          <input
            id="host-game-name"
            className="host-dialog__input"
            type="text"
            value={gameName}
            onChange={(event) => setGameName(event.target.value)}
            placeholder="Enter game name"
            maxLength={28}
            required
          />

          <label className="host-dialog__label" htmlFor="host-max-players">
            Maximum Players (3-6)
          </label>
          <input
            id="host-max-players"
            className="host-dialog__input"
            type="number"
            min={3}
            max={6}
            value={maxPlayers}
            onChange={(event) => setMaxPlayers(Number(event.target.value) || 3)}
            required
          />

          <p className="host-dialog__note">
            A game code will be generated automatically when you create the table.
            {isDemoMode ? ' Demo mode is currently enabled.' : ''}
          </p>

          {errorMessage ? <p className="host-dialog__error">{errorMessage}</p> : null}

          <button
            type="submit"
            className="host-dialog__submit"
            disabled={!gameName.trim() || isSubmitting}
            data-a11y-description="Create a new game lobby with the selected setup."
          >
            Create Game
          </button>
        </form>
      </section>
    </main>
  )
}

export default HostPage
