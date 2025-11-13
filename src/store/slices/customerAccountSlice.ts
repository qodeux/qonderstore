import type { Address } from '../../schemas/address.schema'

interface CustomerAccountState {
  loading: boolean
  addresses: Address[]
  selectedAddress?: Address | null
}
