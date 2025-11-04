import { Button, Input, NumberInput, Select, SelectItem, Switch } from '@heroui/react'
import { PackageMinus, PackagePlus, TriangleAlert, X } from 'lucide-react'
import { nanoid } from 'nanoid'
import { useEffect } from 'react'
import { Controller, useFieldArray, useFormContext } from 'react-hook-form'
import { NumericFormat } from 'react-number-format'

export type WholeSalePrice = {
  min: number | undefined
  price: number | undefined
}

export type WholeSaleRow = { id?: string; min?: number; price?: number }

const ProductUnitForm = () => {
  const {
    control,
    register,
    trigger,
    clearErrors,
    setFocus,
    setValue,
    setError,
    watch,
    formState: { errors }
  } = useFormContext()

  const lowStockSwitch = watch('lowStockSwitch')
  const minSaleSwitch = watch('minSaleSwitch')
  const maxSaleSwitch = watch('maxSaleSwitch')
  const wholesaleSwitch = watch('wholesaleSwitch')

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'wholesale_prices',
    keyName: 'k'
  })

  const wholesaleRows = watch('wholesale_prices') as WholeSaleRow[] | undefined

  // Habilitar/deshabilitar mayoreo: limpiar o asegurar 1 fila
  useEffect(() => {
    if (!wholesaleSwitch) {
      replace([])
      clearErrors('wholesale_prices')
    } else if (!fields.length) {
      append({ min: undefined, price: undefined })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wholesaleSwitch])

  // Validación de secuencia (mín ascendente, precio descendente)
  const validateWholesalePrices = (rows: WholeSaleRow[]) => {
    if (!wholesaleSwitch) {
      clearErrors('wholesale_prices')
      return true
    }

    if (!rows || rows.length === 0) {
      setError('wholesale_prices', { type: 'required', message: 'Agrega al menos un precio de mayoreo' })
      return false
    }

    let ok = true
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const prev = rows[i - 1]

      if (r.min == null || r.price == null) ok = false
      if (i > 0) {
        if (r.min != null && prev?.min != null && r.min < prev.min) ok = false
        if (r.price != null && prev?.price != null && r.price > prev.price) ok = false
      }
    }

    if (!ok) {
      setError('wholesale_prices', { type: 'validate', message: 'Revisa los precios de mayoreo' })
    } else {
      clearErrors('wholesale_prices')
    }
    return ok
  }

  // Valida cuando cambian filas o el switch
  useEffect(() => {
    validateWholesalePrices((wholesaleRows ?? []) as WholeSaleRow[])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wholesaleRows, wholesaleSwitch])

  // Botón "Agregar" solo si la última fila está completa
  const last = (wholesaleRows && wholesaleRows[wholesaleRows.length - 1]) || undefined
  const canAdd = wholesaleSwitch && (wholesaleRows?.length ? last?.min != null && last?.price != null : true)
  // -------------------------------------------------------------------------------

  return (
    <form className='space-y-2' name='product-unit-form'>
      <section className='grid grid-cols-3 gap-2'>
        <Controller
          name='unit'
          control={control}
          render={({ field, fieldState }) => (
            <Select
              label='Unidad de venta'
              size='sm'
              selectedKeys={field.value ? [String(field.value)] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0]
                field.onChange(value)
              }}
              isInvalid={!!fieldState.error}
              errorMessage={fieldState.error?.message}
              disallowEmptySelection
            >
              <SelectItem key='pz'>Pieza</SelectItem>
              <SelectItem key='pk'>Paquete</SelectItem>
              <SelectItem key='box'>Caja</SelectItem>
            </Select>
          )}
        />
        //TODO [UN-95]: El staff no debe ver este campo
        <Controller
          name='base_cost'
          control={control}
          render={({ field, fieldState }) => (
            <NumericFormat
              label='Costo base'
              value={field.value ?? ''}
              onValueChange={(v) => field.onChange(v.floatValue ?? undefined)}
              onBlur={field.onBlur}
              name={field.name}
              getInputRef={field.ref}
              thousandSeparator
              decimalScale={2}
              fixedDecimalScale
              allowNegative={false}
              prefix='$ '
              inputMode='decimal'
              customInput={Input}
              size='sm'
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
        <Controller
          name='public_price'
          control={control}
          render={({ field, fieldState }) => (
            <NumericFormat
              label='Precio público'
              value={field.value ?? ''}
              onValueChange={(v) => field.onChange(v.floatValue ?? undefined)}
              onBlur={field.onBlur}
              name={field.name}
              getInputRef={field.ref}
              thousandSeparator
              decimalScale={2}
              fixedDecimalScale
              allowNegative={false}
              prefix='$ '
              inputMode='decimal'
              customInput={Input}
              size='sm'
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
        <section className='space-y-1'>
          <div className='flex items-center justify-between'>
            <Controller
              name='minSaleSwitch'
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <Switch
                  aria-label='Habilitar compra mínima'
                  size='sm'
                  isSelected={field.value}
                  onChange={(e) => {
                    const checked = e.target.checked
                    field.onChange(checked)
                    if (checked) {
                      setTimeout(() => setFocus('min_sale'), 0)
                    } else {
                      setValue('min_sale', undefined, { shouldDirty: true, shouldValidate: false })
                      clearErrors('min_sale')
                    }
                  }}
                />
              )}
            />
            <PackageMinus color={minSaleSwitch ? 'black' : 'gray'} />
            <Controller
              name='min_sale'
              control={control}
              render={({ field }) => (
                <NumberInput
                  key={minSaleSwitch ? 'min-on' : 'min-off'}
                  aria-label='Compra mínima'
                  value={minSaleSwitch ? (field.value ?? undefined) : undefined}
                  isDisabled={!minSaleSwitch}
                  size='sm'
                  className='max-w-20 text-center'
                  maxValue={999}
                  minValue={1}
                  onChange={(v) => {
                    field.onChange(v === undefined ? undefined : v)
                    if (minSaleSwitch) trigger('min_sale')
                  }}
                  isInvalid={!!errors.min_sale && minSaleSwitch}
                />
              )}
            />
          </div>

          <div className='text-xs text-center w-full text-gray-500'>Compra mínima</div>
        </section>
        <section className='space-y-1'>
          <div className='flex items-center justify-between'>
            <Controller
              name='maxSaleSwitch'
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <Switch
                  aria-label='Habilitar compra máxima'
                  size='sm'
                  isSelected={field.value}
                  onChange={(e) => {
                    const checked = e.target.checked
                    field.onChange(checked)
                    if (checked) {
                      setTimeout(() => setFocus('max_sale'), 0)
                    } else {
                      setValue('max_sale', undefined, { shouldDirty: true, shouldValidate: false })
                      clearErrors('max_sale')
                    }
                  }}
                />
              )}
            />
            <PackagePlus color={maxSaleSwitch ? 'black' : 'gray'} />
            <Controller
              name='max_sale'
              control={control}
              render={({ field }) => (
                <NumberInput
                  key={maxSaleSwitch ? 'max-on' : 'max-off'}
                  aria-label='Compra máxima'
                  value={maxSaleSwitch ? (field.value ?? undefined) : undefined}
                  isDisabled={!maxSaleSwitch}
                  size='sm'
                  className='max-w-20 text-center'
                  minValue={1}
                  onChange={(v) => {
                    field.onChange(v)
                    if (maxSaleSwitch) trigger('max_sale')
                  }}
                  isInvalid={!!errors.max_sale && maxSaleSwitch}
                />
              )}
            />
          </div>
          <div className='text-xs text-center w-full text-gray-500 '>Compra máxima</div>
        </section>
        <section className='space-y-1'>
          <div className='flex items-center justify-between'>
            <Controller
              name='lowStockSwitch'
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <Switch
                  aria-label='Habilitar alerta de stock bajo'
                  size='sm'
                  isSelected={field.value}
                  onChange={(e) => {
                    const checked = e.target.checked
                    field.onChange(checked)
                    if (checked) {
                      setTimeout(() => setFocus('low_stock'), 0)
                    } else {
                      setValue('low_stock', undefined, { shouldDirty: true, shouldValidate: false })
                      clearErrors('low_stock')
                    }
                  }}
                />
              )}
            />
            <TriangleAlert color={lowStockSwitch ? 'black' : 'gray'} />

            <Controller
              name='low_stock'
              control={control}
              render={({ field }) => (
                <NumberInput
                  key={lowStockSwitch ? 'low-on' : 'low-off'}
                  aria-label='Alerta de stock bajo'
                  value={lowStockSwitch ? (field.value ?? undefined) : undefined}
                  isDisabled={!lowStockSwitch}
                  size='sm'
                  className='max-w-20 text-center'
                  minValue={1}
                  isWheelDisabled
                  onChange={(v) => {
                    field.onChange(v)
                    if (lowStockSwitch) trigger('low_stock')
                  }}
                  isInvalid={!!errors.low_stock && lowStockSwitch}
                />
              )}
            />
          </div>
          <div className='text-xs text-center w-full text-gray-500 '>Alerta de stock bajo</div>
        </section>
      </section>

      {errors.max_sale && errors.max_sale.message !== 'Ingresa el máximo por transacción' && (
        <p className='mt-1 text-sm text-danger flex items-center justify-center gap-2' role='alert'>
          <TriangleAlert /> {errors.max_sale.message as string}
        </p>
      )}

      {/* Header de Mayoreo (con tu visibilidad basada en wholesaleRead) */}
      <section className='mt-4'>
        <div className='flex flex-row justify-between items-center '>
          <Switch aria-label='Compra máxima' size='sm' {...register('wholesaleSwitch')}>
            Habilitar compras de mayoreo
          </Switch>

          {wholesaleSwitch && (
            <Button
              variant='ghost'
              color='primary'
              size='sm'
              onPress={() => append({ min: undefined, price: undefined })}
              isDisabled={!canAdd}
            >
              Agregar precio
            </Button>
          )}
        </div>
      </section>

      {/* Lista editable de precios de mayoreo (array controlado por RHF) */}
      <section>
        {wholesaleSwitch && (
          <div className='mt-2 p-2 border border-blue-200 rounded space-y-2 max-h-[180px] overflow-y-auto'>
            {fields.map((f, index) => (
              <div className='flex flex-row gap-2 items-center' key={f.k ?? nanoid()}>
                {/* Mínimo */}
                <Controller
                  name={`wholesale_prices.${index}.min`}
                  control={control}
                  render={({ field, fieldState }) => (
                    <NumberInput
                      label='Mínimo'
                      size='sm'
                      minValue={1}
                      value={field.value ?? undefined}
                      onChange={(v) => {
                        field.onChange(v === undefined ? undefined : Number(v))
                        trigger('wholesale_prices')
                      }}
                      isInvalid={!!fieldState.error}
                      //errorMessage={fieldState.error?.message}
                    />
                  )}
                />

                {/* Precio */}
                <Controller
                  name={`wholesale_prices.${index}.price`}
                  control={control}
                  render={({ field, fieldState }) => (
                    <NumericFormat
                      thousandSeparator
                      decimalScale={2}
                      fixedDecimalScale
                      allowNegative={false}
                      prefix='$ '
                      inputMode='decimal'
                      customInput={Input}
                      label='Precio'
                      size='sm'
                      value={field.value ?? ''}
                      onValueChange={(v) => {
                        field.onChange(typeof v.floatValue === 'number' ? v.floatValue : undefined)
                        trigger('wholesale_prices')
                      }}
                      isInvalid={!!fieldState.error}
                      //errorMessage={fieldState.error?.message}
                    />
                  )}
                />

                {fields.length > 1 && (
                  <Button variant='ghost' color='danger' size='sm' onPress={() => remove(index)} isIconOnly>
                    <X />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {errors.wholesale_prices && (
          <p className='mt-1 text-sm text-danger flex items-center gap-2' role='alert'>
            <TriangleAlert /> Los precios de mayoreo no son válidos.
          </p>
        )}
      </section>
    </form>
  )
}

export default ProductUnitForm
