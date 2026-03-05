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

    def start(self):
        """Run all 10 rounds, then declare the winner."""
        for round_idx, contract in enumerate(CONTRACTS):
            print(f"\n{'='*40}")
            print(f"  ROUND {round_idx + 1} — "
                  f"{contract.required_sets} set(s), {contract.required_runs} run(s)")
            print(f"{'='*40}")

            for player in self.players:
                player.reset_for_new_round()

            round_ = Round(self.players, round_number=round_idx + 1, contract=contract)
            round_.start()

            self.update_total_scores(round_.calculate_scores())
            self.current_round_idx += 1

        self.game_over = True
        self.declare_winner()
    
    def update_total_scores(self, round_results):
        for player_name, score in round_results.items():
            self.total_scores[player_name] += score
            print(f"{player_name} Score: {score} | Total: {self.total_scores[player_name]}")

    def declare_winner(self):
        # lowest score wins
        winner = min(self.total_scores, key=self.total_scores.get)
        print(f"GAME OVER. The winner is {winner} with {self.total_scores[winner]} points! Hurray!!!")
