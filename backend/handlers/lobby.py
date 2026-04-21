"""
Lobby events: create_game, join_game, start_game, connect, disconnect.
"""

from app.hands import Hand
from serializers import build_player_view
from session_manager import games, sid_to_game, generate_game_code, init_round


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
        for p in session["players"]:
            if p["sid"] == sid:
                p["sid"] = None
                await sio.emit("player_disconnected", {"player_name": p["name"]}, room=game_code)
                break

    @sio.event
    async def create_game(sid, data):
        """
        Client emits:  { player_name: str }
        Server emits:  game_created { game_code, player_name }  → creator
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
    async def rejoin_game(sid, data):
        """
        Client emits:  { game_code: str, player_name: str }
        Called after a page reload mid-game. Re-enters the socket room and
        sends the full game state back to the rejoining player.
        Server emits:  game_state  → rejoining player only
        Server emits:  player_reconnected { player_name }  → room
        """
        game_code = (data.get("game_code") or "").strip().upper()
        player_name = (data.get("player_name") or "").strip()

        if game_code not in games:
            return await sio.emit("error", {"message": "Game not found"}, to=sid)

        session = games[game_code]

        if session["phase"] == "lobby":
            return await sio.emit("error", {"message": "Game has not started yet"}, to=sid)

        player = next((p for p in session["players"] if p["name"] == player_name), None)
        if player is None:
            return await sio.emit("error", {"message": "Player not in this game"}, to=sid)

        # Update sid and re-enter the socket room
        player["sid"] = sid
        sid_to_game[sid] = game_code
        await sio.enter_room(sid, game_code)

        # Send full game state to the rejoining player
        await sio.emit(
            "game_state",
            build_player_view(session, player_name),
            to=sid,
        )

        await sio.emit(
            "player_reconnected",
            {"player_name": player_name},
            room=game_code,
        )

    @sio.event
    async def rejoin_lobby(sid, data):
        """
        Client emits:  { game_code: str, player_name: str }
        Called after a page reload so the new socket re-enters the room.
        Updates the player's sid and emits the current player list back.
        Server emits:  player_joined { player_name, players: [str] }  → room
        """
        game_code = (data.get("game_code") or "").strip().upper()
        player_name = (data.get("player_name") or "").strip()

        if game_code not in games:
            return await sio.emit("error", {"message": "Game not found"}, to=sid)

        session = games[game_code]
        player = next((p for p in session["players"] if p["name"] == player_name), None)

        if player is None:
            return await sio.emit("error", {"message": "Player not in this game"}, to=sid)

        # Update sid and re-enter the socket room
        player["sid"] = sid
        sid_to_game[sid] = game_code
        await sio.enter_room(sid, game_code)

        # Send current player list to everyone in the room
        await sio.emit(
            "player_joined",
            {"player_name": player_name, "players": [p["name"] for p in session["players"]]},
            room=game_code,
        )

    @sio.event
    async def start_game(sid, data):
        """
        Client emits:  { game_code: str }
        Only the host can call this. Requires 2–6 players.
        Server emits:  game_started { round_number, contract }  → room
        Then sends:    game_state  → each player individually
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
