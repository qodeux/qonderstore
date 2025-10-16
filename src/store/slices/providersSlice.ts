import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Provider } from '../../schemas/providers.schema'

interface providersState {
  previousStep: number
  jumpToStep: number | null
  selectedProvider?: Provider | null
  items: Provider[]
  loading: boolean
  error: string | null
  isEditing: boolean
}

const initialState: providersState = {
  selectedProvider: null,
  previousStep: 0,
  jumpToStep: null,
  items: [],
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

    setSelectedProvider(state, action) {
      state.selectedProvider = state.items.find((item) => item.id === action.payload) || null
      state.loading = false
      state.error = null
    },

    setPreviousStep(state, action) {
      state.previousStep = action.payload
    },
    requestJumpToStep: (state, action: PayloadAction<number>) => {
      state.jumpToStep = action.payload
    },
    clearJumpToStep: (state) => {
      state.jumpToStep = null
    }
  }
})
export const { setEditMode, setSelectedProvider, setProviders, setPreviousStep, requestJumpToStep, clearJumpToStep } = providerSlice.actions

export default providerSlice.reducer
