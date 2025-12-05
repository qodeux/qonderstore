import { Autocomplete, AutocompleteItem, Input, Select, SelectItem } from '@heroui/react'
import { useRef } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { useSelector } from 'react-redux'
import type { RootState } from '../../../store/store'

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
}

const colorsOptions = [
  { label: 'Rojo', key: 'red' },
  { label: 'Azul', key: 'blue' },
  { label: 'Verde', key: 'green' },
  { label: 'Amarillo', key: 'yellow' },
  { label: 'Negro', key: 'black' }
]

const PaymentMethodsForm = () => {
  const userTouchedSlug = useRef(false)
  const { setValue } = useFormContext()

  const {
    control,
    formState: { errors }
  } = useFormContext()

  const banksOptions = useSelector((state: RootState) => state.catalogs.banks)

  return (
    <form className='space-y-2'>
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
        name='slug'
        control={control}
        render={({ field, fieldState }) => (
          <Input
            label='Slug'
            type='text'
            size='sm'
            variant='bordered'
            value={field.value ?? ''}
            onValueChange={(v) => {
              userTouchedSlug.current = true
              field.onChange(v)
            }}
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message as string}
          />
        )}
      />

      <Controller
        name='color'
        control={control}
        render={({ field }) => (
          <Select
            label='Color'
            size='sm'
            variant='bordered'
            selectedKeys={field.value ? [String(field.value)] : []}
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0] ?? null
              field.onChange(value)
            }}
            isInvalid={!!errors.brand}
            errorMessage={errors.brand?.message as string}
            isClearable
            onClear={() => field.onChange(null)}
          >
            {colorsOptions.map((color) => (
              <SelectItem key={color.key}>{color.label}</SelectItem>
            ))}
          </Select>
        )}
      />
    </form>
  )
}

export default PaymentMethodsForm
