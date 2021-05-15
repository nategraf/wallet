import * as Knex from 'knex'

export async function seed(knex: Knex): Promise<void> {
  await knex('last_blocks').insert({
    key: 'Accounts_AccountWalletAddressSet',
    lastBlock: 0,
  })
  await knex('last_blocks').insert({
    key: 'Attestations_AttestationCompleted',
    lastBlock: 0,
  })
  await knex('last_blocks').insert({
    key: 'cUsd_Transfer',
    lastBlock: 0,
  })
  await knex('last_blocks').insert({
    key: 'Escrow_Transfer',
    lastBlock: 0,
  })
  await knex('last_blocks').insert({
    key: 'Escrow_Withdrawal',
    lastBlock: 0,
  })
  await knex('last_blocks').insert({
    key: 'Escrow_Revocation',
    lastBlock: 0,
  })
}
