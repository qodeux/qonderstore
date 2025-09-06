import { createSlice } from '@reduxjs/toolkit'

interface UIState {
  sidebarOpen: boolean
  loading: boolean
  modalOpen: boolean
}

const initialState: UIState = {
  sidebarOpen: false,
  loading: false,
  modalOpen: false
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
    }
  }
})

export const { openSidebar, closeSidebar, setLoading, openModal, closeModal } = uiSlice.actions

export default uiSlice.reducer
