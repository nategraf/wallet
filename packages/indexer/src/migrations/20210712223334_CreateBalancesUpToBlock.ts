import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('partial_balances', (table) => {
    table.string('address')
    table.integer('blockUpdated')
    table.decimal('value', 32, 0)

    table.unique(['address'])
  })
  await knex.schema.alterTable('partial_balances', (table) => {
    table.index('address')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('partial_balances')
}
