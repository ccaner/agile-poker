import { Game, GameState } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

export async function createGame(name: string): Promise<Game> {
  const response = await fetch(`${API_BASE_URL}/games`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error('Failed to create game');
  }
  const game = await response.json();
  return game;
}

export async function getGame(gameId?: string): Promise<{ [gameId: string]: Game } | null> {
  try {
    if (gameId) {
      const response = await fetch(`${API_BASE_URL}/games/${gameId}`);
      if (!response.ok) {
        return null;
      }
      const game = await response.json();
      return { [game.id]: game };
    }
    
    const response = await fetch(`${API_BASE_URL}/games`);
    if (!response.ok) {
      return null;
    }
    const games = await response.json();
    return games;
  } catch (error) {
    console.error('Error fetching game:', error);
    return null;
  }
}

export async function saveGame(gameId: string, state: GameState): Promise<void> {
  const game = state.games[gameId];
  if (!game) {
    throw new Error('Game not found');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(game),
    });

    if (!response.ok) {
      throw new Error('Failed to save game');
    }

    // Wait for the response to ensure the game was saved
    const updatedGame = await response.json();
    console.log('Game saved successfully:', updatedGame);
  } catch (error) {
    console.error('Error saving game:', error);
    throw new Error('Failed to save game');
  }
} 