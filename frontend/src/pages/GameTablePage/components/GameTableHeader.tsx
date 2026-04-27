import { useRef, useState } from 'react'
import type { DemoRound } from '../../GameTablePage.mock'

type GameTableHeaderProps = {
  isLiveMode: boolean
  currentDemoRound: DemoRound
  demoRounds: DemoRound[]
  demoRoundIndex: number
  displayRoundNumber: number
  displayTotalRounds: number
  displayContractText: string
  turnLabel: string
  isFinalDemoRound: boolean
  isDemoGameComplete: boolean
  isDenseMeldPreview: boolean
  onBackToLobby: () => void
  onOpenRulebook: () => void
  onJumpToDemoRound: (index: number) => void
  onNextDemoRound: () => void
  onEndDemoGame: () => void
  onToggleDenseMeldPreview: () => void
  onResetDemo: () => void
}

function GameTableHeader({
  isLiveMode,
  currentDemoRound,
  demoRounds,
  demoRoundIndex,
  displayRoundNumber,
  displayTotalRounds,
  displayContractText,
  turnLabel,
  isFinalDemoRound,
  isDemoGameComplete,
  isDenseMeldPreview,
  onBackToLobby,
  onOpenRulebook,
  onJumpToDemoRound,
  onNextDemoRound,
  onEndDemoGame,
  onToggleDenseMeldPreview,
  onResetDemo,
}: GameTableHeaderProps) {
  const [isRoundMenuOpen, setIsRoundMenuOpen] = useState(false)
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false)
  const roundMenuRef = useRef<HTMLDivElement>(null)
  const actionsMenuRef = useRef<HTMLDivElement>(null)

  const closeRoundMenu = () => setIsRoundMenuOpen(false)
  const closeActionsMenu = () => setIsActionsMenuOpen(false)

  const handleMenuBlur =
    (containerRef: React.RefObject<HTMLDivElement | null>, close: () => void) =>
    (event: React.FocusEvent) => {
      if (!containerRef.current?.contains(event.relatedTarget as Node)) close()
    }

  return (
    <header className="game-table-header">
      <div className="game-table-header__left">
        <button
          type="button"
          className="game-table-header__btn game-table-header__btn--back"
          onClick={onBackToLobby}
        >
          ← Leave
        </button>

        {!isLiveMode && (
          <div
            className={`game-dropdown${isRoundMenuOpen ? ' is-open' : ''}`}
            ref={roundMenuRef}
            onBlur={handleMenuBlur(roundMenuRef, closeRoundMenu)}
          >
            <button
              type="button"
              className="game-dropdown__trigger"
              onClick={() => setIsRoundMenuOpen((open) => !open)}
              aria-haspopup="true"
              aria-expanded={isRoundMenuOpen}
            >
              Round {currentDemoRound.roundNumber}/{demoRounds.length}
              <span className="game-dropdown__caret">▼</span>
            </button>
            <div className="game-dropdown__menu" role="menu">
              <div className="game-dropdown__section-label">All Rounds</div>
              {demoRounds.map((round, i) => (
                <button
                  key={round.roundNumber}
                  type="button"
                  className={`game-dropdown__item${i === demoRoundIndex ? ' is-active' : ''}`}
                  role="menuitem"
                  onClick={() => {
                    onJumpToDemoRound(i)
                    closeRoundMenu()
                  }}
                >
                  <span className="game-dropdown__item-label">Round {round.roundNumber}</span>
                  <span className="game-dropdown__item-badge">{round.contractText}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {isLiveMode && (
          <span className="game-table-header__chip game-table-header__chip--contract" style={{ marginLeft: '0.5rem' }}>
            Round {displayRoundNumber}/{displayTotalRounds}
          </span>
        )}
      </div>

      <div className="game-table-header__center">
        <p className="game-table-header__chip game-table-header__chip--contract">{displayContractText}</p>
        <p className="game-table-header__chip game-table-header__chip--turn">{turnLabel}</p>
      </div>

      <div className="game-table-header__right">
        {!isLiveMode && (
          <div
            className={`game-dropdown${isActionsMenuOpen ? ' is-open' : ''}`}
            ref={actionsMenuRef}
            onBlur={handleMenuBlur(actionsMenuRef, closeActionsMenu)}
          >
            <button
              type="button"
              className="game-dropdown__trigger"
              onClick={() => setIsActionsMenuOpen((open) => !open)}
              aria-haspopup="true"
              aria-expanded={isActionsMenuOpen}
            >
              Actions
              <span className="game-dropdown__caret">▼</span>
            </button>
            <div className="game-dropdown__menu" role="menu" style={{ left: 'auto', right: 0 }}>
              <div className="game-dropdown__section-label">Demo Controls</div>
              <button
                type="button"
                className="game-dropdown__item game-dropdown__item--primary"
                role="menuitem"
                onClick={() => {
                  onNextDemoRound()
                  closeActionsMenu()
                }}
                disabled={isFinalDemoRound || isDemoGameComplete}
              >
                <span className="game-dropdown__item-label">Next Round</span>
                <span className="game-dropdown__item-badge">
                  {isFinalDemoRound ? 'Final' : `→ Round ${demoRoundIndex + 2}`}
                </span>
              </button>
              <button
                type="button"
                className="game-dropdown__item game-dropdown__item--danger"
                role="menuitem"
                onClick={() => {
                  onEndDemoGame()
                  closeActionsMenu()
                }}
                disabled={!isFinalDemoRound || isDemoGameComplete}
              >
                <span className="game-dropdown__item-label">End Game</span>
              </button>
              <div className="game-dropdown__separator" />
              <div className="game-dropdown__section-label">Table View</div>
              <button
                type="button"
                className={`game-dropdown__item${isDenseMeldPreview ? ' is-active' : ''}`}
                role="menuitem"
                onClick={() => {
                  onToggleDenseMeldPreview()
                  closeActionsMenu()
                }}
              >
                <span className="game-dropdown__item-label">
                  {isDenseMeldPreview ? 'Normal Melds' : 'Dense Melds Preview'}
                </span>
              </button>
              <div className="game-dropdown__separator" />
              <button
                type="button"
                className="game-dropdown__item"
                role="menuitem"
                onClick={() => {
                  onResetDemo()
                  closeActionsMenu()
                }}
              >
                <span className="game-dropdown__item-label">Reset Demo</span>
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          className="game-table-header__btn game-table-header__btn--rules"
          onClick={onOpenRulebook}
        >
          Rulebook
        </button>
      </div>
    </header>
  )
}

export default GameTableHeader
