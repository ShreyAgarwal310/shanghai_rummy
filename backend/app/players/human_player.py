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

from app.players.player import Player

class HumanPlayer(Player):

    def take_turn(self, current_round):
        print(f"\n{self.name}'s turn")

        action = input("Choose action (draw/play): ").strip().lower()

        if action == "draw":
            current_round.handle_draw(self)
            card_to_discard = self.choose_discard()
            self.hand.discard_card(card_to_discard)
            current_round.discard_pile.add_card(card_to_discard)

        elif action == "play":
            current_round.handle_play(self)

        else:
            print("Invalid choice.")

    def choose_discard(self):
        """Prompt player to choose a card to discard; returns the chosen card."""
        cards = self.hand.get_cards()
        print("\nYour hand:")
        for i, card in enumerate(cards):
            print(f"{i}: {card}")
        choice = int(input("Select card index to discard: "))
        return cards[choice]

    def choose_meld(self):
        """Prompt player to choose cards for a meld; returns list of selected cards."""
        cards = self.hand.get_cards()
        print("\nYour hand:")
        for i, card in enumerate(cards):
            print(f"{i}: {card}")
        indices = input(
            "Enter card indices for meld (space separated): "
        ).strip().split()
        selected_cards = [cards[int(i)] for i in indices]
        return selected_cards