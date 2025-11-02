// components/common/ScrollToTopButton.tsx
import { Button, Tooltip } from '@heroui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronsUp } from 'lucide-react'
import { useEffect, useState } from 'react'

type Props = {
  /** referencia al contenedor con scroll */
  targetRef: React.RefObject<HTMLElement | null>
  /** opcional: distancia (px) desde el top para mostrar el botón */
  threshold?: number
}

const ScrollToTopButton = ({ targetRef, threshold = 300 }: Props) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = targetRef.current
    if (!el) return

    const updateVisibility = () => {
      const hasOverflow = el.scrollHeight > el.clientHeight
      const past = el.scrollTop > threshold
      setVisible(hasOverflow && past)
    }

    el.addEventListener('scroll', updateVisibility, { passive: true })
    window.addEventListener('resize', updateVisibility)
    updateVisibility()

    return () => {
      el.removeEventListener('scroll', updateVisibility)
      window.removeEventListener('resize', updateVisibility)
    }
  }, [targetRef, threshold])

  const handleClick = () => {
    const el = targetRef.current
    el?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key='scrollTop'
          className='absolute bottom-2 right-3 z-40'
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 450, damping: 30 } }}
          exit={{ opacity: 0, y: 20, scale: 0.8, transition: { duration: 0.2, ease: 'easeOut' } }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Tooltip content='Ir arriba' placement='left'>
            <Button isIconOnly onPress={handleClick} className='shadow-lg'>
              <ChevronsUp />
            </Button>
          </Tooltip>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ScrollToTopButton
