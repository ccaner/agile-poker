import { io, Socket } from 'socket.io-client';
import { Game } from '../types';

const SOCKET_URL = 'http://localhost:3001';

export const socketService = {
  socket: null as Socket | null,
  gameUpdateHandlers: new Set<(game: Game) => void>(),

  connect() {
    if (this.socket) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    this.socket.on('gameUpdate', (game: Game) => {
      console.log('Received game update:', game);
      this.gameUpdateHandlers.forEach(handler => handler(game));
    });
  },

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  },

  joinGame(gameId: string) {
    if (this.socket) {
      this.socket.emit('joinGame', gameId);
    }
  },

  onGameUpdate(handler: (game: Game) => void) {
    this.gameUpdateHandlers.add(handler);
  },

  offGameUpdate(handler: (game: Game) => void) {
    this.gameUpdateHandlers.delete(handler);
  },
}; 