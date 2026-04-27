import { useMemo } from 'react'
import { buildMeldsByType, getMeldLaneClassName } from './GameTablePage.logic'
import { demoRounds, opponentSeats as demoOpponentSeats, scoreRows as demoScoreRows, type HandCard, type MeldGroup, type ScoreRow } from './GameTablePage.mock'
import { toContractText, toOpponentSeats, toScoreRows } from './GameTablePage.converters'
import type { GameState } from '../services/socketService'

type UseGameTableDerivedStateParams = {
  currentDemoRound: (typeof demoRounds)[number]
  handCards: HandCard[]
  isDemoMode: boolean
  isDemoGameComplete: boolean
  isLiveMode: boolean
  isMyTurn: boolean
  livePhase: string
  liveState: GameState | null
  meldGroups: MeldGroup[]
  myName: string
  selectedCardIds: string[]
}

export function useGameTableDerivedState({
  currentDemoRound,
  handCards,
  isDemoMode,
  isDemoGameComplete,
  isLiveMode,
  isMyTurn,
  livePhase,
  liveState,
  meldGroups,
  myName,
  selectedCardIds,
}: UseGameTableDerivedStateParams) {
  const displayContractText = isDemoMode
    ? currentDemoRound.contractText
    : toContractText(liveState?.contract ?? null)
  const displayRoundNumber = isDemoMode ? currentDemoRound.roundNumber : liveState?.round_number ?? 1
  const displayTotalRounds = isDemoMode ? demoRounds.length : 10

  const displayOpponents = useMemo(
    () => (isDemoMode ? demoOpponentSeats : liveState ? toOpponentSeats(liveState.players, myName) : []),
    [isDemoMode, liveState, myName],
  )

  const displayScoreRows = useMemo(
    () => (isDemoMode ? demoScoreRows : liveState ? toScoreRows(liveState.total_scores, myName) : []),
    [isDemoMode, liveState, myName],
  )

  const finalLeaderboardRows = useMemo(
    () => [...displayScoreRows].sort((a, b) => a.score - b.score),
    [displayScoreRows],
  )

  const sortedScoreRows = useMemo(
    () => [...displayScoreRows].sort((a, b) => a.score - b.score),
    [displayScoreRows],
  )

  const yourScoreRow = displayScoreRows.find((row) => row.player === 'You') ?? displayScoreRows[0]

  const pinnedScoreRows = useMemo(() => {
    const leader = displayScoreRows[0]
    const second = displayScoreRows[1]
    const rows: ScoreRow[] = [leader]
    if (second && second.player !== leader.player) rows.push(second)
    if (!rows.some((row) => row.player === yourScoreRow.player)) rows.push(yourScoreRow)
    return rows
  }, [displayScoreRows, yourScoreRow])

  const extraScoreRows = useMemo(
    () => displayScoreRows.filter((row) => !pinnedScoreRows.some((pinned) => pinned.player === row.player)),
    [displayScoreRows, pinnedScoreRows],
  )

  const meldsByType = useMemo(() => buildMeldsByType(meldGroups), [meldGroups])
  const setLaneClassName = getMeldLaneClassName(meldsByType.sets.length)
  const runLaneClassName = getMeldLaneClassName(meldsByType.runs.length)
  const selectedCards = useMemo(
    () => handCards.filter((card) => selectedCardIds.includes(card.id)),
    [handCards, selectedCardIds],
  )

  const contractRequirements = useMemo(() => {
    if (!isDemoMode && liveState?.contract) {
      return {
        requiredSets: liveState.contract.required_sets,
        requiredRuns: liveState.contract.required_runs,
      }
    }
    return {
      requiredSets: currentDemoRound.requiredSets,
      requiredRuns: currentDemoRound.requiredRuns,
    }
  }, [currentDemoRound, isDemoMode, liveState])

  const requirementLines = useMemo(() => {
    if (!isDemoMode && liveState?.contract) {
      const lines: string[] = []
      if (liveState.contract.required_sets > 0) lines.push(`${liveState.contract.required_sets}× Set of 3+`)
      if (liveState.contract.required_runs > 0) lines.push(`${liveState.contract.required_runs}× Run of 4+`)
      return lines
    }

    const lines: string[] = []
    if (currentDemoRound.requiredSets > 0) lines.push(`${currentDemoRound.requiredSets}× Set of ${currentDemoRound.setSize}`)
    if (currentDemoRound.requiredRuns > 0) lines.push(`${currentDemoRound.requiredRuns}× Run of ${currentDemoRound.runSize}`)
    return lines
  }, [currentDemoRound, isDemoMode, liveState])

  const turnLabel = isDemoGameComplete
    ? 'Game Complete'
    : isDemoMode
      ? 'Your Turn'
      : isLiveMode
      ? isMyTurn
        ? `Your Turn (${livePhase})`
        : `${liveState?.current_player ?? '...'}'s Turn`
      : 'Connecting...'

  return {
    contractRequirements,
    displayContractText,
    displayOpponents,
    displayRoundNumber,
    displayScoreRows,
    displayTotalRounds,
    extraScoreRows,
    finalLeaderboardRows,
    meldsByType,
    pinnedScoreRows,
    requirementLines,
    runLaneClassName,
    selectedCards,
    setLaneClassName,
    sortedScoreRows,
    turnLabel,
  }
}
