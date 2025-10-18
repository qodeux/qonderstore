import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface UIState {
  sidebarOpen: boolean
  loading: boolean
  modalOpen: boolean
  wizardCurrentIndex: number
  wizardJumpToStep: number | null
}

const initialState: UIState = {
  sidebarOpen: false,
  loading: false,
  modalOpen: false,
  wizardCurrentIndex: 0,
  wizardJumpToStep: null
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openSidebar(state) {
      state.sidebarOpen = true
    },
    closeSidebar(state) {
      state.sidebarOpen = false
    },
    setLoading(state, action) {
      state.loading = action.payload
    },
    openModal(state) {
      state.modalOpen = true
    },
    closeModal(state) {
      state.modalOpen = false
    },
    setWizardCurrentStep(state, action) {
      state.wizardCurrentIndex = action.payload
    },
    requestJumpToStep: (state, action: PayloadAction<number>) => {
      state.wizardJumpToStep = action.payload
    },
    clearJumpToStep: (state) => {
      state.wizardJumpToStep = null
    }
  }
})

export const { openSidebar, closeSidebar, setLoading, openModal, closeModal, setWizardCurrentStep, requestJumpToStep, clearJumpToStep } =
  uiSlice.actions

export default uiSlice.reducer
