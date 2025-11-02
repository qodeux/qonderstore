import { motion, type Variants } from 'framer-motion'
import { memo, useLayoutEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { useWizard } from 'react-use-wizard'

type Props = {
  children: React.ReactNode
  /** Action creator que guarda el índice actual en Redux */
  rxStep: (step: number) => { payload: number; type: string }
}

// +1 entra desde la derecha, -1 desde la izquierda
const variants: Variants = {
  enter: (d: number) => ({ x: d > 0 ? 100 : -100, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d < 0 ? 100 : -100, opacity: 0 })
}

const AnimatedStep = memo(function AnimatedStep({ children, rxStep }: Props) {
  const { activeStep } = useWizard()
  const dispatch = useDispatch()

  // Mantiene el step previo para calcular dirección sin depender de Redux
  const prevRef = useRef(activeStep)
  const firstMountRef = useRef(true)

  const dir = firstMountRef.current
    ? 1 // primer montaje: simula avance (entra desde derecha)
    : activeStep > prevRef.current
      ? 1
      : activeStep < prevRef.current
        ? -1
        : 0

  // Sincroniza índice visible y actualiza ref previa
  useLayoutEffect(() => {
    firstMountRef.current = false
    prevRef.current = activeStep
    dispatch(rxStep(activeStep))
  }, [activeStep, dispatch, rxStep])

  return (
    <motion.div
      // Nota: NO uses key={activeStep} aquí; el key está en el map del Wizard
      custom={dir}
      variants={variants}
      initial='enter'
      animate='center'
      exit='exit'
      transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
})

export default AnimatedStep
