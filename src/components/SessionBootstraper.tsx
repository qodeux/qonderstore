// components/SessionBootstrapper.tsx
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { restoreSession } from '../store/slices/authSlice'
import type { AppDispatch } from '../store/store'

export const SessionBootstrapper = () => {
  const dispatch = useDispatch<AppDispatch>()
  useEffect(() => {
    dispatch(restoreSession())
  }, [dispatch])
  return null
}
