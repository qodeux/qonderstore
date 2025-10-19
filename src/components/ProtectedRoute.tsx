// components/ProtectedRoute.tsx
import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router'
import type { RootState } from '../store/store'

type ProtectedRouteProps = {
  children: React.ReactNode
  allowedRoles?: string[]
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { status, isAuthenticated, user } = useSelector((s: RootState) => s.auth)
  const location = useLocation()

  if (status === 'checking') {
    return null // o spinner
  }

  if (!isAuthenticated) {
    return <Navigate to='/login' replace state={{ from: location.pathname + location.search }} />
  }

  if (allowedRoles?.length) {
    const role = user?.role ?? ''
    if (!allowedRoles.includes(role)) {
      return <Navigate to='/admin' replace />
    }
  }

  return <>{children}</>
}

export default ProtectedRoute
