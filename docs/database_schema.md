erDiagram
    USER ||--o{ PLAYER_STAT : "has"
    USER ||--o{ GAME_PARTICIPANT : "participates"
    GAME_SESSION ||--o{ GAME_PARTICIPANT : "contains"
    GAME_SESSION ||--o{ GAME_STATE : "tracks"

    USER {
        uuid user_id PK
        string username
        string email
        string password_hash
        timestamp created_at
    }

    PLAYER_STAT {
        uuid stat_id PK
        uuid user_id FK
        int total_wins
        int games_played
        int total_points
    }

    GAME_SESSION {
        uuid game_id PK
        uuid host_id FK
        enum status
        int current_round
        uuid current_turn_id FK
    }

    GAME_PARTICIPANT {
        uuid participant_id PK
        uuid game_id FK
        uuid user_id FK
        int seat_number
        int current_score
        int buys_remaining
        boolean has_laid_down
    }

    GAME_STATE {
        uuid state_id PK
        uuid game_id FK
        jsonb hand_data
        jsonb discard_pile
        jsonb board_state
    }
