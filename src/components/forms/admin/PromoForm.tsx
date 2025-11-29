import { Autocomplete, AutocompleteItem, DatePicker, Input, Radio, RadioGroup, Select, SelectItem, Switch } from '@heroui/react'
import { getLocalTimeZone, today } from '@internationalized/date'
import { useEffect, useMemo } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { NumericFormat } from 'react-number-format'
import { useSelector } from 'react-redux'
import type { RootState } from '../../../store/store'
import { week_days } from '../../../types/dates'
import { discount_types, isDiscountType, promo_frequencies, promo_mode, promo_types } from '../../../types/promos'
import { all_units } from '../../../types/storeOrders'

const PromotionForm = () => {
  const { control, setValue, getFieldState } = useFormContext()

  const discountType = useWatch({ control, name: 'discount_type' })
  const isLimited = useWatch({ control, name: 'is_limited' })
  const isConditioned = useWatch({ control, name: 'is_conditioned' })

  const categories = useSelector((state: RootState) => state.categories.items)
  const products = useSelector((state: RootState) => state.products.items)

  const promoType = useWatch({
    control,
    name: 'promo_type'
  })

  const selectedFrequency = useWatch({
    control,
    name: 'frequency'
  })

  const promoMode = useWatch({
    control,
    name: 'mode'
  })

  const selectedCategory = useWatch({
    control,
    name: 'category'
  })

  const selectedSubCategory = useWatch({
    control,
    name: 'subcategory'
  })

  const selectedProduct = useWatch({
    control,
    name: 'product'
  })

  const targetError = getFieldState('promo_type_target_id')

  const unit_type = useMemo(() => {
    if (promoType !== 'product') return []
    const saleType = products.find((p) => p.id === selectedProduct)?.sale_type
    return all_units.filter((u) => u.saleType === saleType)
  }, [promoType, products, selectedProduct])

  //const subcategories = useMemo(() => categories.filter((c) => c.parent === (selectedCategory ?? -1)), [categories, selectedCategory])

  const selectedCategoryNum = selectedCategory == null ? null : Number(selectedCategory)

  const subcategories = useMemo(() => {
    if (!categories?.length || selectedCategoryNum == null) return []
    return categories.filter((c) => Number(c.parent) === selectedCategoryNum)
  }, [categories, selectedCategoryNum])

  // Modifica el useEffect existente para manejar mejor el caso inicial
  useEffect(() => {
    if (promoType === 'product') {
      setValue('promo_type_target_id', selectedProduct, { shouldDirty: false, shouldValidate: true })
      return
    }

    if (promoType === 'category') {
      // Espera a que subcategories esté listo antes de decidir
      if (selectedSubCategory != null && subcategories.some((sc) => sc.id === selectedSubCategory)) {
        setValue('promo_type_target_id', selectedSubCategory, { shouldDirty: false, shouldValidate: true })
      } else if (selectedCategoryNum != null) {
        setValue('promo_type_target_id', selectedCategoryNum, { shouldDirty: false, shouldValidate: true })
      }
    }
  }, [promoType, selectedProduct, selectedCategoryNum, selectedSubCategory, subcategories, setValue])

  // useEffect(() => {
  //   console.log('🔍 Debug:', {
  //   selectedCategory: selectedCategoryNum,
  //   selectedSubCategory,
  //   subcategoriesLength: subcategories.length,
  //   subcategoriesIds: subcategories.map((s) => s.id),
  //   defaultValues: control._defaultValues
  //   })
  // }, [selectedCategoryNum, selectedSubCategory, subcategories])

  return (
    <form className='space-y-2'>
      <Controller
        name='name'
        render={({ field, fieldState }) => (
          <Input
            label='Nombre de la promoción'
            type='text'
            size='sm'
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message as string}
            {...field}
            variant='bordered'
            classNames={{ inputWrapper: 'bg-white' }}
          />
        )}
      />
      <Controller
        name='promo_type'
        control={control}
        render={({ field, fieldState }) => (
          <Select
            label='Tipo de promoción'
            size='sm'
            selectedKeys={field.value ? [String(field.value)] : []}
            onSelectionChange={(keys) => {
              const rawValue = Array.from(keys)[0]
              field.onChange(rawValue)
            }}
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message}
            disallowEmptySelection
            variant='bordered'
            classNames={{ trigger: 'bg-white' }}
          >
            {promo_types.map((type) => (
              <SelectItem key={type.key}>{type.label}</SelectItem>
            ))}
          </Select>
        )}
      />
      <div className='grid grid-cols-2 gap-2'>
        {promoType === 'category' && (
          <>
            <Controller
              name='category'
              control={control}
              render={({ field, fieldState }) => (
                <Select
                  label='Categoría'
                  size='sm'
                  selectedKeys={field.value != null ? new Set([String(field.value)]) : new Set()}
                  onSelectionChange={(keys) => {
                    const raw = Array.from(keys as Set<React.Key>)[0]
                    const value = raw != null ? Number(raw) : undefined

                    // actualiza categoría
                    field.onChange(value)

                    // 🔁 limpia subcategoría porque cambió de categoría
                    setValue('subcategory', undefined, { shouldDirty: true })
                  }}
                  disallowEmptySelection
                  isInvalid={!!fieldState.error}
                  errorMessage={fieldState.error?.message}
                  variant='bordered'
                  classNames={{ trigger: 'bg-white' }}
                >
                  {categories
                    .filter((c) => c.parent === null)
                    .map((c) => (
                      <SelectItem key={c.id}>{c.name}</SelectItem>
                    ))}
                </Select>
              )}
            />

            {subcategories.length > 0 && (
              <Controller
                name='subcategory'
                control={control}
                render={({ field, fieldState }) => (
                  <Select
                    key={`subcat-${selectedCategory}-${field.value}`} // Mejor key para forzar re-render
                    label='Subcategoría'
                    size='sm'
                    selectedKeys={field.value != null ? new Set([String(field.value)]) : new Set()}
                    onSelectionChange={(keys) => {
                      const raw = Array.from(keys as Set<React.Key>)[0]
                      field.onChange(raw != null ? Number(raw) : undefined)
                    }}
                    disallowEmptySelection
                    isInvalid={!!fieldState.error}
                    errorMessage={fieldState.error?.message}
                    variant='bordered'
                    classNames={{ trigger: 'bg-white' }}
                  >
                    {subcategories.map((sc) => (
                      <SelectItem key={sc.id}>{sc.name}</SelectItem>
                    ))}
                  </Select>
                )}
              />
            )}
          </>
        )}
        {promoType === 'product' && (
          <>
            <Controller
              name='product'
              control={control}
              render={({ field, fieldState }) => (
                <Autocomplete
                  size='sm'
                  label='Producto'
                  selectedKey={String(field.value) || ''}
                  onSelectionChange={(sel) => {
                    field.onChange(Number(sel))
                  }}
                  isInvalid={!!fieldState.error}
                  variant='bordered'
                  classNames={{ base: 'bg-white' }}
                >
                  {products.map((product) => (
                    <AutocompleteItem key={product.id}>{product.name}</AutocompleteItem>
                  ))}
                </Autocomplete>
              )}
            />

            <Controller
              name='product_unit'
              control={control}
              render={({ field, fieldState }) => (
                <Select
                  label='Tipo de unidad'
                  size='sm'
                  selectedKeys={field.value ? [String(field.value)] : []}
                  onSelectionChange={(keys) => {
                    const rawValue = Array.from(keys)[0]
                    field.onChange(rawValue)
                  }}
                  value={discountType}
                  isInvalid={!!fieldState.error}
                  errorMessage={fieldState.error?.message as string}
                  disallowEmptySelection
                  variant='bordered'
                  classNames={{ trigger: 'bg-white' }}
                >
                  {unit_type.map((type) => (
                    <SelectItem key={type.key}>{type.label}</SelectItem>
                  ))}
                </Select>
              )}
            />
          </>
        )}
      </div>
      {targetError.error && <p className='text-danger text-xs pl-1'>Debes seleccionar un elemento </p>}
      <Controller
        name='promo_type_target_id'
        control={control}
        render={({ field, fieldState }) => (
          <Input
            label='promo type target'
            type='text'
            size='sm'
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message as string}
            {...field}
            className='hidden'
          />
        )}
      />
      <Controller
        name='discount_type'
        control={control}
        render={({ field, fieldState }) => (
          <Select
            label='Tipo de descuento'
            size='sm'
            selectedKeys={field.value ? [String(field.value)] : []}
            onSelectionChange={(keys) => {
              if (keys instanceof Set) {
                const first = keys.values().next().value as string | number | undefined
                const val = typeof first === 'number' ? String(first) : first
                if (val && isDiscountType(val)) {
                  field.onChange(val)
                }
              }
            }}
            value={discountType}
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message as string}
            disallowEmptySelection
            variant='bordered'
            classNames={{ trigger: 'bg-white' }}
          >
            {discount_types.map((type) => (
              <SelectItem key={type.key}>{type.label}</SelectItem>
            ))}
          </Select>
        )}
      />
      {discountType === 'season' && (
        <div className='grid grid-cols-2 gap-2'>
          <Controller
            name='frequency'
            control={control}
            render={({ field, fieldState }) => (
              <Select
                label='Frecuencia'
                size='sm'
                selectedKeys={field.value ? [String(field.value)] : []}
                onSelectionChange={(keys) => {
                  const rawValue = Array.from(keys)[0]
                  field.onChange(rawValue)
                }}
                isInvalid={!!fieldState.error}
                errorMessage={fieldState.error?.message as string}
                disallowEmptySelection
                variant='bordered'
                classNames={{ trigger: 'bg-white' }}
              >
                {promo_frequencies.map((type) => (
                  <SelectItem key={type.key}>{type.label}</SelectItem>
                ))}
              </Select>
            )}
          />
          {selectedFrequency === 'once' && (
            <Controller
              name='date'
              control={control}
              rules={{ required: 'La fecha es obligatoria' }}
              render={({ field, fieldState }) => (
                <div className='flex flex-col items-start'>
                  <DatePicker
                    {...field}
                    label='Fecha'
                    size='sm'
                    onChange={(date) => {
                      field.onChange(date)
                      setValue('frequency_value', { date: date?.toString() })
                    }} // muy importante
                    value={field.value}
                    granularity='day'
                    minValue={today(getLocalTimeZone())}
                    isInvalid={!!fieldState.error}
                    errorMessage={fieldState.error?.message}
                    variant='bordered'
                    classNames={{
                      inputWrapper: 'bg-white'
                    }}
                    calendarProps={{
                      classNames: {
                        title: 'text-xs capitalize-first-letter',
                        pickerItem: 'capitalize'
                      }
                    }}
                  />
                </div>
              )}
            />
          )}
          {selectedFrequency === 'weekly' && (
            <Controller
              name='week_days'
              control={control}
              render={({ field, fieldState }) => (
                <Select
                  label='Selecciona los días'
                  size='sm'
                  selectionMode='multiple'
                  selectedKeys={new Set((field.value ?? []) as (string | number)[])}
                  onSelectionChange={(keys) => {
                    const arr = Array.from(keys as Set<React.Key>).map((k) => String(k))
                    field.onChange(arr)
                    setValue('frequency_value', arr)
                  }}
                  isInvalid={!!fieldState.error}
                  errorMessage={fieldState.error?.message as string}
                  disallowEmptySelection
                  variant='bordered'
                  classNames={{ trigger: 'bg-white' }}
                >
                  {week_days.map((type) => (
                    <SelectItem key={type.key}>{type.label}</SelectItem>
                  ))}
                </Select>
              )}
            />
          )}
          {selectedFrequency === 'monthly' && (
            <Controller
              name='day_month'
              control={control}
              rules={{ required: 'La fecha es obligatoria' }}
              render={({ field, fieldState }) => (
                <NumericFormat
                  value={field.value}
                  onValueChange={(v) => {
                    const num = v.floatValue === undefined ? undefined : v.floatValue
                    field.onChange(num)
                    setValue('frequency_value', { day: num })
                  }}
                  allowNegative={false}
                  inputMode='numeric'
                  customInput={Input}
                  variant='bordered'
                  classNames={{ inputWrapper: 'bg-white' }}
                  min={1}
                  max={31}
                  maxLength={2}
                  label='Día del mes (1-31)'
                  size='sm'
                  isInvalid={!!fieldState.error}
                  errorMessage={fieldState.error?.message}
                />
              )}
            />
          )}
        </div>
      )}
      <Controller
        name='frequency_value'
        control={control}
        render={({ field, fieldState }) => (
          <Input
            label='frequency value'
            type='text'
            size='sm'
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message as string}
            {...field}
            className='hidden'
          />
        )}
      />
      {discountType === 'code' && (
        <Controller
          name='code'
          control={control}
          render={({ field, fieldState }) => (
            <Input
              label='Código'
              type='text'
              size='sm'
              isInvalid={!!fieldState.error}
              errorMessage={fieldState.error?.message as string}
              value={field.value?.toUpperCase()}
              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
              variant='bordered'
              classNames={{ inputWrapper: 'bg-white' }}
            />
          )}
        />
      )}
      <div className='grid grid-cols-2 gap-2  '>
        <Controller
          name='mode'
          control={control}
          render={({ field, fieldState }) => (
            <Select
              label='Modalidad'
              size='sm'
              selectedKeys={field.value ? [String(field.value)] : []}
              onSelectionChange={(keys) => {
                const rawValue = Array.from(keys)[0]
                field.onChange(rawValue)
              }}
              isInvalid={!!fieldState.error}
              errorMessage={fieldState.error?.message as string}
              disallowEmptySelection
              variant='bordered'
              classNames={{ trigger: 'bg-white' }}
            >
              {promo_mode.map((type) => (
                <SelectItem key={type.key}>{type.label}</SelectItem>
              ))}
            </Select>
          )}
        />
        <Controller
          name='mode_value'
          control={control}
          render={({ field, fieldState }) => (
            <NumericFormat
              key={promoMode}
              value={field.value ?? ''}
              onValueChange={(v) => {
                const num = v.floatValue === undefined ? undefined : v.floatValue
                field.onChange(num)
              }}
              thousandSeparator={promoMode === 'fixed'}
              decimalScale={promoMode === 'fixed' ? 2 : 0}
              fixedDecimalScale={promoMode === 'fixed'}
              allowNegative={false}
              prefix={promoMode === 'fixed' ? '$' : undefined}
              suffix={promoMode === 'percentage' ? '%' : undefined}
              inputMode={promoMode === 'fixed' ? 'decimal' : 'numeric'}
              customInput={Input}
              maxLength={promoMode === 'percentage' ? 3 : undefined}
              label='Valor'
              size='sm'
              variant='bordered'
              classNames={{ inputWrapper: 'bg-white' }}
              isInvalid={!!fieldState.error}
              errorMessage={fieldState.error?.message}
              onFocus={(e) => {
                setTimeout(() => e.currentTarget.select(), 0)
              }}
              onPointerDown={(e) => {
                const el = e.currentTarget as HTMLInputElement
                if (document.activeElement !== el) {
                  e.preventDefault()
                  el.focus()
                  el.select()
                }
              }}
            />
          )}
        />
      </div>
      <div className='flex items-center justify-between gap-2'>
        {discountType !== 'fixed' && selectedFrequency !== 'once' && (
          <Controller
            name='valid_until'
            control={control}
            rules={{ required: 'La fecha es obligatoria' }}
            render={({ field, fieldState }) => (
              <div className='w-1/2'>
                <DatePicker
                  {...field}
                  showMonthAndYearPickers
                  label='Vigencia'
                  size='sm'
                  isInvalid={!!fieldState.error}
                  errorMessage={fieldState.error?.message}
                  onChange={(date) => field.onChange(date)} // muy importante
                  value={field.value}
                  granularity='day'
                  minValue={today(getLocalTimeZone()).add({ days: 1 })}
                  variant='bordered'
                  classNames={{
                    inputWrapper: 'bg-white'
                  }}
                  calendarProps={{
                    classNames: {
                      title: 'text-xs capitalize-first-letter',
                      pickerItem: 'capitalize'
                    }
                  }}
                  //defaultValue={now(getLocalTimeZone())}
                />
              </div>
            )}
          />
        )}
      </div>

      <div className='flex items-center justify-between'>
        <label>Limites</label>
        <Controller
          name='is_limited'
          render={({ field }) => (
            <Switch size='sm' isSelected={!!field.value} onValueChange={field.onChange} onBlur={field.onBlur} ref={field.ref}>
              {field.value ? 'Si' : 'No'}
            </Switch>
          )}
        />
      </div>
      {isLimited && (
        <>
          <Controller
            name='limit_type'
            render={({ field }) => (
              <RadioGroup orientation='horizontal' size='sm' onValueChange={field.onChange} value={field.value}>
                <Radio value='user'>Por usuario</Radio>
                <Radio value='global'>Global</Radio>
              </RadioGroup>
            )}
          />

          <Controller
            name='limit'
            render={({ field, fieldState }) => (
              <Input
                {...field}
                label='Total'
                type='text'
                size='sm'
                isInvalid={!!fieldState.error}
                errorMessage={fieldState.error?.message}
                variant='bordered'
                classNames={{ inputWrapper: 'bg-white' }}
              />
            )}
          />
        </>
      )}
      <div className='flex items-center justify-between'>
        <label>Condiciones</label>
        <Controller
          name='is_conditioned'
          render={({ field }) => (
            <Switch size='sm' isSelected={!!field.value} onValueChange={field.onChange} onBlur={field.onBlur} ref={field.ref}>
              {field.value ? 'Si' : 'No'}
            </Switch>
          )}
        />
      </div>
      {isConditioned && (
        <>
          <Controller
            name='condition_type'
            render={({ field }) => (
              <RadioGroup orientation='horizontal' size='sm' onValueChange={field.onChange} value={field.value}>
                <Radio value='min_sale'>Compra mínima</Radio>
                <Radio value='quantity'>Cantidad</Radio>
              </RadioGroup>
            )}
          />

          <Controller
            name='condition'
            render={({ field, fieldState }) => (
              <Input
                {...field}
                label='Cantidad'
                type='text'
                size='sm'
                isInvalid={!!fieldState.error}
                errorMessage={fieldState.error?.message}
                variant='bordered'
                classNames={{ inputWrapper: 'bg-white' }}
              />
            )}
          />
        </>
      )}

      <Controller
        name='is_active'
        render={({ field }) => (
          <Switch
            size='sm'
            isSelected={!!field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            ref={field.ref}
            className='mt-4'
          >
            {field.value ? 'Promoción activada' : 'Promoción desactivada'}
          </Switch>
        )}
      />
    </form>
  )
}

export default PromotionForm
