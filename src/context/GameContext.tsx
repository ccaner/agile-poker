import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Game, Story, User } from '../types';
import { getGame, saveGame, createGame } from '../utils/db';
import { socketService } from '../utils/socket';

type Vote = {
  gameId: string;
  storyId: string;
  userId: string;
  points: number;
};

type GameAction =
  | { type: 'CREATE_GAME'; payload: { gameName: string; userName: string } }
  | { type: 'JOIN_GAME'; payload: { gameId: string; userName: string } }
  | { type: 'ADD_STORY'; payload: { gameId: string; title: string; jiraLink: string } }
  | { type: 'VOTE'; payload: { gameId: string; storyId: string; userId: string; points: number } }
  | { type: 'FINISH_VOTING'; payload: { gameId: string; storyId: string } }
  | { type: 'CLOSE_STORY'; payload: { gameId: string; storyId: string; finalPoint: number } }
  | { type: 'RESTART_VOTING'; payload: { gameId: string; storyId: string } }
  | { type: 'LOAD_STATE'; payload: { games: { [gameId: string]: Game }; currentGame?: Game } }
  | { type: 'SET_CURRENT_GAME'; payload: { gameId: string } }
  | { type: 'SET_CURRENT_USER'; payload: { userId: string } };

interface GameState {
  games: { [gameId: string]: Game };
  currentGame: Game | null;
  currentUser: User | null;
}

type GameDispatch = (action: GameAction) => void;

