"""
Lobby events: create_game, join_game, start_game, connect, disconnect.
"""

from app.hands import Hand
from serializers import build_player_view
from session_manager import games, sid_to_game, generate_game_code, get_current_player, init_round


def register(sio):

    @sio.event
    async def connect(sid, environ):
        print(f"[connect] {sid}")

    @sio.event
    async def disconnect(sid):
        print(f"[disconnect] {sid}")
        game_code = sid_to_game.pop(sid, None)
        if not game_code or game_code not in games:
            return
        session = games[game_code]

        disconnected_name = None
        for p in session["players"]:
            if p["sid"] == sid:
                p["sid"] = None
                disconnected_name = p["name"]
                await sio.emit("player_disconnected", {"player_name": p["name"]}, room=game_code)
                break

        # If no players remain connected during an active game, cancel bots and remove it.
        # In lobby phase we leave the game open — players reconnect via rejoin_lobby.
        if session["phase"] not in ("lobby",) and not any(p["sid"] is not None for p in session["players"]):
            from handlers.turn import _cancel_bot_task
            _cancel_bot_task(game_code)
            games.pop(game_code, None)
            print(f"[disconnect] all players gone — removed game {game_code}")
            return

        # If it's the disconnected player's turn, hand off to the bot immediately
        if disconnected_name and session["phase"] in ("draw", "play"):
            from handlers.turn import _schedule_bot_if_needed
            current = get_current_player(session)
            if current["name"] == disconnected_name:
                _schedule_bot_if_needed(sio, session, game_code)

    @sio.event
    async def create_game(sid, data):
        """
        client send: player_name as a string
        server sends the created game with paramters of game code and  the player name. attributes of the creator
        """
        player_name = (data.get("player_name") or "").strip()
        if not player_name:
            return await sio.emit("error", {"message": "player_name is required"}, to=sid)

        game_code = generate_game_code()
        session: dict = {
            "game_code": game_code,
            "host_name": player_name,
            "phase": "lobby",
            "round_number": 0,
            "contract": None,
            "deck": None,
            "discard_pile": None,
            "melds_on_table": {},
            "current_player_idx": 0,
            "total_scores": {player_name: 0},
            "players": [
                {
                    "name": player_name,
                    "sid": sid,
                    "hand": Hand(),
                    "has_laid_down": False,
                    "score": 0,
                }
            ],
        }
        games[game_code] = session
        sid_to_game[sid] = game_code

        await sio.enter_room(sid, game_code)
        await sio.emit("game_created", {"game_code": game_code, "player_name": player_name}, to=sid)

    @sio.event
    async def join_game(sid, data):
        """
        Client emits:  { game_code: str, player_name: str }
        Server emits:  player_joined { player_name, players: [str] }  → room
        """
        game_code = (data.get("game_code") or "").strip().upper()
        player_name = (data.get("player_name") or "").strip()

        if not game_code or not player_name:
            return await sio.emit("error", {"message": "game_code and player_name are required"}, to=sid)
        if game_code not in games:
            return await sio.emit("error", {"message": "Game not found"}, to=sid)

        session = games[game_code]

        if session["phase"] != "lobby":
            return await sio.emit("error", {"message": "Game already in progress"}, to=sid)
        if len(session["players"]) >= 6:
            return await sio.emit("error", {"message": "Game is full (max 6 players)"}, to=sid)
        if any(p["name"] == player_name for p in session["players"]):
            return await sio.emit("error", {"message": "Name already taken in this game"}, to=sid)

        session["players"].append({
            "name": player_name,
            "sid": sid,
            "hand": Hand(),
            "has_laid_down": False,
            "score": 0,
        })
        session["total_scores"][player_name] = 0
        sid_to_game[sid] = game_code

        await sio.enter_room(sid, game_code)
        await sio.emit(
            "player_joined",
            {"player_name": player_name, "players": [p["name"] for p in session["players"]]},
            room=game_code,
        )

    @sio.event
    async def start_game(sid, data):
        """
        client sends the game code as string. 
        the server will emit that the game has stated with the parameters of round_number and contract.
        it will then send the game state to each player
        """
        game_code = (data.get("game_code") or "").strip().upper()
        if game_code not in games:
            return await sio.emit("error", {"message": "Game not found"}, to=sid)

        session = games[game_code]

        if session["phase"] != "lobby":
            return await sio.emit("error", {"message": "Game already started"}, to=sid)
        if session["players"][0]["sid"] != sid:
            return await sio.emit("error", {"message": "Only the host can start the game"}, to=sid)
        if len(session["players"]) < 2:
            return await sio.emit("error", {"message": "Need at least 2 players to start"}, to=sid)

        session["round_number"] = 1
        init_round(session)

        contract = session["contract"]
        await sio.emit(
            "game_started",
            {
                "round_number": 1,
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

        from handlers.turn import _schedule_bot_if_needed
        _schedule_bot_if_needed(sio, session, game_code)

    @sio.event
    async def rejoin_lobby(sid, data):
        game_code = (data.get("game_code") or "").strip().upper()
        player_name = (data.get("player_name") or "").strip()

        if game_code not in games:
            return await sio.emit("error", {"message": "Game not found"}, to=sid)

        session = games[game_code]

        if session["phase"] != "lobby":
            return await sio.emit("error", {"message": "Game already in progress"}, to=sid)

        player = next((p for p in session["players"] if p["name"] == player_name), None)
        if player is None:
            return await sio.emit("error", {"message": "Player not in this game"}, to=sid)

        player["sid"] = sid
        sid_to_game[sid] = game_code
        await sio.enter_room(sid, game_code)

        await sio.emit(
            "player_joined",
            {"player_name": player_name, "players": [p["name"] for p in session["players"]]},
            room=game_code,
        )
