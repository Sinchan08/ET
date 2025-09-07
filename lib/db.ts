// lib/db.ts
import { Pool } from 'pg';

// This creates a connection pool. It's an efficient way to manage
// connections to your database. It reads the DATABASE_URL automatically
// from your .env.local file.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// We export an object with a 'query' function that we can use
// anywhere in our backend to talk to the database.
export default {
  query: (text: string, params: any[]) => pool.query(text, params),
};