import { useState } from 'react'
import type { ReactNode } from 'react'
import './RulesPage.css'

type RulesBookPage = {
  title: string
  subtitle: string
  tip: string
  content: ReactNode
}

const rulesBookPages: RulesBookPage[] = [
  {
    title: 'Game Setup',
    subtitle: 'Cards, seats, dealer flow, and objective',
    tip: 'Call out the active contract before round start so everyone tracks the same objective.',
    content: (
      <>
        <p className="rules-book__lead">
          Shanghai Rummy uses <strong>108 cards</strong> (two standard 52-card decks plus 4 Jokers).
        </p>
        <p>Play with 3-6 players. Each round starts with 11 cards dealt to every player.</p>
        <p>The first player to the dealer&apos;s left starts. Play continues clockwise.</p>
        <p>
          Goal: finish each round by completing that round&apos;s contract, then end with the lowest total score after all
          rounds.
        </p>
        <div className="rules-book__spotlight">
          <h3>Quick Snapshot</h3>
          <ul>
            <li>Draw one card per turn</li>
            <li>Make required contract</li>
            <li>Discard to end turn</li>
          </ul>
        </div>
      </>
    ),
  },
  {
    title: 'Core Terms',
    subtitle: 'Shared language used throughout every round',
    tip: 'Teams avoid most disputes by agreeing on term definitions before round one.',
    content: (
      <>
        <div className="rules-book__spotlight">
          <h3>Key Vocabulary</h3>
          <ul>
            <li>
              <strong>Set:</strong> same rank cards (e.g., Q-Q-Q)
            </li>
            <li>
              <strong>Run:</strong> consecutive cards in one suit (e.g., 7-8-9-10 hearts)
            </li>
            <li>
              <strong>Natural:</strong> non-wild card used at face value
            </li>
            <li>
              <strong>Wild:</strong> Joker or other wild-card rule replacement
            </li>
            <li>
              <strong>Lay Down:</strong> placing your contract to the table
            </li>
            <li>
              <strong>Lay Off:</strong> adding cards to melds already on table
            </li>
          </ul>
        </div>
        <p>Using consistent terms keeps buy requests, meld checks, and scoring decisions clean and fast.</p>
      </>
    ),
  },
  {
    title: 'Turn Structure',
    subtitle: 'The exact flow of a standard turn',
    tip: 'If your hand is close to the contract, avoid discarding cards that complete obvious runs.',
    content: (
      <>
        <ol className="rules-book__steps">
          <li>Draw 1 card (from the stock or top of discard).</li>
          <li>Lay down your contract if you can, then add extra cards to legal melds when allowed.</li>
          <li>Discard 1 card to end your turn.</li>
        </ol>
        <p>
          You must satisfy your own contract before you can lay off cards to table melds. If the stock runs out,
          reshuffle the discard pile (leave the top discard in place).
        </p>
      </>
    ),
  },
  {
    title: 'Round Contracts',
    subtitle: 'What each round requires before you can go out',
    tip: 'Track rounds where runs are required; suit organization in hand matters more than rank duplication.',
    content: (
      <>
        <table className="rules-book__contract-table">
          <thead>
            <tr>
              <th>Round</th>
              <th>Contract</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>Two sets of 3</td>
            </tr>
            <tr>
              <td>2</td>
              <td>One set of 3 + one run of 4</td>
            </tr>
            <tr>
              <td>3</td>
              <td>Two runs of 4</td>
            </tr>
            <tr>
              <td>4</td>
              <td>Three sets of 3</td>
            </tr>
            <tr>
              <td>5</td>
              <td>Two sets of 3 + one run of 4</td>
            </tr>
            <tr>
              <td>6</td>
              <td>One set of 3 + two runs of 4</td>
            </tr>
            <tr>
              <td>7</td>
              <td>Three runs of 4</td>
            </tr>
          </tbody>
        </table>
        <p>
          Some house tables use a variant final-round finish rule. In this app, the in-game contract text is always
          authoritative.
        </p>
      </>
    ),
  },
  {
    title: 'Buy Rules',
    subtitle: 'How out-of-turn discard grabs are handled',
    tip: 'Buying can be powerful, but each buy increases hand size pressure for later discard timing.',
    content: (
      <>
        <p>A buy is taking the top discard out of turn when the active player passes on that discard.</p>
        <p>If you buy, you take the discard and also draw penalty card(s) from the stock.</p>
        <p>
          If multiple players request the same discard, priority follows turn order from the active player. Buy limits
          vary by table and round, so the backend resolves all buy priority and limits.
        </p>
        <div className="rules-book__spotlight">
          <h3>Example</h3>
          <p>
            Player A discards a card you need. You request a buy, receive that discard, then draw the penalty card from
            stock.
          </p>
        </div>
      </>
    ),
  },
  {
    title: 'Melds, Runs, and Jokers',
    subtitle: 'Building legal combinations',
    tip: 'Keep flexible middles for runs (like 6-7-8) and avoid locking too many wilds early.',
    content: (
      <>
        <p>A set is same rank (different suits). A run is sequential cards in the same suit.</p>
        <p>In standard Shanghai tables, aces are usually high in runs.</p>
        <p>
          Jokers are wild. Wild-card restrictions differ by table (for example, one Joker per meld in some versions),
          so follow the round rules shown in-game.
        </p>
        <p>
          If Joker replacement is enabled, a player may replace a Joker in a meld with the exact natural card and take
          the Joker for immediate use in that turn.
        </p>
        <ul className="rules-book__icon-list">
          <li>
            <strong>Set:</strong> 9-9-9
          </li>
          <li>
            <strong>Run:</strong> 6-7-8-9 same suit
          </li>
          <li>
            <strong>Wild:</strong> Joker may substitute depending on table limits
          </li>
        </ul>
      </>
    ),
  },
  {
    title: 'Laying Down & Laying Off',
    subtitle: 'How table meld interactions usually work',
    tip: 'Wait to lay down until your hand remains flexible enough to go out in as few turns as possible.',
    content: (
      <>
        <p>
          You generally cannot lay off until your own contract is down. After that, you may add legal cards to existing
          table melds on your turn.
        </p>
        <p>
          Most tables require all melds to remain valid after any add/rearrange action. If table meld manipulation is
          allowed in your variant, every resulting meld must still be legal.
        </p>
        <div className="rules-book__spotlight">
          <h3>Backend Ownership</h3>
          <p>
            This app follows backend validation for layoff legality, Joker replacement flow, and any rearrangement
            permissions.
          </p>
        </div>
      </>
    ),
  },
  {
    title: 'Ending a Round',
    subtitle: 'Going out and locking round scores',
    tip: 'Plan your final discard early; many almost-complete hands fail because the exit card is trapped.',
    content: (
      <>
        <p>To go out, you must satisfy the current contract and get rid of all cards (usually by a final discard).</p>
        <p>
          Once a player goes out, the round ends immediately. Remaining players keep penalty points for cards left in
          hand.
        </p>
        <p>
          In many 7-round Shanghai variants, the final contract is three runs and no discard. Use your table&apos;s
          configured round rule.
        </p>
      </>
    ),
  },
  {
    title: 'Scoring',
    subtitle: 'Penalty points and match winner',
    tip: 'Low cards are safer to hold. Unused Jokers are expensive at scoring time.',
    content: (
      <>
        <p>Standard penalty scoring at round end:</p>
        <div className="rules-book__score-grid">
          <p>2-7</p>
          <p>5 each</p>
          <p>8-K</p>
          <p>10 each</p>
          <p>Aces</p>
          <p>20 each</p>
          <p>Jokers</p>
          <p>50 each</p>
        </div>
        <p>
          Add scores across all rounds. Lowest total score wins the game. If your table uses house scoring, follow the
          configured in-game values.
        </p>
      </>
    ),
  },
  {
    title: 'Variants & Tie Rules',
    subtitle: 'Important differences across Shanghai tables',
    tip: 'When in doubt, trust the in-game contract text and backend prompts over memory.',
    content: (
      <>
        <p>Shanghai Rummy has table variants. Common differences include:</p>
        <ul>
          <li>Number of rounds (often 7 or 10)</li>
          <li>Buy limits per player per round</li>
          <li>Wild-card restrictions per meld</li>
          <li>Whether final contract requires no discard to go out</li>
          <li>Ace handling in runs (high-only vs flexible)</li>
        </ul>
        <p>
          Tie handling is commonly lowest score wins, then shared placement or playoff round depending on house rule. In
          this app, backend-configured rules are authoritative.
        </p>
      </>
    ),
  },
]

