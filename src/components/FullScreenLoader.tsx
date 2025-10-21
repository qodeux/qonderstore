// components/FullScreenLoader.tsx
import { Spinner } from '@heroui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  open: boolean
  message?: string
}

export const FullScreenLoader = ({ open, message = 'Cargando…' }: Props) => {
  // Evita hydration mismatch en SSR/StrictMode
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return createPortal(
    <AnimatePresence mode='wait' initial={false}>
      {open && (
        <motion.div
          key='overlay'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className='fixed inset-0 z-[9999] grid place-items-center bg-white '
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 4 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
          >
            <Spinner size='lg' />
            <p className='text-sm text-default-500'>{message}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
