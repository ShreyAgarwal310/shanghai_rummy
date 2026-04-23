import { useState, useMemo } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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

const RANK_ORDER: Record<string, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14, 'JOKER': 15,
}
const SUIT_ORDER: Record<string, number> = {
  CLUBS: 0, DIAMONDS: 1, HEARTS: 2, SPADES: 3, JOKER: 4,
}

type SortableCardProps = {
  card: HandCard
  selected: boolean
  onHandCardClick: (id: string) => void
}

function SortableCard({ card, selected, onHandCardClick }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 999 : undefined,
    position: 'relative',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`local-player-zone__card${isDragging ? ' is-dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <PlayingCard
        card={card}
        size="hand"
        interactive
        selected={selected}
        onClick={() => onHandCardClick(card.id)}
        description={`Hand card ${getCardDescription(card)}. Click to select, drag to reorder.`}
      />
    </div>
  )
}

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
  // Store only the display order (IDs). displayCards is derived purely via useMemo
  // so it updates in the same render as any handCards change — no setState-during-render
  // or useEffect timing issues.
  const [cardOrder, setCardOrder] = useState<string[]>(() => handCards.map((c) => c.id))

  const handById = useMemo(() => new Map(handCards.map((c) => [c.id, c])), [handCards])

  const displayCards = useMemo(() => {
    const filtered = cardOrder.filter((id) => handById.has(id))
    const filteredSet = new Set(filtered)
    const added = handCards.filter((c) => !filteredSet.has(c.id)).map((c) => c.id)
    return [...filtered, ...added].map((id) => handById.get(id)!)
  }, [cardOrder, handById, handCards])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const ids = displayCards.map((c) => c.id)
      const oldIndex = ids.indexOf(active.id as string)
      const newIndex = ids.indexOf(over.id as string)
      if (oldIndex >= 0 && newIndex >= 0) {
        setCardOrder(arrayMove(ids, oldIndex, newIndex))
      }
    }
  }

  function sortBySuit() {
    setCardOrder(
      [...displayCards]
        .sort((a, b) => {
          const s = SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit]
          return s !== 0 ? s : RANK_ORDER[a.rank] - RANK_ORDER[b.rank]
        })
        .map((c) => c.id),
    )
  }

  function sortByRank() {
    setCardOrder(
      [...displayCards]
        .sort((a, b) => {
          const r = RANK_ORDER[a.rank] - RANK_ORDER[b.rank]
          return r !== 0 ? r : SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit]
        })
        .map((c) => c.id),
    )
  }

  const hasSelection = selectedCardIds.length > 0
  const pendingMeldCount = pendingMelds.length

  return (
    <section className="local-player-zone" aria-label="Your hand and status">
      <header className="local-player-zone__header">
        <h2>Your Hand</h2>
        <p>{displayCards.length} cards</p>
        {isLiveMode && (
          <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>
            {isMyTurn ? '● Your turn' : '○ Waiting...'}
          </p>
        )}
        <div className="local-player-zone__sort-btns">
          <button
            type="button"
            className="local-player-zone__sort-btn"
            onClick={sortBySuit}
            title="Sort by suit"
          >
            Sort Suit
          </button>
          <button
            type="button"
            className="local-player-zone__sort-btn"
            onClick={sortByRank}
            title="Sort by rank"
          >
            Sort Rank
          </button>
        </div>
      </header>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="local-player-zone__hand">
          <SortableContext items={displayCards.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
            {displayCards.map((card) => (
              <SortableCard
                key={card.id}
                card={card}
                selected={selectedCardIds.includes(card.id)}
                onHandCardClick={onHandCardClick}
              />
            ))}
          </SortableContext>

          {pendingMelds.length > 0 && (
            <>
              <div className="local-player-zone__staged-divider" aria-hidden="true" />
              {pendingMelds.map((meld, i) => (
                <div key={i} className="staged-meld-group">
                  <p className="staged-meld-group__label">{meld.type}</p>
                  <div className="staged-meld-group__cards">
                    {meld.cards.map((card, j) => (
                      <PlayingCard key={`${i}-${j}`} card={card} size="hand" />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </DndContext>

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
