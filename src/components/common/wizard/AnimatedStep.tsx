import type { Variants } from 'framer-motion'
import { motion } from 'framer-motion'
import { memo, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useWizard } from 'react-use-wizard'
import { clearJumpToStep, setWizardNavDir } from '../../../store/slices/uiSlice'
import type { RootState } from '../../../store/store'

type Props = {
  children: React.ReactNode
  rxStep: (step: number) => { payload: number; type: string }
}

// Dirección explícita:
//   +1 => avanzar: entra desde la derecha (x: 100)
//   -1 => atrás:   entra desde la izquierda (x: -100)
const variants: Variants = {
  enter: (d: number) => ({ x: d > 0 ? 100 : -100, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d < 0 ? 100 : -100, opacity: 0 })
}

const AnimatedStep = memo(function AnimatedStep({ children, rxStep }: Props) {
  const { activeStep, goToStep } = useWizard()
  const dispatch = useDispatch()
  const navDir = useSelector((s: RootState) => s.ui.wizardNavDir) // -1 | 0 | 1
  const jumpToStep = useSelector((s: RootState) => s.ui.wizardJumpToStep)

  // Limpia la intención una vez montado el paso (siguiente tick)
  useEffect(() => {
    if (navDir !== 0) {
      const t = setTimeout(() => dispatch(setWizardNavDir(0)), 0)
      return () => clearTimeout(t)
    }
  }, [navDir, dispatch])

  // Guardar último step al desmontar
  useEffect(() => {
    return () => {
      dispatch(rxStep(activeStep))
    }
  }, [activeStep, dispatch, rxStep])

  // Jump programado (no afecta la animación basada en intención)
  useEffect(() => {
    if (Number.isInteger(jumpToStep) && jumpToStep != null && jumpToStep !== activeStep) {
      goToStep(jumpToStep)
      dispatch(clearJumpToStep())
    }
  }, [jumpToStep, activeStep, goToStep, dispatch])

  // Fallback simple: si llega 0 por primer mount, asume +1 (entra desde derecha)
  const dir = navDir === 0 ? 1 : navDir

  return (
    <motion.div
      key={activeStep} // fuerza remount por paso
      custom={dir} // usa intención explícita
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
