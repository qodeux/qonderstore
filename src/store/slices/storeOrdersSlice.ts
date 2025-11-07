import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { storeOrders } from '../../schemas/storeOrders.schema'

interface storeOrdersState {
  selectedOrders: storeOrders | null
  items: storeOrders[]
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
    setStoreOrders(state, action: PayloadAction<storeOrders[]>) {
      state.items = action.payload
    }
  }
})

export const { setStoreOrders: setStoreOrders } = storeOrdersSlice.actions

export default storeOrdersSlice.reducer
