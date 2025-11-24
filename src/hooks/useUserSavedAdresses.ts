import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import supabase from '../lib/supabase'
import { userService } from '../services/userService'
import { setUserAddresses } from '../store/slices/authSlice'

export const useUserSavedAdresses = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    const fetchUserAddresses = async () => {
      const { data, error } = await userService.fetchAdresses()

      if (data) dispatch(setUserAddresses(data))
      if (error) console.error('Error al cargar marcas de productos:', error.message)
    }

    fetchUserAddresses()
    const channel = supabase
      .channel('realtime:UserAddresses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_addresses' }, async () => {
        await fetchUserAddresses()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dispatch])
}
