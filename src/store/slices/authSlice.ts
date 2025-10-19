import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { User } from '../../schemas/users.schema'
import { authService } from '../../services/authService'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
  isAuthenticated?: boolean
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false
}

export const loginUser = createAsyncThunk<User | null, { email: string; password: string }, { rejectValue: string }>(
  'auth/loginUser',
  async ({ email, password }, thunkAPI) => {
    try {
      const response = await authService.signIn({ email, password })

      console.log(response)

      if (response && 'error' in response) {
        switch (response.error) {
          case 'Invalid login credentials':
            return thunkAPI.rejectWithValue('Datos de inicio de sesión inválidos')
          case 'Email not confirmed':
            return thunkAPI.rejectWithValue('El correo electrónico no ha sido confirmado')
          default:
            return thunkAPI.rejectWithValue('Error desconocido durante el inicio de sesión')
        }
      }
      return response
    } catch (error) {
      console.log(error)
      return thunkAPI.rejectWithValue('Error during login')
    }
  }
)

export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>('auth/logoutUser', async (_, thunkAPI) => {
  const response = await authService.signOut()

  if (!response) {
    return thunkAPI.rejectWithValue('Error during logout')
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.error = null
        state.isAuthenticated = true
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Login failed'
        state.isAuthenticated = false
      })
      //Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = action.payload || 'Logout failed'
      })
  }
})

// export const { logout } = authSlice.actions
export default authSlice.reducer
