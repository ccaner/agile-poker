const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Initialize database
const db = new sqlite3.Database(path.join(__dirname, 'agile-poker.db'), (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    // Drop existing tables
    db.serialize(() => {
      db.run('DROP TABLE IF EXISTS votes');
      db.run('DROP TABLE IF EXISTS stories');
      db.run('DROP TABLE IF EXISTS users');
      db.run('DROP TABLE IF EXISTS games');
      createTables();
    });
  }
});

// Create tables
function createTables() {
  db.serialize(() => {
    // Games table
    db.run(`CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      users TEXT,
      stories TEXT,
      current_story_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      game_id TEXT,
      name TEXT NOT NULL,
      is_admin BOOLEAN DEFAULT 0,
      FOREIGN KEY (game_id) REFERENCES games(id)
    )`);

    // Stories table
    db.run(`CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      game_id TEXT,
      title TEXT NOT NULL,
      jira_link TEXT,
      status TEXT DEFAULT 'voting',
      final_point INTEGER,
      FOREIGN KEY (game_id) REFERENCES games(id)
    )`);

    // Votes table
    db.run(`CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY,
      story_id TEXT,
      user_id TEXT,
      points INTEGER,
      FOREIGN KEY (story_id) REFERENCES stories(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
  });
}

// Helper function to promisify database operations
function runQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Helper function to run a single query and get the first result
function runQuerySingle(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Helper function to run an insert/update/delete query
function runCommand(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

// Game operations
async function createGame(game) {
  const id = uuidv4();
  await runCommand(
    'INSERT INTO games (id, name, status, users, stories, current_story_index) VALUES (?, ?, ?, ?, ?, ?)',
    [
      id,
      game.name,
      game.status || 'active',
      JSON.stringify(game.users || []),
      JSON.stringify(game.stories || []),
      game.currentStoryIndex || 0
    ]
  );
  return id;
}

async function getGames() {
  const games = await runQuery('SELECT * FROM games');
  const gamesMap = {};
  
  for (const game of games) {
    gamesMap[game.id] = {
      id: game.id,
      name: game.name,
      status: game.status,
      users: JSON.parse(game.users),
      stories: JSON.parse(game.stories),
      currentStoryIndex: game.current_story_index
    };
  }
  
  return gamesMap;
}

async function getGame(id) {
  const game = await runQuerySingle('SELECT * FROM games WHERE id = ?', [id]);
  if (!game) return null;
  
  return {
    id: game.id,
    name: game.name,
    status: game.status,
    users: JSON.parse(game.users),
    stories: JSON.parse(game.stories),
    currentStoryIndex: game.current_story_index
  };
}

async function updateGame(id, game) {
  await runCommand(
    'UPDATE games SET name = ?, status = ?, users = ?, stories = ?, current_story_index = ? WHERE id = ?',
    [
      game.name,
      game.status,
      JSON.stringify(game.users),
      JSON.stringify(game.stories),
      game.currentStoryIndex,
      id
    ]
  );
}

// User operations
async function addUser(gameId, user) {
  const game = await getGame(gameId);
  if (!game) throw new Error('Game not found');
  
  const users = [...game.users, user];
  await runCommand(
    'UPDATE games SET users = ? WHERE id = ?',
    [JSON.stringify(users), gameId]
  );
  return user;
}

async function getUsers(gameId) {
  const game = await getGame(gameId);
  if (!game) throw new Error('Game not found');
  return game.users;
}

// Story operations
async function addStory(gameId, story) {
  const game = await getGame(gameId);
  if (!game) throw new Error('Game not found');
  
  const stories = [...game.stories, story];
  await runCommand(
    'UPDATE games SET stories = ? WHERE id = ?',
    [JSON.stringify(stories), gameId]
  );
  return story;
}

async function getStories(gameId) {
  const game = await getGame(gameId);
  if (!game) throw new Error('Game not found');
  return game.stories;
}

async function updateStoryStatus(gameId, storyId, status) {
  const game = await getGame(gameId);
  if (!game) throw new Error('Game not found');
  
  const stories = game.stories.map(story => 
    story.id === storyId ? { ...story, status } : story
  );
  
  await runCommand(
    'UPDATE games SET stories = ? WHERE id = ?',
    [JSON.stringify(stories), gameId]
  );
  return stories.find(story => story.id === storyId);
}

// Vote operations
async function addVote(gameId, storyId, userId, value) {
  const game = await getGame(gameId);
  if (!game) throw new Error('Game not found');
  
  const votes = game.votes || {};
  if (!votes[storyId]) {
    votes[storyId] = {};
  }
  votes[storyId][userId] = value;
  
  await runCommand(
    'UPDATE games SET votes = ? WHERE id = ?',
    [JSON.stringify(votes), gameId]
  );
  return { storyId, userId, value };
}

async function getVotes(gameId, storyId) {
  const game = await getGame(gameId);
  if (!game) throw new Error('Game not found');
  
  const votes = game.votes || {};
  return votes[storyId] || {};
}

async function clearVotes(storyId) {
  await runCommand('DELETE FROM votes WHERE story_id = ?', [storyId]);
}

module.exports = {
  createGame,
  getGame,
  getGames,
  updateGame,
  addUser,
  getUsers,
  addStory,
  getStories,
  updateStoryStatus,
  addVote,
  getVotes,
  clearVotes
}; 