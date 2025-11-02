import { createSlice } from '@reduxjs/toolkit'
import type { providersOrders } from '../../schemas/providersOrders.schema'

interface providersOrdersState {
  selectedOrderId: number | null
  items: providersOrders[]
  SupplyOrder: boolean
  loading: boolean
  error: string | null
}

const initialState: providersOrdersState = {
  selectedOrderId: null,
  items: [],
  SupplyOrder: false,
  loading: false,
  error: null
}

const providersOrdersSlice = createSlice({
  name: 'providersOrders',
  initialState,
  reducers: {
    setProvidersOrders(state, action) {
      state.SupplyOrder = action.payload
    }
  }
})

export const { setProvidersOrders } = providersOrdersSlice.actions

export default providersOrdersSlice.reducer
