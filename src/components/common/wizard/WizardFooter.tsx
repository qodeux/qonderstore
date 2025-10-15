import { Button, Tooltip } from '@heroui/react'
import { ChevronLeft, ChevronRight, CircleCheckBig } from 'lucide-react'
import { useState } from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'
import { useWizard } from 'react-use-wizard'

type Props = {
  getStepForm?: (stepIndex: number) => UseFormReturn<FieldValues> | undefined
  onConfirm?: () => void
}

const WizardFooter = ({ getStepForm, onConfirm }: Props) => {
  const { nextStep, previousStep, isFirstStep, isLastStep, activeStep } = useWizard()

  const [checking, setChecking] = useState(false)

  const currentForm = getStepForm?.(activeStep)
  //const errorCount = currentForm ? Object.keys(currentForm.formState.errors ?? {}).length : 0

  const handleNext = async () => {
    if (currentForm) {
      setChecking(true)

      console.log(currentForm.getValues())

      // Valida TODO el formulario del paso actual y enfoca el primero con error
      const ok = await currentForm.trigger(undefined, { shouldFocus: true })

      if (!ok) {
        console.error(currentForm.formState.errors)
      }

      setChecking(false)
      if (!ok) return // ❌ No avanza si hay errores
    }
    await nextStep() // ✅ Avanza si no hay form o si pasó validación
  }

  return (
    <footer className='flex justify-between gap-2 my-2'>
      {!isFirstStep ? (
        <Tooltip content='Anterior' placement='right'>
          <Button color='primary' onPress={previousStep} size='sm' isDisabled={checking}>
            <ChevronLeft className='text-gray-200' />
          </Button>
        </Tooltip>
      ) : (
        <div />
      )}

      {/* Info simple de errores del paso actual (opcional) */}
      {/* <small className='text-xs text-default-500'>
        Paso {activeStep + 1} {currentForm ? `• ${errorCount} errores` : ''}
      </small> */}

      {!isLastStep ? (
        <Tooltip content='Siguiente' placement='left'>
          <Button color='primary' onPress={handleNext} className='pl-4' size='sm' isLoading={checking}>
            <ChevronRight className='text-gray-200' />
          </Button>
        </Tooltip>
      ) : (
        <Tooltip content='Guardar' placement='left'>
          <Button color='success' onPress={onConfirm} className='pl-4' size='sm' isLoading={checking}>
            <CircleCheckBig className='text-gray-200' />
          </Button>
        </Tooltip>
      )}
    </footer>
  )
}

export default WizardFooter
