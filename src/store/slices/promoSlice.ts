import { createSlice } from '@reduxjs/toolkit'

interface promotionState {
  editMode: boolean
}

const initialState: promotionState = {
  editMode: false
}

const promotionSlice = createSlice({
  name: 'promotions',
  initialState,
  reducers: {
    setEditMode(state, action) {
      state.editMode = action.payload
    }
  }
})
export const { setEditMode } = promotionSlice.actions

export default promotionSlice.reducer
