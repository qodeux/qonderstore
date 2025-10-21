import { createSlice } from '@reduxjs/toolkit'
import type { Provider } from '../../schemas/providers.schema'
import type { SupplyOrder } from '../../types/providers'

interface providersState {
  selectedProvider?: Provider | null
  items: Provider[]
  supplyOrders: SupplyOrder[]
  loading: boolean
  error: string | null
  isEditing: boolean
}

const initialState: providersState = {
  selectedProvider: null,
  items: [],
  supplyOrders: [],
  loading: false,
  error: null,
  isEditing: false
}

const providerSlice = createSlice({
  name: 'providers',
  initialState,
  reducers: {
    setEditMode(state, action) {
      state.isEditing = action.payload
      if (!action.payload) {
        state.selectedProvider = null
      }
    },
    setProviders(state, action) {
      state.items = action.payload
    },
    setSupplyOrders(state, action) {
      state.supplyOrders = action.payload
    },

    setSelectedProvider(state, action) {
      state.selectedProvider = state.items.find((item) => item.id === action.payload) || null
      state.loading = false
      state.error = null
    }
  }
})
export const { setEditMode, setSelectedProvider, setProviders, setSupplyOrders } = providerSlice.actions

export default providerSlice.reducer
