"""
RIYA

Main Entry Point

Responsibility:
- Starts the program.
- Creates Player objects.
- Creates the Game object.
- Calls game.start().

This file should contain NO game logic.
It should only launch the application.
"""
from app.game import Game
from app.players.human_player import HumanPlayer

if __name__ == "__main__":
    players = [
        HumanPlayer("Player 1"),
        HumanPlayer("Player 2"),
    ]
    game = Game(players)
    game.start()
