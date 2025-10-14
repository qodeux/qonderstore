import { Autocomplete, AutocompleteItem, Input, Radio, RadioGroup } from '@heroui/react'
import { motion } from 'framer-motion'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { PatternFormat } from 'react-number-format'

const banks = [
  { name: 'Banco 1', key: 'banco_1' },
  { name: 'Banco 2', key: 'banco_2' },
  { name: 'Banco 3', key: 'banco_3' }
]

const BankDataForm = () => {
  const { control } = useFormContext()

  const accountType = useWatch({ control, name: 'account_type' })

  return (
    <motion.form className='space-y-3'>
      <Controller
        name='bank'
        control={control}
        render={({ field, fieldState }) => (
          <Autocomplete
            label='Selecciona un banco'
            size='sm'
            variant='bordered'
            classNames={{ base: 'bg-white' }}
            selectedKey={String(field.value) || ''}
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message as string}
            onSelectionChange={(sel) => {
              console.log(sel)
              field.onChange(sel)
            }}
          >
            {banks.map((bank) => (
              <AutocompleteItem key={bank.key}>{bank.name}</AutocompleteItem>
            ))}
          </Autocomplete>
        )}
      />

      <Controller
        name='account_type'
        control={control}
        render={({ field }) => (
          <RadioGroup orientation='horizontal' size='sm' {...field}>
            <Radio value='clabe'>CLABE</Radio>
            <Radio value='cuenta'>Cuenta</Radio>
            <Radio value='tarjeta'>Tarjeta</Radio>
          </RadioGroup>
        )}
      />

      <Controller
        name='account'
        control={control}
        render={({ field, fieldState }) => (
          <PatternFormat
            customInput={Input}
            label={accountType === 'clabe' ? 'Cuenta CLABE' : accountType === 'cuenta' ? 'Número de cuenta' : 'Número de tarjeta'}
            format={accountType === 'clabe' ? '### ### ########### #' : accountType === 'cuenta' ? '############' : '#### #### #### ####'}
            type='text'
            classNames={{ inputWrapper: 'bg-white' }}
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
            maxLength={50}
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message as string}
            {...field}
            classNames={{ inputWrapper: 'bg-white' }}
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
            maxLength={13}
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message as string}
            classNames={{ inputWrapper: 'bg-white' }}
            {...field}
          />
        )}
      />
    </motion.form>
  )
}

export default BankDataForm
