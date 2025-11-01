import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import supabase from '../lib/supabase'
import { setCategories } from '../store/slices/categoriesSlice'

export const useCategories = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null
    let subscription: ReturnType<typeof supabase.auth.onAuthStateChange>['data']['subscription'] | null = null
    let isMounted = true

    const fetchCategories = async () => {
      const { data, error } = await supabase.from('categories_view').select('*')
      if (!isMounted) return
      if (data) dispatch(setCategories(data))
      if (error) console.error('Error al cargar categorías:', error.message)
    }

    const subscribe = () => {
      channel = supabase
        .channel('realtime:categories')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, async () => {
          console.log('[Realtime] cambio en categories')
          await fetchCategories()
        })
        .subscribe((status) => console.log('[Realtime] status:', status))
    }

    const setup = async () => {
      await fetchCategories()

      // Inyecta token actual (si existe) y suscribe
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (token) {
        supabase.realtime.setAuth(token)
        subscribe()
      }

      // Guarda la suscripción para limpiar luego
      const res = supabase.auth.onAuthStateChange((event, session) => {
        const t = session?.access_token
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          supabase.realtime.setAuth(t as string)
          if (channel) supabase.removeChannel(channel)
          subscribe()
        }
        if (event === 'SIGNED_OUT') {
          if (channel) supabase.removeChannel(channel)
          channel = null
        }
      })

      subscription = res.data.subscription
    }

    setup()

    return () => {
      isMounted = false
      if (channel) supabase.removeChannel(channel)
      // No await en cleanup de React; dispara y olvida:
      subscription?.unsubscribe()
    }
  }, [dispatch])
}
