import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { socket, emitJoinGame, onPlayerJoined, onError } from '../services/socketService'
import { navigateTo } from '../utils/navigate'
import './JoinPage.css'

const AMBIENT_SUITS = ['♠', '♥', '♦', '♣', '♠', '♥', '♦', '♣'] as const

function JoinPage() {
  const [gameCode, setGameCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleBackClick = () => {
    navigateTo('/')
  }

  useEffect(() => {
    socket.connect()

    const offJoined = onPlayerJoined(() => {
      const code = gameCode.trim().toUpperCase()
      sessionStorage.setItem('sr_game_code', code)
      sessionStorage.setItem('sr_player_name', playerName.trim())
      sessionStorage.setItem('sr_is_host', 'false')
      navigateTo(`/host/game/${code}`)
    })

    const offError = onError(({ message }) => {
      setErrorMessage(message)
      setIsSubmitting(false)
    })

    return () => { offJoined(); offError() }
  }, [gameCode, playerName])

  const handleCodeSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const code = gameCode.trim().toUpperCase()
    if (!code || !playerName.trim()) return
    setErrorMessage('')
    setIsSubmitting(true)
    emitJoinGame(code, playerName.trim())
  }

  return (
    <main className="join-page" aria-label="Join game lobby">

      {/* Floating ambient suit symbols */}
      <div className="join-ambient" aria-hidden="true">
        {AMBIENT_SUITS.map((suit, i) => (
          <span key={i} className={`join-ambient__suit join-ambient__suit--${i + 1}`}>{suit}</span>
        ))}
      </div>

      {/* Fixed gold border frame */}
      <div className="join-frame" aria-hidden="true">
        <span className="join-frame__corner join-frame__corner--tl" />
        <span className="join-frame__corner join-frame__corner--tr" />
        <span className="join-frame__corner join-frame__corner--bl" />
        <span className="join-frame__corner join-frame__corner--br" />
        <span className="join-frame__mid join-frame__mid--top">◆</span>
        <span className="join-frame__mid join-frame__mid--right">◆</span>
        <span className="join-frame__mid join-frame__mid--bottom">◆</span>
        <span className="join-frame__mid join-frame__mid--left">◆</span>
      </div>

      <button
        type="button"
        className="join-page__back-btn"
        onClick={handleBackClick}
        data-a11y-description="Return to the home lobby screen."
      >
        ← Back to Lobby
      </button>

      <section className="join-page__content" aria-labelledby="available-games-title">
        <header className="join-page__title-card">
          <div className="join-page__pretitle" aria-hidden="true">
            <span className="join-page__ornament-line" />
            <span className="join-page__ornament-gem">◆</span>
            <span className="join-page__ornament-line" />
          </div>
          <p className="join-page__subtitle">Find Your Table</p>
          <h1 id="available-games-title" className="join-page__title">Join a Game</h1>
          <div className="join-page__title-ornament" aria-hidden="true">
            <span className="join-page__ornament-line" />
            <span className="join-page__ornament-gem">◈</span>
            <span className="join-page__ornament-gem join-page__ornament-gem--main">◆</span>
            <span className="join-page__ornament-gem">◈</span>
            <span className="join-page__ornament-line" />
          </div>
        </header>

        <form className="join-page__code-card" onSubmit={handleCodeSubmit}>
          <label className="join-page__code-label" htmlFor="join-player-name">
            Your Name
          </label>
          <input
            id="join-player-name"
            className="join-page__code-input"
            type="text"
            autoComplete="off"
            maxLength={20}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            style={{ marginBottom: '0.75rem', display: 'block', width: '100%' }}
          />
          <label className="join-page__code-label" htmlFor="game-code-input">
            Game Code
          </label>
          <div className="join-page__code-row">
            <input
              id="game-code-input"
              className="join-page__code-input"
              type="text"
              autoComplete="off"
              maxLength={10}
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              placeholder="ABCD12"
            />
            <button
              type="submit"
              className="join-page__join-btn"
              disabled={!gameCode.trim() || !playerName.trim() || isSubmitting}
              data-a11y-description="Submit this game code to join a table."
            >
              {isSubmitting ? '...' : '▷ Join'}
            </button>
          </div>
          {errorMessage ? (
            <p style={{ color: 'var(--color-error, red)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
              {errorMessage}
            </p>
          ) : null}
        </form>
      </section>
    </main>
  )
}

export default JoinPage
