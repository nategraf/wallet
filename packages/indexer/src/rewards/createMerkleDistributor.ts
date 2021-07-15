import BigNumber from 'bignumber.js'
import { performance } from 'perf_hooks'
import { FIREBASE_PROJECT_ID } from '../config'
import { runRawSql } from '../database/db'
import { uploadFile } from '../util/files'
import { deployDistributor } from './merkle/distributorDeployer'
import { createMerkleTree } from './merkle/merkleCreator'
import { usersToRewardSql } from './rewardsSql'

export const WEI_PER_UNIT = 1000000000000000000
const REWARD_PERCENT = 0.05 * (7 / 365)
const MAX_ELIGIBLE_BALANCE = new BigNumber(1000 * WEI_PER_UNIT)
const MIN_REWARD = 0.01 * WEI_PER_UNIT

export async function createAndDeployMerkleDistributor(fromBlock: number, toBlock: number) {
  const rewardsByAddress = await calculateRewardsByAddress(fromBlock, toBlock)
  const directory = `rewardDistributions/${Date.now()}`
  await outputToFileAndUpload(directory, 'rewardsByAddress.json', rewardsByAddress)
  const merkleTree = createMerkleTree(rewardsByAddress)
  await outputToFileAndUpload(directory, 'merkleTree.json', merkleTree)
  return {
    ...(await deployDistributor(merkleTree)),
    rewardsByAddress: `${directory}/rewardsByAddress.json`,
    merkleTree: `${directory}/merkleTree.json`,
  }
}

async function outputToFileAndUpload(directory: string, fileName: string, output: any) {
  console.debug('Starting file upload: ', fileName)
  await uploadFile(
    `${FIREBASE_PROJECT_ID}.appspot.com`,
    `${directory}/${fileName}`,
    JSON.stringify(output)
  )
}

async function calculateRewardsByAddress(fromBlock: number, toBlock: number) {
  const blocksInRange = toBlock - fromBlock
  const t0 = performance.now()
  const usersToReward: any[] = await runRawSql(usersToRewardSql(fromBlock, toBlock))
  const timeToFetchUsers = performance.now() - t0
  console.info(`Got ${usersToReward.length} verified users in ${timeToFetchUsers}ms`)

  const accountsByIdentifier: { [identifier: string]: any } = {}
  usersToReward.reduce((accum: any, item: any) => {
    if (!accum[item.identifier]) {
      accum[item.identifier] = []
    }
    accum[item.identifier].push({
      address: item.walletAddress,
      startingBalance: item.startingBalance,
      movements: item.movements,
    })
    return accum
  }, accountsByIdentifier)

  const rewardsByAddress: { [address: string]: number } = {}

  for (const identifier of Object.keys(accountsByIdentifier)) {
    let bestAddress
    let bestAverageBalance
    for (const {
      address,
      startingBalance: startingBalanceString,
      movements,
    } of accountsByIdentifier[identifier]) {
      const startingBalance = new BigNumber(startingBalanceString ?? 0)
      if (movements?.length ?? 0 === 0) {
        if (!bestAverageBalance || startingBalance.isGreaterThan(bestAverageBalance)) {
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
        if (!bestAverageBalance || averageBalance.isGreaterThan(bestAverageBalance)) {
          bestAddress = address
          bestAverageBalance = averageBalance
        }
      }
    }
    if (bestAddress && bestAverageBalance && bestAverageBalance.gt(0)) {
      const balance = bestAverageBalance.gt(MAX_ELIGIBLE_BALANCE)
        ? MAX_ELIGIBLE_BALANCE
        : bestAverageBalance
      const reward = balance.multipliedBy(REWARD_PERCENT).decimalPlaces(0).toNumber()
      rewardsByAddress[bestAddress] = Math.max(reward, MIN_REWARD)
    }
  }

  return rewardsByAddress
}
