import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { SupplyOrder } from '../../schemas/providersOrders.schema'

export type SupplyOrdersState = {
  selectedOrder: SupplyOrder | null
  items: SupplyOrder[]
  loading: boolean
  error: string | null
}

const initialState: SupplyOrdersState = {
  selectedOrder: null,
  items: [],
  loading: false,
  error: null
}

const supplyOrdersSlice = createSlice({
  name: 'supplyOrders',
  initialState,
  reducers: {
    setSupplyOrders(state, action: PayloadAction<SupplyOrder[]>) {
      state.items = action.payload
    }
  }
})

export const { setSupplyOrders } = supplyOrdersSlice.actions

export default supplyOrdersSlice.reducer
