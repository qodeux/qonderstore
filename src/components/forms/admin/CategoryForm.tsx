import { Input, Select, SelectItem } from '@heroui/react'
import { Controller, useFormContext } from 'react-hook-form'
import { useSelector } from 'react-redux'
import type { RootState } from '../../../store/store'

const colorsOptions = [
  { label: 'Rojo', key: 'red' },
  { label: 'Azul', key: 'blue' },
  { label: 'Verde', key: 'green' },
  { label: 'Amarillo', key: 'yellow' },
  { label: 'Negro', key: 'black' }
]

const CategoryForm = () => {
  const categories = useSelector((state: RootState) => state.categories.categories) ?? []

  const {
    control,
    formState: { errors }
  } = useFormContext()

  return (
    <form className='space-y-2'>
      <Controller
        name='name'
        control={control}
        render={({ field }) => (
          <Input label='Nombre' type='text' size='sm' isInvalid={!!errors.name} errorMessage={errors.name?.message as string} {...field} />
        )}
      />

      <Controller
        name='slug_id'
        control={control}
        render={({ field }) => (
          <Input
            label='Clave'
            type='text'
            size='sm'
            maxLength={5}
            isInvalid={!!errors.slug_id}
            errorMessage={errors.slug_id?.message as string}
            {...field}
            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
          />
        )}
      />

      <Controller
        name='parent'
        control={control}
        render={({ field }) => (
          <Select
            label='Categoría principal'
            size='sm'
            selectedKeys={field.value ? [String(field.value)] : []}
            onSelectionChange={(keys) => {
              const rawValue = Array.from(keys)[0]
              const parsedValue = rawValue ? Number(rawValue) : undefined
              field.onChange(parsedValue)
            }}
            isInvalid={!!errors.parent}
            errorMessage={errors.parent?.message as string}
            disallowEmptySelection
          >
            {categories
              .filter((cat) => cat.parent === null)
              .map((category) => (
                <SelectItem key={category.id}>{category.name}</SelectItem>
              ))}
          </Select>
        )}
      />
      <Controller
        name='color'
        control={control}
        render={({ field }) => (
          <Select
            label='Color'
            size='sm'
            selectedKeys={field.value ? [String(field.value)] : []}
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0]
              field.onChange(value)
            }}
            isInvalid={!!errors.category}
            errorMessage={errors.category?.message as string}
            disallowEmptySelection
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

export default CategoryForm
