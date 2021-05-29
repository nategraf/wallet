import { Contract, Event, indexEvents } from './index'

enum Action {
  Transfer = 'Transfer',
  Withdraw = 'Withdraw',
  Revocation = 'Revocation',
}

export async function handleInvites() {
  await indexEvents(
    Contract.Escrow,
    Event.Withdrawal,
    'escrow',
    ({
      transactionHash,
      blockNumber,
      returnValues: { identifier, to, token, value, paymentId },
    }) => ({
      transactionHash,
      blockNumber,
      action: Action.Withdraw,
      from: to,
      identifier,
      token,
      value,
      paymentId,
    })
  )
  await indexEvents(
    Contract.Escrow,
    Event.Transfer,
    'escrow',
    ({
      transactionHash,
      blockNumber,
      returnValues: { from, identifier, token, value, paymentId },
    }) => ({
      transactionHash,
      blockNumber,
      action: Action.Transfer,
      from,
      identifier,
      token,
      value,
      paymentId,
    })
  )
  await indexEvents(
    Contract.Escrow,
    Event.Revocation,
    'escrow',
    ({
      transactionHash,
      blockNumber,
      returnValues: { identifier, by, token, value, paymentId },
    }) => ({
      transactionHash,
      blockNumber,
      action: Action.Revocation,
      from: by,
      identifier,
      token,
      value,
      paymentId,
    })
  )
}
