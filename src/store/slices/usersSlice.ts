import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ProductRating } from '../../schemas/storeOrders.schema'
import type { User } from '../../schemas/users.schema'

export type UsersState = {
  isEditing: boolean
  selectedUser?: User | null
  items: User[]
  productRatings?: ProductRating[]
  loading?: boolean
  error?: string | null
}

const initialState: UsersState = {
  isEditing: false,
  selectedUser: null,
  items: []
}

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setEditMode(state, action) {
      state.isEditing = action.payload
    },
    setUsers(state, action) {
      state.items = action.payload
    },

    setSelectedUser(state, action: PayloadAction<string | number | null>) {
      state.selectedUser = state.items.find((item) => item.id === action.payload) || null
      state.loading = false
      state.error = null
    },
    setProductRatings(state, action: PayloadAction<ProductRating[]>) {
      state.productRatings = action.payload
    }
  }
})
export const { setEditMode, setUsers, setSelectedUser, setProductRatings } = usersSlice.actions

export default usersSlice.reducer
