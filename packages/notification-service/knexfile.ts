module.exports = {
  development: {
    // client: "sqlite3",
    // connection: {
    //   filename: "./dev.sqlite3"
    // }
    client: 'postgresql',
    connection: {
      database: 'indexer_mainnet',
      user: 'postgres',
      password: 'docker',
    },
  },

  staging: {
    client: 'postgresql',
    connection: {
      database: 'indexer_mainnet',
      user: 'postgres',
      password: 'docker',
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: 'knex_migrations',
    },
  },

  production: {
    client: 'postgresql',
    connection: {
      database: 'indexer_mainnet',
      user: 'postgres',
      password: 'docker',
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: 'knex_migrations',
    },
  },
}
