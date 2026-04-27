import { useMemo } from 'react'
import { buildMeldsByType, getMeldLaneClassName } from './GameTablePage.logic'
import { demoRounds, opponentSeats as demoOpponentSeats, scoreRows as demoScoreRows, type HandCard, type MeldGroup, type ScoreRow } from './GameTablePage.mock'
import { toContractText, toOpponentSeats, toScoreRows } from './GameTablePage.converters'
import type { GameState } from '../services/socketService'

type UseGameTableDerivedStateParams = {
  currentDemoRound: (typeof demoRounds)[number]
  handCards: HandCard[]
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
  isDemoGameComplete,
  isLiveMode,
  isMyTurn,
  livePhase,
  liveState,
  meldGroups,
  myName,
  selectedCardIds,
}: UseGameTableDerivedStateParams) {
  const displayContractText = isLiveMode ? toContractText(liveState?.contract ?? null) : currentDemoRound.contractText
  const displayRoundNumber = isLiveMode ? liveState?.round_number ?? 1 : currentDemoRound.roundNumber
  const displayTotalRounds = isLiveMode ? 10 : demoRounds.length

  const displayOpponents = useMemo(
    () => (isLiveMode && liveState ? toOpponentSeats(liveState.players, myName) : demoOpponentSeats),
    [isLiveMode, liveState, myName],
  )

  const displayScoreRows = useMemo(
    () => (isLiveMode && liveState ? toScoreRows(liveState.total_scores, myName) : demoScoreRows),
    [isLiveMode, liveState, myName],
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
    if (isLiveMode && liveState?.contract) {
      return {
        requiredSets: liveState.contract.required_sets,
        requiredRuns: liveState.contract.required_runs,
      }
    }
    return {
      requiredSets: currentDemoRound.requiredSets,
      requiredRuns: currentDemoRound.requiredRuns,
    }
  }, [currentDemoRound, isLiveMode, liveState])

  const requirementLines = useMemo(() => {
    if (isLiveMode && liveState?.contract) {
      const lines: string[] = []
      if (liveState.contract.required_sets > 0) lines.push(`${liveState.contract.required_sets}× Set of 3+`)
      if (liveState.contract.required_runs > 0) lines.push(`${liveState.contract.required_runs}× Run of 4+`)
      return lines
    }

    const lines: string[] = []
    if (currentDemoRound.requiredSets > 0) lines.push(`${currentDemoRound.requiredSets}× Set of ${currentDemoRound.setSize}`)
    if (currentDemoRound.requiredRuns > 0) lines.push(`${currentDemoRound.requiredRuns}× Run of ${currentDemoRound.runSize}`)
    return lines
  }, [currentDemoRound, isLiveMode, liveState])

  const turnLabel = isDemoGameComplete
    ? 'Game Complete'
    : isLiveMode
      ? isMyTurn
        ? `Your Turn (${livePhase})`
        : `${liveState?.current_player ?? '...'}'s Turn`
      : 'Your Turn'

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
