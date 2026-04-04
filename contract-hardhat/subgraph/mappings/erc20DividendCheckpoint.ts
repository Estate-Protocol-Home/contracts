import { BigInt } from '@graphprotocol/graph-ts'
import { dataSource } from '@graphprotocol/graph-ts'

import {
  ERC20DividendDeposited as ERC20DividendDepositedEvent,
  ERC20DividendClaimed as ERC20DividendClaimedEvent,
} from '../../generated/templates/ERC20DividendCheckpoint/ERC20DividendCheckpoint'
import {
  ERC20DividendDeposited as ERC20DividendDepositedSchema,
  ERC20DividendClaimed as ERC20DividendClaimedSchema,
  UserDividend,
  Account,
  AccountUser,
  CheckpointBalance,
  Aggregate,
  TokenBalance,
} from '../../generated/schema'
import { CHANNEL_ADDRESS } from '../constant'
import { sendPushNotification } from '../helpers/pushNotification'

function getOrCreateAccount(address: string): Account {
  let account = Account.load(address)
  if (!account) {
    account = new Account(address)
    account.save()
  }
  return account
}

function notifyUsers(): void {
  const title = 'Rent Generated Alerts'
  const body = `A property has generated rental income. Please visit https://www.estateprotocol.com to claim your rent.`
  const recipient = CHANNEL_ADDRESS
  const type = '1'
  const subject = title
  const message = body
  const image = 'https://www.estateprotocol.com/favicon.ico'
  const secret = 'null'
  const cta = 'https://www.estateprotocol.com/'
  const category = '4'
  const notification = `{"type": "${type}", "title": "${title}", "body": "${body}", "subject": "${subject}", "message": "${message}", "image": "${image}", "secret": "${secret}", "cta": "${cta}", "category": "${category}"}`
  sendPushNotification(recipient, notification)
}

export function handleDividendCreation(event: ERC20DividendDepositedEvent): void {
  let context = dataSource.context()
  let securityToken = context.getString('securityToken')

  // id = {paymentToken}-{dividendIndex} (matching prod)
  let dividendId =
    event.params._token.toHexString() + '-' + event.params._dividendIndex.toString()

  let entity = ERC20DividendDepositedSchema.load(dividendId)
  if (!entity) {
    entity = new ERC20DividendDepositedSchema(dividendId)
  }

  entity.depositor = event.params._depositor
  entity.checkpointId = event.params._checkpointId
  entity.maturity = event.params._maturity
  entity.expiry = event.params._expiry
  entity.paymentToken = event.params._token
  entity.token = securityToken
  entity.amount = event.params._amount
  entity.totalSupply = event.params._totalSupply
  entity.dividendIndex = event.params._dividendIndex
  entity.name = event.params._name
  entity.contractAddress = event.address
  entity.timestamp = event.block.timestamp
  entity.save()

  // Update global dividend counter for this security token
  let agg = Aggregate.load(securityToken)
  if (agg) {
    agg.currentDividendId = event.params._dividendIndex
    agg.save()
  }

  // Pre-populate UserDividend for every known investor at the checkpoint
  let accountUser = AccountUser.load(securityToken)
  if (accountUser && event.params._totalSupply.gt(BigInt.fromI32(0))) {
    let investors = accountUser.user

    for (let i = 0; i < investors.length; i++) {
      let investorAddress = investors[i]

      // Look up investor's balance at the dividend's checkpoint
      let checkpointBalanceId =
        securityToken +
        '-' +
        event.params._checkpointId.toString() +
        '-' +
        investorAddress
      let checkpointBalance = CheckpointBalance.load(checkpointBalanceId)

      let balance = BigInt.fromI32(0)
      if (checkpointBalance && checkpointBalance.balance.gt(BigInt.fromI32(0))) {
        balance = checkpointBalance.balance
      }

      // Proportional claimable: (balance / totalSupply) * amount
      let totalClaimableAmount = BigInt.fromI32(0)
      if (balance.gt(BigInt.fromI32(0))) {
        totalClaimableAmount = balance
          .times(event.params._amount)
          .div(event.params._totalSupply)
      }

      // id = {investorAddress}-{securityToken}-{dividendIndex} (matching prod)
      let userDividendId =
        investorAddress + '-' + securityToken + '-' + event.params._dividendIndex.toString()

      let userDividend = UserDividend.load(userDividendId)
      if (!userDividend) {
        userDividend = new UserDividend(userDividendId)
      }
      userDividend.user = investorAddress
      userDividend.claim = BigInt.fromI32(0)
      userDividend.withheld = BigInt.fromI32(0)
      userDividend.totalClaimableAmount = totalClaimableAmount
      userDividend.creationUnixTimestamp = event.block.timestamp
      userDividend.transactionHash = event.transaction.hash
      userDividend.token = securityToken
      userDividend.save()

      getOrCreateAccount(investorAddress)
    }
  }

  notifyUsers()
}

export function handleERC20DividendClaimed(event: ERC20DividendClaimedEvent): void {
  let context = dataSource.context()
  let securityToken = context.getString('securityToken')
  let payeeAddress = event.params._payee.toHexString()

  getOrCreateAccount(payeeAddress)

  // Raw claim event entity (id = txHash, matching prod)
  let claimed = new ERC20DividendClaimedSchema(event.transaction.hash.toHexString())
  claimed.payee = payeeAddress
  claimed.dividendIndex = event.params._dividendIndex
  claimed.paymentToken = event.params._token
  claimed.token = securityToken
  claimed.amount = event.params._amount
  claimed.withheld = event.params._withheld
  claimed.contractAddress = event.address
  claimed.timestamp = event.block.timestamp
  claimed.transactionHash = event.transaction.hash
  claimed.save()

  // Update UserDividend with actual claimed amount
  let userDividendId =
    payeeAddress + '-' + securityToken + '-' + event.params._dividendIndex.toString()

  let userDividend = UserDividend.load(userDividendId)
  if (!userDividend) {
    // Created lazily if deposit event was missed
    userDividend = new UserDividend(userDividendId)
    userDividend.user = payeeAddress
    userDividend.totalClaimableAmount = event.params._amount.plus(event.params._withheld)
    userDividend.creationUnixTimestamp = event.block.timestamp
    userDividend.transactionHash = event.transaction.hash
    userDividend.token = securityToken
  }
  userDividend.claim = event.params._amount
  userDividend.withheld = event.params._withheld
  userDividend.save()

  // Accumulate dividend earnings on the investor's TokenBalance
  let tokenBalanceId = payeeAddress + '-' + securityToken
  let tokenBalance = TokenBalance.load(tokenBalanceId)
  if (tokenBalance) {
    tokenBalance.dividendAmount = tokenBalance.dividendAmount.plus(event.params._amount)
    tokenBalance.save()
  }
}
