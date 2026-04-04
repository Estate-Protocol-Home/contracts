import { BigInt } from '@graphprotocol/graph-ts'

import {
  NewSecurityToken as NewSecurityTokenEvent,
  NewSecurityToken1 as NewSecurityTokenLegacyEvent,
} from '../../generated/SecurityTokenRegistry/SecurityTokenRegistry'
import { SecurityToken, Aggregate, AccountUser } from '../../generated/schema'
import { SecurityToken as SecurityTokenTemplate } from '../../generated/templates'

function createOrLoadAggregate(tokenAddress: string): Aggregate {
  let agg = Aggregate.load(tokenAddress)
  if (!agg) {
    agg = new Aggregate(tokenAddress)
    agg.currentCheckpoint = BigInt.fromI32(0)
    agg.currentDividendId = BigInt.fromI32(0)
    agg.save()
  }
  return agg
}

function createOrLoadAccountUser(tokenAddress: string): AccountUser {
  let accountUser = AccountUser.load(tokenAddress)
  if (!accountUser) {
    accountUser = new AccountUser(tokenAddress)
    accountUser.user = []
    accountUser.save()
  }
  return accountUser
}

// Full event (specVersion >= 3.0): includes name, polyFee, protocolVersion
export function handleNewSecurityToken(event: NewSecurityTokenEvent): void {
  let tokenAddress = event.params._securityTokenAddress.toHexString()

  let entity = SecurityToken.load(tokenAddress)
  if (!entity) {
    entity = new SecurityToken(tokenAddress)
  }

  entity.ticker = event.params._ticker
  entity.name = event.params._name
  entity.securityTokenAddress = event.params._securityTokenAddress
  entity.owner = event.params._owner
  entity.addedAt = event.params._addedAt
  entity.registrant = event.params._registrant
  entity.fromAdmin = event.params._fromAdmin
  entity.usdFee = event.params._usdFee
  entity.polyFee = event.params._polyFee
  entity.protocolVersion = event.params._protocolVersion
  entity.save()

  createOrLoadAggregate(tokenAddress)
  createOrLoadAccountUser(tokenAddress)

  // Start tracking Transfer and CheckpointCreated events on this token
  SecurityTokenTemplate.create(event.params._securityTokenAddress)
}

// Legacy event: has _name but no _polyFee or _protocolVersion
export function handleNewSecurityTokenLegacy(event: NewSecurityTokenLegacyEvent): void {
  let tokenAddress = event.params._securityTokenAddress.toHexString()

  let entity = SecurityToken.load(tokenAddress)
  if (!entity) {
    entity = new SecurityToken(tokenAddress)
  }

  entity.ticker = event.params._ticker
  entity.name = event.params._name
  entity.securityTokenAddress = event.params._securityTokenAddress
  entity.owner = event.params._owner
  entity.addedAt = event.params._addedAt
  entity.registrant = event.params._registrant
  entity.fromAdmin = event.params._fromAdmin
  entity.usdFee = event.params._registrationFee
  entity.polyFee = BigInt.fromI32(0)
  entity.protocolVersion = BigInt.fromI32(0)
  entity.save()

  createOrLoadAggregate(tokenAddress)
  createOrLoadAccountUser(tokenAddress)

  SecurityTokenTemplate.create(event.params._securityTokenAddress)
}
