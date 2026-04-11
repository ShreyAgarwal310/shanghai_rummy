# Supabase Schema

Use Supabase Auth for login storage and the public tables below for profile and leaderboard data.

```mermaid
erDiagram
    AUTH_USER ||--|| PROFILE : "owns"
    PROFILE ||--|| PLAYER_STATS : "has all-time stats"
    PROFILE ||--o{ LEADERBOARD_PERIOD_STATS : "has leaderboard snapshots"

    AUTH_USER {
        uuid id PK
        string email
        jsonb raw_user_meta_data
        timestamptz created_at
    }

    PROFILE {
        uuid id PK
        string email
        string display_name
        string preferred_name
        string bio
        string avatar_url
        boolean invite_notifications
        jsonb accessibility_preferences
        timestamptz created_at
        timestamptz updated_at
    }

    PLAYER_STATS {
        uuid user_id PK
        int games_played
        int wins
        int losses
        int total_points
        numeric average_score
        int best_score
        int worst_score
        int current_streak
        int longest_streak
        int total_melds
        int perfect_rounds
        string favorite_round
        timestamptz updated_at
    }

    LEADERBOARD_PERIOD_STATS {
        uuid user_id FK
        string timeframe
        date period_start
        int games_played
        int wins
        int losses
        int total_points
        numeric average_score
        int current_streak
        int longest_streak
        timestamptz updated_at
    }
```

## Notes

- `auth.users` remains the source of truth for login credentials.
- `public.profiles` stores editable profile data used by the frontend.
- `public.player_stats` stores all-time numbers for stats pages and the all-time leaderboard.
- `public.leaderboard_period_stats` stores precomputed weekly and monthly leaderboard rows.
- Current views expected by the frontend are:
  - `public.leaderboard_all_time`
  - `public.leaderboard_current_weekly`
  - `public.leaderboard_current_monthly`
- Run [docs/supabase_schema.sql](/Users/shreyagarwal/Code/GitHub/shanghai_rummy/docs/supabase_schema.sql) in the Supabase SQL editor to create the schema.
