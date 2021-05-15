import { knex } from './db'

export async function getLastBlock(key: string) {
  const row = await knex('last_blocks').where({ key: key }).first()
  return row.lastBlock
}

export async function setLastBlock(key: string, block: number) {
  return knex('last_blocks').where({ key: key }).update({ lastBlock: block })
}
