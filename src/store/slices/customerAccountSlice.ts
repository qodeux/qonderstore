import type { AddressInput } from '../../schemas/address.schema'

interface CustomerAccountState {
  loading: boolean
  addresses: AddressInput[]
  selectedAddress?: AddressInput | null
}
