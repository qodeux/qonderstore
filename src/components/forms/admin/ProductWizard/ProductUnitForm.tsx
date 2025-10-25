import { Button, Input, NumberInput, Select, SelectItem, Switch } from '@heroui/react'
import { TriangleAlert, X } from 'lucide-react'
import { nanoid } from 'nanoid'
import { useEffect, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { NumericFormat } from 'react-number-format'
import { useSelector } from 'react-redux'
import type { RootState } from '../../../../store/store'

export type WholeSalePrice = {
  min: number | undefined
  price: number | undefined
}

export type WholeSaleRow = { id: string; min?: number; price?: number }

const ProductUnitForm = () => {
  const isEditing = useSelector((state: RootState) => state.products.isEditing)

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

  const wholesaleRead = watch('wholesale_prices_read')

  const minSale = watch('min_sale')
  const maxSale = watch('max_sale')
  const lowStock = watch('low_stock')

  // Estado local con IDs estables
  const [wholesalePrices, setWholesalePrices] = useState<WholeSaleRow[]>([])

  // Agregar fila
  const addRow = () => setWholesalePrices((prev) => [...prev, { id: nanoid() }])

  // Actualizar una fila por ID
  const updateRow = (id: string, patch: Partial<WholeSaleRow>) =>
    setWholesalePrices((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  // Eliminar una fila por ID
  const removeRow = (id: string) => setWholesalePrices((prev) => prev.filter((r) => r.id !== id))

  const [wholesaleErrors, setWholesaleErrors] = useState<Record<string, { min?: string; price?: string }>>({})

  const last = wholesalePrices[wholesalePrices.length - 1]
  const canAdd = !wholesaleSwitch || (last?.min != null && last?.price != null)

  const validateWholesalePrices = (rows: WholeSaleRow[]) => {
    if (!wholesaleSwitch) {
      setWholesaleErrors({})
      clearErrors('wholesale_prices')
      return true
    }

    const errs: Record<string, { min?: string; price?: string }> = {}
    let valid = true

    if (rows.length === 0) {
      setError('wholesale_prices', { type: 'required', message: 'Agrega al menos un precio de mayoreo' })
      return false
    }

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const prev = rows[i - 1]

      if (r.min == null) {
        errs[r.id] = { ...(errs[r.id] || {}), min: 'Requerido' }
        valid = false
      }
      if (r.price == null) {
        errs[r.id] = { ...(errs[r.id] || {}), price: 'Requerido' }
        valid = false
      }

      if (i > 0) {
        if (r.min != null && prev?.min != null && r.min < prev.min) {
          errs[r.id] = { ...(errs[r.id] || {}), min: `Debe ser ≥ ${prev.min}` }
          valid = false
        }
        if (r.price != null && prev?.price != null && r.price > prev.price) {
          errs[r.id] = { ...(errs[r.id] || {}), price: `Debe ser ≤ ${prev.price}` }
          valid = false
        }
      }
    }

    setWholesaleErrors(errs)
    if (!valid) {
      setError('wholesale_prices', { type: 'validate', message: 'Revisa los precios de mayoreo' })
    } else {
      clearErrors('wholesale_prices')
    }
    return valid
  }

  // A) Habilitar/deshabilitar mayoreo y asegurar 1 fila al encender
  useEffect(() => {
    if (!wholesaleSwitch) {
      setWholesalePrices([]) // limpia filas
    } else if (wholesalePrices.length === 0) {
      addRow()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wholesaleSwitch])

  // B) Sincroniza el JSON oculto
  useEffect(() => {
    if (!wholesaleSwitch) {
      setValue('wholesale_prices', '[]', { shouldDirty: true, shouldValidate: true })
      return
    }

    const compact = wholesalePrices.map(({ min, price }) => ({ min, price })) //filter((r) => r.min != null && r.price != null)

    setValue('wholesale_prices', JSON.stringify(compact), {
      shouldDirty: true,
      shouldValidate: true
    })
  }, [wholesalePrices, wholesaleSwitch, setValue])

  // C) Valida cuando cambien filas o el switch
  useEffect(() => {
    validateWholesalePrices(wholesalePrices)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wholesalePrices, wholesaleSwitch])

  useEffect(() => {
    if (lowStockSwitch) {
      // pequeño defer para asegurar que el input esté montado/habilitado
      const id = setTimeout(() => setFocus('low_stock'), 0)
      return () => clearTimeout(id)
    } else {
      // si se desactiva, limpia errores del campo
      setValue('low_stock', undefined, { shouldValidate: false })
      //clearErrors('low_stock')
    }
  }, [lowStockSwitch, setFocus, clearErrors])

  useEffect(() => {
    if (minSaleSwitch) {
      // pequeño defer para asegurar que el input esté montado/habilitado
      const id = setTimeout(() => setFocus('min_sale'), 0)
      return () => clearTimeout(id)
    } else {
      // si se desactiva, limpia errores del campo
      //clearErrors('min_sale')
    }
  }, [minSaleSwitch, setFocus, clearErrors])

  useEffect(() => {
    if (maxSaleSwitch) {
      // pequeño defer para asegurar que el input esté montado/habilitado
      const id = setTimeout(() => setFocus('max_sale'), 0)
      return () => clearTimeout(id)
    } else {
      // si se desactiva, limpia errores del campo
      //clearErrors('max_sale')
    }
  }, [maxSaleSwitch, setFocus, clearErrors])

  useEffect(() => {
    if (!minSale) {
      setValue('minSaleSwitch', false, { shouldValidate: false })
    } else {
      setValue('minSaleSwitch', true, { shouldValidate: false })
    }
  }, [minSale, setValue])

  useEffect(() => {
    if (!maxSale) {
      setValue('maxSaleSwitch', false, { shouldValidate: false })
    } else {
      setValue('maxSaleSwitch', true, { shouldValidate: false })
    }
  }, [maxSale, setValue])

  useEffect(() => {
    if (!lowStock) {
      setValue('lowStockSwitch', false, { shouldValidate: false })
    } else {
      setValue('lowStockSwitch', true, { shouldValidate: false })
    }
  }, [lowStock, setValue])

  useEffect(() => {
    if (wholesaleRead) {
      console.log('Se ejecutaaaaaa')
      setValue('wholesale_prices', 'wholesaleRead', { shouldValidate: false })
    }
  }, [wholesaleRead])

  return (
    <form className='space-y-2' name='product-unit-form'>
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
      <section className='flex flex-row gap-2'>
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
      </section>
      <section className='grid grid-cols-2 gap-4'>
        <div className='flex flex-row justify-between'>
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
                    // feedback inmediato opcional
                    trigger('min_sale')
                    // focus
                    setTimeout(() => setFocus('min_sale'), 0)
                  } else {
                    // limpiar valor/errores al apagar
                    setValue('min_sale', undefined, { shouldValidate: false })
                    clearErrors('min_sale')
                  }
                }}
              >
                Compra mínima
              </Switch>
            )}
          />

          <Controller
            name='min_sale'
            control={control}
            render={({ field }) => (
              <NumberInput
                aria-label='Compra mínima'
                {...field}
                isDisabled={!minSaleSwitch}
                size='sm'
                className='max-w-20 text-center'
                maxValue={999}
                minValue={1}
                onChange={(v) => {
                  field.onChange(v === undefined ? undefined : Number(v))
                  if (minSaleSwitch) trigger('min_sale')
                }}
                onBlur={async () => {
                  field.onBlur()
                  if (minSaleSwitch) await trigger('min_sale')
                }}
                isInvalid={!!errors.min_sale}
              />
            )}
          />
        </div>
        <div className='flex flex-row justify-between'>
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
                    // feedback inmediato opcional
                    trigger('max_sale')
                    // focus
                    setTimeout(() => setFocus('max_sale'), 0)
                  } else {
                    // limpiar valor/errores al apagar
                    setValue('max_sale', undefined, { shouldValidate: false })
                    clearErrors('max_sale')
                  }
                }}
              >
                Compra máxima
              </Switch>
            )}
          />

          <Controller
            name='max_sale'
            control={control}
            render={({ field }) => (
              <NumberInput
                aria-label='Compra máxima'
                {...field}
                isDisabled={!maxSaleSwitch}
                size='sm'
                className='max-w-20 text-center'
                maxValue={999}
                minValue={1}
                onChange={(v) => {
                  field.onChange(v === undefined ? undefined : Number(v))
                  if (maxSaleSwitch) trigger('max_sale')
                }}
                onBlur={async () => {
                  field.onBlur()
                  if (maxSaleSwitch) await trigger('max_sale')
                }}
                isInvalid={!!errors.max_sale}
              />
            )}
          />
        </div>
        <div className='flex flex-row items-center justify-between gap-3'>
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
                    // feedback inmediato opcional
                    trigger('low_stock')
                    // focus
                    setTimeout(() => setFocus('low_stock'), 0)
                  } else {
                    // limpiar valor/errores al apagar
                    setValue('low_stock', undefined, { shouldValidate: false })
                    clearErrors('low_stock')
                  }
                }}
              >
                Alerta de stock bajo
              </Switch>
            )}
          />

          <Controller
            name='low_stock'
            control={control}
            render={({ field }) => (
              <NumberInput
                aria-label='Alerta de stock bajo'
                {...field}
                value={field.value ?? undefined}
                isDisabled={!lowStockSwitch}
                size='sm'
                className='max-w-20 text-center'
                minValue={1}
                isWheelDisabled
                onChange={(v) => {
                  const val = v === undefined ? undefined : Number(v)
                  setValue('low_stock', val, {
                    shouldValidate: true, // 🔑 valida inmediatamente
                    shouldDirty: true,
                    shouldTouch: true
                  })
                }}
                onBlur={field.onBlur} // ya no necesitas trigger aquí
                isInvalid={!!errors.low_stock}
              />
            )}
          />
        </div>
        {/* {(!isEditing || (isEditing && !wholesaleRead)) && ( */}
        {wholesaleRead && (
          <div className='flex flex-row justify-between items-center hidden'>
            <Switch aria-label='Compra máxima' size='sm' {...register('wholesaleSwitch')}>
              Mayoreo
            </Switch>

            {wholesaleSwitch && (
              <Button variant='ghost' color='primary' size='sm' onPress={addRow} isDisabled={!canAdd}>
                Agregar precio
              </Button>
            )}
          </div>
        )}
      </section>
      <Controller name='wholesale_prices' control={control} defaultValue='[]' render={({ field }) => <input {...field} type='hidden' />} />
      <Controller name='wholesale_prices_read' control={control} render={({ field }) => <input {...field} type='hidden' />} />

      {/* TODO [UN-69]: Implementar lógica para volver a establecer precios de mayoreo */}
      {/* {wholesaleRead && isEditing && (
        <>
          <Button>Volver a establecer</Button>

          <table className='w-full text-sm border-collapse border border-slate-200'>
            <thead>
              <th>Minimo </th>
              <th>Precio</th>
            </thead>
            {JSON.parse(wholesaleRead).map((row: WholeSalePrice, index: number) => (
              <tr key={index}>
                <td className='pr-4 text-right'>{row.min} </td>
                <td className='pr-4 text-right'>{row.price}</td>
              </tr>
            ))}
          </table>

          <p className='text-sm text-info flex items-center gap-2'>
            <TriangleAlert /> Los precios de mayoreo no se pueden editar en se deben volver a generar
          </p>
        </>
      )} */}

      <section>
        {wholesaleSwitch && (
          <div className='mt-2 p-2 border border-blue-200 rounded space-y-2 max-h-[180px] overflow-y-auto'>
            {wholesalePrices.map((item) => {
              const rowErr = wholesaleErrors[item.id] || {}
              return (
                <div className='flex flex-row gap-2 items-center' key={item.id}>
                  <div>
                    <NumberInput
                      label='Mínimo'
                      size='sm'
                      minValue={1}
                      value={item.min ?? undefined}
                      onChange={(v) => updateRow(item.id, { min: v === undefined ? undefined : Number(v) })}
                      isInvalid={!!rowErr.min}
                    />
                  </div>

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
                    isClearable
                    onClear={() => updateRow(item.id, { price: undefined })}
                    value={item.price ?? ''}
                    onValueChange={(v) => updateRow(item.id, { price: typeof v.floatValue === 'number' ? v.floatValue : undefined })}
                    isInvalid={!!rowErr.price}
                  />

                  {wholesalePrices.length > 1 && (
                    <Button variant='ghost' color='danger' size='sm' onPress={() => removeRow(item.id)} isIconOnly>
                      <X />
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {errors.wholesale_prices && (
          <p className='mt-1 text-sm text-danger flex items-center gap-2' role='alert'>
            <TriangleAlert /> {errors.wholesale_prices.message as string}
          </p>
        )}
      </section>
    </form>
  )
}

export default ProductUnitForm
