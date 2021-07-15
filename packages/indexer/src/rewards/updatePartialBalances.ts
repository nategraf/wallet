import asyncPool from 'tiny-async-pool'
import { database, runRawSql } from '../database/db'
import { movementsBetweenBlocksSql } from './rewardsSql'

export async function updatePartialBalances(fromBlock: number, toBlock: number) {
  const balanceChanges = await runRawSql(movementsBetweenBlocksSql(fromBlock, toBlock))
  console.info('Total addresses with changes', balanceChanges.length)
  await asyncPool(
    40,
    balanceChanges,
    async ({ address, difference }: { address: string; difference: string }) => {
      const updated = await database('partial_balances')
        .where({ address })
        .update({
          blockUpdated: toBlock,
          value: database.raw(`${difference} + value`),
        })
        .returning('*')
      if (!updated.length) {
        await database('partial_balances').insert({
          address,
          blockUpdated: toBlock,
          value: difference,
        })
      }
    }
  )
}
