import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface UIState {
  sidebarOpen: boolean
  isEditing: boolean
  loading: boolean
  modalOpen: boolean
  wizardCurrentIndex: number
  wizardJumpToStep: number | null
  layoutOutletHeight?: number | null
  layoutToolbarSpace: number
}

const initialState: UIState = {
  isEditing: false,
  sidebarOpen: false,
  loading: false,
  modalOpen: false,
  wizardCurrentIndex: 0,
  wizardJumpToStep: null,
  layoutOutletHeight: null,
  layoutToolbarSpace: 140
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
    },
    setLayoutOutletHeight(state, action: PayloadAction<number | null>) {
      state.layoutOutletHeight = action.payload
    }
  }
})

export const {
  openSidebar,
  closeSidebar,
  setLoading,
  openModal,
  closeModal,
  setWizardCurrentStep,
  requestJumpToStep,
  clearJumpToStep,
  setLayoutOutletHeight
} = uiSlice.actions

export default uiSlice.reducer
