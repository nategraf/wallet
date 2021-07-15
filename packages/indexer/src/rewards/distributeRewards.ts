import { toTransactionObject } from '@celo/connect'
import asyncPool from 'tiny-async-pool'
import { FIREBASE_PROJECT_ID } from '../config'
import { readFile } from '../util/files'
import { getContractKit } from '../util/utils'
import MerkleDistributor from './merkle/MerkleDistributor.json'

const from = '0xbc7378A2ceC46426378fC3857C0B82FEc276a155'
const privateKey = '2d428190c08a892a0bcf8c2df98f93143ed6e7ec137e014b16be0edf6da019ba'

export async function distributeRewards(contractAddress: string, merkleTreePath: string) {
  const merkleTree: any = await readFile(`${FIREBASE_PROJECT_ID}.appspot.com`, merkleTreePath)

  const kit = await getContractKit()
  kit.addAccount(privateKey)

  // @ts-ignore
  const merkleDistributor = new kit.web3.eth.Contract(MerkleDistributor.abi, contractAddress)
  const distributorMerkleRoot = await merkleDistributor.methods.merkleRoot().call()
  if (merkleTree.merkleRoot != distributorMerkleRoot) {
    console.error(
      `Merkle root: ${merkleTree.merkleRoot} does not match contract root: ${distributorMerkleRoot}`
    )
  }

  await asyncPool(10, Object.keys(merkleTree.claims), async (account: string) => {
    const claim = merkleTree.claims[account]
    const isClaimed = await merkleDistributor.methods.isClaimed(claim.index).call()
    if (isClaimed) {
      return {}
    }
    try {
      const claimTx = toTransactionObject(
        kit.connection,
        merkleDistributor.methods.claim(claim.index, account, claim.amount, claim.proof)
      )
      const receipt = await claimTx.sendAndWaitForReceipt({ from })
      console.info(
        JSON.stringify({
          type: 'ClaimRewardSuccess',
          account,
          transactionHash: receipt.transactionHash,
        })
      )
      return true
    } catch (error) {
      console.error(`Error with claim: ${account}\n${error}`)
      return false
    }
  })
}
