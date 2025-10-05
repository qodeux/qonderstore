import { createSlice } from '@reduxjs/toolkit'
import type { Category } from '../../schemas/category.schema'

interface categoriesState {
  editMode: boolean
  selectedCategory?: Category | null
  categories: Category[] | null
}

const initialState: categoriesState = {
  editMode: false,
  selectedCategory: null,
  categories: null
}

const categorySlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    setEditMode(state, action) {
      state.editMode = action.payload
      if (!action.payload) {
        state.selectedCategory = null
      }
    },
    setCategories(state, action) {
      state.categories = action.payload
    },
    setSelectedCategory(state, action) {
      state.selectedCategory = action.payload
    }
  }
})
export const { setEditMode, setSelectedCategory, setCategories } = categorySlice.actions

export default categorySlice.reducer
