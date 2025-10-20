import { Button, Input } from '@heroui/react'
import { Controller, useFormContext } from 'react-hook-form'
import { useWizard } from 'react-use-wizard'

const AccountData = () => {
  const { control, watch, trigger, setValue, setError, clearErrors, getValues } = useFormContext()
  const { nextStep, previousStep } = useWizard()

  return (
    <form className='flex w-full flex-col space-y-2 text-center'>
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
            classNames={{ inputWrapper: 'bg-white' }}
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
            classNames={{ inputWrapper: 'bg-white' }}
            description='El nombre de usuario será público, no necesariamente debe ser tu nombre real.'
          />
        )}
      />

      <Button variant='ghost' color='primary' size='md' onPress={nextStep}>
        Enviar solicitud
      </Button>
    </form>
  )
}

export default AccountData
