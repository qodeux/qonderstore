import type { AuthError, Session } from '@supabase/supabase-js'
import supabase from '../lib/supabase'
import type { User } from '../schemas/users.schema'

export type EmailPasswordCredentials = {
  email: string
  password: string
}

export type SignUpPayload = EmailPasswordCredentials & {
  metadata?: Record<string, unknown>
  redirectTo?: string
}

export type OAuthProvider = 'google' | 'github' | 'gitlab' | 'bitbucket' | 'azure' | 'discord' | 'facebook' | 'twitch' | 'apple'

export const authService = {
  // Email/password sign in
  async signIn({ email, password }: EmailPasswordCredentials): Promise<User | null | { error: AuthError['message'] }> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      console.error('auth.signIn error:', error)
      return { error: error.message }
    }

    //Si trae datos el login es correcto e iremos a supabase a la tabla user_profiles por la informacion segun el id del user
    if (data.user) {
      const { id } = data.user
      const { data: profileData, error: profileError } = await supabase.from('user_profiles').select('*').eq('id', id).single()

      if (profileError) {
        console.error('auth.signIn profile error:', profileError)
        return { error: 'Profile not found' }
      }

      //console.log(profileData)

      return profileData
    } else {
      return null
    }
  },

  // OAuth sign in with provider
  async signInWithProvider(provider: OAuthProvider, redirectTo?: string) {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } })
    if (error) {
      console.error('auth.signInWithProvider error:', error)
      return null
    }
    return data
  },

  // Sign up new user
  async signUp({ email, password, metadata, redirectTo }: SignUpPayload) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: redirectTo
      }
    })

    if (error) {
      console.error('auth.signUp error:', error)
      return null
    }
    return data
  },

  // Sign out idempotente: si no hay sesión, regresa true sin fallar
  async signOut() {
    const { data } = await supabase.auth.getSession()
    if (!data?.session) return true
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('auth.signOut error:', error)
      return false
    }
    return true
  },
  // Get current session
  async getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.error('auth.getSession error:', error)
      return null
    }
    return data.session
  },

  //   // Get current user
  //   async getUser(): Promise<User | null> {
  //     const { data, error } = await supabase.auth.getUser()
  //     if (error) {
  //       console.error('auth.getUser error:', error)
  //       return null
  //     }
  //     return data.user
  //   },

  // Get user profile by ID
  async getUserProfile(userId: string): Promise<User | { error: string }> {
    const { data, error } = await supabase.from('user_profiles').select('*').eq('id', userId).single()
    if (error) {
      console.error('auth.getUserProfile error:', error)
      return { error: 'Error al obtener el perfil de usuario' }
    }
    return data
  },

  // Subscribe to auth state changes
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    const { data } = supabase.auth.onAuthStateChange((event, session) => callback(event, session))
    return () => data.subscription.unsubscribe()
  },

  // Send password reset email
  async resetPassword(email: string, redirectTo?: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) {
      console.error('auth.resetPassword error:', error)
      return null
    }
    return data
  },

  // Update currently logged in user
  async updateUser(updates: Parameters<typeof supabase.auth.updateUser>[0]) {
    const { data, error } = await supabase.auth.updateUser(updates)
    if (error) {
      console.error('auth.updateUser error:', error)
      return null
    }
    return data
  }
}

export type AuthService = typeof authService
