import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import supabase from '../lib/supabase'
import type { ConfigDB } from '../schemas/config.schema'
import { setConfig } from '../store/slices/configSlice'

export const useConfig = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    // Carga inicial
    const fetchConfig = async () => {
      const { data, error } = await supabase.from('config').select('*')

      if (data) dispatch(setConfig(data as ConfigDB[]))
      if (error) console.error('Error al cargar configuración:', error.message)
    }

    fetchConfig()

    // Realtime
    const channel = supabase
      .channel('realtime:Config')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'config' }, async () => {
        console.log('Cambios detectados')

        await fetchConfig() // <-- recarga todo desde la view
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dispatch])
}
