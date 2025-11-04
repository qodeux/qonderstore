// components/common/ScrollToTopButton.tsx
import { Button, Tooltip } from '@heroui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronsUp } from 'lucide-react'
import { useEffect, useState } from 'react'

type Props = {
  /** referencia al contenedor con scroll */
  targetRef?: React.RefObject<HTMLElement | null> // 👈 ahora es opcional
  /** opcional: distancia (px) desde el top para mostrar el botón */
  threshold?: number
}

const ScrollToTopButton = ({ targetRef, threshold = 300 }: Props) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Si no hay ref, usa el window
    const el = targetRef?.current
    //const scrollTarget = el ?? window

    const getScrollTop = () => {
      return el ? el.scrollTop : window.scrollY || document.documentElement.scrollTop
    }

    const getScrollHeight = () => {
      return el ? el.scrollHeight - el.clientHeight : document.documentElement.scrollHeight - window.innerHeight
    }

    const updateVisibility = () => {
      const hasOverflow = getScrollHeight() > 0
      const past = getScrollTop() > threshold
      setVisible(hasOverflow && past)
    }

    if (el) {
      el.addEventListener('scroll', updateVisibility, { passive: true })
    } else {
      window.addEventListener('scroll', updateVisibility, { passive: true })
    }

    window.addEventListener('resize', updateVisibility)
    updateVisibility()

    return () => {
      if (el) {
        el.removeEventListener('scroll', updateVisibility)
      } else {
        window.removeEventListener('scroll', updateVisibility)
      }
      window.removeEventListener('resize', updateVisibility)
    }
  }, [targetRef, threshold])

  const handleClick = () => {
    const el = targetRef?.current
    if (el) {
      el.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key='scrollTop'
          className='fixed bottom-4 right-4 z-40' // 👈 fixed en vez de absolute para el caso window
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
