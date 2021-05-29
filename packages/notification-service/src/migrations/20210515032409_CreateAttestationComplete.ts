import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('attestations_completed', (table) => {
    table.string('identifier')
    table.string('account')
    table.string('issuer')
    table.integer('blockNumber')
    table.string('transactionHash')
    table.integer('logIndex')

    table.unique(['transactionHash', 'logIndex'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('attestations_completed')
}
