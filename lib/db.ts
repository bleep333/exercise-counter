import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dbPath = path.join(process.cwd(), 'data', 'exercises.db')
const dbDir = path.dirname(dbPath)

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

// Singleton pattern to prevent multiple database connections
let dbInstance: Database.Database | null = null

function getDatabase(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(dbPath)
    
    // Initialize database schema
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exercise_type TEXT NOT NULL,
        count INTEGER NOT NULL,
        duration INTEGER NOT NULL,
        completed_at TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)
  }
  
  return dbInstance
}

const db = getDatabase()
export default db
