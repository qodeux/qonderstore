// components/AuthOverlay.tsx
import { useSelector } from 'react-redux'
import type { RootState } from '../store/store'
import { FullScreenLoader } from './FullScreenLoader'

export const AuthOverlay = () => {
  const { status, logoutInProgress, loading } = useSelector((s: RootState) => s.auth)

  const open = logoutInProgress || status === 'checking' || loading
  const message = logoutInProgress ? 'Cerrando sesión…' : loading ? 'Iniciando sesión…' : 'Cargando…'
  return <FullScreenLoader open={open} message={message} />
}
