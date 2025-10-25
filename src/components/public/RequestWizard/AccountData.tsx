import { Button, Checkbox, Input } from '@heroui/react'
import { Controller, useFormContext } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { useWizard } from 'react-use-wizard'
import type { RequestInput } from '../../../schemas/request.schema'
import { requestAccessService } from '../../../services/requestAccessService'
import type { RootState } from '../../../store/store'

const AccountData = () => {
  const { control, trigger, handleSubmit, setError } = useFormContext()
  const { nextStep, previousStep } = useWizard()
  const requestData = useSelector((state: RootState) => state.requestAccess.requestData)

  const onSubmit = handleSubmit(
    async (data) => {
      console.log(data)

      const isValid = await trigger()
      if (isValid) {
        const requestAccess = await requestAccessService.createRequest({ ...requestData, ...data } as RequestInput)

        if (requestAccess.error) {
          if (requestAccess.error.code === '23505') {
            // Manejo de error: clave duplicada

            const details = requestAccess.error?.message ?? ''

            if (details.includes('request_access_alias_key')) {
              setError('alias', { message: 'Este nombre de usuario ya está en uso' })
            } else if (details.includes('request_access_email_key')) {
              setError('email', { message: 'Este correo electrónico ya está en uso' })
            } else {
              console.error('Error desconocido:', details)
            }
          }

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
    <form className='flex w-full flex-col space-y-2 text-center' onSubmit={onSubmit}>
      <h4 className='font-bold text-xl'>Datos de tu cuenta</h4>

      <Controller
        name='alias'
        control={control}
        render={({ field, fieldState }) => (
          <Input
            label='Nombre de usuario'
            type='text'
            size='sm'
            variant='bordered'
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message as string}
            {...field}
            classNames={{ inputWrapper: 'bg-white', errorMessage: 'text-left' }}
          />
        )}
      />

      <Controller
        name='email'
        control={control}
        render={({ field, fieldState }) => (
          <Input
            label='Email'
            type='text'
            variant='bordered'
            size='sm'
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message as string}
            {...field}
            classNames={{ inputWrapper: 'bg-white', errorMessage: 'text-left' }}
            description='El nombre de usuario será público, no necesariamente debe ser tu nombre real.'
          />
        )}
      />

      <Controller
        name='acceptTerms'
        control={control}
        render={({ field, fieldState }) => (
          <Checkbox isInvalid={!!fieldState.error} {...field} classNames={{ label: 'text-xs text-left' }} className='mb-2'>
            He leído y acepto los términos y condiciones así como la política de privacidad.
          </Checkbox>
        )}
      />

      <Button variant='ghost' color='primary' size='md' type='submit'>
        Enviar solicitud
      </Button>
    </form>
  )
}

export default AccountData
