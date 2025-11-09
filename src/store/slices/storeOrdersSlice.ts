import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { storeOrder } from '../../schemas/storeOrders.schema'

interface storeOrdersState {
  selectedOrder: storeOrder | null
  items: storeOrder[]
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
    setStoreOrders(state, action: PayloadAction<storeOrder[]>) {
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
