import BigNumber from 'bignumber.js'
import * as functions from 'firebase-functions'
import fs from 'fs'
import { initDatabase, runRawSql } from '../database/db'
import { createMerkleTree } from './merkleCreator'
import {
  averageBalancesSql,
  verifiedUsersSql,
  walletAddressesFromAccountAddressesSql,
} from './rewardsSql'

const REWARD_PERCENT = 0.05 * (7 / 365)

export async function generateAndDeployMerkleDistributor() {
  const rewardsByAddress = await calculateRewardsByAddress(6740993, 6861951) //5280814, 5400814)
  outputToFile('rewardsByAddress.json', rewardsByAddress, 'Reward amounts')
  const merkleData = createMerkleTree(rewardsByAddress)
  outputToFile('merkleTree.json', merkleData, 'Merkle Tree')
}

function outputToFile(filename: string, output: any, outputDetails: string) {
  fs.writeFile(filename, JSON.stringify(output, null, 2), (err) => {
    if (err) console.error(err)
  })
  console.log(outputDetails, ' output to file: ', filename)
}

async function calculateRewardsByAddress(fromBlock: number, toBlock: number) {
  const blocksInRange = toBlock - fromBlock
  const verifiedUsers = await runRawSql(verifiedUsersSql)
  console.info(`Got ${verifiedUsers.length} verified users`)
  const rewardsByAddress: { [address: string]: number } = {}
  let noWalletInfo = 0
  let noBalance = 0
  let ignored = 0
  let totalRewards = 0
  let index = 0
  for (const { accounts } of verifiedUsers) {
    index++
    if (index % 10 === 0) {
      console.log({
        index,
        noWalletInfo,
        noBalance,
        ignored,
        totalRewards,
      })
    }
    const walletAddressContainers = await runRawSql(
      walletAddressesFromAccountAddressesSql(accounts)
    )
    if (walletAddressContainers.length === 0) {
      noWalletInfo++
      continue
    }
    const walletAddresses = walletAddressContainers.map((container: any) => container.walletAddress)
    console.time('balances')
    const addressesBalances = await runRawSql(
      averageBalancesSql(walletAddresses, fromBlock, toBlock)
    )
    console.timeEnd('balances')
    if (addressesBalances.length === 0) {
      noBalance++
      continue
    }
    let bestAddress
    let bestAverageBalance
    for (const {
      address,
      starting_balance: startingBalanceString,
      movements,
    } of addressesBalances) {
      const startingBalance = new BigNumber(startingBalanceString)
      if (movements?.length ?? 0 === 0) {
        if (!bestAverageBalance || startingBalance > bestAverageBalance) {
          bestAddress = address
          bestAverageBalance = startingBalance
        }
      } else {
        const sortedMovements = movements
          .sort((a: any[], b: any[]) => a[1] - b[1])
          .map((movement: any[]) => ({
            transferValue: new BigNumber(movement[0]),
            blockNumber: movement[1],
          }))
        let currentBlock = sortedMovements[0].blockNumber
        let averageBalance = startingBalance.dividedBy((currentBlock - fromBlock) / blocksInRange)
        let lastBalance = startingBalance.plus(sortedMovements[0].transferValue)
        for (let i = 1; i < sortedMovements.length; i++) {
          currentBlock = sortedMovements[i].blockNumber
          if (currentBlock !== sortedMovements[i - 1].blockNumber) {
            averageBalance = averageBalance.plus(
              lastBalance.dividedBy(
                (currentBlock - sortedMovements[i - 1].blockNumber) / blocksInRange
              )
            )
          }
          lastBalance = lastBalance.plus(sortedMovements[i].transferValue)
        }
        if (toBlock > sortedMovements[-1].blockNumber) {
          averageBalance = averageBalance.plus(
            lastBalance.dividedBy((toBlock - sortedMovements[-1].blockNumber) / blocksInRange)
          )
        }
        if (!bestAverageBalance || averageBalance > bestAverageBalance) {
          bestAddress = address
          bestAverageBalance = averageBalance
        }
      }
    }
    if (bestAddress && bestAverageBalance) {
      const reward = bestAverageBalance?.multipliedBy(REWARD_PERCENT).toNumber()
      totalRewards += reward
      rewardsByAddress[bestAddress] = reward
    } else {
      ignored++
    }
  }
  return rewardsByAddress
}

export const generateMerkleDistributor = functions.https.onRequest(async (_, response) => {
  await initDatabase()
  await generateAndDeployMerkleDistributor()
  response.end()
})
