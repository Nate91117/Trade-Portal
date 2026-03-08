import { neon } from '@neondatabase/serverless';

// Module-level singleton — one connection string per cold start
export const sql = neon(process.env.DATABASE_URL!);
