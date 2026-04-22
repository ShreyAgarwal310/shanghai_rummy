import type { HandCard, TableCard } from '../../GameTablePage.mock'
import { getCardDescription } from '../../GameTablePage.logic'
import PlayingCard from './PlayingCard'

type PendingMeld = { type: 'set' | 'run'; cards: TableCard[] }

type ContractRequirements = {
  requiredSets: number
  requiredRuns: number
}

type LocalPlayerZoneProps = {
  handCards: HandCard[]
  selectedCardIds: string[]
  showBuyAction: boolean
  pendingMelds: PendingMeld[]
  contract: ContractRequirements
  isMyTurn: boolean
  hasLaidDown: boolean
  isLiveMode: boolean
  stealJokerMode: boolean
  onHandCardClick: (cardId: string) => void
  onAttemptMeld: () => void
  onSubmitLayDown: () => void
  onDrawFromDeck: () => void
  onDrawFromDiscard: () => void
  onBuyAction: () => void
  onClearSelection: () => void
  onDiscard: () => void
  onToggleStealJoker: () => void
}

// function isContractSatisfied(pendingMelds: PendingMeld[], contract: ContractRequirements): boolean {
//   const stagedSets = pendingMelds.filter((m) => m.type === 'set').length
//   const stagedRuns = pendingMelds.filter((m) => m.type === 'run').length
//   return stagedSets >= contract.requiredSets && stagedRuns >= contract.requiredRuns
// }

function LocalPlayerZone({
  handCards,
  selectedCardIds,
  showBuyAction,
  pendingMelds,
  // contract,
  isMyTurn,
  hasLaidDown,
  isLiveMode,
  stealJokerMode,
  onHandCardClick,
  onAttemptMeld,
  onSubmitLayDown,
  onDrawFromDeck,
  onDrawFromDiscard,
  onBuyAction,
  onClearSelection,
  onDiscard,
  onToggleStealJoker,
}: LocalPlayerZoneProps) {
  const hasSelection = selectedCardIds.length > 0
  const pendingMeldCount = pendingMelds.length
  // const contractMet = pendingMeldCount > 0 && isContractSatisfied(pendingMelds, contract)


  return (
    <section className="local-player-zone" aria-label="Your hand and status">
      <header className="local-player-zone__header">
        <h2>Your Hand</h2>
        <p>{handCards.length} cards</p>
        {isLiveMode && (
          <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>
            {isMyTurn ? '● Your turn' : '○ Waiting...'}
          </p>
        )}
      </header>

      <div className="local-player-zone__hand">
        {handCards.map((card) => (
          <PlayingCard
            key={card.id}
            card={card}
            size="hand"
            className="local-player-zone__card"
            interactive
            selected={selectedCardIds.includes(card.id)}
            onClick={() => onHandCardClick(card.id)}
            description={`Hand card ${getCardDescription(card)}. Click to select.`}
          />
        ))}
      </div>

      <section className="game-action-bar" aria-label="Action controls">
        <div className="game-action-bar__buttons">
          {/* Draw phase */}
          <button
            type="button"
            className="game-action-bar__btn"
            onClick={onDrawFromDeck}
            data-a11y-description="Draw from deck."
          >
            Draw Deck
          </button>
          <button
            type="button"
            className="game-action-bar__btn"
            onClick={onDrawFromDiscard}
            data-a11y-description="Request draw from discard."
          >
            Draw Discard
          </button>

          {/* Stage Meld — hidden once laid down in live mode */}
          {(!isLiveMode || !hasLaidDown) && (
            <button
              type="button"
              className="game-action-bar__btn game-action-bar__btn--primary"
              onClick={onAttemptMeld}
              data-a11y-description="Stage selected cards as a meld."
            >
              {isLiveMode ? 'Stage Meld' : 'Attempt Meld'}
            </button>
          )}

          {isLiveMode && !hasLaidDown && (
            <button
              type="button"
              className="game-action-bar__btn game-action-bar__btn--primary"
              onClick={onSubmitLayDown}
              disabled={pendingMeldCount === 0}
              data-a11y-description="Submit all staged melds to the server."
            >
              Lay Down {pendingMeldCount > 0 ? `(${pendingMeldCount})` : ''}
            </button>
          )}

          {/* Discard */}
          {isLiveMode ? (
            <button
              type="button"
              className="game-action-bar__btn game-action-bar__btn--secondary"
              onClick={onDiscard}
              disabled={selectedCardIds.length !== 1}
              data-a11y-description="Discard the selected card and end your turn."
            >
              Discard
            </button>
          ) : (
            <button
              type="button"
              className="game-action-bar__btn game-action-bar__btn--secondary"
              onClick={onBuyAction}
              disabled={!showBuyAction}
              data-a11y-description="Send buy intent when buy window is open."
            >
              Buy
            </button>
          )}

          <button
            type="button"
            className={`game-action-bar__btn game-action-bar__btn--steal${stealJokerMode ? ' is-active' : ''}`}
            onClick={onToggleStealJoker}
            data-a11y-description="Toggle steal joker mode. Select a card from your hand, then click a meld containing a wildcard to steal it."
          >
            {stealJokerMode ? 'Cancel Steal' : 'Steal Joker'}
          </button>
          <button
            type="button"
            className="game-action-bar__btn game-action-bar__btn--ghost"
            onClick={onClearSelection}
            disabled={!hasSelection}
            data-a11y-description="Clear all selected hand cards."
          >
            Clear Selection
          </button>
        </div>
      </section>
    </section>
  )
}

export default LocalPlayerZone
