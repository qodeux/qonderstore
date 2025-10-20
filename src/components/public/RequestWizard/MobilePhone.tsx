import { Button, Input } from '@heroui/react'
import { Controller, useFormContext } from 'react-hook-form'
import { PatternFormat } from 'react-number-format'
import { useWizard } from 'react-use-wizard'

const MobilePhone = () => {
  const { control } = useFormContext()
  const { nextStep } = useWizard()

  return (
    <form className='flex w-full flex-col text-center space-y-2 '>
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
            classNames={{ inputWrapper: 'bg-white' }}
            description='Necesitas usar un teléfono móvil para continuar con el proceso de registro y verificación.'
          />
        )}
      />

      <Button variant='ghost' color='primary' size='md' onPress={nextStep}>
        Enviar código
      </Button>
    </form>
  )
}

export default MobilePhone
