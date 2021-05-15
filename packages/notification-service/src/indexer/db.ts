import knex from 'knex'

const knexInstance = knex({
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    user: 'postgres',
    password: 'docker',
    database: 'indexer_mainnet',
  },
})

export { knexInstance as knex }
