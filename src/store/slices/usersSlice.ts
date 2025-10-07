import { createSlice } from '@reduxjs/toolkit'

export type User = {
  id: number
  user_name: string
  role: string
  last_activity: string
  is_active: boolean
  email: string
  full_name: string
  phone?: string
}

interface UsersState {
  editMode: boolean
  selectedUser?: User | null
  items: User[]
}

const initialState: UsersState = {
  editMode: false,
  selectedUser: null,
  items: []
}

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setEditMode(state, action) {
      state.editMode = action.payload
    },
    setUsers(state, action) {
      state.items = action.payload
    },

    setSelectedUser(state, action) {
      state.selectedUser = action.payload
    }
  }
})
export const { setEditMode, setUsers, setSelectedUser } = usersSlice.actions

export default usersSlice.reducer
