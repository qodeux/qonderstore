import { Input } from '@heroui/react'
import { Controller, useFormContext } from 'react-hook-form'

// const colorsOptions = [
//   { label: 'Rojo', key: 'red' },
//   { label: 'Azul', key: 'blue' },
//   { label: 'Verde', key: 'green' },
//   { label: 'Amarillo', key: 'yellow' },
//   { label: 'Negro', key: 'black' }
// ]

const ProviderForm = () => {
  //   const providers = useSelector((state: RootState) => state.providers.items) ?? []
  //   const editMode = useSelector((state: RootState) => state.providers.editMode)

  const { control } = useFormContext()

  return (
    <form className='space-y-2'>
      <Controller
        name='alias'
        control={control}
        render={({ field, fieldState }) => (
          <Input
            label='Alias'
            type='text'
            size='sm'
            variant='bordered'
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message as string}
            {...field}
          />
        )}
      />
      <Controller
        name='name'
        control={control}
        render={({ field, fieldState }) => (
          <Input
            label='Nombre'
            type='text'
            size='sm'
            variant='bordered'
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message as string}
            {...field}
          />
        )}
      />
      <Controller
        name='phone'
        control={control}
        render={({ field, fieldState }) => (
          <Input
            label='Teléfono'
            type='text'
            variant='bordered'
            size='sm'
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message as string}
            {...field}
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
          />
        )}
      />
      <Controller
        name='address'
        control={control}
        render={({ field, fieldState }) => (
          <Input
            label='Dirección'
            type='text'
            variant='bordered'
            size='sm'
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message as string}
            {...field}
          />
        )}
      />
    </form>
  )
}

export default ProviderForm
