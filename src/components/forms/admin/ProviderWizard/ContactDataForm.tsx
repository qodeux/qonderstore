import { Autocomplete, AutocompleteItem, Input, Switch } from '@heroui/react'
import { motion } from 'framer-motion'
import { Controller, useForm } from 'react-hook-form'

const neighborhoods = [
  { name: 'Colonia 1', key: 'colonia_1' },
  { name: 'Colonia 2', key: 'colonia_2' },
  { name: 'Colonia 3', key: 'colonia_3' }
]

const ContactDataForm = () => {
  const { control, watch } = useForm()

  const addAddress = watch('switchAddAddress', false)

  return (
    <motion.form className='space-y-2'>
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
            classNames={{ inputWrapper: 'bg-white' }}
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
            classNames={{ inputWrapper: 'bg-white' }}
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
          />
        )}
      />

      <Controller
        name='switchAddAddress'
        control={control}
        render={({ field }) => (
          <Switch size='sm' {...field}>
            ¿Agregar dirección?
          </Switch>
        )}
      />

      {addAddress && (
        <>
          <Controller
            name='postal_code'
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label='Código Postal'
                type='text'
                variant='bordered'
                size='sm'
                isInvalid={!!fieldState.error}
                errorMessage={fieldState.error?.message as string}
                {...field}
                classNames={{ inputWrapper: 'bg-white' }}
              />
            )}
          />
          <Controller
            name='address'
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label='Calle y número'
                type='text'
                variant='bordered'
                size='sm'
                isInvalid={!!fieldState.error}
                errorMessage={fieldState.error?.message as string}
                {...field}
                classNames={{ inputWrapper: 'bg-white' }}
              />
            )}
          />

          <Controller
            name='neighborhood'
            control={control}
            render={({ field }) => (
              <Autocomplete
                label='Selecciona una colonia'
                size='sm'
                variant='bordered'
                classNames={{ base: 'bg-white' }}
                selectedKey={String(field.value) || ''}
                onSelectionChange={(sel) => {
                  console.log(sel)
                  field.onChange(sel)
                }}
              >
                {neighborhoods.map((neighborhood) => (
                  <AutocompleteItem key={neighborhood.key}>{neighborhood.name}</AutocompleteItem>
                ))}
              </Autocomplete>
            )}
          />
        </>
      )}
    </motion.form>
  )
}

export default ContactDataForm
