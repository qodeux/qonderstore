import { Autocomplete, AutocompleteItem, Checkbox, Input, Select, SelectItem, Switch, Textarea } from '@heroui/react'
import { Star } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { useSelector } from 'react-redux'
import '../../../components/common/react-tags/style.css'
import type { RootState } from '../../../store/store'

const suggestions = [
  { id: 1, name: 'United States', label: 'United States', value: 'United States' },
  { id: 2, name: 'United Kingdom', label: 'United Kingdom', value: 'United Kingdom' },
  { id: 3, name: 'Afghanistan', label: 'Afghanistan', value: 'Afghanistan' },
  { id: 4, name: 'Aland Islands', label: 'Aland Islands', value: 'Aland Islands' },
  { id: 5, name: 'Albania', label: 'Albania', value: 'Albania' },
  { id: 6, name: 'Algeria', label: 'Algeria', value: 'Algeria' },
  { id: 7, name: 'American Samoa', label: 'American Samoa', value: 'American Samoa' },
  { id: 8, name: 'Andorra', label: 'Andorra', value: 'Andorra' },
  { id: 9, name: 'Angola', label: 'Angola', value: 'Angola' },
  { id: 10, name: 'Anguilla', label: 'Anguilla', value: 'Anguilla' }
]

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
  const categories = useSelector((state: RootState) => state.categories.categories)
  const productBrands = useSelector((state: RootState) => state.products.brands)

  const {
    register,
    control,
    setValue,
    getValues,
    formState: { errors, isSubmitted, touchedFields }
  } = useFormContext()

  const userTouchedSlug = useRef(false)
  const didInitSlug = useRef(false)

  // const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

  const categoryWatch = useWatch({
    control,
    name: 'category'
  })

  const hasChildren = categories.some((cat) => cat.parent === categoryWatch)

  // const [selected, setSelected] = useState([])

  // const onAdd = useCallback(
  //   (newTag) => {
  //     setSelected([...selected, newTag])
  //   },
  //   [selected]
  // )

  // const onDelete = useCallback(
  //   (tagIndex) => {
  //     setSelected(selected.filter((_, i) => i !== tagIndex))
  //   },
  //   [selected]
  // )

  useEffect(() => {
    if (didInitSlug.current) return
    didInitSlug.current = true

    const currentName = getValues('name') || ''
    const currentSlug = getValues('slug') || ''
    if (!currentSlug) {
      // No valides en el primer fill para evitar error visual inicial
      setValue('slug', slugify(currentName), { shouldValidate: false, shouldDirty: false })
    }
  }, [getValues, setValue])

  return (
    <section className='flex flex-row gap-4'>
      <div className='w-1/3'>
        <figure className='w-full aspect-square border border-dashed border-gray-400 bg-gray-50 flex items-center justify-center'>
          <span className='text-sm text-gray-400'>Click para agregar imagen</span>
        </figure>
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
          <Controller
            name='name'
            control={control}
            render={({ field }) => (
              <Input
                label='Nombre'
                type='text'
                size='sm'
                value={field.value ?? ''}
                onValueChange={(v) => {
                  field.onChange(v)
                  if (!userTouchedSlug.current) {
                    setValue('slug', slugify(v), {
                      shouldValidate: true || !!touchedFields.slug, // valida solo si ya interactuaron
                      shouldDirty: true
                    })
                  }
                }}
                isInvalid={!!errors.name}
                errorMessage={errors.name?.message as string}
              />
            )}
          />
          <Controller
            name='slug'
            control={control}
            render={({ field }) => (
              <Input
                label='Slug'
                type='text'
                size='sm'
                value={field.value ?? ''}
                onValueChange={(v) => {
                  userTouchedSlug.current = true
                  field.onChange(v)
                }}
                isInvalid={!!errors.slug}
                errorMessage={errors.slug?.message as string}
              />
            )}
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
                {categories
                  .filter((cat) => cat.parent === null)
                  .map((cat) => (
                    <SelectItem key={cat.id}>{cat.name}</SelectItem>
                  ))}
              </Select>
            )}
          />

          {hasChildren && (
            <Controller
              name='subcategory'
              control={control}
              render={({ field }) => (
                <Select
                  label='Subcategoria'
                  size='sm'
                  selectedKeys={field.value ? [String(field.value)] : []}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0]
                    field.onChange(Number(value))
                  }}
                  isInvalid={!!errors.sub_category}
                  errorMessage={errors.sub_category?.message as string}
                  disallowEmptySelection
                >
                  {categories
                    .filter((cat) => cat.parent === categoryWatch)
                    .map((cat) => (
                      <SelectItem key={cat.id}>{cat.name}</SelectItem>
                    ))}
                </Select>
              )}
            />
          )}

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
                disallowEmptySelection
              >
                <SelectItem key='unit'>Unidad</SelectItem>
                <SelectItem key='bulk'>Granel</SelectItem>
              </Select>
            )}
          />

          {selectedTypeUnit === 'unit' && (
            <Controller
              name='brand'
              control={control}
              render={() => (
                <Autocomplete label='Selecciona una marca' size='sm'>
                  {productBrands.map((brand) => (
                    <AutocompleteItem key={brand.id}>{brand.name}</AutocompleteItem>
                  ))}
                </Autocomplete>
              )}
            />
          )}

          <Textarea
            label='Descripcion'
            size='sm'
            isInvalid={!!errors.description}
            errorMessage={errors.description?.message as string}
            {...register('description')}
          />

          {/* 
          <ReactTags
            selected={selected}
            suggestions={suggestions}
            onAdd={onAdd}
            onDelete={onDelete}
            noOptionsText='No matching countries'
            placeholderText='Agrega una etiqueta'
            collapseOnSelect
            allowNew
            newOptionText='Agregar: %value%'

          /> */}
        </form>
      </div>
    </section>
  )
}

export default ProductDataForm
