import { NewSecurityToken as NewSecurityTokenEvent } from '../../generated/SecurityTokenRegistry/SecurityTokenRegistry';
import {
  Account as AccountSchema,
  Aggregate as AggregateSchema,
  SecurityToken as SecurityTokenSchema,
  Transfer as TransferSchema,
  CheckpointBalance as CheckpointBalanceSchema,
  TokenBalance as TokenBalanceSchema,
  AccountUser as AccountUserSchema,
} from "../../generated/schema";
import { 
  CheckpointCreated as CheckpointCreatedEvent, 
  Transfer as TransferEvent 
} from '../../generated/templates/SecurityToken/SecurityToken';
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";


export function handleNewSecurityTokenCreation(event: NewSecurityTokenEvent): void {

  const id = event.params._securityTokenAddress.toHex();  
  let token = SecurityTokenSchema.load(id);

  if (!token) {
    token = new SecurityTokenSchema(id);
  }

  token.ticker = event.params._ticker;
  token.name = event.params._name;
  token.securityTokenAddress = event.params._securityTokenAddress;
  token.owner = event.params._owner;
  token.addedAt = event.params._addedAt;
  token.registrant = event.params._registrant;
  token.fromAdmin = event.params._fromAdmin;
  token.usdFee = event.params._usdFee;
  token.polyFee = event.params._polyFee;
  token.protocolVersion = event.params._protocolVersion;

  token.save();
}

export function handleCreateCheckpoint(event: CheckpointCreatedEvent): void {
  const id = event.address.toHex();  
  let aggregate = AggregateSchema.load(id);

  if (!aggregate) {
    aggregate = new AggregateSchema(id);
    aggregate.currentDividendId = BigInt.fromI32(0);
  }

  aggregate.currentCheckpoint = event.params._checkpointId;

  aggregate.save();
}

function loadAggregate(id: string): AggregateSchema {
  let entity = AggregateSchema.load(id);
  if (!entity) {
    entity = new AggregateSchema(id);
    entity.currentCheckpoint = BigInt.fromI32(0);
    entity.currentDividendId = BigInt.fromI32(0);
    entity.save();
  }
  return entity;
}

function createAccountUser(id: string, userAddress: string): AccountUserSchema {
  let accountUser = AccountUserSchema.load(id);

  if (!accountUser) {
    accountUser = new AccountUserSchema(id);
    accountUser.user = []; // Initialize as an empty array
  }

  let users = accountUser.user

  const userBytes = userAddress;


  if (
    !users.includes(userBytes) && 
    userAddress != "0x0000000000000000000000000000000000000000"
  ) {
    users.push(userBytes)
    accountUser.user = users
    accountUser.save()
  }

  return accountUser;
}

function getOrCreateAccount(accountId: string): AccountSchema {
  let account = AccountSchema.load(accountId);
  if (!account) {
    account = new AccountSchema(accountId);
    account.save();
  }
  return account;
}

function getOrCreateToken(tokenId: Address): SecurityTokenSchema {
  let token = SecurityTokenSchema.load(tokenId.toHex());

  if (!token) {
    token = new SecurityTokenSchema(tokenId.toHex());
  }
  return token;
}

function getOrCreateTokenBalance(userId: string, tokenId: string): TokenBalanceSchema {
  let balanceId = userId + "-" + tokenId;
  let tokenBalance = TokenBalanceSchema.load(balanceId);
  if (!tokenBalance) {
    tokenBalance = new TokenBalanceSchema(balanceId);
    tokenBalance.user = userId;
    tokenBalance.token = tokenId;
    tokenBalance.balance = BigInt.fromI32(0);
    tokenBalance.dividendAmount = BigInt.fromI32(0);
    tokenBalance.save();
  }
  return tokenBalance;
}

function createCheckpoint(tokenBalance: TokenBalanceSchema, user: string, blockNumber: BigInt, timestamp: BigInt, tokenId: string): void {
  let aggregate = loadAggregate(tokenId);
  let id = tokenId + "-" + aggregate.currentCheckpoint.toString() + "-" + user;

  let checkpoint = CheckpointBalanceSchema.load(id);

  if (!checkpoint) {
    checkpoint = new CheckpointBalanceSchema(id);
  }
  checkpoint.tokenBalance = tokenBalance.id;
  checkpoint.currentCheckpoint = aggregate.currentCheckpoint;
  checkpoint.user = user;
  checkpoint.balance = tokenBalance.balance;
  checkpoint.timestamp = timestamp;
  checkpoint.blockNumber = blockNumber;
  checkpoint.save();
}

export function handleTransfer(event: TransferEvent): void {

  let tokenId = event.address.toHex();
  let fromAccountId = event.params.from.toHex();
  let toAccountId = event.params.to.toHex();
  let transferId = event.transaction.hash.toHex();


  let token = getOrCreateToken(event.address);

  let fromAccount = getOrCreateAccount(fromAccountId);
  let toAccount = getOrCreateAccount(toAccountId);

  createAccountUser(tokenId, fromAccountId);
  createAccountUser(tokenId, toAccountId);

  let fromTokenBalance = getOrCreateTokenBalance(fromAccountId, tokenId);

  let toTokenBalance = getOrCreateTokenBalance(toAccountId, tokenId);

  let aggregate = loadAggregate(tokenId);

  fromTokenBalance.balance = fromTokenBalance.balance.minus(event.params.value);
  toTokenBalance.balance = toTokenBalance.balance.plus(event.params.value);

  fromTokenBalance.save();
  toTokenBalance.save();
  
  createCheckpoint(fromTokenBalance, fromAccountId, event.block.number, event.block.timestamp, tokenId);
  createCheckpoint(toTokenBalance, toAccountId, event.block.number, event.block.timestamp, tokenId);


  let transfer = new TransferSchema(transferId)

  transfer.token = token.id;
  transfer.from = fromAccount.id;
  transfer.to = toAccount.id;
  transfer.value = event.params.value;
  transfer.transactionHash = event.transaction.hash;
  transfer.blockNumber = event.block.number;
  transfer.timestamp = event.block.timestamp;
  transfer.save();
}

