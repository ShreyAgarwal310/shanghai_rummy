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
try:
    from app.game import Game
    from app.players.human_player import HumanPlayer
except ModuleNotFoundError:
    # Allow direct execution like: python app/main.py
    import sys
    from pathlib import Path

    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    from app.game import Game
    from app.players.human_player import HumanPlayer

if __name__ == "__main__":
    players = [
        HumanPlayer("Player 1"),
        HumanPlayer("Player 2"),
    ]
    game = Game(players)
    game.start()
