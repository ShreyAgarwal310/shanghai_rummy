import { supabase } from '../lib/supabase'
import type { LeaderboardViewRow } from '../types/database'

export type LeaderboardTimeframe = 'All Time' | 'Monthly' | 'Weekly'

const leaderboardViews: Record<LeaderboardTimeframe, 'leaderboard_all_time' | 'leaderboard_current_monthly' | 'leaderboard_current_weekly'> = {
  'All Time': 'leaderboard_all_time',
  Monthly: 'leaderboard_current_monthly',
  Weekly: 'leaderboard_current_weekly',
}

export async function fetchLeaderboard(timeframe: LeaderboardTimeframe): Promise<LeaderboardViewRow[]> {
  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from(leaderboardViews[timeframe])
    .select('*')
    .order('wins', { ascending: false })
    .order('win_rate', { ascending: false })
    .order('average_score', { ascending: true })
    .limit(10)

  if (error) {
    throw error
  }

  return data ?? []
}
