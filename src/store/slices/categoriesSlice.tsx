import { createSlice } from '@reduxjs/toolkit'

interface categoriesState {
  editMode: boolean
}

const initialState: categoriesState = {
  editMode: false
}

const categorySlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    setEditMode(state, action) {
      state.editMode = action.payload
    }
  }
})
export const { setEditMode } = categorySlice.actions

export default categorySlice.reducer
