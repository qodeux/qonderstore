import { motion, type Variants } from 'framer-motion'
import { memo, useEffect, useRef, type PropsWithChildren } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useWizard } from 'react-use-wizard'
import { clearJumpToStep } from '../../../store/slices/providersSlice'
import type { RootState } from '../../../store/store'

type Props = {
  rxStep: (number: number) => { type: string; payload: number } // setPreviousStep
} & PropsWithChildren

const variants: Variants = {
  enter: (direction: number) => ({ x: direction > 0 ? 100 : -100, opacity: 0 }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 100 : -100, opacity: 0 })
}

const AnimatedStep = memo(function AnimatedStep({ children, rxStep }: Props) {
  const { activeStep, goToStep } = useWizard()
  const dispatch = useDispatch()

  const jumpToStep = useSelector((s: RootState) => s.providers.jumpToStep)

  // Dirección de animación con ref local (no depende del store)
  const lastStepRef = useRef<number>(activeStep)
  const direction = activeStep - lastStepRef.current
  useEffect(() => {
    lastStepRef.current = activeStep
  }, [activeStep])

  // Cleanup: guarda último visitado cuando este step se desmonte
  useEffect(() => {
    return () => {
      dispatch(rxStep(activeStep))
    }
  }, [activeStep, dispatch, rxStep])

  // Consumir intención de salto (one-shot) y limpiarla
  useEffect(() => {
    if (Number.isInteger(jumpToStep) && jumpToStep != null && jumpToStep !== activeStep) {
      goToStep(jumpToStep)
      dispatch(clearJumpToStep())
    }
  }, [jumpToStep, activeStep, goToStep, dispatch])

  return (
    <motion.div
      custom={direction}
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