const initialState: GameState = {
  games: {},
  currentGame: null,
  currentUser: null
};

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'CREATE_GAME': {
      const { gameName, userName } = action.payload;
      return state;
    }
    case 'JOIN_GAME': {
      const { gameId, userName } = action.payload;
      const game = state.games[gameId];
      if (!game) return state;

      const newUser = {
        id: `user-${Date.now()}`,
        name: userName,
        isAdmin: false
      };

      const updatedGame = {
        ...game,
        users: [...game.users, newUser]
      };

      const newState = {
        ...state,
        games: {
          ...state.games,
          [gameId]: updatedGame
        },
        currentGame: state.currentGame?.id === gameId ? updatedGame : state.currentGame,
        currentUser: newUser
      };

      // Save the updated game to the backend
      saveGame(gameId, newState).catch(error => {
        console.error('Failed to save game after user join:', error);
      });

      return newState;
    }
    case 'ADD_STORY': {
      const { gameId, title, jiraLink } = action.payload;
      const game = state.games[gameId];
      if (!game) return state;

      const newStory = {
        id: `story-${Date.now()}`,
        title,
        jiraLink,
        status: 'voting' as const,
        votes: {}
      };

      const updatedGame = {
        ...game,
        stories: [...game.stories, newStory]
      };

      const newState = {
        ...state,
        games: {
          ...state.games,
          [gameId]: updatedGame
        },
        currentGame: state.currentGame?.id === gameId ? updatedGame : state.currentGame
      };

      // Save the updated game to the backend
      saveGame(gameId, newState).catch(error => {
        console.error('Failed to save game after adding story:', error);
      });

      return newState;
    }
    case 'VOTE': {
      const { gameId, storyId, userId, points } = action.payload;
      const game = state.games[gameId];
      if (!game) return state;

      const updatedStories = game.stories.map(story => {
        if (story.id === storyId) {
          return {
            ...story,
            votes: {
              ...story.votes,
              [userId]: points
            }
          };
        }
        return story;
      });

      const updatedGame = {
        ...game,
        stories: updatedStories
      };

      const newState = {
        ...state,
        games: {
          ...state.games,
          [gameId]: updatedGame
        },
        currentGame: state.currentGame?.id === gameId ? updatedGame : state.currentGame
      };

      // Save the updated game to the backend
      saveGame(gameId, newState).catch(error => {
        console.error('Failed to save game after vote:', error);
      });

      return newState;
    }
    case 'FINISH_VOTING': {
      const { gameId, storyId } = action.payload;
      const game = state.games[gameId];
      if (!game) return state;

      const updatedStories = game.stories.map(story => {
        if (story.id === storyId) {
          return {
            ...story,
            status: 'finished' as const
          };
        }
        return story;
      });

      const updatedGame = {
        ...game,
        stories: updatedStories
      };

      const newState = {
        ...state,
        games: {
          ...state.games,
          [gameId]: updatedGame
        },
        currentGame: state.currentGame?.id === gameId ? updatedGame : state.currentGame
      };

      // Save the updated game to the backend
      saveGame(gameId, newState).catch(error => {
        console.error('Failed to save game after finishing voting:', error);
      });

      return newState;
    }
    case 'CLOSE_STORY': {
      const { gameId, storyId, finalPoint } = action.payload;
      const game = state.games[gameId];
      if (!game) return state;

      const updatedStories = game.stories.map(story => {
        if (story.id === storyId) {
          return {
            ...story,
            status: 'closed' as const,
            finalPoint
          };
        }
        return story;
      });

      const updatedGame = {
        ...game,
        stories: updatedStories
      };

      const newState = {
        ...state,
        games: {
          ...state.games,
          [gameId]: updatedGame
        },
        currentGame: state.currentGame?.id === gameId ? updatedGame : state.currentGame
      };

      // Save the updated game to the backend
      saveGame(gameId, newState).catch(error => {
        console.error('Failed to save game after closing story:', error);
      });

      return newState;
    }
    case 'RESTART_VOTING': {
      const { gameId, storyId } = action.payload;
      const game = state.games[gameId];
      if (!game) return state;

      const updatedStories = game.stories.map(story => {
        if (story.id === storyId) {
          return {
            ...story,
            status: 'voting' as const,
            votes: {}
          };
        }
        return story;
      });

      const updatedGame = {
        ...game,
        stories: updatedStories
      };

      const newState = {
        ...state,
        games: {
          ...state.games,
          [gameId]: updatedGame
        },
        currentGame: state.currentGame?.id === gameId ? updatedGame : state.currentGame
      };

      // Save the updated game to the backend
      saveGame(gameId, newState).catch(error => {
        console.error('Failed to save game after restarting voting:', error);
      });

      return newState;
    }
    case 'LOAD_STATE': {
      return {
        ...state,
        games: action.payload.games,
        ...(action.payload.currentGame && { currentGame: action.payload.currentGame })
      };
    }
    case 'SET_CURRENT_GAME': {
      const { gameId } = action.payload;
      const game = state.games[gameId];
      if (!game) return state;
      
      return {
        ...state,
        currentGame: game
      };
    }
    case 'SET_CURRENT_USER': {
      const { userId } = action.payload;
      const game = state.currentGame;
      if (!game) return state;
      const user = game.users.find(u => u.id === userId);
      if (!user) return state;
      return {
        ...state,
        currentUser: user
      };
    }
    default:
      return state;
  }
};

