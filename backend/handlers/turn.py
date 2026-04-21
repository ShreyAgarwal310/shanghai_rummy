"""
In-game turn events: draw_card, lay_down, add_to_meld, discard_card.
Also handles round-over and game-over logic.
"""

from app.melds.run_meld import RunMeld
from app.melds.set_meld import SetMeld
from app.rules.contract import CONTRACTS
from app.rules.rules_engine import RulesEngine
from serializers import build_player_view, card_to_dict, dict_to_card, hand_to_list
from session_manager import games, get_current_player, init_round


def register(sio):

    @sio.event
    async def draw_card(sid, data):
        """
        Client emits:  { game_code: str, source: "deck" | "discard" }
        Server emits:  card_drawn { player_name, source, card?, deck_size, discard_top }  → room
                       hand_updated { hand }  → drawing player only
        """
        game_code = (data.get("game_code") or "").strip().upper()
        source = data.get("source")

        if game_code not in games:
            return await sio.emit("error", {"message": "Game not found"}, to=sid)
        session = games[game_code]

        current = get_current_player(session)
        if current["sid"] != sid:
            return await sio.emit("error", {"message": "It is not your turn"}, to=sid)
        if session["phase"] != "draw":
            return await sio.emit("error", {"message": "Not in draw phase"}, to=sid)
        if source not in ("deck", "discard"):
            return await sio.emit("error", {"message": "source must be 'deck' or 'discard'"}, to=sid)

        if source == "deck":
            if session["deck"].is_empty():
                return await sio.emit("error", {"message": "Deck is empty"}, to=sid)
            card = session["deck"].draw()
            current["hand"].add_card(card)
            public_card = None  # deck draws are private
        else:
            if session["discard_pile"].is_empty():
                return await sio.emit("error", {"message": "Discard pile is empty"}, to=sid)
            card = session["discard_pile"].take_top_card()
            current["hand"].add_card(card)
            public_card = card_to_dict(card)  # discard draws are visible to all

        session["phase"] = "play"
        discard_top = session["discard_pile"].top_card()

        await sio.emit(
            "card_drawn",
            {
                "player_name": current["name"],
                "source": source,
                "card": public_card,
                "deck_size": len(session["deck"]),
                "discard_top": card_to_dict(discard_top) if discard_top else None,
            },
            room=game_code,
        )
        await sio.emit("hand_updated", {"hand": hand_to_list(current["hand"])}, to=sid)

    @sio.event
    async def lay_down(sid, data):
        """
        Client emits:
          { game_code, melds: [{ type: "set"|"run", cards: [{rank, suit}] }] }

        Must satisfy the round contract exactly. Can only be done once per round.

        Server emits:  meld_laid { player_name, melds }  → room
                       hand_updated { hand }  → player only
        """
        game_code = (data.get("game_code") or "").strip().upper()
        melds_data = data.get("melds") or []

        if game_code not in games:
            return await sio.emit("error", {"message": "Game not found"}, to=sid)
        session = games[game_code]

        current = get_current_player(session)
        if current["sid"] != sid:
            return await sio.emit("error", {"message": "It is not your turn"}, to=sid)
        if session["phase"] != "play":
            return await sio.emit("error", {"message": "Draw a card before laying down"}, to=sid)
        if current["has_laid_down"]:
            return await sio.emit("error", {"message": "You have already laid down this round"}, to=sid)

        # Build meld objects
        built_melds = []
        typed_melds = []
        for m in melds_data:
            meld_type = m.get("type")
            try:
                cards = [dict_to_card(c) for c in m.get("cards", [])]
            except (KeyError, ValueError) as exc:
                return await sio.emit("error", {"message": f"Invalid card data: {exc}"}, to=sid)

            if meld_type == "set":
                obj = SetMeld(cards)
            elif meld_type == "run":
                obj = RunMeld(cards)
            else:
                return await sio.emit("error", {"message": f"Unknown meld type: {meld_type!r}"}, to=sid)

            built_melds.append(obj)
            typed_melds.append((meld_type, obj))

        if not RulesEngine.meets_contract(built_melds, session["contract"]):
            return await sio.emit("error", {"message": "Melds do not satisfy the round contract"}, to=sid)

        # Confirm all cards are in the player's hand
        hand_cards = current["hand"].get_cards()
        for _, obj in typed_melds:
            for card in obj.cards:
                if card not in hand_cards:
                    return await sio.emit("error", {"message": f"Card {card} is not in your hand"}, to=sid)

        # Remove from hand, place on table
        for _, obj in typed_melds:
            for card in obj.cards:
                current["hand"].discard_card(card)

        for meld_type, obj in typed_melds:
            session["melds_on_table"][current["name"]].append(
                {"type": meld_type, "cards": list(obj.cards)}
            )

        current["has_laid_down"] = True

        await sio.emit(
            "meld_laid",
            {
                "player_name": current["name"],
                "melds": [
                    {"type": t, "cards": [card_to_dict(c) for c in obj.cards]}
                    for t, obj in typed_melds
                ],
            },
            room=game_code,
        )
        await sio.emit("hand_updated", {"hand": hand_to_list(current["hand"])}, to=sid)

    @sio.event
    async def add_to_meld(sid, data):
        """
        Client emits:
          { game_code, target_player, meld_index, cards: [{rank, suit}] }

        Only allowed after you've laid down your own contract this round.

        Server emits:  meld_updated { target_player, meld_index, meld }  → room
                       hand_updated { hand }  → player only
        """
        game_code = (data.get("game_code") or "").strip().upper()
        target_name = data.get("target_player")
        meld_index = data.get("meld_index")
        cards_data = data.get("cards") or []

        if game_code not in games:
            return await sio.emit("error", {"message": "Game not found"}, to=sid)
        session = games[game_code]

        current = get_current_player(session)
        if current["sid"] != sid:
            return await sio.emit("error", {"message": "It is not your turn"}, to=sid)
        if session["phase"] != "play":
            return await sio.emit("error", {"message": "Not in play phase"}, to=sid)
        if not current["has_laid_down"]:
            return await sio.emit("error", {"message": "Lay down your contract before adding to melds"}, to=sid)

        target_melds = session["melds_on_table"].get(target_name)
        if target_melds is None:
            return await sio.emit("error", {"message": f"No melds found for player {target_name!r}"}, to=sid)
        if not isinstance(meld_index, int) or not (0 <= meld_index < len(target_melds)):
            return await sio.emit("error", {"message": "Invalid meld_index"}, to=sid)

        try:
            new_cards = [dict_to_card(c) for c in cards_data]
        except (KeyError, ValueError) as exc:
            return await sio.emit("error", {"message": f"Invalid card data: {exc}"}, to=sid)

        if not new_cards:
            return await sio.emit("error", {"message": "No cards provided"}, to=sid)

        hand_cards = current["hand"].get_cards()
        for card in new_cards:
            if card not in hand_cards:
                return await sio.emit("error", {"message": f"Card {card} is not in your hand"}, to=sid)

        existing = target_melds[meld_index]
        meld_type = existing["type"]
        combined_cards = existing["cards"] + new_cards
        combined_meld = SetMeld(combined_cards) if meld_type == "set" else RunMeld(combined_cards)

        if not combined_meld.is_valid():
            return await sio.emit("error", {"message": "Adding those cards does not produce a valid meld"}, to=sid)

        for card in new_cards:
            current["hand"].discard_card(card)
        existing["cards"] = combined_cards

        await sio.emit(
            "meld_updated",
            {
                "target_player": target_name,
                "meld_index": meld_index,
                "meld": {"type": meld_type, "cards": [card_to_dict(c) for c in combined_cards]},
            },
            room=game_code,
        )
        await sio.emit("hand_updated", {"hand": hand_to_list(current["hand"])}, to=sid)

    @sio.event
    async def discard_card(sid, data):
        """
        Client emits:  { game_code: str, card: {rank, suit} }

        Ends the player's turn. If they go out (laid down + empty hand), triggers round-over.

        Server emits:  card_discarded { player_name, card, discard_top, deck_size }  → room
                       hand_updated { hand }  → player only
        Then either:
          round_over → game_over  OR  round_started + game_state
          turn_started { current_player, phase }  → room
        """
        game_code = (data.get("game_code") or "").strip().upper()
        card_data = data.get("card")

        if game_code not in games:
            return await sio.emit("error", {"message": "Game not found"}, to=sid)
        session = games[game_code]

        current = get_current_player(session)
        if current["sid"] != sid:
            return await sio.emit("error", {"message": "It is not your turn"}, to=sid)
        if session["phase"] != "play":
            return await sio.emit("error", {"message": "Draw a card before discarding"}, to=sid)

        try:
            card = dict_to_card(card_data)
        except (KeyError, ValueError, TypeError) as exc:
            return await sio.emit("error", {"message": f"Invalid card data: {exc}"}, to=sid)

        if card not in current["hand"].get_cards():
            return await sio.emit("error", {"message": "That card is not in your hand"}, to=sid)

        current["hand"].discard_card(card)
        session["discard_pile"].add_card(card)

        await sio.emit(
            "card_discarded",
            {
                "player_name": current["name"],
                "card": card_to_dict(card),
                "discard_top": card_to_dict(card),
                "deck_size": len(session["deck"]),
            },
            room=game_code,
        )
        await sio.emit("hand_updated", {"hand": hand_to_list(current["hand"])}, to=sid)

        if RulesEngine.can_go_out(current["hand"], current["has_laid_down"]):
            await _end_round(sio, session, game_code)
            return

        # Advance to next player
        session["current_player_idx"] = (session["current_player_idx"] + 1) % len(session["players"])
        session["phase"] = "draw"

        next_player = get_current_player(session)
        await sio.emit(
            "turn_started",
            {"current_player": next_player["name"], "phase": "draw"},
            room=game_code,
        )


async def _end_round(sio, session: dict, game_code: str) -> None:
    """Score the round, then start the next or end the game."""
    round_scores = {p["name"]: p["hand"].calculate_value() for p in session["players"]}
    for name, score in round_scores.items():
        session["total_scores"][name] += score

    await sio.emit(
        "round_over",
        {
            "round_number": session["round_number"],
            "round_scores": round_scores,
            "total_scores": dict(session["total_scores"]),
        },
        room=game_code,
    )

    if session["round_number"] >= len(CONTRACTS):
        winner = min(session["total_scores"], key=session["total_scores"].get)
        session["phase"] = "game_over"
        await sio.emit(
            "game_over",
            {"winner": winner, "final_scores": dict(session["total_scores"])},
            room=game_code,
        )
        games.pop(game_code, None)
    else:
        session["round_number"] += 1
        init_round(session)

        contract = session["contract"]
        await sio.emit(
            "round_started",
            {
                "round_number": session["round_number"],
                "contract": {
                    "required_sets": contract.required_sets,
                    "required_runs": contract.required_runs,
                },
            },
            room=game_code,
        )
        for p in session["players"]:
            if p["sid"]:
                await sio.emit("game_state", build_player_view(session, p["name"]), to=p["sid"])
