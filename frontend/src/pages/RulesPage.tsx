import { useState } from 'react'
import type { ReactNode } from 'react'
import './RulesPage.css'
import TutPage1 from '../assets/TutPage1.png'
import TutPage2 from '../assets/TutPage2.png'
import TutPage3 from '../assets/TutPage3.png'
import TutPage4 from '../assets/TutPage4.png'
import TutPage5 from '../assets/TutPage5.png'
import TutPage6 from '../assets/TutPage6.png'
import TutPage7 from '../assets/TutPage7.png'
import TutPage8 from '../assets/TutPage8.png'
import TutPage9 from '../assets/TutPage9.png'
import TutPage10 from '../assets/TutPage10.png'
import TutPage11 from '../assets/TutPage11.png'
import TutPage12 from '../assets/TutPage12.png'
import TutPage13 from '../assets/TutPage13.png'
import TutPage14 from '../assets/TutPage14.png'
import TutPage15 from '../assets/TutPage15.png'
import TutPage16 from '../assets/TutPage16.png'
import TutPage17 from '../assets/TutPage17.png'
import TutPage18 from '../assets/TutPage18.png'
import TutPage19 from '../assets/TutPage19.png'
import TutPage20 from '../assets/TutPage20.png'

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
          Shanghai Rummy uses <strong>108 cards</strong>: two standard 52-card decks plus 4 Jokers.
        </p>
        <div className="rules-book__info-grid">
          <article className="rules-book__info-card">
            <h4>Players</h4>
            <p>3 to 6</p>
          </article>
          <article className="rules-book__info-card">
            <h4>Starting Hand</h4>
            <p>11 cards each</p>
          </article>
          <article className="rules-book__info-card">
            <h4>Turn Order</h4>
            <p>Clockwise</p>
          </article>
          <article className="rules-book__info-card">
            <h4>Win Condition</h4>
            <p>Lowest total score</p>
          </article>
        </div>
        <p>The player to the dealer&apos;s left starts each round. Play continues clockwise until someone goes out.</p>
        <p>
          Your objective in every round is to complete the current contract, then reduce your hand to zero cards when
          allowed by the round rules.
        </p>
        <div className="rules-book__spotlight">
          <h3>Round Start Checklist</h3>
          <ul>
            <li>Confirm which contract is active</li>
            <li>Check hand for early set/run patterns</li>
            <li>Track key discards from each opponent</li>
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
              <strong>Set:</strong> same rank cards (example: Q-Q-Q)
            </li>
            <li>
              <strong>Run:</strong> consecutive cards in one suit (example: 7-8-9-10 hearts)
            </li>
            <li>
              <strong>Natural:</strong> a non-wild card used as printed
            </li>
            <li>
              <strong>Wild:</strong> a Joker or other wild substitute allowed by table rules
            </li>
            <li>
              <strong>Lay Down:</strong> placing your full contract melds on the table
            </li>
            <li>
              <strong>Lay Off:</strong> adding legal cards to existing table melds
            </li>
          </ul>
        </div>
        <div className="rules-book__info-grid">
          <article className="rules-book__info-card">
            <h4>Natural vs Wild</h4>
            <p>Naturals define real rank/suit structure. Wilds fill missing slots.</p>
          </article>
          <article className="rules-book__info-card">
            <h4>Lay Down vs Lay Off</h4>
            <p>Lay down completes your contract. Lay off extends already-valid melds.</p>
          </article>
        </div>
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
          <li>Draw one card from deck or discard.</li>
          <li>If eligible, lay down your contract melds.</li>
          <li>If already laid down, lay off cards onto valid table melds.</li>
          <li>Discard one card to end turn (unless round variant says otherwise).</li>
        </ol>
        <p>
          You must satisfy your own contract before laying off to other melds. If stock runs out, reshuffle discard
          pile while keeping the top discard visible.
        </p>
        <p className="rules-book__callout">
          In this app, backend turn state is authoritative. If an action is out of phase, it is rejected server-side.
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
        <p className="rules-book__callout">
          In-game round text is always authoritative. If your table uses custom contracts, follow the live contract
          indicator shown during play.
        </p>
      </>
    ),
  },
  {
    title: 'Melds, Runs, and Jokers',
    subtitle: 'Building legal combinations',
    tip: 'Keep flexible middles for runs (like 6-7-8) and avoid locking too many wilds early.',
    content: (
      <>
        <div className="rules-book__info-grid">
          <article className="rules-book__info-card">
            <h4>Set Rules</h4>
            <p>Minimum 3 cards, same rank, wilds may fill missing cards.</p>
          </article>
          <article className="rules-book__info-card">
            <h4>Run Rules</h4>
            <p>Minimum 4 cards, same suit, consecutive ranks with legal wild placement.</p>
          </article>
        </div>
        <p>Aces can be high or low in runs when allowed, but they cannot wrap around (Q-K-A-2 is invalid).</p>
        <p>Jokers are wild. Some variants also treat specific cards as wild (for example, 2 of clubs).</p>
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
        <p className="rules-book__callout">
          If Joker replacement is enabled, the exact natural card can replace a Joker in a meld, then that Joker may be
          reused immediately if rules allow.
          <strong> However, you may only steal a Joker if you have already laid down your own contract.</strong>
        </p>
      </>
    ),
  },
  {
    title: 'Laying Down & Laying Off',
    subtitle: 'How table meld interactions usually work',
    tip: 'Wait to lay down until your hand remains flexible enough to go out in as few turns as possible.',
    content: (
      <>
        <ol className="rules-book__steps">
          <li>Lay down only when your full contract is complete.</li>
          <li>After laying down, you may lay off legal cards to table melds on your turn.</li>
          <li>Every changed meld must remain valid after your move.</li>
        </ol>
        <div className="rules-book__spotlight">
          <h3>Validation</h3>
          <p>
            The server validates layoff legality, Joker replacement flow, and any rearrangement permissions.
          </p>
        </div>
        <p className="rules-book__callout rules-book__callout--warning">
          Common invalid layoff: adding a non-matching rank to a set, or breaking suit/sequence integrity in a run.
        </p>
      </>
    ),
  },
  {
    title: 'Ending a Round',
    subtitle: 'Going out and locking round scores',
    tip: 'Plan your final discard early; many almost-complete hands fail because the exit card is trapped.',
    content: (
      <>
        <p>To go out, you must satisfy the round contract and remove all cards from your hand as the round allows.</p>
        <p>
          In standard flow, this means ending with a legal final discard. Some variants allow different final-round
          endings.
        </p>
        <p>
          Once someone goes out, round scoring is immediate. Any cards left in other players&apos; hands count as penalty
          points.
        </p>
        <p className="rules-book__callout">
          In this app, going-out eligibility is backend validated against your laid-down status and remaining hand.
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
        <p>Penalty scoring in this implementation:</p>
        <div className="rules-book__score-grid">
          <p>Jokers and wildcards</p>
          <p>50 each</p>
          <p>Aces</p>
          <p>20 each</p>
          <p>10, J, Q, K</p>
          <p>10 each</p>
          <p>Other number cards</p>
          <p>5 each</p>
        </div>
        <p>
          Total score is cumulative across rounds. Lowest overall score wins the game.
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
        <p>Shanghai Rummy varies by table. Common differences include:</p>
        <ul className="rules-book__split-list">
          <li>Number of rounds (often 7 or 10)</li>
          <li>Wild-card restrictions per meld</li>
          <li>Whether final contract requires no discard to go out</li>
          <li>Ace handling in runs (high-only vs flexible)</li>
        </ul>
        <p>
          Tie handling is table-dependent: shared placement, tiebreak hand, or playoff round are all common.
        </p>
        <p className="rules-book__callout">
          This app always follows backend-configured rules first. If screen text conflicts with memory, trust live game
          prompts.
        </p>
      </>
    ),
  },
]

