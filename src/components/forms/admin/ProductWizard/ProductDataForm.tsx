import '@/components/common/react-tags/style.css'
import { Autocomplete, AutocompleteItem, Button, Checkbox, Input, Select, SelectItem, Switch, Textarea } from '@heroui/react'
import { IterationCw, Star } from 'lucide-react'
import { customAlphabet } from 'nanoid'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { PatternFormat } from 'react-number-format'
import { useDispatch, useSelector } from 'react-redux'
import { setSaleType } from '../../../../store/slices/productsSlice'
import type { RootState } from '../../../../store/store'

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
}

const ProductDataForm = () => {
  const dispatch = useDispatch()
  const categories = useSelector((state: RootState) => state.categories.categories)
  const productBrands = useSelector((state: RootState) => state.products.brands)

  const {
    register,
    control,
    setValue,
    trigger,
    formState: { errors }
  } = useFormContext()

  const userTouchedSlug = useRef(false)

  const makeId = customAlphabet('0123456789', 6)
  const genRef = useRef(makeId)
  const skuDigitsRef = useRef<string>('')

  // watches
  const categoryWatch = useWatch({ control, name: 'category' })
  const saleTypeWatch = useWatch({ control, name: 'sale_type' })
  const formHasChildren = useWatch({ control, name: 'hasChildren' }) // del form

  //const brandWatch = useWatch({ control, name: 'brand' })

  // derive prefix
  const categoryPrefix = useMemo(() => {
    if (!categoryWatch) return ''
    const category = categories.find((cat) => cat.id === categoryWatch)
    return category?.slug_id ? `${category.slug_id}` : ''
  }, [categoryWatch, categories])

  // registrar campos condicionales para que RHF muestre errores aunque no se monten
  useEffect(() => {
    register('subcategory')
    register('hasChildren')
  }, [register])

  // cuando cambie category => calcular si tiene hijos y guardarlo en el form; si no tiene, limpiar subcategory
  useEffect(() => {
    if (categoryWatch == null) return
    const nextHasChildren = categories.some((cat) => cat.parent === categoryWatch)
    setValue('hasChildren', nextHasChildren, { shouldDirty: true, shouldValidate: true })
    if (!nextHasChildren) {
      setValue('subcategory', undefined, { shouldDirty: true, shouldValidate: true })
    }
    void trigger('subcategory') // muestra/actualiza el error de inmediato si aplica
  }, [categoryWatch, categories, setValue, trigger])

  const regenerateSku = useCallback(() => {
    const next = genRef.current()
    skuDigitsRef.current = next
    setValue('sku', next, { shouldDirty: true, shouldValidate: true })
  }, [setValue])

  useEffect(() => {
    dispatch(setSaleType(saleTypeWatch))
  }, [saleTypeWatch, dispatch])

  return (
    <form name='product-data-form'>
      {/* asegurar registro siempre */}
      <input type='hidden' {...register('subcategory')} />
      <input type='hidden' {...register('hasChildren')} />

      <section className='space-y-2'>
        <div className=' flex justify-between items-center'>
          <Controller
            name='is_active'
            control={control}
            render={({ field }) => (
              <Switch size='sm' {...field} isSelected={field.value}>
                {field.value ? 'Activo' : 'Inactivo'}
              </Switch>
            )}
          />
          <Controller
            name='featured'
            control={control}
            render={({ field }) => (
              <Checkbox
                icon={<Star fill='#000' />}
                size='lg'
                color='warning'
                {...field}
                classNames={{ label: 'justify-start text-base text-sm' }}
                isSelected={field.value}
              >
                {field.value ? 'Destacado' : 'Destacar'}
              </Checkbox>
            )}
          />
        </div>

        <Controller
          name='name'
          control={control}
          render={({ field }) => (
            <Input
              label='Nombre'
              type='text'
              size='sm'
              variant='bordered'
              value={field.value ?? ''}
              onValueChange={(v) => {
                field.onChange(v)
                if (!userTouchedSlug.current) {
                  setValue('slug', slugify(v), { shouldValidate: true, shouldDirty: true })
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
              variant='bordered'
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
              variant='bordered'
              selectedKeys={field.value ? [String(field.value)] : []}
              onSelectionChange={(keys) => {
                const raw = Array.from(keys)[0]
                const nextCategory = Number(raw)
                field.onChange(nextCategory)

                // sincroniza hasChildren y limpia subcategory si no aplica
                const nextHasChildren = categories.some((cat) => cat.parent === nextCategory)
                setValue('hasChildren', nextHasChildren, { shouldDirty: true, shouldValidate: true })
                if (!nextHasChildren) {
                  setValue('subcategory', undefined, { shouldDirty: true, shouldValidate: true })
                }
                void trigger('subcategory')
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

        {formHasChildren && (
          <Controller
            name='subcategory'
            control={control}
            render={({ field, fieldState }) => (
              <Select
                label='Subcategoria'
                size='sm'
                variant='bordered'
                selectedKeys={field.value ? [String(field.value)] : []}
                onSelectionChange={(keys) => {
                  const raw = Array.from(keys)[0]
                  const next = Number(raw)
                  field.onChange(next)
                }}
                isInvalid={!!fieldState.error}
                errorMessage={fieldState.error?.message as string}
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

        <div className='flex gap-2'>
          <Controller
            name='sale_type'
            control={control}
            render={({ field }) => (
              <Select
                label='Tipo de venta'
                size='sm'
                variant='bordered'
                selectedKeys={field.value ? [String(field.value)] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0]
                  field.onChange(value) // 'unit' | 'bulk'
                }}
                selectionMode='single'
                isInvalid={!!errors.sale_type}
                errorMessage={errors.sale_type?.message as string}
                disallowEmptySelection
              >
                <SelectItem key='unit'>Unidad</SelectItem>
                <SelectItem key='bulk'>Granel</SelectItem>
              </Select>
            )}
          />
          <Controller
            name='sku'
            control={control}
            render={({ field }) => (
              <PatternFormat
                format={`${categoryWatch ? `${categoryPrefix}-######` : '######'}`}
                customInput={Input}
                label='SKU'
                size='sm'
                variant='bordered'
                value={field.value ?? ''}
                onValueChange={(v) => field.onChange(v.value)}
                isInvalid={!!errors.sku}
                endContent={
                  <Button
                    isIconOnly
                    className='absolute right-0 top-0 m-2'
                    size='sm'
                    variant='ghost'
                    color='primary'
                    onPress={regenerateSku}
                  >
                    <IterationCw size={18} />
                  </Button>
                }
              />
            )}
          />
        </div>

        {saleTypeWatch === 'unit' && (
          <Controller
            name='brand'
            control={control}
            render={({ field }) => (
              <Autocomplete
                label='Selecciona una marca'
                size='sm'
                variant='bordered'
                selectedKey={String(field.value) || ''}
                onSelectionChange={(sel) => {
                  console.log(sel)
                  field.onChange(sel)
                }}
              >
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
          variant='bordered'
          isInvalid={!!errors.description}
          errorMessage={errors.description?.message as string}
          {...register('description')}
        />
      </section>
    </form>
  )
}

export default ProductDataForm
