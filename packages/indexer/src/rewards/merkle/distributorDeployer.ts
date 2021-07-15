import { toTransactionObject } from '@celo/connect'
import { BigNumber } from 'bignumber.js'
import { getContractKit } from '../../util/utils'
import MerkleDistributor from './MerkleDistributor.json'

const from = '0xbc7378A2ceC46426378fC3857C0B82FEc276a155'
const privateKey = '2d428190c08a892a0bcf8c2df98f93143ed6e7ec137e014b16be0edf6da019ba'

export async function deployDistributor(merkleTree: any) {
  const kit = await getContractKit()
  kit.addAccount(privateKey)
  const cUsdToken = await kit.contracts.getStableToken()
  const abi = MerkleDistributor.abi

  // @ts-ignore - web3 is rejecting abi format even though it is correct.
  let merkleDistributor = new kit.web3.eth.Contract(abi)
  let txResult = await toTransactionObject(
    kit.connection,
    // @ts-ignore - web3 Object instead of CeloTxObject
    merkleDistributor.deploy({
      data: '0x' + MerkleDistributor.bytecode,
      arguments: [cUsdToken.address, merkleTree.merkleRoot],
    })
  ).sendAndWaitForReceipt({ from })

  // @ts-ignore
  let contract = new kit.web3.eth.Contract(abi, txResult.contractAddress)
  merkleTree.contractAddress = contract.options.address

  return {
    contractAddress: contract.options.address,
    merkleRoot: await contract.methods.merkleRoot().call(),
    tokenAddress: await contract.methods.token().call(),
    totalRewards: new BigNumber(merkleTree.tokenTotal).toFixed(0),
  }
}
