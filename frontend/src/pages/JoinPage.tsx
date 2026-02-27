import { useState } from 'react'
import type { FormEvent } from 'react'
import './JoinPage.css'

function JoinPage() {
  const [gameCode, setGameCode] = useState('')
  const [demoJoinNotice, setDemoJoinNotice] = useState('')

  const handleBackClick = () => {
    window.location.assign('/')
  }

  const handleCodeSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // Placeholder: actual join validation/flow will be connected to backend later.
  }

  const handleDemoJoinClick = () => {
    setDemoJoinNotice('Demo table selected. Game board screen is the next step and will be connected next.')
  }

  return (
    <main className="join-page" aria-label="Join game lobby">
      <button
        type="button"
        className="join-page__back-btn"
        onClick={handleBackClick}
        data-a11y-description="Return to the home lobby screen."
      >
        ← Back to Lobby
      </button>

      <section className="join-page__content" aria-labelledby="available-games-title">
        <h1 id="available-games-title" className="join-page__title">
          Available Games
        </h1>

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

        {demoJoinNotice ? (
          <p className="join-page__demo-notice" aria-live="polite">
            {demoJoinNotice}
          </p>
        ) : null}
      </section>
    </main>
  )
}

export default JoinPage
