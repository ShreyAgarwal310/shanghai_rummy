"""
RIYA

HumanPlayer Class

Responsibility:
- Implements how a human player takes a turn.
- Prompts the user for input.
- Chooses draw source.
- Chooses discard.
- Chooses melds to play.

This class does NOT:
- Validate whether moves are legal (RulesEngine does that).
- Control round progression.
"""

from player import Player

class HumanPlayer(Player):

    def take_turn(self, current_round):
        print(f"\n{self.name}'s turn")

        action = input("Choose action (draw/play): ").strip().lower()

        if action == "draw":
            current_round.handle_draw(self)

        elif action == "play":
            current_round.handle_play(self)

        else:
            print("Invalid choice.")

        # Choose card

        def choose_discard(self):
            cards = self.hand.get_cards()

            print("\nYour hand:")
            for i, card in enumerate(cards):
                print(f"{i}: {card}")

        choice = int(input("Select card index to discard: "))

        return cards[choice]

        # Attempt meld

    def choose_meld(self):
        cards = self.hand.get_cards()

        print("\nYour hand:")
        for i, card in enumerate(cards):
            print(f"{i}: {card}")

        indices = input(
        "Enter card indices for meld (space separated): "
        ).split()

        selected_cards = [cards[int(i)] for i in indices]

        return selected_cards