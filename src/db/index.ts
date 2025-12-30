import { drizzle } from 'drizzle-orm/bun-sqlite'
import { Database } from 'bun:sqlite'
import * as schema from './schema'
import { mkdir } from 'fs/promises'

// Ensure data directory exists
await mkdir('./data', { recursive: true })

const sqlite = new Database('./data/ecommerce.db')
export const db = drizzle(sqlite, { schema })

export * from './schema'
