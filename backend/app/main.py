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
import game
import hands
import round
import players

class Player:

    def __init__(self, name, score):
        self.name = name
        self.score = score

class Game:

    def __init__(self, players):
        self.players = players
        self.game_start = False

    def begin_game(self):
        self.game_start = True
    game = Game(players)


game.start()
