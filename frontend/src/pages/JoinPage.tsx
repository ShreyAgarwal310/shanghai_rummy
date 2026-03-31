import { useState } from 'react'
import type { FormEvent } from 'react'
import { navigateTo } from '../utils/navigate'
import './JoinPage.css'

const AMBIENT_SUITS = ['♠', '♥', '♦', '♣', '♠', '♥', '♦', '♣'] as const

function JoinPage() {
  const [gameCode, setGameCode] = useState('')

  const handleBackClick = () => {
    navigateTo('/')
  }

  const handleCodeSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedCode = gameCode.trim()
    if (!normalizedCode) {
      return
    }
    navigateTo(`/host/game/${normalizedCode}`)
  }

  const handleDemoJoinClick = () => {
    navigateTo('/host/game/GAMECODE')
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
          <h1 id="available-games-title" className="join-page__title">Available Games</h1>
          <div className="join-page__title-ornament" aria-hidden="true">
            <span className="join-page__ornament-line" />
            <span className="join-page__ornament-gem">◈</span>
            <span className="join-page__ornament-gem join-page__ornament-gem--main">◆</span>
            <span className="join-page__ornament-gem">◈</span>
            <span className="join-page__ornament-line" />
          </div>
        </header>

        <form className="join-page__code-card" onSubmit={handleCodeSubmit}>
          <label className="join-page__code-label" htmlFor="game-code-input">
            Enter Game Code
          </label>
          <div className="join-page__code-row">
            <input
              id="game-code-input"
              className="join-page__code-input"
              type="text"
              autoComplete="off"
              maxLength={10}
              value={gameCode}
              onChange={(event) => setGameCode(event.target.value.toUpperCase())}
              placeholder="ABCD1234"
            />
            <button
              type="submit"
              className="join-page__join-btn"
              disabled={!gameCode.trim()}
              data-a11y-description="Submit this game code to request joining a private table."
            >
              ▷ Join
            </button>
          </div>
        </form>

        <section className="join-page__games-grid" aria-label="Hosted games list">
          <article className="join-page__game-card">
            <header className="join-page__game-card-header">
              <h2 className="join-page__game-title">Demo Table</h2>
              <span className="join-page__game-status" data-a11y-label="Status: Open">
                Open
              </span>
            </header>

            <p className="join-page__game-meta">Players: 1 / 4</p>
            <p className="join-page__game-host">
              Host: <strong>DemoHost</strong>
            </p>
            <p className="join-page__game-text">Use this to test the join flow until live lobbies are connected.</p>

            <button
              type="button"
              className="join-page__join-btn join-page__join-btn--card"
              onClick={handleDemoJoinClick}
              data-a11y-description="Join the demo table to test the lobby flow."
            >
              ▷ Join
            </button>
          </article>

          <article className="join-page__empty-card" aria-live="polite">
            <p className="join-page__empty-title">No live hosted games yet.</p>
            <p className="join-page__empty-text">You can still join the demo table now or use a private game code above.</p>
          </article>
        </section>

      </section>
    </main>
  )
}

export default JoinPage
