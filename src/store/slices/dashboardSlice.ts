import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface DashboardState {
  selectedModule: string
}

const initialState: DashboardState = {
  selectedModule: 'products'
}

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setSelectedModule: (state, action: PayloadAction<string>) => {
      state.selectedModule = action.payload
    },
    resetModule: (state) => {
      state.selectedModule = initialState.selectedModule
    }
  }
})

export const { setSelectedModule, resetModule } = dashboardSlice.actions
export default dashboardSlice.reducer
