import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import supabase from '../lib/supabase'
import { setAccessRequests } from '../store/slices/requestAccessSlice'

export const useRequests = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    // Carga inicial
    const fetchRequests = async () => {
      const { data, error } = await supabase.from('request_access').select('*')

      if (data) dispatch(setAccessRequests(data))
      if (error) console.error('Error al cargar las solicitudes:', error.message)
    }

    fetchRequests()

    // Realtime
    const channel = supabase
      .channel('realtime:Requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'request_access' }, async () => {
        await fetchRequests() // <-- recarga todo desde la view
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dispatch])
}
