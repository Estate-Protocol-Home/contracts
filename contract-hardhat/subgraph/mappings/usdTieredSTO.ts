import { TokenPurchase as TokenPurchaseSchema } from '../../generated/schema'
import { TokenPurchase } from '../../generated/templates/USDTieredSTO/USDTieredSTO'

export function handleTokenPurchase(event: TokenPurchase): void {
  // id = txHash (matching prod schema)
  const id = event.transaction.hash.toHex()

  let entity = TokenPurchaseSchema.load(id)
  if (!entity) {
    entity = new TokenPurchaseSchema(id)
  }

  entity.contractAddress = event.address
  entity.purchaser = event.params._purchaser
  entity.beneficiary = event.params._beneficiary
  entity.tokens = event.params._tokens
  entity.usdAmount = event.params._usdAmount
  entity.tierPrice = event.params._tierPrice
  entity.tier = event.params._tier
  entity.timestamp = event.block.timestamp

  entity.save()
}
