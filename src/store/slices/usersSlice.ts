import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { User } from '../../schemas/users.schema'

interface UsersState {
  isEditing: boolean
  selectedUser?: User | null
  items: User[]
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
    }
  }
})
export const { setEditMode, setUsers, setSelectedUser } = usersSlice.actions

export default usersSlice.reducer
