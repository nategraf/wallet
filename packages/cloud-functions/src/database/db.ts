import { Knex, knex } from 'knex'
import { DB_CONFIG } from '../config'

let db: Knex
export async function initDatabase() {
  db = knex({
    client: 'pg',
    connection: {
      host: DB_CONFIG.host,
      database: DB_CONFIG.database,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password,
    },
    debug: false, // TODO: Read this from env variable
  })

  console.info('Database initialized successfully')
  return db
}

export function database(tableName: string) {
  if (!db) {
    throw new Error('Database not yet initialized')
  }

  return db(tableName)
}

export async function runRawSql(sql: string) {
  if (!db) {
    throw new Error('Database not yet initialized')
  }
  const result = await db.raw(sql)
  return result.rows
}
