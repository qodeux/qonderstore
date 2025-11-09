import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { storeOrder } from '../../schemas/storeOrders.schema'

interface storeOrdersState {
  selectedOrders: storeOrder | null
  items: storeOrder[]
  loading: boolean
  error: string | null
}

const initialState: storeOrdersState = {
  selectedOrders: null,
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
    }
  }
})

export const { setStoreOrders: setStoreOrders } = storeOrdersSlice.actions

export default storeOrdersSlice.reducer
