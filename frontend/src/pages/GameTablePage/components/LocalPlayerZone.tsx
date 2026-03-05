import type { HandCard } from '../../GameTablePage.mock'
import { getCardDescription } from '../../GameTablePage.logic'
import PlayingCard from './PlayingCard'

type LocalPlayerZoneProps = {
  handCards: HandCard[]
  selectedCardId: string | null
  showBuyAction: boolean
  onHandCardClick: (cardId: string) => void
  onAttemptMeld: () => void
  onDrawFromDeck: () => void
  onDrawFromDiscard: () => void
  onBuyAction: () => void
  onClearSelection: () => void
}

function LocalPlayerZone({
  handCards,
  selectedCardId,
  showBuyAction,
  onHandCardClick,
  onAttemptMeld,
  onDrawFromDeck,
  onDrawFromDiscard,
  onBuyAction,
  onClearSelection,
}: LocalPlayerZoneProps) {
  return (
    <section className="local-player-zone" aria-label="Your hand and status">
      <header className="local-player-zone__header">
        <h2>Your Hand</h2>
        <p>{handCards.length} cards</p>
      </header>

      <div className="local-player-zone__hand">
        {handCards.map((card) => (
          <PlayingCard
            key={card.id}
            card={card}
            size="hand"
            className="local-player-zone__card"
            interactive
            selected={selectedCardId === card.id}
            onClick={() => onHandCardClick(card.id)}
            description={`Hand card ${getCardDescription(card)}. Click to select this card and unselect the previous card.`}
          />
        ))}
      </div>

      <section className="game-action-bar" aria-label="Action controls">
        <div className="game-action-bar__buttons">
          <button
            type="button"
            className="game-action-bar__btn game-action-bar__btn--primary"
            onClick={onAttemptMeld}
            data-a11y-description="Attempt to meld selected cards. Backend validates legality."
          >
            Attempt Meld
          </button>
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
          <button
            type="button"
            className="game-action-bar__btn game-action-bar__btn--secondary"
            onClick={onBuyAction}
            disabled={!showBuyAction}
            data-a11y-description="Send buy intent when buy window is open."
          >
            Buy
          </button>
          <button
            type="button"
            className="game-action-bar__btn game-action-bar__btn--ghost"
            onClick={onClearSelection}
            disabled={!selectedCardId}
            data-a11y-description="Clear the selected hand card."
          >
            Clear Selection
          </button>
        </div>
        <p className="game-action-bar__note">
          UI-intent mode only: actions dispatch placeholders for backend handling, with no local rules validation.
        </p>
      </section>
    </section>
  )
}

export default LocalPlayerZone
