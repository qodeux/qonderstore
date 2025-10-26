import { Button, Input } from '@heroui/react'
import { Controller, useFormContext } from 'react-hook-form'
import { PatternFormat } from 'react-number-format'
import { useDispatch } from 'react-redux'
import { useWizard } from 'react-use-wizard'
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
        //Si estamos en desarrollo saltamos el envío del OTP y la validación de Twilio
        if (import.meta.env.VITE_DEV_MODE === 'true') {
          nextStep()
          return
        }

        //Despues de pasar la validación, hacemos el lookup en twilio
        const response = await fetch('/.netlify/functions/twilio-lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: data.phone })
        })

        const lookupData = await response.json()

        if (!response.ok) {
          alert(lookupData?.error || 'Error verificando el número de teléfono')
          return
        }

        if (!lookupData.isValid) {
          setError('phone', { type: 'manual', message: 'Número de teléfono inválido' })
          return
        }

        if (!lookupData.isMobile) {
          setError('phone', { type: 'manual', message: 'No es un número de teléfono móvil' })
          return
        }

        console.log(lookupData)

        dispatch(patchRequest(data))

        const otpSendResponse = await fetch('/.netlify/functions/twilio-otp-send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: data.phone, channel: 'sms', locale: 'es' })
        }).then((r) => r.json())

        console.log(otpSendResponse)

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
