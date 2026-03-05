import type { DemoRound } from '../../GameTablePage.mock'

type DemoRailProps = {
  currentDemoRound: DemoRound
  totalRounds: number
  isFinalDemoRound: boolean
  isDemoGameComplete: boolean
  isDenseMeldPreview: boolean
  setCount: number
  runCount: number
  onNextDemoRound: () => void
  onEndDemoGame: () => void
  onResetDemo: () => void
  onToggleDenseMeldPreview: () => void
}

function DemoRail({
  currentDemoRound,
  totalRounds,
  isFinalDemoRound,
  isDemoGameComplete,
  isDenseMeldPreview,
  setCount,
  runCount,
  onNextDemoRound,
  onEndDemoGame,
  onResetDemo,
  onToggleDenseMeldPreview,
}: DemoRailProps) {
  return (
    <aside className="game-demo-rail game-demo-rail--dock" aria-label="Demo mode controls">
      <header className="game-demo-rail__header">
        <h3>Demo Round Controls</h3>
        <p>
          Round {currentDemoRound.roundNumber}/{totalRounds}
        </p>
      </header>
      <p className="game-demo-rail__text">Temporary QA controls for previewing each round contract and final game state.</p>
      <button
        type="button"
        className="game-demo-rail__btn game-demo-rail__btn--primary"
        onClick={onNextDemoRound}
        disabled={isFinalDemoRound || isDemoGameComplete}
      >
        Next Round
      </button>
      {isFinalDemoRound ? (
        <button
          type="button"
          className="game-demo-rail__btn game-demo-rail__btn--danger"
          onClick={onEndDemoGame}
          disabled={isDemoGameComplete}
        >
          End Game
        </button>
      ) : null}
      <button type="button" className="game-demo-rail__btn game-demo-rail__btn--ghost" onClick={onResetDemo}>
        Reset Demo
      </button>
      <button type="button" className="game-demo-rail__btn" onClick={onToggleDenseMeldPreview}>
        {isDenseMeldPreview ? 'Return to Normal Melds' : 'Preview 6 Sets + 6 Runs'}
      </button>

      {isFinalDemoRound && !isDemoGameComplete ? (
        <p className="game-demo-rail__hint">Final round reached. Click End Game to preview post-game summary.</p>
      ) : null}

      {isDenseMeldPreview ? (
        <p className="game-demo-rail__hint">
          Dense preview active: {setCount} sets and {runCount} runs loaded.
        </p>
      ) : null}

      {isDemoGameComplete ? (
        <section className="game-demo-result">
          <h4>Game Complete</h4>
          <p>Victory overlay opened. Reset demo to run another end-game preview.</p>
        </section>
      ) : null}
    </aside>
  )
}

export default DemoRail
