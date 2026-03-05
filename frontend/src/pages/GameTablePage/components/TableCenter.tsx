import { buildCardBacks } from '../../GameTablePage.logic'
import type { OpponentSeat, TableCard } from '../../GameTablePage.mock'
import type { MeldsByType } from '../../GameTablePage.types'
import PlayingCard from './PlayingCard'

type TableCenterProps = {
  opponentSeats: OpponentSeat[]
  meldsByType: MeldsByType
  setLaneClassName: string
  runLaneClassName: string
  selectedCardsCount: number
  showBuyAction: boolean
  topDiscardCard: TableCard
  onDrawFromDeck: () => void
  onDiscardPileClick: () => void
  onLayoffToMeld: (groupIndex: number, meldIndex: number) => void
}

function TableCenter({
  opponentSeats,
  meldsByType,
  setLaneClassName,
  runLaneClassName,
  selectedCardsCount,
  showBuyAction,
  topDiscardCard,
  onDrawFromDeck,
  onDiscardPileClick,
  onLayoffToMeld,
}: TableCenterProps) {
  return (
    <>
      <ul className="opponent-seats" aria-label="Opponents">
        {opponentSeats.map((seat) => (
          <li key={seat.id} className={`opponent-seat opponent-seat--${seat.position}`}>
            <p className="opponent-seat__name">{seat.name}</p>
            <div className="opponent-seat__cards" aria-hidden="true">
              {buildCardBacks(seat.cardCount).map((cardId) => (
                <span key={cardId} className="opponent-seat__card-back" />
              ))}
            </div>
            <p className="opponent-seat__meta">
              {seat.cardCount} cards | Score {seat.score}
            </p>
          </li>
        ))}
      </ul>

      <section className="table-felt" aria-label="Table center">
        <div className="table-felt__layout">
          <section className={setLaneClassName} aria-label="Set melds">
            <header className="table-meld-lane__header">
              <h3>Sets</h3>
              <span>{meldsByType.sets.length}</span>
            </header>
            <div className="table-meld-lane__list">
              {meldsByType.sets.length === 0 ? (
                <p className="table-meld-lane__empty">No sets on table.</p>
              ) : (
                meldsByType.sets.map((entry) => (
                  <article key={`set-${entry.groupIndex}-${entry.meldIndex}`} className="meld-entry">
                    <div className="meld-entry__top">
                      <p className="meld-entry__owner">{entry.player}</p>
                      <p className="meld-entry__meta">Set {entry.meldIndex + 1}</p>
                    </div>
                    <button
                      type="button"
                      className={`player-melds__meld ${selectedCardsCount > 0 ? 'player-melds__meld--active-target' : ''}`}
                      onClick={() => onLayoffToMeld(entry.groupIndex, entry.meldIndex)}
                      data-a11y-description={`Lay off selected cards onto ${entry.player}'s set meld ${entry.meldIndex + 1}. Backend validates this action.`}
                    >
                      {entry.cards.map((card, cardIndex) => (
                        <PlayingCard
                          key={`${entry.player}-${entry.meldIndex}-${card.rank}-${card.suit}-${cardIndex}`}
                          card={card}
                          size="meld"
                          className="player-melds__card"
                        />
                      ))}
                    </button>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="table-felt__center" aria-label="Draw and discard piles">
            <div className="table-felt__piles">
              <button
                type="button"
                className="table-pile table-pile--action"
                onClick={onDrawFromDeck}
                data-a11y-description="Draw from the deck. Backend validates whether drawing is legal."
              >
                <p className="table-pile__label">Deck</p>
                <div className="table-pile__card table-pile__card--back" aria-hidden="true" />
                <p className="table-pile__meta">74 cards left</p>
              </button>

              <button
                type="button"
                className={`table-pile table-pile--action ${showBuyAction ? 'table-pile--buy-ready' : ''}`}
                onClick={onDiscardPileClick}
                data-a11y-description="Discard pile target. With one selected hand card this discards; with none it requests draw or buy."
              >
                <p className="table-pile__label">Discard</p>
                <PlayingCard card={topDiscardCard} size="pile" className="table-pile__discard-card" />
                <p className="table-pile__meta">Top card visible</p>
              </button>
            </div>
          </section>

          <section className={runLaneClassName} aria-label="Run melds">
            <header className="table-meld-lane__header">
              <h3>Runs</h3>
              <span>{meldsByType.runs.length}</span>
            </header>
            <div className="table-meld-lane__list">
              {meldsByType.runs.length === 0 ? (
                <p className="table-meld-lane__empty">No runs on table.</p>
              ) : (
                meldsByType.runs.map((entry) => (
                  <article key={`run-${entry.groupIndex}-${entry.meldIndex}`} className="meld-entry">
                    <div className="meld-entry__top">
                      <p className="meld-entry__owner">{entry.player}</p>
                      <p className="meld-entry__meta">Run {entry.meldIndex + 1}</p>
                    </div>
                    <button
                      type="button"
                      className={`player-melds__meld ${selectedCardsCount > 0 ? 'player-melds__meld--active-target' : ''}`}
                      onClick={() => onLayoffToMeld(entry.groupIndex, entry.meldIndex)}
                      data-a11y-description={`Lay off selected cards onto ${entry.player}'s run meld ${entry.meldIndex + 1}. Backend validates this action.`}
                    >
                      {entry.cards.map((card, cardIndex) => (
                        <PlayingCard
                          key={`${entry.player}-${entry.meldIndex}-${card.rank}-${card.suit}-${cardIndex}`}
                          card={card}
                          size="meld"
                          className="player-melds__card"
                        />
                      ))}
                    </button>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </>
  )
}

export default TableCenter
