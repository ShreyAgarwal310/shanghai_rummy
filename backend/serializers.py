"""
converts python game to and from json-serialisable dicts
and builds the per-player game state view to websocket
"""


from app.cards.card import Card
from app.hands import Hand


def card_to_dict(card: Card) -> dict:
    return {"rank": card.rank, "suit": card.suit}


def dict_to_card(d: dict) -> Card:
    return Card(suit=d["suit"], rank=d["rank"])


def hand_to_list(hand: Hand) -> list[dict]:
    return [card_to_dict(c) for c in hand.get_cards()]


def melds_table_to_dict(melds_on_table: dict) -> dict:
    result = {}
    for player_name, meld_list in melds_on_table.items():
        result[player_name] = [
            {"type": m["type"], "cards": [card_to_dict(c) for c in m["cards"]]}
            for m in meld_list
        ]
    return result


def build_player_view(session: dict, viewer_name: str) -> dict:
    players_info = []
    for p in session["players"]:
        info = {
            "name": p["name"],
            "card_count": len(p["hand"]),
            "has_laid_down": p["has_laid_down"],
            "total_score": session["total_scores"].get(p["name"], 0),
            "connected": p["sid"] is not None,
        }
        if p["name"] == viewer_name:
            info["hand"] = hand_to_list(p["hand"])
        players_info.append(info)

    discard_top = session["discard_pile"].top_card() if session["discard_pile"] else None
    contract = session["contract"]

    return {
        "phase": session["phase"],
        "round_number": session["round_number"],
        "contract": {
            "required_sets": contract.required_sets,
            "required_runs": contract.required_runs,
        } if contract else None,
        "current_player": session["players"][session["current_player_idx"]]["name"]
            if session["phase"] not in ("lobby", "game_over") else None,
        "players": players_info,
        "discard_top": card_to_dict(discard_top) if discard_top else None,
        "deck_size": len(session["deck"]) if session["deck"] else 0,
        "melds_on_table": melds_table_to_dict(session["melds_on_table"]),
        "total_scores": dict(session["total_scores"]),
    }
