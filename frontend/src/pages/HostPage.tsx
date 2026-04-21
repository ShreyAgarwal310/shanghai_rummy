import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { socket, emitCreateGame, onGameCreated, onError } from '../services/socketService'
import { navigateTo } from '../utils/navigate'
import './HostPage.css'

const AMBIENT_SUITS = ['♠', '♥', '♦', '♣', '♠', '♥', '♦', '♣'] as const

function HostPage() {
  const [playerName, setPlayerName] = useState('')
  const [gameName, setGameName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Keep a ref so the stable effect callback always reads the latest gameName
  const gameNameRef = useRef(gameName)
  useEffect(() => { gameNameRef.current = gameName }, [gameName])

  const handleBackToLobby = () => {
    navigateTo('/')
  }

  useEffect(() => {
    socket.connect()

    const onConnectError = () => {
      setErrorMessage("cannot connect to server. is the backend running?")
      setIsSubmitting(false)
    }
    socket.on('connect_error', onConnectError)

    const offCreated = onGameCreated(({ game_code, player_name }) => {
      sessionStorage.setItem('sr_game_code', game_code)
      sessionStorage.setItem('sr_player_name', player_name)
      sessionStorage.setItem('sr_game_name', gameNameRef.current.trim())
      sessionStorage.setItem('sr_is_host', 'true')
      navigateTo(`/host/game/${game_code}`)
    })

    const offError = onError(({ message }) => {
      setErrorMessage(message)
      setIsSubmitting(false)
    })

    return () => { 
    socket.off('connect_error', onConnectError)  
    offCreated(); offError() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!playerName.trim()) return
    setErrorMessage('')
    setIsSubmitting(true)
    emitCreateGame(playerName.trim())
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
          <h1 className="host-dialog__title">Create New Game</h1>

          <label className="host-dialog__label" htmlFor="host-player-name">
            Your Name
          </label>
          <input
            id="host-player-name"
            className="host-dialog__input"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            required
          />

          <label className="host-dialog__label" htmlFor="host-game-name">
            Game Name
          </label>
          <input
            id="host-game-name"
            className="host-dialog__input"
            type="text"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            placeholder="Enter game name"
            maxLength={28}
            required
          />

          <p className="host-dialog__note">
            A game code will be generated automatically when you create the table.
          </p>

          {errorMessage ? <p className="host-dialog__error">{errorMessage}</p> : null}

          <button
            type="submit"
            className="host-dialog__submit"
            disabled={!playerName.trim() || !gameName.trim() || isSubmitting}
            data-a11y-description="Create a new game lobby with the selected setup."
          >
            {isSubmitting ? 'Creating...' : 'Create Game'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default HostPage
