import { Button, Input } from '@heroui/react'
import { Controller, useFormContext } from 'react-hook-form'
import { PatternFormat } from 'react-number-format'
import { useDispatch } from 'react-redux'
import { useWizard } from 'react-use-wizard'
import { requestAccessService } from '../../../services/requestAccessService'
import { patchRequest } from '../../../store/slices/requestAccessSlice'

const MobilePhone = () => {
  const { control, trigger, handleSubmit, setError } = useFormContext()
  const { nextStep } = useWizard()
  const dispatch = useDispatch()

  const onSubmit = handleSubmit(
    async (data) => {
      console.log(data)

      const isValid = await trigger()

      if (isValid) {
        dispatch(patchRequest(data))

        //Si estamos en desarrollo saltamos el envío del OTP y la validación de Twilio
        if (import.meta.env.VITE_DEV_MODE === 'true') {
          //Validamos que no exista ya el teléfono en la base de datos
          const existingUser = await requestAccessService.verifyPhoneExists(data.phone)

          if (existingUser.exists) {
            setError('phone', { type: 'manual', message: existingUser.msg })
            return
          }

          nextStep()
          return
        }

        //Despues de pasar la validación RHF, hacemos la validacion en el servicio
        const validateResponse = await requestAccessService.validatePhone(data.phone)

        if (!validateResponse.ok) {
          if (validateResponse?.error) {
            setError('phone', { type: 'manual', message: validateResponse.error })
          }
          return
        }

        if (!validateResponse.isValid) {
          setError('phone', { type: 'manual', message: 'Número de teléfono inválido' })
          return
        }

        if (!validateResponse.isMobile) {
          setError('phone', { type: 'manual', message: 'No es un número de teléfono móvil' })
          return
        }

        const otpSendResponse = await requestAccessService.sendOTP(data.phone)

        if (otpSendResponse?.error) {
          setError('phone', { type: 'manual', message: 'Error enviando el código OTP. Intenta de nuevo.' })
          return
        }

        nextStep()
      }
    },
    (errors) => {
      console.log(errors)
    }
  )

  return (
    <form className='flex w-full flex-col text-center space-y-2 ' onSubmit={onSubmit}>
      <h4 className='font-bold text-xl'>Solicita tu acceso</h4>

      <Controller
        name='phone'
        control={control}
        render={({ field, fieldState }) => (
          <PatternFormat
            customInput={Input}
            format='## #### ####'
            label='Teléfono'
            type='text'
            variant='bordered'
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message as string}
            {...field}
            classNames={{ inputWrapper: 'bg-white', errorMessage: 'text-left' }}
            description='Necesitas usar un teléfono móvil para continuar con el proceso de registro y verificación.'
          />
        )}
      />

      <Button variant='ghost' color='primary' size='md' type='submit'>
        Enviar código
      </Button>
    </form>
  )
}

export default MobilePhone
