import { Contract, Event, indexEvents } from './index'

export async function handleAttestations() {
  await indexEvents(
    Contract.Attestations,
    Event.AttestationCompleted,
    'attestations_completed',
    ({ transactionHash, blockNumber, returnValues: { identifier, account, issuer } }) => ({
      transactionHash,
      blockNumber,
      identifier,
      account,
      issuer,
    })
  )
}
