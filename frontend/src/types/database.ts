export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type AccessibilityPreferencesRecord = {
  highContrast: boolean
  reducedMotion: boolean
  largerText: boolean
  screenReaderHints: boolean
  colorAssistLabels: boolean
}

export type ProfileRow = {
  id: string
  email: string | null
  display_name: string | null
  preferred_name: string | null
  bio: string | null
  avatar_url: string | null
  invite_notifications: boolean
  accessibility_preferences: AccessibilityPreferencesRecord | null
  created_at: string
  updated_at: string
}

export type PlayerStatsRow = {
  user_id: string
  games_played: number
  wins: number
  losses: number
  total_points: number
  average_score: number
  best_score: number | null
  worst_score: number | null
  current_streak: number
  longest_streak: number
  total_melds: number
  perfect_rounds: number
  favorite_round: string | null
  updated_at: string
}

export type LeaderboardPeriodStatsRow = {
  user_id: string
  timeframe: 'weekly' | 'monthly'
  period_start: string
  games_played: number
  wins: number
  losses: number
  total_points: number
  average_score: number
  current_streak: number
  longest_streak: number
  updated_at: string
}

export type LeaderboardViewRow = {
  user_id: string
  player_name: string | null
  wins: number
  games_played: number
  win_rate: number
  average_score: number
  current_streak: number
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: Partial<ProfileRow> & Pick<ProfileRow, 'id'>
        Update: Partial<ProfileRow>
        Relationships: []
      }
      player_stats: {
        Row: PlayerStatsRow
        Insert: Partial<PlayerStatsRow> & Pick<PlayerStatsRow, 'user_id'>
        Update: Partial<PlayerStatsRow>
        Relationships: []
      }
      leaderboard_period_stats: {
        Row: LeaderboardPeriodStatsRow
        Insert: LeaderboardPeriodStatsRow
        Update: Partial<LeaderboardPeriodStatsRow>
        Relationships: []
      }
    }
    Views: {
      leaderboard_all_time: {
        Row: LeaderboardViewRow
        Relationships: []
      }
      leaderboard_current_weekly: {
        Row: LeaderboardViewRow
        Relationships: []
      }
      leaderboard_current_monthly: {
        Row: LeaderboardViewRow
        Relationships: []
      }
    }
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}
