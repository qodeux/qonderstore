import { Button, Tooltip } from '@heroui/react'
import { ChevronLeft, ChevronRight, CircleCheckBig } from 'lucide-react'
import { useState } from 'react'
import { flushSync } from 'react-dom'
import type { FieldValues, UseFormReturn } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import { useWizard } from 'react-use-wizard'
import { setWizardNavDir } from '../../../store/slices/uiSlice'

type Props = {
  getStepForm?: (stepIndex: number) => UseFormReturn<FieldValues> | undefined
  onConfirm?: () => void
}

const WizardFooter = ({ getStepForm, onConfirm }: Props) => {
  const { nextStep, previousStep, isFirstStep, isLastStep, activeStep } = useWizard()
  const dispatch = useDispatch()

  const [checking, setChecking] = useState(false)

  const currentForm = getStepForm?.(activeStep)

  const handlePrev = async () => {
    // Marca intención de navegación SINCRÓNICAMENTE antes de cambiar de paso
    flushSync(() => dispatch(setWizardNavDir(-1)))
    await previousStep()
  }

  const handleNext = async () => {
    if (currentForm) {
      setChecking(true)
      const ok = await currentForm.trigger(undefined, { shouldFocus: true })
      setChecking(false)
      if (!ok) return
    }
    // Marca intención de navegación SINCRÓNICAMENTE antes de cambiar de paso
    flushSync(() => dispatch(setWizardNavDir(1)))
    await nextStep()
  }

  return (
    <footer className='flex justify-between gap-2 my-2'>
      {!isFirstStep ? (
        <Tooltip content='Anterior' placement='right'>
          <Button color='primary' onPress={handlePrev} size='sm' isDisabled={checking}>
            <ChevronLeft className='text-gray-200' />
          </Button>
        </Tooltip>
      ) : (
        <div />
      )}

      {!isLastStep ? (
        <Tooltip content='Siguiente' placement='left'>
          <Button color='primary' onPress={handleNext} className='pl-4' size='sm' isLoading={checking}>
            <ChevronRight className='text-gray-200' />
          </Button>
        </Tooltip>
      ) : (
        <Tooltip content='Confirmar' placement='left'>
          <Button color='success' onPress={onConfirm} className='pl-4' size='sm' isLoading={checking}>
            <CircleCheckBig className='text-gray-200' />
          </Button>
        </Tooltip>
      )}
    </footer>
  )
}

export default WizardFooter
