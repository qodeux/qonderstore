import { Checkbox, Input, Select, SelectItem, Switch, Textarea } from '@heroui/react'
import { Star } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { categories } from '../../../types/products'

type Props = {
  selectedTypeUnit: string
  onchangeTypeUnit: (value: string) => void
}

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
}

const ProductDataForm = ({ selectedTypeUnit, onchangeTypeUnit }: Props) => {
  const {
    register,
    control,
    setValue,
    getValues,
    formState: { errors }
  } = useFormContext()

  const name = useWatch({ control, name: 'name' })
  const userTouchedSlug = useRef(false)

  useEffect(() => {
    const current = getValues('slug')
    if (!userTouchedSlug.current || !current) {
      setValue('slug', slugify(name || ''), { shouldValidate: true, shouldDirty: true })
    }
  }, [name, setValue, getValues])

  return (
    <section className='flex flex-row gap-4'>
      <div className='w-1/3'>
        Imagenes
        <br />
        {selectedTypeUnit}
        <div className='flex flex-col gap-4'>
          <Switch defaultSelected size='sm' {...register('is_active')}>
            Activo
          </Switch>
          <Checkbox icon={<Star fill='#000' />} size='lg' color='warning' {...register('featured')}>
            Destacado
          </Checkbox>
        </div>
      </div>
      <div className='w-2/3'>
        <form className='space-y-2' name='product-data-form'>
          <Input
            label='Nombre'
            type='text'
            size='sm'
            isInvalid={!!errors.name}
            errorMessage={errors.name?.message as string}
            {...register('name')}
          />
          <Input
            label='Slug'
            type='text'
            size='sm'
            isInvalid={!!errors.slug}
            errorMessage={errors.slug?.message as string}
            {...register('slug', {
              onChange: () => {
                userTouchedSlug.current = true
              }
            })}
          />
          <Input
            label='SKU'
            type='text'
            size='sm'
            isInvalid={!!errors.sku}
            errorMessage={errors.sku?.message as string}
            {...register('sku')}
          />

          <Controller
            name='category'
            control={control}
            render={({ field }) => (
              <Select
                label='Categoria'
                size='sm'
                selectedKeys={field.value ? [String(field.value)] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0]
                  field.onChange(Number(value))
                }}
                isInvalid={!!errors.category}
                errorMessage={errors.category?.message as string}
                disallowEmptySelection
              >
                {categories.map((cat) => (
                  <SelectItem key={cat.id}>{cat.name}</SelectItem>
                ))}
              </Select>
            )}
          />

          <Controller
            name='type_unit'
            control={control}
            render={({ field }) => (
              <Select
                label='Tipo de venta'
                size='sm'
                selectedKeys={field.value ? [field.value] : selectedTypeUnit ? [selectedTypeUnit] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string
                  field.onChange(value)
                  onchangeTypeUnit(value)
                }}
                selectionMode='single'
                isInvalid={!!errors.type_unit}
                errorMessage={errors.type_unit?.message as string}
              >
                <SelectItem key='unit'>Unidad</SelectItem>
                <SelectItem key='bulk'>Granel</SelectItem>
              </Select>
            )}
          />

          <Input label='Marca' type='text' size='sm' className={selectedTypeUnit === 'unit' ? '' : 'hidden'} {...register('brand')} />
          <Textarea
            label='Descripcion'
            size='sm'
            isInvalid={!!errors.description}
            errorMessage={errors.description?.message as string}
            {...register('description')}
          />

          <Input
            label='Etiquetas'
            type='text'
            size='sm'
            {...register('tags')}
            isInvalid={!!errors.tags}
            errorMessage={errors.tags?.message as string}
          />
        </form>
      </div>
    </section>
  )
}

export default ProductDataForm
