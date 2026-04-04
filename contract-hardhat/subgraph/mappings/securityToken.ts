import { BigInt, Address } from '@graphprotocol/graph-ts'

import {
  Transfer as TransferEvent,
  CheckpointCreated as CheckpointCreatedEvent,
} from '../../generated/templates/SecurityToken/SecurityToken'
import {
  Transfer,
  Account,
  TokenBalance,
  CheckpointBalance,
  AccountUser,
  Aggregate,
} from '../../generated/schema'

function getOrCreateAccount(address: string): Account {
  let account = Account.load(address)
  if (!account) {
    account = new Account(address)
    account.save()
  }
  return account
}

function getOrCreateAggregate(tokenAddress: string): Aggregate {
  let agg = Aggregate.load(tokenAddress)
  if (!agg) {
    agg = new Aggregate(tokenAddress)
    agg.currentCheckpoint = BigInt.fromI32(0)
    agg.currentDividendId = BigInt.fromI32(0)
    agg.save()
  }
  return agg
}

function getOrCreateTokenBalance(userAddress: string, tokenAddress: string): TokenBalance {
  let id = userAddress + '-' + tokenAddress
  let tb = TokenBalance.load(id)
  if (!tb) {
    tb = new TokenBalance(id)
    tb.user = userAddress
    tb.token = tokenAddress
    tb.balance = BigInt.fromI32(0)
    tb.dividendAmount = BigInt.fromI32(0)
    tb.save()
  }
  return tb
}

export function handleTransfer(event: TransferEvent): void {
  let tokenAddress = event.address.toHexString()
  let fromAddress = event.params.from.toHexString()
  let toAddress = event.params.to.toHexString()

  getOrCreateAccount(fromAddress)
  getOrCreateAccount(toAddress)

  // Current checkpoint from Aggregate
  let agg = getOrCreateAggregate(tokenAddress)
  let currentCheckpoint = agg.currentCheckpoint

  // Transfer entity (id = txHash, matching prod)
  let transfer = new Transfer(event.transaction.hash.toHexString())
  transfer.token = tokenAddress
  transfer.from = fromAddress
  transfer.to = toAddress
  transfer.value = event.params.value
  transfer.transactionHash = event.transaction.hash
  transfer.blockNumber = event.block.number
  transfer.timestamp = event.block.timestamp
  transfer.save()

  // Update 'from' TokenBalance
  let fromTB = getOrCreateTokenBalance(fromAddress, tokenAddress)
  fromTB.balance = fromTB.balance.minus(event.params.value)
  fromTB.save()

  // Update 'to' TokenBalance
  let toTB = getOrCreateTokenBalance(toAddress, tokenAddress)
  toTB.balance = toTB.balance.plus(event.params.value)
  toTB.save()

  // Snapshot CheckpointBalance for 'from'
  let fromCBId = tokenAddress + '-' + currentCheckpoint.toString() + '-' + fromAddress
  let fromCB = new CheckpointBalance(fromCBId)
  fromCB.tokenBalance = fromTB.id
  fromCB.user = fromAddress
  fromCB.balance = fromTB.balance
  fromCB.currentCheckpoint = currentCheckpoint
  fromCB.timestamp = event.block.timestamp
  fromCB.blockNumber = event.block.number
  fromCB.save()

  // Snapshot CheckpointBalance for 'to'
  let toCBId = tokenAddress + '-' + currentCheckpoint.toString() + '-' + toAddress
  let toCB = new CheckpointBalance(toCBId)
  toCB.tokenBalance = toTB.id
  toCB.user = toAddress
  toCB.balance = toTB.balance
  toCB.currentCheckpoint = currentCheckpoint
  toCB.timestamp = event.block.timestamp
  toCB.blockNumber = event.block.number
  toCB.save()

  // Update AccountUser investor list for this token (skip zero address)
  if (event.params.to != Address.zero()) {
    let accountUser = AccountUser.load(tokenAddress)
    if (!accountUser) {
      accountUser = new AccountUser(tokenAddress)
      accountUser.user = []
    }
    let users = accountUser.user
    let found = false
    for (let i = 0; i < users.length; i++) {
      if (users[i] == toAddress) {
        found = true
        break
      }
    }
    if (!found) {
      users.push(toAddress)
      accountUser.user = users
      accountUser.save()
    }
  }
}

export function handleCheckpointCreated(event: CheckpointCreatedEvent): void {
  let tokenAddress = event.address.toHexString()
  let agg = getOrCreateAggregate(tokenAddress)
  agg.currentCheckpoint = event.params._checkpointId
  agg.save()
}
