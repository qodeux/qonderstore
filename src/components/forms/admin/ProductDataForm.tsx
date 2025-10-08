import { Autocomplete, AutocompleteItem, Button, Checkbox, Input, Select, SelectItem, Switch, Textarea } from '@heroui/react'
import { IterationCw, Star } from 'lucide-react'
import { customAlphabet } from 'nanoid'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { PatternFormat } from 'react-number-format'
import { useSelector } from 'react-redux'
import '../../../components/common/react-tags/style.css'
import type { RootState } from '../../../store/store'

// const suggestions = [
//   { id: 1, name: 'United States', label: 'United States', value: 'United States' },
//   { id: 2, name: 'United Kingdom', label: 'United Kingdom', value: 'United Kingdom' },
//   { id: 3, name: 'Afghanistan', label: 'Afghanistan', value: 'Afghanistan' },
//   { id: 4, name: 'Aland Islands', label: 'Aland Islands', value: 'Aland Islands' },
//   { id: 5, name: 'Albania', label: 'Albania', value: 'Albania' },
//   { id: 6, name: 'Algeria', label: 'Algeria', value: 'Algeria' },
//   { id: 7, name: 'American Samoa', label: 'American Samoa', value: 'American Samoa' },
//   { id: 8, name: 'Andorra', label: 'Andorra', value: 'Andorra' },
//   { id: 9, name: 'Angola', label: 'Angola', value: 'Angola' },
//   { id: 10, name: 'Anguilla', label: 'Anguilla', value: 'Anguilla' }
// ]

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
}

const ProductDataForm = () => {
  const categories = useSelector((state: RootState) => state.categories.categories)
  const productBrands = useSelector((state: RootState) => state.products.brands)

  const {
    register,
    control,
    setValue,
    getValues,
    formState: { errors }
  } = useFormContext()

  const userTouchedSlug = useRef(false)

  const makeId = customAlphabet('0123456789', 6)
  // generador estable (función que cuando la llamas te da 6 dígitos)
  const genRef = useRef(makeId)
  const skuDigitsRef = useRef<string>('')

  const categoryWatch = useWatch({
    control,
    name: 'category'
  })

  const categoryPrefix = useMemo(() => {
    if (!categoryWatch) return ''
    const category = categories.find((cat) => cat.id === categoryWatch)
    return category?.slug_id ? `${category.slug_id}` : ''
  }, [categoryWatch, categories])

  const hasChildren = categories.some((cat) => cat.parent === categoryWatch)

  const selectedTypeUnit = useWatch({
    control,
    name: 'type_unit'
  })

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
    if (!skuDigitsRef.current) {
      const existing = getValues('sku')?.match(/\d{6}$/)?.[0]
      skuDigitsRef.current = existing ?? makeId()
      setValue('sku', skuDigitsRef.current, { shouldDirty: false })
    }
  }, [makeId, setValue, getValues])

  const regenerateSku = useCallback(() => {
    const next = genRef.current() // ✅ función estable por instancia
    skuDigitsRef.current = next
    setValue('sku', next, { shouldDirty: true, shouldValidate: true })
  }, [setValue])

  return (
    <form className='flex flex-row gap-4' name='product-data-form'>
      <section className='w-1/3 space-y-2'>
        <figure className='w-full aspect-square border border-dashed border-gray-400 bg-gray-50 flex items-center justify-center'>
          <span className='text-sm text-gray-400 text-center'>
            Click para agregar imagen
            <br />
            (Próximamente)
          </span>
        </figure>

        <Controller
          name='sku'
          control={control}
          render={({ field }) => (
            <PatternFormat
              format={`${categoryWatch ? `${categoryPrefix}-######` : '######'}`}
              allowEmptyFormatting
              customInput={Input}
              label='SKU'
              size='sm'
              value={field.value ?? ''}
              onValueChange={(v) => field.onChange(v.value)}
              isInvalid={!!errors.sku}
              endContent={
                <Button isIconOnly className='absolute right-0 top-0 m-2' size='sm' variant='ghost' color='primary' onPress={regenerateSku}>
                  <IterationCw size={18} />
                </Button>
              }
            />
          )}

          // solo limpia SKU
        />
        <div className='flex flex-col gap-4'>
          <Switch defaultSelected size='sm' {...register('is_active')}>
            Activo
          </Switch>
          <Checkbox icon={<Star fill='#000' />} size='lg' color='warning' {...register('featured')}>
            Destacado
          </Checkbox>
        </div>
      </section>
      <section className='w-2/3 space-y-2'>
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
                    shouldValidate: true,
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
              selectedKeys={field.value ? [String(field.value)] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0]
                field.onChange(value)
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
      </section>
    </form>
  )
}

export default ProductDataForm
