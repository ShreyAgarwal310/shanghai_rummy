"""
RIYA

Hand Class

Responsibility:
- Manages the cards belonging to a single player.
- Adds and removes cards.
- Sorts cards.
- Calculates deadwood (remaining card points).
- Returns cards for meld evaluation.

The Hand class does NOT:
- Control turns.
- Validate contracts.
- Interact with other players.
"""

class Hand:
    def __init__(self):
        self.cards = [] #using a arraylist

    def add_card(self, card):
        """Add a card to the hand (used when dealing or drawing)."""
        self.cards.append(card)

    def discard_card(self, card):
        self.cards.remove(card)

    def sort_cards(self):
        self.cards.sort(key=lambda c: (c.sort_value, c.suit_value))

    def deadwood (self) -> int: # calculating remaining card pts
        return sum (card.point_value for card in self.cards)
    
    def get_card(self):
        return list(self.cards)  # copy so callers don't mutate internal state

    def get_cards(self):
        """Alias for get_card() for compatibility."""
        return self.get_card()
    
    def is_empty(self) -> bool:
        return len(self.cards) == 0
    
    def calculate_value(self) -> int:
        #sum of the remaining card pts to determine winner
        return sum(card.point_value for card in self.cards)
    
    def __len__(self):
        return len(self.cards)

    def __repr__(self):
        return f"Hand([{', '.join(str(c) for c in self.cards)}])"