// store/slices/authSlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { User } from '../../schemas/users.schema'
import { authService } from '../../services/authService'

type AuthStatus = 'idle' | 'checking' | 'authenticated' | 'unauthenticated'

interface AuthState {
  user: User | null
  status: AuthStatus
  token: string | null
  loading: boolean // ⬅️ úsalo SOLO para loginUser
  error: string | null
  isAuthenticated: boolean
  logoutInProgress: boolean
}

const initialState: AuthState = {
  status: 'idle',
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  logoutInProgress: false
}

/** LOGIN: siempre devuelve User o rechaza */
export const loginUser = createAsyncThunk<User, { email: string; password: string }, { rejectValue: string }>(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const resp = await authService.signIn({ email, password })
      if ('error' in resp) {
        switch (resp.error) {
          case 'Invalid login credentials':
            return rejectWithValue('Datos de inicio de sesión inválidos')
          case 'Email not confirmed':
            return rejectWithValue('El correo electrónico no ha sido confirmado')
          default:
            return rejectWithValue(resp.error || 'Error desconocido durante el inicio de sesión')
        }
      }
      // resp es User
      return resp
    } catch {
      return rejectWithValue('Error durante el login')
    }
  }
)

export const performLogout = createAsyncThunk<void, void>('auth/performLogout', async (_, { dispatch }) => {
  // 1) Activa overlay inmediatamente (evita blink y redirección temprana)
  dispatch(beginLogout())
  // 2) Ejecuta el logout real (tu thunk existente)
  await dispatch(logoutUser()).unwrap()
})

/** LOGOUT: se usa cuando tú haces clic en “Salir” (hace IO una sola vez) */
export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>('auth/logoutUser', async (_, { rejectWithValue }) => {
  const start = Date.now()
  const MIN_DELAY = 800 // ⏳ asegura que se vea el overlay

  const ok = await authService.signOut()
  if (!ok) return rejectWithValue('Error during logout')

  // delay sintético (opcional)
  const elapsed = Date.now() - start
  const remaining = MIN_DELAY - elapsed
  if (remaining > 0) await new Promise((r) => setTimeout(r, remaining))
})

/** RESTORE inicial: se usa al bootstrap. No toques `loading`; pone checking SOLO si venías de idle */
export const restoreSession = createAsyncThunk<User, void, { rejectValue: string }>(
  'auth/restoreSession',
  async (_, { rejectWithValue }) => {
    const start = Date.now()
    const MIN_DELAY = 800 // 👈 visible 0.8 segundos aprox.

    try {
      const session = await authService.getSession()
      if (!session?.user) {
        // ⏳ espera antes de rechazar para evitar blink al entrar en rutas protegidas
        const elapsed = Date.now() - start
        const remaining = MIN_DELAY - elapsed
        if (remaining > 0) await new Promise((r) => setTimeout(r, remaining))
        return rejectWithValue('No hay sesión activa')
      }

      const profile = await authService.getUserProfile(session.user.id)
      if ('error' in profile) {
        const elapsed = Date.now() - start
        const remaining = MIN_DELAY - elapsed
        if (remaining > 0) await new Promise((r) => setTimeout(r, remaining))
        return rejectWithValue(profile.error)
      }

      // ⏳ también espera si todo salió bien (por consistencia visual)
      const elapsed = Date.now() - start
      const remaining = MIN_DELAY - elapsed
      if (remaining > 0) await new Promise((r) => setTimeout(r, remaining))

      return profile
    } catch {
      const elapsed = Date.now() - start
      const remaining = MIN_DELAY - elapsed
      if (remaining > 0) await new Promise((r) => setTimeout(r, remaining))
      return rejectWithValue('Error restoring session')
    }
  }
)

/** REFRESH silencioso: para SIGNED_IN / TOKEN_REFRESHED / USER_UPDATED (no cambia status/loading) */
export const refreshProfileSilent = createAsyncThunk<User | null, string | undefined, { rejectValue: string }>(
  'auth/refreshProfileSilent',
  async (userId, { rejectWithValue }) => {
    try {
      if (!userId) return null
      const profile = await authService.getUserProfile(userId)
      if ('error' in profile) return rejectWithValue(profile.error)
      return profile
    } catch {
      return rejectWithValue('No se pudo refrescar el perfil')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Limpieza local sin IO (úsalo en onAuthStateChange → SIGNED_OUT) */
    authLoggedOut(state) {
      state.status = 'unauthenticated'
      state.isAuthenticated = false
      state.user = null
      state.token = null
      state.error = null
      // NO tocar loading aquí
    },
    beginLogout(state) {
      // 👈 NUEVO
      state.logoutInProgress = true
      state.status = 'checking' // fuerza overlay en protegidas
      // ¡no toques isAuthenticated aquí! así evitas Navigate prematuro
    }
  },
  extraReducers: (builder) => {
    /** LOGIN */
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
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.status = 'unauthenticated'
        state.isAuthenticated = false
        state.user = null
        state.error = action.payload || 'Login failed'
      })

    /** LOGOUT explícito (tu botón “Salir”) */
    builder
      .addCase(logoutUser.pending, (state) => {
        state.logoutInProgress = true
        state.status = 'checking' // 👈 activa overlay en protegidas
        state.error = null
      })
      // LOGOUT done
      .addCase(logoutUser.fulfilled, (state) => {
        state.logoutInProgress = false
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.status = 'unauthenticated'
        state.error = null
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.logoutInProgress = false
        //state.error = action.payload || 'Logout failed'
        state.isAuthenticated = false
        state.user = null
        state.status = 'unauthenticated'
      })

    /** RESTORE (bootstrap): SOLO setea checking si venías de idle; NO tocar loading */
    builder
      .addCase(restoreSession.pending, (state) => {
        //state.status = 'checking'
        if (state.status === 'idle') {
          state.status = 'checking'
        }
        state.error = null
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.status = 'authenticated'
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(restoreSession.rejected, (state) => {
        // Si falló el restore (sin sesión), quedas como no autenticado
        state.status = 'unauthenticated'
        state.isAuthenticated = false
        state.user = null
      })

    /** REFRESH silencioso: NO tocar status/loading para evitar blink */
    builder
      .addCase(refreshProfileSilent.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload
          state.isAuthenticated = true
          // status se mantiene (normalmente 'authenticated')
        }
      })
      // Rechazo silencioso: no movemos status/loading
      .addCase(refreshProfileSilent.rejected, (state) => {
        // opcional: podrías loguear un error global si te interesa
      })
  }
})

export const { authLoggedOut, beginLogout } = authSlice.actions
export default authSlice.reducer
