import { Button, InputOtp } from '@heroui/react'
import { useState } from 'react'
import { flushSync } from 'react-dom'
import { Controller, useFormContext } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { useWizard } from 'react-use-wizard'
import { requestAccessService } from '../../../services/requestAccessService'
import { setWizardNavDir } from '../../../store/slices/uiSlice'
import type { RootState } from '../../../store/store'

const OTPCode = () => {
  const { control, handleSubmit, setError, setValue, setFocus, trigger, clearErrors } = useFormContext()
  const { previousStep, nextStep } = useWizard()
  const dispatch = useDispatch()
  const { requestData } = useSelector((state: RootState) => state.requestAccess)

  const maxCodeAttempts = 3
  const [codeAttempts, setCodeAttempts] = useState<number>(0)
  const [showHelp, setShowHelp] = useState<boolean>(false)

  const handlePrev = async () => {
    // Marca intención de navegación SINCRÓNICAMENTE antes de cambiar de paso
    flushSync(() => dispatch(setWizardNavDir(-1)))
    await previousStep()
  }

  const onSubmit = handleSubmit(async (data) => {
    console.log(data)

    const isValid = await trigger()

    if (!isValid) {
      return
    }

    //Si estamos en desarrollo saltamos la comprobación del OTP
    if (import.meta.env.VITE_DEV_MODE === 'true') {
      if (data.code !== '1234') {
        setError('code', { type: 'manual', message: 'Código incorrecto, intenta de nuevo' })
        setTimeout(() => {
          setValue('code', '')
          setFocus('code')
          setCodeAttempts((prev) => prev + 1)

          if (codeAttempts + 1 >= maxCodeAttempts - 1) {
            setShowHelp(true)
          }
        }, 1000)
        return
      }

      clearErrors('code')

      setTimeout(() => {
        nextStep()
      }, 1000)

      return
    }

    if (!requestData?.phone) return
    const verificationResult = await requestAccessService.checkOTP(requestData.phone, data.code)

    if (!verificationResult.success) {
      setError('code', { type: 'manual', message: 'Código incorrecto, intenta de nuevo' })
      setTimeout(() => {
        setValue('code', '')
        setFocus('code')
        setCodeAttempts((prev) => prev + 1)

        if (codeAttempts + 1 >= maxCodeAttempts - 1) {
          setShowHelp(true)
        }
      }, 1000)
    } else {
      setTimeout(() => {
        nextStep()
      }, 1000)
    }
  })

  return (
    <form className='flex w-full flex-col space-y-2  text-center' onSubmit={onSubmit}>
      <h4 className='font-bold text-xl'>Código de verificación</h4>

      <div className='flex justify-center'>
        <Controller
          name='code'
          control={control}
          render={({ field, fieldState }) => (
            <InputOtp
              length={4}
              value={field.value}
              onValueChange={field.onChange}
              size='lg'
              onComplete={() => {
                onSubmit()
              }}
              autoFocus
              isInvalid={!!fieldState.error}
              errorMessage={fieldState.error?.message}
            />
          )}
        />
      </div>

      <p className='text-sm'>Ingresa el código de verificación que hemos enviado a tu teléfono móvil.</p>

      {showHelp && <p className='text-xs'>¿No recibiste el código? Solicita uno nuevo o comprueba tu número de teléfono.</p>}

      <Button variant='ghost' color='primary' size='md' className='w-full mt-2' onPress={handlePrev}>
        Regresar
      </Button>
    </form>
  )
}

export default OTPCode
