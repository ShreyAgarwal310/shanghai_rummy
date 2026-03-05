import { getCardDescription, redSuits, suitSymbols } from '../../GameTablePage.logic'
import type { TableCard } from '../../GameTablePage.mock'
import type { PlayingCardSize } from '../../GameTablePage.types'

type PlayingCardProps = {
  card: TableCard
  size: PlayingCardSize
  className?: string
  interactive?: boolean
  description?: string
  selected?: boolean
  onClick?: () => void
}

function PlayingCard({ card, size, className = '', interactive = false, description, selected = false, onClick }: PlayingCardProps) {
  const isJoker = card.rank === 'JOKER' || card.suit === 'JOKER'
  const colorClass = isJoker ? 'playing-card--joker' : redSuits.has(card.suit) ? 'playing-card--red' : 'playing-card--black'
  const cardClasses = [
    'playing-card',
    `playing-card--${size}`,
    colorClass,
    interactive ? 'playing-card--interactive' : '',
    selected ? 'playing-card--selected' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  const cardAria = description ?? `Card ${getCardDescription(card)}.`

  const cardFace = (
    <>
      <span className="playing-card__corner playing-card__corner--top" aria-hidden="true">
        <span className="playing-card__rank">{isJoker ? '★' : card.rank}</span>
        <span className="playing-card__suit">{suitSymbols[card.suit]}</span>
      </span>

      <span className="playing-card__center" aria-hidden="true">
        {isJoker ? <span className="playing-card__joker-word">JOKER</span> : <span className="playing-card__center-suit">{suitSymbols[card.suit]}</span>}
      </span>

      <span className="playing-card__corner playing-card__corner--bottom" aria-hidden="true">
        <span className="playing-card__rank">{isJoker ? '★' : card.rank}</span>
        <span className="playing-card__suit">{suitSymbols[card.suit]}</span>
      </span>
    </>
  )

  if (interactive) {
    return (
      <button type="button" className={cardClasses} data-a11y-description={cardAria} aria-pressed={selected} onClick={onClick}>
        {cardFace}
      </button>
    )
  }

  return (
    <div className={cardClasses} role="img" aria-label={getCardDescription(card)}>
      {cardFace}
    </div>
  )
}

export default PlayingCard
