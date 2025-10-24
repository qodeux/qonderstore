import { Button, Input } from '@heroui/react'
import { Controller, useFormContext } from 'react-hook-form'
import { PatternFormat } from 'react-number-format'
import { useDispatch } from 'react-redux'
import { useWizard } from 'react-use-wizard'
import { patchRequest } from '../../../store/slices/requestAccessSlice'

const MobilePhone = () => {
  const { control, trigger, handleSubmit } = useFormContext()
  const { nextStep } = useWizard()
  const dispatch = useDispatch()

  const onSubmit = handleSubmit(
    async (data) => {
      console.log(data)

      const isValid = await trigger()
      if (isValid) {
        dispatch(patchRequest(data))

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
