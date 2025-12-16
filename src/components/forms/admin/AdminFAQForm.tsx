import { Input, Textarea } from '@heroui/react'
import { Controller, useFormContext } from 'react-hook-form'

const AdminFAQForm = () => {
  const {
    control,
    formState: { errors }
  } = useFormContext()

  return (
    <form className='space-y-2'>
      <Controller
        name='question'
        control={control}
        render={({ field, fieldState }) => (
          <Textarea
            label='Pregunta frecuente'
            size='sm'
            variant='bordered'
            maxLength={300}
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message as string}
            {...field}
            classNames={{ inputWrapper: 'bg-white' }}
          />
        )}
      />
      <Controller
        name='answer'
        control={control}
        render={({ field, fieldState }) => (
          <Textarea
            label='Respuesta'
            size='sm'
            variant='bordered'
            maxLength={500}
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message as string}
            {...field}
            classNames={{ inputWrapper: 'bg-white' }}
          />
        )}
      />
      <Controller
        name='order'
        control={control}
        render={({ field, fieldState }) => (
          <Input
            label='Orden'
            type='number'
            size='sm'
            variant='bordered'
            value={field.value ?? ''} // si es undefined, muestra vacío
            onValueChange={(v) => {
              // guarda string vacío (para permitir borrar)
              // o número cuando haya valor
              field.onChange(v === '' ? '' : Number(v))
            }}
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message as string}
            classNames={{ inputWrapper: 'bg-white' }}
          />
        )}
      />
      <Controller
        name='type'
        control={control}
        render={({ field, fieldState }) => (
          <Input
            label='Tipo'
            type='text'
            size='sm'
            variant='bordered'
            maxLength={20}
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message as string}
            {...field}
            classNames={{ inputWrapper: 'bg-white' }}
          />
        )}
      />
    </form>
  )
}

export default AdminFAQForm
