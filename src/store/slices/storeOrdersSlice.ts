import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { StoreOrder } from '../../schemas/storeOrders.schema'

interface storeOrdersState {
  selectedOrder: StoreOrder | null
  items: StoreOrder[]
  loading: boolean
  error: string | null
}

const initialState: storeOrdersState = {
  selectedOrder: null,
  items: [],
  loading: false,
  error: null
}

const storeOrdersSlice = createSlice({
  name: 'storeOrders',
  initialState,
  reducers: {
    setStoreOrders(state, action: PayloadAction<StoreOrder[]>) {
      state.items = action.payload
    },
    setSelectedOrder(state, action: PayloadAction<string>) {
      const order = state.items.find((o) => o.id === action.payload) || null
      state.selectedOrder = order
    }
  }
})

export const { setStoreOrders: setStoreOrders, setSelectedOrder } = storeOrdersSlice.actions

export default storeOrdersSlice.reducer
