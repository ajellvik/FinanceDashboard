const Database = require('better-sqlite3');
const path = require('path');

let db;

function getDb() {
  if (!db) {
    // For Vercel, we'll use a temporary database
    // In production, you should use a cloud database like PostgreSQL
    const dbPath = process.env.DATABASE_PATH || '/tmp/finance.db';
    db = new Database(dbPath);
    
    // Create tables if they don't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticker TEXT NOT NULL,
        type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS portfolio_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        total_value REAL NOT NULL,
        holdings TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  return db;
}

module.exports = { getDb };
