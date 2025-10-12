import { Input } from '@heroui/react'
import { motion } from 'framer-motion'
import { Controller, useForm } from 'react-hook-form'

const BankDataForm = () => {
  const { control } = useForm()
  return (
    <motion.form className='space-y-3'>
      <Controller
        name='Banco'
        control={control}
        render={({ field, fieldState }) => (
          <Input
            label='Banco'
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
        name='account'
        control={control}
        render={({ field, fieldState }) => (
          <Input
            label='CLABE'
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
        name='holder_name'
        control={control}
        render={({ field, fieldState }) => (
          <Input
            label='Nombre del titular'
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
        name='rfc'
        control={control}
        render={({ field, fieldState }) => (
          <Input
            label='RFC'
            type='text'
            size='sm'
            variant='bordered'
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message as string}
            {...field}
          />
        )}
      />
    </motion.form>
  )
}

export default BankDataForm
