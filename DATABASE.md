# Database Setup

This application uses **SQLite** with `better-sqlite3` for storing exercise statistics.

## Why SQLite?

SQLite is an excellent choice for this application because:

- **File-based**: No separate database server required
- **Lightweight**: Perfect for small to medium-sized applications
- **Reliable**: ACID-compliant and battle-tested
- **Easy to deploy**: Database file is included with the application
- **Fast**: Excellent performance for read-heavy workloads

## Database Location

The database file is stored at: `data/exercises.db`

This directory is automatically created on first run if it doesn't exist.

## Schema

The database contains a single table:

```sql
CREATE TABLE exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exercise_type TEXT NOT NULL,
  count INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  completed_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
)
```

## Migration to Other Databases

If you need to scale to a larger database (PostgreSQL, MySQL, etc.) in the future, the API routes in `app/api/exercises/route.ts` can be easily modified to use a different database client. The schema is simple and can be adapted to any SQL database.

## Production Considerations

For production deployments:

1. **Backup**: Regularly backup the `data/exercises.db` file
2. **Scaling**: If you need to handle many concurrent users, consider migrating to PostgreSQL
3. **Cloud Storage**: For serverless deployments, consider using a cloud database service
