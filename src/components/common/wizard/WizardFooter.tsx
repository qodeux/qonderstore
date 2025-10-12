import { Button, Tooltip } from '@heroui/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useWizard } from 'react-use-wizard'

const WizardFooter = () => {
  const { nextStep, previousStep, isFirstStep, isLastStep } = useWizard()
  return (
    <footer className='flex justify-between gap-2 my-2'>
      {!isFirstStep && (
        <Tooltip content='Anterior' placement='right'>
          <Button color='primary' onPress={previousStep} size='sm'>
            <ChevronLeft className='text-gray-200' />
          </Button>
        </Tooltip>
      )}
      {isFirstStep && <div />}
      {!isLastStep && (
        <Tooltip content='Siguiente' placement='left'>
          <Button color='primary' onPress={nextStep} className='pl-4' size='sm'>
            <ChevronRight className='text-gray-200' />
          </Button>
        </Tooltip>
      )}
    </footer>
  )
}

export default WizardFooter
