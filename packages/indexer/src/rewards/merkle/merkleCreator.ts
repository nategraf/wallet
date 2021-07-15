import { BigNumber } from 'ethers'
import BalanceTree from './balance-tree'

export function createMerkleTree(rawRewardsByAddress: { [address: string]: number }) {
  const rewardsByAddress: { [address: string]: BigNumber } = {}
  for (const address of Object.keys(rawRewardsByAddress)) {
    rewardsByAddress[address] = BigNumber.from(`0x${rawRewardsByAddress[address].toString(16)}`)
  }

  const sortedAddresses = Object.keys(rewardsByAddress).sort()

  // construct a tree
  const tree = new BalanceTree(
    sortedAddresses.map((address) => ({
      account: address,
      amount: rewardsByAddress[address],
    }))
  )

  // generate claims
  const claims = sortedAddresses.reduce<{
    [address: string]: {
      amount: string
      index: number
      proof: string[]
    }
  }>((memo, address, index) => {
    const amount = rewardsByAddress[address]
    memo[address] = {
      index,
      amount: amount.toHexString(),
      proof: tree.getProof(index, address, amount),
    }
    return memo
  }, {})

  const tokenTotal: BigNumber = sortedAddresses.reduce<BigNumber>(
    (memo, key) => memo.add(rewardsByAddress[key]),
    BigNumber.from(0)
  )

  return {
    merkleRoot: tree.getHexRoot(),
    tokenTotal: tokenTotal.toHexString(),
    contractAddress: '0x0',
    claims,
  }
}
