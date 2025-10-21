import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import supabase from '../lib/supabase'
import { setBanks } from '../store/slices/catalogsSlice'

//Catálogos disponibles
type CatalogName = 'banks' | 'account_types'

export const useCatalog = (catName: CatalogName) => {
  const dispatch = useDispatch()

  useEffect(() => {
    // Carga inicial
    const fetchCatalogs = async () => {
      const { data, error } = await supabase.from(`view_cat_${catName}`).select('*')

      if (data) {
        switch (catName) {
          case 'banks':
            dispatch(setBanks(data))
            break
          case 'account_types':
            dispatch({ type: 'catalogs/setAccountTypes', payload: data })
            break
          default:
            break
        }
      }

      if (error) console.error('Error al cargar catálogos:', error.message)
    }

    fetchCatalogs()

    // Realtime
    const channel = supabase
      .channel('realtime:Catalogs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'catalogs' }, async () => {
        await fetchCatalogs() // <-- recarga todo desde la view
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dispatch, catName])
}
