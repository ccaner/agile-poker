# Agile Planning Poker Backend

This is the backend server for the Agile Planning Poker application. It provides a RESTful API for managing games, users, stories, and votes.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The server will start on port 3001 by default.

## API Endpoints

### Games

- `POST /api/games`
  - Creates a new game
  - Request body: `{ name: string }`
  - Returns: `{ id: string, name: string }`

- `GET /api/games/:gameId`
  - Gets a game by ID
  - Returns: Game object

### Users

- `POST /api/games/:gameId/users`
  - Adds a user to a game
  - Request body: `{ name: string, isAdmin: boolean }`
  - Returns: `{ id: string, name: string, isAdmin: boolean }`

- `GET /api/games/:gameId/users`
  - Gets all users for a game
  - Returns: Array of user objects

### Stories

- `POST /api/games/:gameId/stories`
  - Adds a story to a game
  - Request body: `{ title: string, jiraLink: string }`
  - Returns: `{ id: string, title: string, jiraLink: string }`

- `GET /api/games/:gameId/stories`
  - Gets all stories for a game
  - Returns: Array of story objects

- `PUT /api/stories/:storyId/status`
  - Updates a story's status
  - Request body: `{ status: 'pending' | 'voting' | 'completed' }`
  - Returns: Updated story object

### Votes

- `POST /api/stories/:storyId/votes`
  - Adds a vote to a story
  - Request body: `{ userId: string, points: number }`
  - Returns: `{ id: string, points: number }`

- `GET /api/stories/:storyId/votes`
  - Gets all votes for a story
  - Returns: Array of vote objects

- `DELETE /api/stories/:storyId/votes`
  - Clears all votes for a story
  - Returns: Success message 