function RulesPage() {
  const [currentPageIndex, setCurrentPageIndex] = useState(0)

  const currentPage = rulesBookPages[currentPageIndex]
  const isFirstPage = currentPageIndex === 0
  const isLastPage = currentPageIndex === rulesBookPages.length - 1

  const handleBackClick = () => {
    window.location.assign('/')
  }

  const goToPreviousPage = () => {
    if (isFirstPage) {
      return
    }
    setCurrentPageIndex((index) => index - 1)
  }

  const goToNextPage = () => {
    if (isLastPage) {
      return
    }
    setCurrentPageIndex((index) => index + 1)
  }

  return (
    <main className="rules-page" aria-label="Rules and Tips">
      <button
        type="button"
        className="rules-page__back-btn"
        onClick={handleBackClick}
        data-a11y-description="Return to the home lobby screen."
      >
        ← Back to Lobby
      </button>

      <section className="rules-book" aria-label="Shanghai Rummy Rules Book">
        <aside className="rules-book__sheet rules-book__sheet--left">
          <p className="rules-book__crest">Shanghai Rummy Handbook</p>
          <h1 className="rules-book__headline">The Rules</h1>
          <h2 className="rules-book__legend-title">Legend</h2>
          <ol className="rules-book__legend-list">
            {rulesBookPages.map((page, index) => (
              <li key={page.title}>
                <button
                  type="button"
                  className={`rules-book__legend-item ${index === currentPageIndex ? 'is-active' : ''}`}
                  onClick={() => setCurrentPageIndex(index)}
                  data-a11y-description={`Open rules chapter ${index + 1}: ${page.title}.`}
                >
                  <span>Page {index + 1}</span>
                  <span>{page.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </aside>

        <article className="rules-book__sheet rules-book__sheet--right">
          <p className="rules-book__chapter">Chapter {currentPageIndex + 1}</p>
          <h2 className="rules-book__page-title">{currentPage.title}</h2>
          <p className="rules-book__subtitle">{currentPage.subtitle}</p>
          <div className="rules-book__page-content">{currentPage.content}</div>
          <aside className="rules-book__tip" aria-label="Strategy tip">
            <h3>Table Tip</h3>
            <p>{currentPage.tip}</p>
          </aside>

          <footer className="rules-book__footer">
            <button
              type="button"
              className="rules-book__nav-btn"
              onClick={goToPreviousPage}
              disabled={isFirstPage}
              data-a11y-description="Open previous rules page."
            >
              ←
            </button>
            <p className="rules-book__page-marker">
              Page {currentPageIndex + 1} of {rulesBookPages.length}
            </p>
            <button
              type="button"
              className="rules-book__nav-btn"
              onClick={goToNextPage}
              disabled={isLastPage}
              data-a11y-description="Open next rules page."
            >
              →
            </button>
          </footer>
        </article>
      </section>
    </main>
  )
}

export default RulesPage
