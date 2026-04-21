"""
In-memory game session store and helpers.

All mutable state lives here so handlers stay stateless.

Session shape:
{
    game_code: str,
    host_name: str,
    phase: "lobby" | "draw" | "play" | "game_over",
    round_number: int,          # 1-indexed; 0 = not started
    contract: Contract | None,
    deck: Deck | None,
    discard_pile: DiscardPile | None,
    current_player_idx: int,
    total_scores: {player_name: int},
    melds_on_table: {
        player_name: [{"type": "set"|"run", "cards": [Card, ...]}]
    },
    players: [
        {
            name: str,
            sid: str | None,    # None when disconnected
            hand: Hand,
            has_laid_down: bool,
            score: int,
        }
    ],
}
"""

import random
import string

from app.cards.deck import Deck
from app.cards.discard_pile import DiscardPile
from app.hands import Hand
from app.rules.contract import CONTRACTS

# global state

games: dict[str, dict] = {}       # game_code -> session
sid_to_game: dict[str, str] = {}  # sid -> game_code

# session helpers


def generate_game_code(length: int = 6) -> str:
    chars = string.ascii_uppercase + string.digits
    while True:
        code = "".join(random.choices(chars, k=length))
        if code not in games:
            return code


def get_current_player(session: dict) -> dict:
    return session["players"][session["current_player_idx"]]


def find_player_by_sid(session: dict, sid: str) -> dict | None:
    return next((p for p in session["players"] if p["sid"] == sid), None)


def init_round(session: dict) -> None:
    """Reset hands and deal for the current round_number (1-indexed)."""
    round_idx = session["round_number"] - 1
    session["contract"] = CONTRACTS[round_idx]
    session["deck"] = Deck()
    session["discard_pile"] = DiscardPile()
    session["melds_on_table"] = {p["name"]: [] for p in session["players"]}
    session["current_player_idx"] = 0
    session["phase"] = "draw"

    for p in session["players"]:
        p["hand"] = Hand()
        p["has_laid_down"] = False

    deck = session["deck"]
    deck.shuffle()
    cards_to_deal = 13 if session["round_number"] >= 10 else 11
    for _ in range(cards_to_deal):
        for p in session["players"]:
            p["hand"].add_card(deck.draw())

    session["discard_pile"].add_card(deck.draw())
