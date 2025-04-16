const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const { createGame, getGame, updateGame, addUser, getUsers, addStory, getStories, updateStoryStatus, addVote, getVotes, clearVotes, getGames } = require('./db');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT"]
  }
});

const port = process.env.PORT || 3001;

// Initialize database
const db = new sqlite3.Database('agile-poker.db', (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('joinGame', (gameId) => {
    socket.join(gameId);
    console.log(`User joined game: ${gameId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Helper function to emit game updates to all clients in a game room
const emitGameUpdate = (gameId, game) => {
  console.log(`Emitting game update for game ${gameId}`);
  io.to(gameId).emit('gameUpdate', game);
};

// API Routes
// Get all games
app.get('/api/games', async (req, res) => {
  try {
    const games = await getGames();
    res.json(games);
  } catch (error) {
    console.error('Error getting games:', error);
    res.status(500).json({ error: 'Failed to get games' });
  }
});

app.post('/api/games', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Game name is required' });
    }
    const gameData = {
      name,
      status: 'active',
      users: [],
      stories: [],
      currentStoryIndex: 0
    };
    const gameId = await createGame(gameData);
    const game = await getGame(gameId);
    res.status(201).json(game);
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

app.get('/api/games/:gameId', async (req, res) => {
  try {
    const game = await getGame(req.params.gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
  } catch (error) {
    console.error('Error getting game:', error);
    res.status(500).json({ error: 'Failed to get game' });
  }
});

app.post('/api/games/:gameId/users', async (req, res) => {
  try {
    const { name, isAdmin } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'User name is required' });
    }
    const user = await addUser(req.params.gameId, name, isAdmin);
    res.status(201).json(user);
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ error: 'Failed to add user' });
  }
});

app.get('/api/games/:gameId/users', async (req, res) => {
  try {
    const users = await getUsers(req.params.gameId);
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

app.post('/api/games/:gameId/stories', async (req, res) => {
  try {
    const { title, jiraLink } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Story title is required' });
    }
    const story = await addStory(req.params.gameId, title, jiraLink);
    res.status(201).json(story);
  } catch (error) {
    console.error('Error adding story:', error);
    res.status(500).json({ error: 'Failed to add story' });
  }
});

app.get('/api/games/:gameId/stories', async (req, res) => {
  try {
    const stories = await getStories(req.params.gameId);
    res.json(stories);
  } catch (error) {
    console.error('Error getting stories:', error);
    res.status(500).json({ error: 'Failed to get stories' });
  }
});

app.put('/api/stories/:storyId/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    const story = await updateStoryStatus(req.params.storyId, status);
    res.json(story);
  } catch (error) {
    console.error('Error updating story status:', error);
    res.status(500).json({ error: 'Failed to update story status' });
  }
});

app.post('/api/stories/:storyId/votes', async (req, res) => {
  try {
    const { userId, points } = req.body;
    if (!userId || points === undefined) {
      return res.status(400).json({ error: 'User ID and points are required' });
    }
    const vote = await addVote(req.params.storyId, userId, points);
    res.status(201).json(vote);
  } catch (error) {
    console.error('Error adding vote:', error);
    res.status(500).json({ error: 'Failed to add vote' });
  }
});

app.get('/api/stories/:storyId/votes', async (req, res) => {
  try {
    const votes = await getVotes(req.params.storyId);
    res.json(votes);
  } catch (error) {
    console.error('Error getting votes:', error);
    res.status(500).json({ error: 'Failed to get votes' });
  }
});

app.delete('/api/stories/:storyId/votes', async (req, res) => {
  try {
    await clearVotes(req.params.storyId);
    res.status(204).send();
  } catch (error) {
    console.error('Error clearing votes:', error);
    res.status(500).json({ error: 'Failed to clear votes' });
  }
});

app.put('/api/games/:gameId', async (req, res) => {
  try {
    const game = req.body;
    if (!game) {
      return res.status(400).json({ error: 'Game data is required' });
    }
    await updateGame(req.params.gameId, game);
    // Emit game update to all connected clients
    emitGameUpdate(req.params.gameId, game);
    res.json(game);
  } catch (error) {
    console.error('Error updating game:', error);
    res.status(500).json({ error: 'Failed to update game' });
  }
});

// Start server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 