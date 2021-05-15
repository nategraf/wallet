import { Contract, Event, indexEvents } from './index'

export async function handleAccountMappings() {
  await indexEvents(
    Contract.Accounts,
    Event.AccountWalletAddressSet,
    'account_wallet_mappings',
    ({ transactionHash, blockNumber, returnValues: { account, walletAddress } }) => ({
      transactionHash,
      blockNumber,
      accountAddress: account,
      walletAddress,
    })
  )
}
