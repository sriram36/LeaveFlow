from app.logging_config import logger
from fastapi import WebSocket
from typing import Dict, List, Optional
import json

from app.models import User

class ConnectionManager:
    def __init__(self):
        # Map WebSocket connection to the authenticated User object
        self.active_connections: Dict[WebSocket, User] = {}

    async def connect(self, websocket: WebSocket, user: User):
        await websocket.accept()
        self.active_connections[websocket] = user

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            del self.active_connections[websocket]

    async def broadcast(self, message: dict, target_users: Optional[List[int]] = None, target_roles: Optional[List[str]] = None):
        """
        Broadcast a message to specific users or roles.
        If target_users and target_roles are both None, broadcasts to everyone (use with caution).
        """
        payload = json.dumps(message)
        dead_connections = []
        
        for connection, user in self.active_connections.items():
            # Check if this connection should receive the message
            should_send = False
            
            if target_users is None and target_roles is None:
                should_send = True
            elif target_users is not None and user.id in target_users:
                should_send = True
            elif target_roles is not None and user.role and user.role.value in target_roles:
                should_send = True
                
            if should_send:
                try:
                    await connection.send_text(payload)
                except Exception as e:
                    logger.error(f"[WebSocket] Error broadcasting to {user.id}: {e}")
                    dead_connections.append(connection)
        
        for dead in dead_connections:
            self.disconnect(dead)

manager = ConnectionManager()
