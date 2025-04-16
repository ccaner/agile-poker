const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'agile-poker.db');

// Create database if it doesn't exist
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    return;
  }
  
  console.log('Connected to database');
  
  // Create tables if they don't exist
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      users TEXT,
      stories TEXT,
      current_story_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Check games table
    db.all('SELECT * FROM games', [], (err, rows) => {
      if (err) {
        console.error('Error reading games table:', err);
      } else {
        console.log('\nGames table:');
        if (rows.length === 0) {
          console.log('No games found');
        } else {
          rows.forEach(row => {
            // Parse JSON fields
            try {
              if (row.users) row.users = JSON.parse(row.users);
              if (row.stories) row.stories = JSON.parse(row.stories);
            } catch (e) {
              console.log('Error parsing JSON:', e);
            }
            console.log(JSON.stringify(row, null, 2));
          });
        }
      }
      
      // Close the database connection
      db.close();
    });
  });
}); 