import { createSlice } from '@reduxjs/toolkit'
import type { Provider } from '../../schemas/providers.schema'

interface providersState {
  editMode: boolean
  previousStep: number
  selectedProvider?: Provider | null
  items: Provider[]
}

const initialState: providersState = {
  editMode: false,
  selectedProvider: null,
  previousStep: 0,
  items: []
}

const providerSlice = createSlice({
  name: 'providers',
  initialState,
  reducers: {
    setEditMode(state, action) {
      state.editMode = action.payload
      if (!action.payload) {
        state.selectedProvider = null
      }
    },
    setProviders(state, action) {
      state.items = action.payload
    },

    setSelectedProvider(state, action) {
      state.selectedProvider = action.payload
    },

    setPreviousStep(state, action) {
      state.previousStep = action.payload
    }
  }
})
export const { setEditMode, setSelectedProvider, setProviders, setPreviousStep } = providerSlice.actions

export default providerSlice.reducer
