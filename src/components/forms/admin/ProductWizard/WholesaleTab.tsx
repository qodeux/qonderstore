import { Button, Input, NumberInput, Tooltip } from '@heroui/react'
import { TriangleAlert, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Controller, useFieldArray, useFormContext } from 'react-hook-form'
import { NumericFormat } from 'react-number-format'
import { nanoid } from 'zod'

/** =========================================================
 *  Child: contenido de una tab de mayoreo (1 unidad = 1 array)
 *  ========================================================= */
type WholesaleRow = {
  min?: number
  price?: number
  total_price?: number
}

function round2(n: number) {
  // evita basura flotante
  return Math.round((n + Number.EPSILON) * 100) / 100
}

const WholesaleTab = ({ unitKey }: { unitKey: string }) => {
  const {
    control,
    setValue,
    getValues,
    setError,
    clearErrors,
    formState: { errors }
  } = useFormContext()

  const control_name = `wholesale_prices.${unitKey}` as const

  const wholesaleRows = getValues(control_name) as WholesaleRow[] | undefined

  const { fields, append, remove } = useFieldArray({
    control,
    name: control_name,
    keyName: 'k'
  })

  // trackea qué editó el usuario por fila (para recalcular cuando cambia "min")
  // key = `${unitKey}:${index}`
  const lastEditedRef = useRef<Record<string, 'unit' | 'total' | undefined>>({})

  const setLastEdited = (index: number, v: 'unit' | 'total') => {
    lastEditedRef.current[`${unitKey}:${index}`] = v
  }

  const syncFromUnit = (index: number) => {
    const row = getValues(`${control_name}.${index}` as const) as WholesaleRow | undefined
    const qty = row?.min
    const unit = row?.price

    if (!qty || qty <= 0) return
    if (typeof unit !== 'number' || Number.isNaN(unit)) return

    const total = round2(unit * qty)
    setValue(`${control_name}.${index}.total_price` as const, total, { shouldDirty: true, shouldTouch: false })
  }

  const syncFromTotal = (index: number) => {
    const row = getValues(`${control_name}.${index}` as const) as WholesaleRow | undefined
    const qty = row?.min
    const total = row?.total_price

    if (!qty || qty <= 0) return
    if (typeof total !== 'number' || Number.isNaN(total)) return

    const unit = round2(total / qty)
    setValue(`${control_name}.${index}.price` as const, unit, { shouldDirty: true, shouldTouch: false })
  }

  const syncOnMinChange = (index: number) => {
    const last = lastEditedRef.current[`${unitKey}:${index}`]

    const row = getValues(`${control_name}.${index}` as const) as WholesaleRow | undefined
    const qty = row?.min
    if (!qty || qty <= 0) return

    // Si el usuario editó total al último, recalculamos unit.
    if (last === 'total') {
      syncFromTotal(index)
      return
    }

    // default: si hay unit_price, recalculamos total; si no, intentamos desde total.
    if (typeof row?.price === 'number') {
      syncFromUnit(index)
    } else if (typeof row?.total_price === 'number') {
      syncFromTotal(index)
    }
  }

  // Validación de secuencia (mín ascendente, precio descendente)
  const validateWholesalePrices = (rows: WholesaleRow[]) => {
    if (!rows || rows.length === 0) {
      setError(control_name, { type: 'required', message: 'Agrega al menos un precio de mayoreo' })
      return false
    }

    let ok = true
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const prev = rows[i - 1]

      if (r.min == null || r.price == null || r.total_price == null) ok = false
      if (i > 0) {
        if (r.min != null && prev?.min != null && r.min < prev.min) ok = false
        if (r.price != null && prev?.price != null && r.price > prev.price) ok = false
      }
    }

    if (!ok) {
      setError(control_name, { type: 'validate', message: 'Revisa los precios de mayoreo' })
    } else {
      clearErrors(control_name)
    }
    return ok
  }

  // Valida cuando cambian filas o el switch
  useEffect(() => {
    //console.log(wholesaleRows)
    validateWholesalePrices((wholesaleRows ?? []) as WholesaleRow[])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wholesaleRows])

  // Botón "Agregar" solo si la última fila está completa
  const last = (wholesaleRows && wholesaleRows[wholesaleRows.length - 1]) || undefined
  const canAdd = wholesaleRows?.length ? last?.min != null && last?.price != null : true
  // -------------------------------------------------------------------------------

  return (
    <section>
      <div className='mt-2 p-2 border border-blue-200 rounded space-y-2 max-h-[180px] overflow-y-auto'>
        {fields.map((f, index) => (
          <div className='flex flex-row gap-2 items-center' key={f.k ?? nanoid()}>
            {/* Mínimo (cantidad) */}
            <Controller
              name={`${control_name}.${index}.min`}
              control={control}
              render={({ field, fieldState }) => (
                <NumberInput
                  variant='bordered'
                  classNames={{ inputWrapper: 'bg-white' }}
                  label='Mínimo'
                  size='sm'
                  minValue={1}
                  value={field.value ?? undefined}
                  onChange={(v) => {
                    const next = v === undefined ? undefined : Number(v)
                    field.onChange(next)
                    // al cambiar cantidad, recalcula según el último campo editado
                    syncOnMinChange(index)
                    validateWholesalePrices(wholesaleRows ?? [])
                  }}
                  isInvalid={!!fieldState.error}
                />
              )}
            />

            {/* Precio unitario */}
            <Controller
              name={`${control_name}.${index}.price`}
              control={control}
              render={({ field, fieldState }) => (
                <NumericFormat
                  variant='bordered'
                  classNames={{ inputWrapper: 'bg-white' }}
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
                    const unit = typeof v.floatValue === 'number' ? v.floatValue : undefined
                    field.onChange(unit)
                    setLastEdited(index, 'unit')
                    // si ya hay cantidad, calcula total
                    syncFromUnit(index)
                    validateWholesalePrices(wholesaleRows ?? [])
                  }}
                  onFocus={(e) => {
                    setTimeout(() => e.currentTarget.select(), 0)
                  }}
                  isInvalid={!!fieldState.error}
                />
              )}
            />

            {/* Precio total */}
            <Controller
              name={`${control_name}.${index}.total_price`}
              control={control}
              render={({ field, fieldState }) => (
                <NumericFormat
                  variant='bordered'
                  classNames={{ inputWrapper: 'bg-white' }}
                  thousandSeparator
                  decimalScale={0}
                  fixedDecimalScale
                  allowNegative={false}
                  prefix='$ '
                  inputMode='decimal'
                  customInput={Input}
                  label='Precio total'
                  size='sm'
                  value={field.value ?? ''}
                  onValueChange={(v) => {
                    const total = typeof v.floatValue === 'number' ? v.floatValue : undefined
                    field.onChange(total)
                    setLastEdited(index, 'total')
                    // si ya hay cantidad, calcula unitario
                    syncFromTotal(index)
                    validateWholesalePrices(wholesaleRows ?? [])
                  }}
                  onFocus={(e) => {
                    setTimeout(() => e.currentTarget.select(), 0)
                  }}
                  isInvalid={!!fieldState.error}
                />
              )}
            />

            {fields.length > 1 && (
              <Tooltip content='Eliminar precio' placement='left'>
                <Button variant='ghost' color='danger' size='sm' onPress={() => remove(index)} isIconOnly>
                  <X />
                </Button>
              </Tooltip>
            )}
          </div>
        ))}
      </div>

      <div className=' flex justify-between mt-2 '>
        {(errors as any)?.wholesale_prices?.[unitKey] ? (
          <p className='mt-1 text-sm text-danger flex items-center gap-2' role='alert'>
            <TriangleAlert /> Los precios de mayoreo no son válidos.
          </p>
        ) : (
          <div></div>
        )}
        <Button
          variant='ghost'
          color='primary'
          size='sm'
          onPress={() => append({ min: undefined, price: undefined, total_price: undefined } as WholesaleRow)}
          isDisabled={!canAdd}
        >
          Agregar precio
        </Button>
      </div>
    </section>
  )
}

export default WholesaleTab
