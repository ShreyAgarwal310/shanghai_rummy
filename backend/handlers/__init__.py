from handlers.lobby import register as register_lobby
from handlers.turn import register as register_turn


def register_all(sio):
    register_lobby(sio)
    register_turn(sio)
