import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import supabase from '../lib/supabase'
import { setProviders } from '../store/slices/providersSlice'

export const useProviders = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    // Carga inicial
    const fetchProviders = async () => {
      const { data, error } = await supabase.from('providers_view').select('*')

      if (data) dispatch(setProviders(data))
      if (error) console.error('Error al cargar proveedores:', error.message)
    }

    fetchProviders()

    // Realtime
    const channel = supabase
      .channel('realtime:Providers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'providers' }, async () => {
        await fetchProviders()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dispatch])
}
