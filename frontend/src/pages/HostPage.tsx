import { useState } from 'react'
import type { FormEvent } from 'react'
import { createGame, isDemoModeEnabled } from '../services/gameService'
import './HostPage.css'

function HostPage() {
  const [gameName, setGameName] = useState('')
  const [maxPlayers, setMaxPlayers] = useState(4)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const isDemoMode = isDemoModeEnabled()

  const handleBackToLobby = () => {
    window.location.assign('/')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const game = await createGame({ gameName, maxPlayers, hostName: 'You' })
      window.location.assign(`/host/game/${game.id}`)
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
      <button
        type="button"
        className="host-page__back"
        onClick={handleBackToLobby}
        data-a11y-description="Return to the home lobby without creating a game."
      >
        ← Back to Lobby
      </button>

      <section className="host-page__overlay" aria-hidden="true" />

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

          <p className="host-dialog__note">A game code will be generated automatically when you create the table.</p>
          <p className="host-dialog__note">
            {isDemoMode ? 'Demo mode is enabled. This flow uses mock data only.' : 'Demo mode is disabled.'}
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
