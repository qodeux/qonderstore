import { motion, type Variants } from 'framer-motion'
import { memo, useEffect, type PropsWithChildren } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useWizard } from 'react-use-wizard'
import type { RootState } from '../../../store/store'

type Props = {
  rxStep: (number: number) => { type: string; payload: number }
} & PropsWithChildren

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0
  }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 100 : -100,
    opacity: 0
  })
} satisfies Variants

const AnimatedStep = memo(function AnimatedStep({ children, rxStep }: Props) {
  const { activeStep } = useWizard()
  const dispatch = useDispatch()
  const { previousStep } = useSelector((state: RootState) => state.providers)

  useEffect(() => {
    return () => {
      dispatch(rxStep(activeStep))
    }
  }, [activeStep, previousStep, dispatch, rxStep])

  return (
    <motion.div
      custom={activeStep - previousStep}
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
