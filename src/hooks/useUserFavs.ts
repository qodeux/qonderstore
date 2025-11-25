import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import supabase from '../lib/supabase'
import { userService } from '../services/userService'
import { setUserFavs } from '../store/slices/authSlice'

export const useUserFavs = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    // Carga inicial
    const fetchUserFavs = async () => {
      const { data, error } = await userService.fetchUserFavorites()

      if (data) dispatch(setUserFavs(data))
      if (error) console.error('Error al cargar marcas de productos:', error.message)
    }
    fetchUserFavs()
    const channel = supabase
      .channel('realtime:UserFavs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_favs' }, async () => {
        await fetchUserFavs()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dispatch])
}
