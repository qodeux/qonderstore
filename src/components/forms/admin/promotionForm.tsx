import { Autocomplete, AutocompleteItem, DatePicker, Input, Radio, RadioGroup, Select, SelectItem, Switch } from '@heroui/react'
import { useState } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { NumericFormat } from 'react-number-format'
import { useSelector } from 'react-redux'
import type { RootState } from '../../../store/store'
import { week_days } from '../../../types/dates'
import { discount_types, isDiscountType, promo_frequencies, promo_mode, promo_types, type DiscountType } from '../../../types/promos'

const PromotionForm = () => {
  const {
    register,
    control,
    formState: { errors },
    setValue
  } = useFormContext()

  const [discountType, setDiscountType] = useState<DiscountType | undefined>(undefined)

  const [isLimited, setIsLimited] = useState(false)

  const [isConditioned, setIsConditioned] = useState(false)

  const categories = useSelector((state: RootState) => state.categories.categories)

  const products = useSelector((state: RootState) => state.products.items)

  const promoType = useWatch({
    control,
    name: 'promo_type'
  })

  const frecuency = useWatch({
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

  const subcategories = categories.filter((cat) => cat.parent === selectedCategory)

  return (
    <form className='space-y-2'>
      <Controller
        name='promo_type'
        control={control}
        render={({ field }) => (
          <Select
            label='Tipo de promoción'
            size='sm'
            selectedKeys={field.value ? [String(field.value)] : []}
            onSelectionChange={(keys) => {
              const rawValue = Array.from(keys)[0]
              field.onChange(rawValue)
            }}
            isInvalid={!!errors.promo_type}
            errorMessage={errors.promo_type?.message as string}
            disallowEmptySelection
          >
            {promo_types.map((type) => (
              <SelectItem key={type.key}>{type.name}</SelectItem>
            ))}
          </Select>
        )}
      />
      {promoType === 'category' && (
        <>
          <Controller
            name='category'
            control={control}
            render={({ field }) => (
              <Select
                label='Categoría'
                size='sm'
                selectedKeys={field.value != null ? new Set([String(field.value)]) : new Set()}
                onSelectionChange={(keys) => {
                  const k = Array.from(keys).at(0)
                  const n = k != null ? Number(k) : null
                  field.onChange(Number.isNaN(n as number) ? null : n)
                }}
                isInvalid={!!errors.category}
                errorMessage={errors.category?.message as string}
                disallowEmptySelection
              >
                {categories
                  .filter((cat) => cat.parent === null)
                  .map((type) => (
                    <SelectItem key={type.id}>{type.name}</SelectItem>
                  ))}
              </Select>
            )}
          />
          {subcategories.length > 0 && (
            <Controller
              name='subcategory'
              control={control}
              render={({ field }) => (
                <Select
                  label='Subcategoría'
                  size='sm'
                  selectedKeys={field.value ? [String(field.value)] : []}
                  onSelectionChange={(keys) => {
                    const rawValue = Array.from(keys)[0]
                    field.onChange(rawValue)
                  }}
                  isInvalid={!!errors.subcategory}
                  errorMessage={errors.subcategory?.message as string}
                  disallowEmptySelection
                >
                  {subcategories.map((type) => (
                    <SelectItem key={type.id}>{type.name}</SelectItem>
                  ))}
                </Select>
              )}
            />
          )}
        </>
      )}
      {promoType === 'product' && (
        <Controller
          name='product'
          control={control}
          render={({ field }) => (
            <Autocomplete
              size='sm'
              label='Selecciona un producto'
              selectedKey={String(field.value) || ''}
              onSelectionChange={(sel) => {
                console.log(sel)
                field.onChange(Number(sel))
              }}
            >
              {products.map((product) => (
                <AutocompleteItem key={product.id}>{product.name}</AutocompleteItem>
              ))}
            </Autocomplete>
          )}
        />
      )}
      <Controller
        name='discount_type'
        control={control}
        render={({ field }) => (
          <Select
            label='Tipo de descuento'
            size='sm'
            selectedKeys={field.value ? [String(field.value)] : []}
            onSelectionChange={(keys) => {
              if (keys instanceof Set) {
                const first = keys.values().next().value as string | number | undefined
                const val = typeof first === 'number' ? String(first) : first
                if (val && isDiscountType(val)) {
                  setDiscountType(val) // <- aquí actualizas usando el key
                  field.onChange(val)
                }
              }
            }}
            value={discountType}
            isInvalid={!!errors.discount_type}
            errorMessage={errors.discount_type?.message as string}
            disallowEmptySelection
          >
            {discount_types.map((type) => (
              <SelectItem key={type.key}>{type.name}</SelectItem>
            ))}
          </Select>
        )}
      />
      {discountType === 'season' && (
        <>
          <Controller
            name='frequency'
            control={control}
            render={({ field }) => (
              <Select
                label='Frecuencia'
                size='sm'
                selectedKeys={field.value ? [String(field.value)] : []}
                onSelectionChange={(keys) => {
                  const rawValue = Array.from(keys)[0]
                  field.onChange(rawValue)
                }}
                isInvalid={!!errors.frequency}
                errorMessage={errors.frequency?.message as string}
                disallowEmptySelection
              >
                {promo_frequencies.map((type) => (
                  <SelectItem key={type.key}>{type.name}</SelectItem>
                ))}
              </Select>
            )}
          />
          {frecuency === 'once' && (
            <Controller
              name='date'
              control={control}
              rules={{ required: 'La fecha es obligatoria' }}
              render={({ field }) => (
                <div className='flex flex-col items-start'>
                  <DatePicker
                    {...field}
                    label='Fecha'
                    size='sm'
                    onChange={(date) => field.onChange(date)} // muy importante
                    value={field.value}
                  />
                </div>
              )}
            />
          )}
          {frecuency === 'weekly' && (
            <Controller
              name='week_days'
              control={control}
              render={({ field }) => (
                <Select
                  label='Selecciona los días'
                  size='sm'
                  selectionMode='multiple'
                  selectedKeys={new Set((field.value ?? []) as (string | number)[])}
                  onSelectionChange={(keys) => {
                    const arr = Array.from(keys as Set<React.Key>).map((k) => String(k))
                    field.onChange(arr)
                  }}
                  isInvalid={!!errors.week_days}
                  errorMessage={errors.week_days?.message as string}
                  disallowEmptySelection
                >
                  {week_days.map((type) => (
                    <SelectItem key={type.key}>{type.name}</SelectItem>
                  ))}
                </Select>
              )}
            />
          )}
          {frecuency === 'monthly' && (
            <Controller
              name='day_month'
              control={control}
              rules={{ required: 'La fecha es obligatoria' }}
              render={({ field }) => (
                <div className='flex flex-col items-start'>
                  <DatePicker
                    {...field}
                    label='Día del mes'
                    size='sm'
                    onChange={(date) => field.onChange(date)} // muy importante
                    value={field.value}
                  />
                </div>
              )}
            />
          )}
        </>
      )}
      {discountType === 'code' && (
        <Input
          label='Código'
          type='text'
          size='sm'
          isInvalid={!!errors.code}
          errorMessage={errors.code?.message as string}
          {...register('code')}
        />
      )}
      <Controller
        name='mode'
        control={control}
        render={({ field }) => (
          <Select
            label='Modalidad'
            size='sm'
            selectedKeys={field.value ? [String(field.value)] : []}
            onSelectionChange={(keys) => {
              const rawValue = Array.from(keys)[0]
              field.onChange(rawValue)
            }}
            isInvalid={!!errors.mode}
            errorMessage={errors.mode?.message as string}
            disallowEmptySelection
          >
            {promo_mode.map((type) => (
              <SelectItem key={type.key}>{type.name}</SelectItem>
            ))}
          </Select>
        )}
      />
      {promoMode === 'fixed' && (
        <Controller
          name='mode_value'
          control={control}
          render={({ field, fieldState }) => (
            <NumericFormat
              // 1) Controlado por RHF: si no hay valor, muestra vacío
              value={field.value ?? ''}
              // 2) Siempre manda undefined cuando está vacío
              onValueChange={(v) => {
                const num = v.floatValue === undefined ? undefined : v.floatValue
                setValue('mode_value', num, {
                  shouldValidate: true
                })
              }}
              thousandSeparator
              decimalScale={2}
              fixedDecimalScale
              allowNegative={false}
              prefix='$ '
              inputMode='decimal'
              customInput={Input}
              label='Valor'
              size='sm'
              isInvalid={!!fieldState.error}
              errorMessage={fieldState.error?.message}
              isClearable
              onClear={() => {
                setValue('mode_value', undefined, {
                  shouldValidate: true
                })
                // opcional: clearErrors('public_price')
              }}
            />
          )}
        />
      )}
      {promoMode === 'percentage' && (
        <Controller
          name='mode_value'
          control={control}
          render={({ field, fieldState }) => (
            <NumericFormat
              value={field.value ?? ''}
              onValueChange={(v) => {
                const num = v.floatValue === undefined ? undefined : v.floatValue
                setValue('mode_value', num, {
                  shouldValidate: true
                })
              }}
              decimalScale={0}
              maxLength={4}
              customInput={Input}
              label='Valor'
              size='sm'
              suffix=' %'
              isInvalid={!!fieldState.error}
              errorMessage={fieldState.error?.message}
              isClearable
              onClear={() => {
                setValue('mode_value', undefined, {
                  shouldValidate: true
                })
                // opcional: clearErrors('public_price')
              }}
            />
          )}
        />
      )}
      <Controller
        name='valid_until'
        control={control}
        rules={{ required: 'La fecha es obligatoria' }}
        render={({ field, fieldState }) => (
          <div className='flex flex-col items-start'>
            <DatePicker
              {...field}
              label='Vigencia'
              size='sm'
              isInvalid={!!fieldState.error}
              errorMessage={fieldState.error?.message}
              onChange={(date) => field.onChange(date)} // muy importante
              value={field.value}
            />
          </div>
        )}
      />
      <Switch size='sm' {...register('is_active')}>
        Activo
      </Switch>
      <div className='flex items-center justify-between'>
        <label>Limites</label>
        <Switch size='sm' {...register('is_limited')} onChange={() => setIsLimited(!isLimited)} defaultSelected={isLimited}>
          Activo
        </Switch>
      </div>
      {isLimited && (
        <>
          <RadioGroup orientation='horizontal' size='sm' {...register('limit_type')}>
            <Radio value='user'>Por usuario</Radio>
            <Radio value='global'>Global</Radio>
          </RadioGroup>
          <Input
            label='Total'
            type='text'
            size='sm'
            isInvalid={!!errors.limit}
            errorMessage={errors.limit?.message as string}
            {...register('limit')}
          />
        </>
      )}
      <div className='flex items-center justify-between'>
        <label>Condiciones</label>
        <Switch size='sm' {...register('is_conditioned')} onChange={() => setIsConditioned(!isConditioned)} defaultSelected={isConditioned}>
          Activo
        </Switch>
      </div>
      {isConditioned && (
        <>
          <RadioGroup orientation='horizontal' size='sm' {...register('condition_type')}>
            <Radio value='min_sale'>Compra mínima</Radio>
            <Radio value='quantity'>Cantidad</Radio>
          </RadioGroup>
          <Input
            label='Cantidad'
            type='text'
            size='sm'
            isInvalid={!!errors.condition}
            errorMessage={errors.condition?.message as string}
            {...register('condition')}
          />
        </>
      )}
    </form>
  )
}

export default PromotionForm
