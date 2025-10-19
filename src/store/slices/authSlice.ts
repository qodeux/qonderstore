// store/slices/authSlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { User } from '../../schemas/users.schema'
import { authService } from '../../services/authService'

type AuthStatus = 'idle' | 'checking' | 'authenticated' | 'unauthenticated'

interface AuthState {
  user: User | null
  status: AuthStatus
  token: string | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
}

const initialState: AuthState = {
  status: 'idle',
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
    } catch {
      return thunkAPI.rejectWithValue('Error during login')
    }
  }
)

export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>('auth/logoutUser', async (_, thunkAPI) => {
  const ok = await authService.signOut()
  if (!ok) return thunkAPI.rejectWithValue('Error during logout')
})

export const restoreSession = createAsyncThunk<User, void, { rejectValue: string }>(
  'auth/restoreSession',
  async (_, { rejectWithValue }) => {
    try {
      const session = await authService.getSession()
      if (!session?.user) return rejectWithValue('No hay sesión activa')
      const profile = await authService.getUserProfile(session.user.id)
      if ('error' in profile) return rejectWithValue(profile.error)
      return profile
    } catch {
      return rejectWithValue('Error restoring session')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Limpieza local sin I/O (para usar al recibir SIGNED_OUT desde Supabase)
    authLoggedOut(state) {
      state.status = 'unauthenticated'
      state.isAuthenticated = false
      state.user = null
      state.token = null
      state.error = null
    }
  },
  extraReducers: (builder) => {
    // LOGIN
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.status = 'checking'
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.status = 'authenticated'
        state.user = action.payload
        state.error = null
        state.isAuthenticated = true
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.status = 'unauthenticated'
        state.error = action.payload || 'Login failed'
        state.isAuthenticated = false
        state.user = null
      })

    // LOGOUT (cuando TÚ haces click en “Salir”)
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.status = 'unauthenticated'
        state.error = null
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = action.payload || 'Logout failed'
        state.status = 'unauthenticated'
        state.isAuthenticated = false
        state.user = null
      })

    // RESTORE
    builder
      .addCase(restoreSession.pending, (state) => {
        state.loading = true
        state.status = 'checking'
        state.error = null
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.loading = false
        state.status = 'authenticated'
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(restoreSession.rejected, (state) => {
        state.loading = false
        state.status = 'unauthenticated'
        state.isAuthenticated = false
        state.user = null
      })
  }
})

export const { authLoggedOut } = authSlice.actions
export default authSlice.reducer
