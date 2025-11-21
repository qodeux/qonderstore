import { useEffect } from 'react'
import { setCart, STORAGE_KEY, type CartItem } from '../store/slices/cartSlice'
import { useAppDispatch } from '../store/store'

export function useCartStorageSync() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const handler = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return

      try {
        if (!event.newValue) {
          dispatch(setCart([]))
          return
        }

        const items = JSON.parse(event.newValue) as CartItem[]
        dispatch(setCart(items))
      } catch (err) {
        console.error('Error syncing cart from storage', err)
      }
    }

    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [dispatch])
}
