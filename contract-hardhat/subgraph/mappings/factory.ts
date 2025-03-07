import { GenerateModuleFromFactory as GenerateModuleFromUSDTieredSTOFactoryEvent } from "../../generated/USDTieredSTOFactory/USDTieredSTOFactory"
import { 
  Aggregate as AggregateSchema,
  GeneralTransferManagerFactory as GeneralTransferManagerFactorySchema,
  USDTieredSTOFactory as USDTieredSTOFactorySchema, 
  ERC20DividendCheckpointFactory as ERC20DividendCheckpointFactorySchema,
  SecurityTokenFactory as SecurityTokenFactorySchema,
} from "../../generated/schema";
import { GenerateModuleFromFactory as GenerateModuleFromERC20DividendCheckpointFactoryEvent } from '../../generated/ERC20DividendCheckpointFactory/ERC20DividendCheckpointFactory';
import { 
  ERC20DividendCheckpoint as ERC20DividendCheckpointTemplate, 
  USDTieredSTO as USDTieredSTOTemplate 
} from "../../generated/templates"
import { LogicContractSet as LogicContractSetEvent } from '../../generated/STFactory/STFactory';
import { SecurityToken as SecurityTokenTemplate } from '../../generated/templates';
import {
  GenerateModuleFromFactory as GenerateModuleFromFactoryEvent
} from '../../generated/GeneralTransferManagerFactory/GeneralTransferManagerFactory';
import { BigInt } from "@graphprotocol/graph-ts";

export function handleGenerateModuleFromGeneralTransferManagerFactory(
  event: GenerateModuleFromFactoryEvent
): void {
  SecurityTokenTemplate.create(event.params._creator);

  let aggregate = AggregateSchema.load(event.params._creator.toHex());

  if (!aggregate) {
    aggregate = new AggregateSchema(event.params._creator.toHex());
    aggregate.currentCheckpoint = BigInt.fromI32(0);
    aggregate.currentDividendId = BigInt.fromI32(0);
    aggregate.save();
  }

  const id = event.params._module.toHex();
  let entity = GeneralTransferManagerFactorySchema.load(id)

  if (!entity) {
    entity = new GeneralTransferManagerFactorySchema(id)
  }

  entity.module = event.params._module;
  entity.moduleName = event.params._moduleName;
  entity.moduleFactory = event.params._moduleFactory;
  entity.creator = event.params._creator;
  entity.setupCost = event.params._setupCost;
  entity.setupCostInPoly = event.params._setupCostInPoly;
  entity.timestamp = event.block.timestamp;
  entity.from = event.transaction.from;

  entity.save()
}

export function handleGenerateModuleFromUSDTieredSTOFactory(
  event: GenerateModuleFromUSDTieredSTOFactoryEvent
): void {
  USDTieredSTOTemplate.create(event.params._module);

  const id = event.params._module.toHex();

  let entity = USDTieredSTOFactorySchema.load(id)

  if (!entity) {
    entity = new USDTieredSTOFactorySchema(id)
  }

  entity.module = event.params._module;
  entity.moduleName = event.params._moduleName;
  entity.moduleFactory = event.params._moduleFactory;
  entity.creator = event.params._creator;
  entity.setupCost = event.params._setupCost;
  entity.setupCostInPoly = event.params._setupCostInPoly;
  entity.timestamp = event.block.timestamp;
  entity.from = event.transaction.from;

  entity.save()
}

export function handleGenerateModuleFromERC20DividendCheckpointFactory(
  event: GenerateModuleFromERC20DividendCheckpointFactoryEvent
): void {
  ERC20DividendCheckpointTemplate.create(event.params._module);

  const id = event.params._module.toHex();

  let entity = ERC20DividendCheckpointFactorySchema.load(id)

  if (!entity) {
    entity = new ERC20DividendCheckpointFactorySchema(id)
  }

  entity.module = event.params._module;
  entity.moduleName = event.params._moduleName;
  entity.moduleFactory = event.params._moduleFactory;
  entity.creator = event.params._creator;
  entity.setupCost = event.params._setupCost;
  entity.setupCostInPoly = event.params._setupCostInPoly;
  entity.timestamp = event.block.timestamp;
  entity.from = event.transaction.from;

  entity.save()
}

export function handleSetSecurityTokenLogic(event: LogicContractSetEvent): void {

  const id = event.transaction.hash.toHex();

  let entity = SecurityTokenFactorySchema.load(id)

  if (!entity) {
    entity = new SecurityTokenFactorySchema(id)
  }

  entity.version = event.params._version
  entity.upgrade = event.params._upgrade
  entity.logicContract = event.params._logicContract
  entity.initializationData = event.params._initializationData
  entity.upgradeData = event.params._upgradeData

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}


