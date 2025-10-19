import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import supabase from '../lib/supabase'
import { setUsers } from '../store/slices/usersSlice'

export const useUsers = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    // Carga inicial
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('user_profiles').select('*')

      if (data) dispatch(setUsers(data))
      if (error) console.error('Error al cargar usuarios:', error.message)
    }

    fetchUsers()

    // Realtime
    const channel = supabase
      .channel('realtime:Users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, async () => {
        await fetchUsers() // <-- recarga todo desde la view
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dispatch])
}
