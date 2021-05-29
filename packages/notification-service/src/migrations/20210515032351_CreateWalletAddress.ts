import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('account_wallet_mappings', (table) => {
    table.string('accountAddress')
    table.string('walletAddress')
    table.integer('blockNumber')
    table.string('transactionHash')
    table.integer('logIndex')

    table.unique(['transactionHash', 'logIndex'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('account_wallet_mappings')
}