const GameContext = createContext<{
  state: GameState;
  dispatch: GameDispatch;
  createGame: (gameName: string, userName: string) => Promise<void>;
}>({
  state: initialState,
  dispatch: () => null,
  createGame: async () => {}
});

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Load games and restore user session on mount
  useEffect(() => {
    const loadGames = async () => {
      try {
        const games = await getGame();
        if (games) {
          // First load all games
          dispatch({
            type: 'LOAD_STATE',
            payload: { games }
          });

          // Then try to restore the current game and user
          const savedGameId = localStorage.getItem('currentGameId');
          const savedUserId = localStorage.getItem('currentUserId');
          
          if (savedGameId && savedUserId && games[savedGameId]) {
            const game = games[savedGameId];
            const user = game.users.find(u => u.id === savedUserId);
            
            if (user) {
              dispatch({
                type: 'SET_CURRENT_GAME',
                payload: { gameId: savedGameId }
              });
              dispatch({
                type: 'SET_CURRENT_USER',
                payload: { userId: savedUserId }
              });
            }
          }
        }
      } catch (error) {
        console.error('Error loading games:', error);
      }
    };
    loadGames();
  }, []);

  // Connect to WebSocket server and set up game update listener
  useEffect(() => {
    socketService.connect();
    console.log('Connected to WebSocket server');

    const handleGameUpdate = (updatedGame: Game) => {
      console.log('Received game update:', updatedGame);
      console.log('Current game:', state.currentGame);
      console.log('Current user:', state.currentUser);
      
      // Update the games state
      const updatedGames = {
        ...state.games,
        [updatedGame.id]: updatedGame
      };

      // If this is the current game, update it and current user
      if (state.currentGame?.id === updatedGame.id) {
        console.log('Updating current game');
        const currentUser = state.currentUser;
        const updatedCurrentGame = updatedGame;

        // If we have a current user, make sure their data is up to date
        if (currentUser) {
          const updatedUser = updatedGame.users.find(u => u.id === currentUser.id);
          if (updatedUser) {
            console.log('Updating current user');
            dispatch({
              type: 'SET_CURRENT_USER',
              payload: { userId: updatedUser.id }
            });
          }
        }

        // Update both the games list and current game
        dispatch({
          type: 'LOAD_STATE',
          payload: { 
            games: updatedGames,
            currentGame: updatedCurrentGame
          }
        });

        // Force a re-render by updating the current game
        dispatch({
          type: 'SET_CURRENT_GAME',
          payload: { gameId: updatedGame.id }
        });
      } else {
        console.log('Updating games list only');
        // If it's not the current game, just update the games list
        dispatch({
          type: 'LOAD_STATE',
          payload: { games: updatedGames }
        });
      }
    };

    socketService.onGameUpdate(handleGameUpdate);
    console.log('Registered game update handler');

    return () => {
      socketService.offGameUpdate(handleGameUpdate);
      socketService.disconnect();
    };
  }, [state.games, state.currentGame, state.currentUser]);

  // Join game room when current game changes
  useEffect(() => {
    if (state.currentGame) {
      console.log('Joining game room:', state.currentGame.id);
      socketService.joinGame(state.currentGame.id);
    }
  }, [state.currentGame]);

  // Save current game and user to localStorage when they change
  useEffect(() => {
    if (state.currentGame && state.currentUser) {
      localStorage.setItem('currentGameId', state.currentGame.id);
      localStorage.setItem('currentUserId', state.currentUser.id);
      localStorage.setItem('userName', state.currentUser.name);
    } else {
      localStorage.removeItem('currentGameId');
      localStorage.removeItem('currentUserId');
    }
  }, [state.currentGame, state.currentUser]);

  // Create a wrapper function for game creation
  const createGameWrapper = async (gameName: string, userName: string) => {
    try {
      const game = await createGame(gameName);
      const adminUser = {
        id: `user-${Date.now()}`,
        name: userName,
        isAdmin: true
      };
      
      const updatedGame: Game = {
        ...game,
        users: [adminUser],
        stories: [],
        currentStoryIndex: 0,
        status: 'active'
      };
      
      // Update the game in the backend
      await saveGame(game.id, {
        ...state,
        games: {
          ...state.games,
          [game.id]: updatedGame
        }
      });
      
      // Update local state and set current user
      dispatch({
        type: 'LOAD_STATE',
        payload: { 
          games: {
            ...state.games,
            [game.id]: updatedGame
          }
        }
      });
      
      dispatch({
        type: 'SET_CURRENT_GAME',
        payload: { gameId: game.id }
      });

      dispatch({
        type: 'SET_CURRENT_USER',
        payload: { userId: adminUser.id }
      });
    } catch (error) {
      console.error('Failed to create game:', error);
      throw error;
    }
  };

  return (
    <GameContext.Provider value={{ state, dispatch, createGame: createGameWrapper }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}; 