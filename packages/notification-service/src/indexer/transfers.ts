import { Contract, Event, indexEvents } from './index'

export async function handlecUsdTransfers() {
  await indexEvents(
    Contract.cUsd,
    Event.Transfer,
    'transfers',
    ({ transactionHash, blockNumber, returnValues: { from, to, value } }) => ({
      transactionHash,
      blockNumber,
      from,
      to,
      value,
      currency: 'cUSD',
    })
  )
}