function RulesPage() {
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [flipClass, setFlipClass] = useState('')
  const [tutorialOpen, setTutorialOpen] = useState(true)
  const [tutSlide, setTutSlide] = useState(0)
  const searchParams = new URLSearchParams(window.location.search)
  const requestedReturnPath = searchParams.get('returnTo')
  const backDestination = requestedReturnPath && requestedReturnPath.startsWith('/game/') ? requestedReturnPath : '/'
  const backButtonLabel = backDestination === '/' ? 'Back to Lobby' : 'Back to Game'

  const currentPage = rulesBookPages[currentPageIndex]
  const isFirstPage = currentPageIndex === 0
  const isLastPage = currentPageIndex === rulesBookPages.length - 1

  const handleBackClick = () => {
    window.location.assign(backDestination)
  }

  const flipTo = (nextIndex: number, direction: 'next' | 'prev') => {
    setFlipClass(`is-flipping-${direction}`)
    window.setTimeout(() => {
      setCurrentPageIndex(nextIndex)
      setFlipClass(`is-arriving-${direction}`)
      window.setTimeout(() => setFlipClass(''), 320)
    }, 280)
  }

  const goToPreviousPage = () => {
    if (isFirstPage) return
    flipTo(currentPageIndex - 1, 'prev')
  }

  const goToNextPage = () => {
    if (isLastPage) return
    flipTo(currentPageIndex + 1, 'next')
  }

  const tutorialSlides = [TutPage1, TutPage2, TutPage3, TutPage4, TutPage5, TutPage6, TutPage7, TutPage8, TutPage9,
    TutPage10, TutPage11, TutPage12, TutPage13, TutPage14, TutPage15, TutPage16, TutPage17, TutPage18, TutPage19, TutPage20]

  return (
    <main className="rules-page" aria-label="Rules and Tips">

      {/* Fixed gold border frame */}
      <div className="rules-frame" aria-hidden="true">
        <span className="rules-frame__corner rules-frame__corner--tl" />
        <span className="rules-frame__corner rules-frame__corner--tr" />
        <span className="rules-frame__corner rules-frame__corner--bl" />
        <span className="rules-frame__corner rules-frame__corner--br" />
        <span className="rules-frame__mid rules-frame__mid--top">◆</span>
        <span className="rules-frame__mid rules-frame__mid--right">◆</span>
        <span className="rules-frame__mid rules-frame__mid--bottom">◆</span>
        <span className="rules-frame__mid rules-frame__mid--left">◆</span>
      </div>

      <button
        type="button"
        className="rules-page__back-btn"
        onClick={handleBackClick}
        data-a11y-description={`Return to ${backDestination === '/' ? 'the home lobby screen' : 'your active game table'}.`}
      >
        ← {backButtonLabel}
      </button>

      <div className="rules-book-outer">
        <div className="rules-book-cover">
        <section className="rules-book" aria-label="Shanghai Rummy Rules Book">
          <aside className="rules-book__sheet rules-book__sheet--left">
            <p className="rules-book__crest">Shanghai Rummy Handbook</p>
            <h1 className="rules-book__headline">The Rules</h1>
            <h2 className="rules-book__legend-title">Contents</h2>
            <ol className="rules-book__legend-list">
              {rulesBookPages.map((page, index) => (
                <li key={page.title}>
                  <button
                    type="button"
                    className={`rules-book__legend-item ${index === currentPageIndex ? 'is-active' : ''}`}
                    onClick={() => {
                      const dir = index > currentPageIndex ? 'next' : 'prev'
                      flipTo(index, dir)
                    }}
                    data-a11y-description={`Open rules page ${index + 1}: ${page.title}.`}
                  >
                    <span>Page {index + 1}</span>
                    <span>{page.title}</span>
                  </button>
                </li>
              ))}
            </ol>
          </aside>

          <article className={`rules-book__sheet rules-book__sheet--right ${flipClass}`}>
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
        </div>
      </div>
      {tutorialOpen && (
  <div className="tutorial-overlay">
    <div className="tutorial-modal">
      <img src={tutorialSlides[tutSlide]} alt={`Tutorial page ${tutSlide + 1}`} className="tutorial-slide" />
      <div className="tutorial-controls">
        <button onClick={() => setTutSlide(i => i - 1)} disabled={tutSlide === 0} className="tutorial-btn">←</button>
        <span className="tutorial-counter">{tutSlide + 1} / {tutorialSlides.length}</span>
        <button onClick={() => setTutSlide(i => i + 1)} disabled={tutSlide === tutorialSlides.length - 1} className="tutorial-btn">→</button>
      </div>
      <button className="tutorial-skip" onClick={() => { setTutorialOpen(false); setTutSlide(0); }}>
        Skip Tutorial ✕
      </button>
    </div>
  </div>
)}
    </main>
  )
}

export default RulesPage
