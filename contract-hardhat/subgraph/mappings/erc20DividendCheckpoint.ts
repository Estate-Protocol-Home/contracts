import { 
  Aggregate as AggregateSchema, 
  ERC20DividendClaimed as ERC20DividendClaimedSchema, 
  ERC20DividendDeposited as ERC20DividendDepositedSchema,
  ERC20DividendCheckpointFactory as ERC20DividendCheckpointFactorySchema,
  AccountUser as AccountUserSchema,
  UserDividend,
} from "../../generated/schema"
import { ERC20DividendCheckpoint, ERC20DividendClaimed as ERC20DividendClaimedEvent, ERC20DividendDeposited, ERC20DividendDeposited as ERC20DividendDepositedEvent } from "../../generated/templates/ERC20DividendCheckpoint/ERC20DividendCheckpoint";
import { CHANNEL_ADDRESS } from "../constant";
import { sendPushNotification } from "../helpers/pushNotification";
import { Address, BigInt } from "@graphprotocol/graph-ts";

function notifyUsers(): void {
  const title = "Rent Generated Alerts";
  const body = `A property has generated rental income. Please visit https://www.estateprotocol.com to claim your rent.`;

  const recipient = CHANNEL_ADDRESS;
  const type = "1";
  const subject = title;
  const message = body;
  const image = "https://www.estateprotocol.com/favicon.ico";
  const secret = "null";
  const cta = "https://www.estateprotocol.com/";
  const category = "4";

  const notification = `{\"type\": \"${type}\", \"title\": \"${title}\", \"body\": \"${body}\", \"subject\": \"${subject}\", \"message\": \"${message}\", \"image\": \"${image}\", \"secret\": \"${secret}\", \"cta\": \"${cta}\", \"category\": \"${category}\"}`;
  sendPushNotification(recipient, notification);
}

function loadERC20DividendCheckpointFactory(id: string): ERC20DividendCheckpointFactorySchema {
  let erc20DividendCheckpointFactory = ERC20DividendCheckpointFactorySchema.load(id);

  if (!erc20DividendCheckpointFactory) {
    erc20DividendCheckpointFactory = new ERC20DividendCheckpointFactorySchema(id)
  }

  return erc20DividendCheckpointFactory;
}

export function handleDividendCreation(event: ERC20DividendDepositedEvent): void {
  let id = event.params._token.toHex() + "-" + event.params._dividendIndex.toString();

  const dividendContract = ERC20DividendCheckpoint.bind(event.address);

  const erc20DividendCheckpointFactory = loadERC20DividendCheckpointFactory(event.address.toHex());

  let token = erc20DividendCheckpointFactory.creator.toHex();

  let accountUsers = AccountUserSchema.load(token);

  if (!accountUsers) {
    accountUsers = new AccountUserSchema(token);
  }

  const users = accountUsers.user;

  const totalSupply = dividendContract.dividends(event.params._dividendIndex).getTotalSupply();


  for (let i = 0; i < users.length; i++) {
    let user = users[i];

    const dividend = dividendContract.calculateDividend(event.params._dividendIndex, Address.fromString(user));

    let userDividendId = user + "-" + token + "-" + event.params._dividendIndex.toString();


    let userDividend = UserDividend.load(userDividendId);

    if (!userDividend) {
      userDividend = new UserDividend(userDividendId);
    }

    userDividend.claim = dividend.getValue0();
    userDividend.withheld = dividend.getValue1();
    userDividend.token = token;
    userDividend.user = user;

    userDividend.save();

  }

  let entity = ERC20DividendDepositedSchema.load(id)

  if (!entity) {
    entity = new ERC20DividendDepositedSchema(id)
  }

  entity.depositor = event.params._depositor;
  entity.checkpointId = event.params._checkpointId;
  entity.maturity = event.params._maturity;
  entity.expiry = event.params._expiry;
  entity.amount = event.params._amount;
  entity.totalSupply = totalSupply;
  entity.dividendIndex = event.params._dividendIndex;
  entity.name = event.params._name;
  entity.contractAddress = event.address;
  entity.timestamp = event.block.timestamp;
  entity.paymentToken = event.params._token;
  entity.token = token;

  entity.save();

  let aggregate = AggregateSchema.load(token);

  if (!aggregate) {
    aggregate = new AggregateSchema(token);
    aggregate.currentCheckpoint = BigInt.fromI32(0);
  }

  aggregate.currentDividendId = event.params._dividendIndex;

  aggregate.save();

  notifyUsers();
}

export function handleDividendClaim(event: ERC20DividendClaimedEvent): void {
  const id = event.transaction.hash.toHex();
  const dividendContract = ERC20DividendCheckpoint.bind(event.address);

  let entity = new ERC20DividendClaimedSchema(id);

  const erc20DividendCheckpointFactory = loadERC20DividendCheckpointFactory(event.address.toHex());

  let token = erc20DividendCheckpointFactory.creator.toHex();

  let accountUsers = AccountUserSchema.load(token);

  if (!accountUsers) {
    accountUsers = new AccountUserSchema(token);
  }

  const users = accountUsers.user;


  for (let i = 0; i < users.length; i++) {
    let user = users[i];

    const dividend = dividendContract.calculateDividend(event.params._dividendIndex, Address.fromString(user));

    let userDividendId = user + "-" + token + "-" + event.params._dividendIndex.toString();


    let userDividend = UserDividend.load(userDividendId);

    if (!userDividend) {
      userDividend = new UserDividend(userDividendId);
    }

    userDividend.claim = dividend.getValue0();
    userDividend.withheld = dividend.getValue1();
    userDividend.token = token;
    userDividend.user = user;

    userDividend.save();

  }

  entity.payee = event.params._payee.toHex();
  entity.dividendIndex = event.params._dividendIndex;
  entity.paymentToken = event.params._token;
  entity.token = token;
  entity.amount = event.params._amount;
  entity.withheld = event.params._withheld;
  entity.contractAddress = event.address;
  entity.timestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}






