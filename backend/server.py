"""
Entry point for the Shanghai Rummy WebSocket server.

Run with:
  uvicorn server:socket_app --host 0.0.0.0 --port 8000 --reload
"""

import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from handlers import register_all

 #app handler

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

#register all socket.io handelers
register_all(sio)

# ── REST ──────────────────────────────────────────────────────────────────────


@app.get("/health")
async def health():
    from session_manager import games
    return {"status": "ok", "active_games": len(games)}
