// components/SessionBootstrapper.tsx
import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { authService } from '../services/authService'
import { authLoggedOut, refreshProfileSilent, restoreSession } from '../store/slices/authSlice'
import type { AppDispatch, RootState } from '../store/store'

export const SessionBootstrapper = () => {
  const dispatch = useDispatch<AppDispatch>()
  const logoutInProgress = useSelector((s: RootState) => s.auth.logoutInProgress)
  const logoutRef = useRef(logoutInProgress)
  useEffect(() => {
    logoutRef.current = logoutInProgress
  }, [logoutInProgress])

  useEffect(() => {
    dispatch(restoreSession())

    const unsubscribe = authService.onAuthStateChange((event, session) => {
      console.log('[Supabase Auth Event]', event)

      if (event === 'INITIAL_SESSION') return

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        dispatch(refreshProfileSilent(session?.user?.id))
        return
      }

      if (event === 'SIGNED_OUT') {
        // Si ESTA pestaña inició el logout, deja que el thunk termine (overlay visible).
        if (logoutRef.current) return
        // Si fue en OTRA pestaña, sincroniza el estado aquí.
        dispatch(authLoggedOut())
        return
      }
    })

    return () => unsubscribe()
  }, [dispatch])

  return null
}
