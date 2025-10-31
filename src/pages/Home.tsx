import { Button, Tooltip } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router'
import { Wizard } from 'react-use-wizard'
import AnimatedStep from '../components/common/wizard/AnimatedStep'
import AccountData from '../components/public/RequestWizard/AccountData'
import Confirmation from '../components/public/RequestWizard/Confirmation'
import MobilePhone from '../components/public/RequestWizard/MobilePhone'
import OTPCode from '../components/public/RequestWizard/OTPCode'
import { requestAccountDataSchema, requestCodeSchema, requestPhoneSchema } from '../schemas/request.schema'
import { requestJumpToStep, setWizardCurrentStep } from '../store/slices/uiSlice'
import type { RootState } from '../store/store'
import type { Step } from '../types/ui'

const Home = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true'
  const { wizardCurrentIndex } = useSelector((state: RootState) => state.ui)
  const mobilePhoneForm = useForm({
    resolver: zodResolver(requestPhoneSchema),
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange'
  })

  const otpForm = useForm({
    resolver: zodResolver(requestCodeSchema),
    shouldUnregister: false,
    mode: 'onSubmit',
    reValidateMode: 'onChange'
  })

  const accountDataForm = useForm({
    resolver: zodResolver(requestAccountDataSchema),
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange'
  })

  const WizardSteps: Step[] = [
    {
      title: 'Solicitar ',
      content: MobilePhone,
      form: mobilePhoneForm
    },
    {
      title: 'Código de verificación',
      content: OTPCode,
      form: otpForm
    },
    {
      title: 'Datos de la cuenta',
      content: AccountData,
      form: accountDataForm
    },

    // En Confirmación pasamos los datos combinados como prop
    {
      title: 'Confirmación',
      content: Confirmation
    }
  ]

  const resetRequestAccess = () => {
    mobilePhoneForm.reset()
    otpForm.reset()
    accountDataForm.reset()

    dispatch(requestJumpToStep(0))
  }

  useEffect(() => {
    if (isAuthenticated) {
      navigate(user && ['staff', 'admin'].includes(user.role) ? '/admin' : '/tienda', { replace: true })
    }
  }, [isAuthenticated, navigate, user])

  return (
    <div className='container grid md:grid-cols-2 md:h-full items-center  space-y-10 md:space-y-0 mx-auto'>
      <section className='space-y-3 max-w-md mx-auto text-sm '>
        <h1 className='text-3xl'>Bienvenido</h1>
        <p>El acceso y la compra de nuestros productos solo están disponibles para nuestros miembros.</p>
        <h4 className='text-xl'>¿Por qué unirte a nuestro club?</h4>
        <ol className=' list-disc ml-3 '>
          <li>Acceso exclusivo a productos de alta calidad.</li>
          <li>Compras discretas, rápidas y seguras.</li>
          <li>Descuentos especiales y promociones solo para miembros.</li>
          <li>Soporte prioritario y atención personalizada.</li>
          <li>Participación en eventos y lanzamientos exclusivos.</li>
        </ol>
      </section>
      <section className='p-8 rounded-lg overflow-hidden bg-white border border-gray-200 shadow-xl w-full sm:max-w-sm  relative top-10 md:top-0 mx-auto'>
        {isDevMode && wizardCurrentIndex > 0 && (
          <Tooltip content='Reiniciar solicitud de acceso'>
            <Button
              variant='flat'
              size='sm'
              color='warning'
              className='absolute top-4 right-4'
              href='/'
              isIconOnly
              onPress={resetRequestAccess}
            >
              <RotateCcw />
            </Button>
          </Tooltip>
        )}
        <Wizard wrapper={<AnimatePresence initial={false} mode='wait' />}>
          {WizardSteps.map(({ content: StepContent, form }, index) => (
            <AnimatedStep key={index} rxStep={setWizardCurrentStep}>
              {form ? (
                <FormProvider {...form}>
                  <StepContent />
                </FormProvider>
              ) : (
                <StepContent />
              )}
            </AnimatedStep>
          ))}
        </Wizard>
      </section>
    </div>
  )
}

export default Home
