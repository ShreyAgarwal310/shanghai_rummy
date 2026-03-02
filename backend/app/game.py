"""
RIYA & EMILY

Game Class

Responsibility:
- Controls the entire match across multiple rounds.
- Tracks total scores for all players.
- Tracks current round number.
- Creates and starts new Round objects.
- Updates total scores after each round.
- Determines when the game ends.
- Declares the overall winner.

The Game class does NOT:
- Handle individual turns.
- Validate melds.
- Control card drawing.
- Contain user input logic.
"""

from app.round import Round
from app.rules.contract import CONTRACTS # 7 rounds from contract.py

class Game:
    def __init__(self, players):
        # store the players and set everyone's starting score to zero
        self.players = players
        self.total_scores = {player.name: 0 for player in players}
        self.current_round_idx = 0
        self.game_over = False
