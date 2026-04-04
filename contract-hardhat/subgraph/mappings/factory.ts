import { DataSourceContext } from '@graphprotocol/graph-ts'

import { GenerateModuleFromFactory as GenerateModuleFromUSDTieredSTOFactoryEvent } from '../../generated/USDTieredSTOFactory/USDTieredSTOFactory'
import { GenerateModuleFromFactory as GenerateModuleFromERC20Event } from '../../generated/ERC20DividendCheckpointFactory/ERC20DividendCheckpointFactory'
import { GenerateModuleFromFactory as GenerateModuleFromGTMEvent } from '../../generated/GeneralTransferManagerFactory/GeneralTransferManagerFactory'
import {
  USDTieredSTOFactory as USDTieredSTOFactorySchema,
  ERC20DividendCheckpointFactory as ERC20DividendCheckpointFactorySchema,
  GeneralTransferManagerFactory as GeneralTransferManagerFactorySchema,
} from '../../generated/schema'
import { ERC20DividendCheckpoint, USDTieredSTO } from '../../generated/templates'

export function handleGenerateModuleFromUSDTieredSTOFactory(
  event: GenerateModuleFromUSDTieredSTOFactoryEvent
): void {
  USDTieredSTO.create(event.params._module)

  const id = event.transaction.hash.toHex()

  let entity = USDTieredSTOFactorySchema.load(id)
  if (!entity) {
    entity = new USDTieredSTOFactorySchema(id)
  }

  entity.module = event.params._module
  entity.moduleName = event.params._moduleName
  entity.moduleFactory = event.params._moduleFactory
  entity.creator = event.params._creator
  entity.setupCost = event.params._setupCost
  entity.setupCostInPoly = event.params._setupCostInPoly
  entity.timestamp = event.block.timestamp
  entity.from = event.transaction.from

  entity.save()
}

export function handleGenerateModuleFromERC20DividendCheckpointFactory(
  event: GenerateModuleFromERC20Event
): void {
  // Pass the SecurityToken address (= _creator, the contract that called addModule)
  // into the template so dividend handlers know which token they belong to
  let context = new DataSourceContext()
  context.setString('securityToken', event.params._creator.toHexString())
  ERC20DividendCheckpoint.createWithContext(event.params._module, context)

  const id = event.transaction.hash.toHex()

  let entity = ERC20DividendCheckpointFactorySchema.load(id)
  if (!entity) {
    entity = new ERC20DividendCheckpointFactorySchema(id)
  }

  entity.module = event.params._module
  entity.moduleName = event.params._moduleName
  entity.moduleFactory = event.params._moduleFactory
  entity.creator = event.params._creator
  entity.setupCost = event.params._setupCost
  entity.setupCostInPoly = event.params._setupCostInPoly
  entity.timestamp = event.block.timestamp
  entity.from = event.transaction.from

  entity.save()
}

export function handleGenerateModuleFromGeneralTransferManagerFactory(
  event: GenerateModuleFromGTMEvent
): void {
  // id = module address (matches prod)
  const id = event.params._module.toHexString()

  let entity = GeneralTransferManagerFactorySchema.load(id)
  if (!entity) {
    entity = new GeneralTransferManagerFactorySchema(id)
  }

  entity.module = event.params._module
  entity.moduleName = event.params._moduleName
  entity.moduleFactory = event.params._moduleFactory
  entity.creator = event.params._creator
  entity.setupCost = event.params._setupCost
  entity.setupCostInPoly = event.params._setupCostInPoly
  entity.timestamp = event.block.timestamp
  entity.from = event.transaction.from

  entity.save()
}
