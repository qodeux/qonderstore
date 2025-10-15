import { Autocomplete, AutocompleteItem, Input, Radio, RadioGroup } from '@heroui/react'
import { motion } from 'framer-motion'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { PatternFormat } from 'react-number-format'
import { useSelector } from 'react-redux'
import { useCatalog } from '../../../../hooks/useCatalog'
import type { RootState } from '../../../../store/store'

const BankDataForm = () => {
  const { control } = useFormContext()

  useCatalog('banks')

  const banksOptions = useSelector((state: RootState) => state.catalogs.banks)

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
              field.onChange(sel)
            }}
          >
            {banksOptions.map((bank) => (
              <AutocompleteItem key={bank.id}>{bank.short_name}</AutocompleteItem>
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
            <Radio value='account'>Cuenta</Radio>
            <Radio value='card'>Tarjeta</Radio>
          </RadioGroup>
        )}
      />

      <Controller
        name='account'
        control={control}
        render={({ field, fieldState }) => (
          <PatternFormat
            customInput={Input}
            label={accountType === 'clabe' ? 'Cuenta CLABE' : accountType === 'account' ? 'Número de cuenta' : 'Número de tarjeta'}
            format={accountType === 'clabe' ? '### ### ########### #' : accountType === 'account' ? '############' : '#### #### #### ####'}
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
            value={field.value?.toUpperCase() || ''}
            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
          />
        )}
      />
    </motion.form>
  )
}

export default BankDataForm
