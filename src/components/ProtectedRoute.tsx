// components/ProtectedRoute.tsx
import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router'
import type { RootState } from '../store/store'
import { FullScreenLoader } from './FullScreenLoader'

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { status, isAuthenticated, user, logoutInProgress } = useSelector((s: RootState) => s.auth)
  const location = useLocation()

  if (status === 'idle' || status === 'checking') {
    return <FullScreenLoader open message={logoutInProgress ? 'Cerrando sesión…' : 'Restaurando sesión…'} />
  }

  if (!isAuthenticated) {
    return <Navigate to='/login' replace state={{ from: location.pathname + location.search }} />
  }

  if (allowedRoles?.length) {
    const role = user?.role ?? ''
    if (!allowedRoles.includes(role)) return <Navigate to='/admin' replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
