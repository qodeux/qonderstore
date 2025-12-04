import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type UIState = {
  sidebarOpen: boolean
  isEditing: boolean
  loading: boolean
  modalOpen: boolean
  cartOpen: boolean
  modalName?: string | null
  wizardCurrentIndex: number
  wizardJumpToStep: number | null
  layoutOutletHeight?: number | null
  layoutToolbarSpace: number
  wizardNavDir: -1 | 0 | 1
}

const initialState: UIState = {
  isEditing: false,
  sidebarOpen: false,
  loading: false,
  modalOpen: false,
  wizardCurrentIndex: 0,
  wizardJumpToStep: null,
  layoutOutletHeight: null,
  layoutToolbarSpace: 140,
  wizardNavDir: 0,
  cartOpen: false
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
    setCartOpen(state, action: PayloadAction<boolean>) {
      state.cartOpen = action.payload
    },
    setEditMode(state, action: PayloadAction<boolean>) {
      state.isEditing = action.payload
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
    setModal(state, action: PayloadAction<string | null>) {
      state.modalName = action.payload
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
    },
    setWizardNavDir(state, action: PayloadAction<-1 | 0 | 1>) {
      state.wizardNavDir = action.payload
    }
  }
})

export const {
  openSidebar,
  closeSidebar,
  setLoading,
  openModal,
  setCartOpen,
  closeModal,
  setModal,
  setEditMode,
  setWizardCurrentStep,
  requestJumpToStep,
  clearJumpToStep,
  setLayoutOutletHeight,
  setWizardNavDir
} = uiSlice.actions

export default uiSlice.reducer
