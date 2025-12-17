import { Checkbox, CheckboxGroup, Input, NumberInput, Select, SelectItem, Switch, Tab, Tabs, type Selection } from '@heroui/react'
import { useEffect, useMemo, useRef } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { NumericFormat } from 'react-number-format'
import { bulkUnitsAvailable } from '../../../../types/products'
import WholesaleTab from './WholesaleTab'

/** ======================
 *  Main Component
 *  ====================== */
const ProductBulkForm = () => {
  const {
    control,
    watch,
    setValue,
    trigger,
    setFocus,
    clearErrors,
    unregister,
    getValues,
    formState: { errors }
  } = useFormContext()

  // Selecciones actuales
  const selectedKeys = (watch('bulk_units_available') as string[] | undefined) ?? []
  const baseUnit = watch('base_unit') as string | undefined

  // Objetos para el Select
  const selectedUnits = useMemo(() => bulkUnitsAvailable.filter((u) => selectedKeys.includes(u.key)), [selectedKeys])

  const publicPrice = watch('base_unit_price') as number | undefined

  const minSaleSwitch = watch('minSaleSwitch')
  const maxSaleSwitch = watch('maxSaleSwitch')

  // Control de edición manual para evitar loops
  const editingRef = useRef<Record<string, 'price' | 'margin' | null>>({}) // por unidad: 'price' o 'margin'
  const setEditing = (key: string, mode: 'price' | 'margin' | null) => {
    editingRef.current[key] = mode
  }

  const UNIT_TO_GRAMS = Object.freeze({ gr: 1, oz: 28, lb: 453 })

  const money = (n: number) => Math.round(n * 100) / 100

  const ratioFrom = (target: string, base: string) => {
    // Guardas adicionales ante claves desconocidas
    const tg = (UNIT_TO_GRAMS as Record<string, number>)[target]
    const bs = (UNIT_TO_GRAMS as Record<string, number>)[base]
    if (!tg || !bs) throw new Error('Unidad no soportada')
    return tg / bs
  }

  // Ajuste % relativo al precio base (NO margen sobre costo)
  const priceFromMarginPct = (basePrice: number, ratio: number, marginPct: number) => money(basePrice * ratio * (1 + marginPct / 100))

  const marginPctFromPrice = (basePrice: number, ratio: number, unitPrice: number) => {
    const pct = (unitPrice / (basePrice * ratio) - 1) * 100
    return Number(pct.toFixed(4)) // o 3/2 decimales según prefieras
  }

  // Convierte "precio por FROM" → "precio por TO"
  const convertUnitPrice = (pricePerFrom: number, from: keyof typeof UNIT_TO_GRAMS, to: keyof typeof UNIT_TO_GRAMS) => {
    const gFrom = UNIT_TO_GRAMS[from]
    const gTo = UNIT_TO_GRAMS[to]
    if (!gFrom || !gTo) return null
    const pricePerGram = pricePerFrom / gFrom
    return money(pricePerGram * gTo).toFixed(0)
  }

  /** ---------------------------------------------
   *  Tabs de mayoreo dinámicas desde RHF (NO state)
   *  --------------------------------------------- */
  const wholesaleFlagNames = useMemo(
    () => selectedUnits.filter((u) => u.key !== baseUnit).map((u) => `units.${u.key}.wholeSale` as const),
    [selectedUnits, baseUnit]
  )

  const wholesaleFlags = useWatch({
    control,
    name: wholesaleFlagNames
  })

  const wholesalePricesObj = useWatch({ control, name: 'wholesale_prices' }) as Record<string, any[]> | undefined

  const wholesaleAvailableUnits = useMemo(() => {
    const keys = selectedUnits.filter((u) => u.key !== baseUnit).map((u) => u.key)

    return keys.filter((k, i) => {
      const bySwitch = !!wholesaleFlags?.[i]
      const byRows = Array.isArray(wholesalePricesObj?.[k]) && wholesalePricesObj![k].length > 0
      return bySwitch || byRows
    })
  }, [selectedUnits, baseUnit, wholesaleFlags, wholesalePricesObj])

  // Recalcula precios cuando cambia la base o el precio base o el set de unidades
  useEffect(() => {
    if (!baseUnit || publicPrice == null) return

    selectedUnits
      .filter((u) => u.key !== baseUnit)
      .forEach((u) => {
        const pct = watch(`units.${u.key}.margin`) as number | undefined
        if (pct == null) {
          // Si no hay margen, no fuerces precio (y no lo limpies mientras edita)
          if (editingRef.current[u.key] !== 'price') {
            setValue(`units.${u.key}.price`, undefined, { shouldValidate: true })
          }
          return
        }

        // Evita SOBREESCRIBIR mientras el user edita el precio manualmente
        if (editingRef.current[u.key] === 'price') return

        const r = ratioFrom(u.key, baseUnit)
        const price = priceFromMarginPct(publicPrice, r, pct)
        setValue(`units.${u.key}.price`, price, { shouldValidate: true })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUnit, publicPrice, selectedKeys.join(',')])

  useEffect(() => {
    if (!selectedUnits.length) return

    selectedUnits
      .filter((u) => u.key !== baseUnit)
      .forEach((u) => {
        const rows = wholesalePricesObj?.[u.key]
        const hasRows = Array.isArray(rows) && rows.length > 0

        const path = `units.${u.key}.wholeSale` as const
        const current = watch(path) as boolean | undefined

        // Si hay filas y el switch está apagado → prenderlo
        if (hasRows && !current) {
          setValue(path, true, { shouldDirty: false, shouldTouch: false, shouldValidate: false })
          return
        }

        // Si NO hay filas y el switch está prendido → apagarlo
        if (!hasRows && current) {
          setValue(path, false, { shouldDirty: false, shouldTouch: false, shouldValidate: false })
        }
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKeys.join(','), baseUnit, wholesalePricesObj])

  return (
    <form className='space-y-2'>
      <Controller
        name='bulk_units_available'
        control={control}
        defaultValue={[]}
        render={({ field }) => (
          <CheckboxGroup
            label='Unidades de venta disponibles'
            orientation='horizontal'
            value={field.value ?? []}
            // Bloqueo: no permitimos quitar la unidad base
            onValueChange={(next: string[]) => {
              const prev = (field.value ?? []) as string[]

              field.onChange(next)

              // Si no hay base y se marcó al menos una, ponemos la primera como base
              if (!baseUnit && next.length > 0) {
                setValue('base_unit', next[0], { shouldDirty: true, shouldTouch: true, shouldValidate: true })
              }

              // ---- SYNC de units con la selección ----
              const selected = new Set(next)
              const units = getValues('units') ?? {}

              // 1) Quitar unidades que ya NO están seleccionadas
              const removed = prev.filter((u) => !selected.has(u))
              removed.forEach((k) => {
                // Limpia units.* (si existía)
                if (units[k]) {
                  unregister(`units.${k}`)
                  clearErrors([`units.${k}`, 'units'])
                  const nextUnits = { ...(getValues('units') ?? {}) }
                  delete nextUnits[k]
                  setValue('units', nextUnits, { shouldDirty: true, shouldValidate: false })
                }

                // Limpia también precios mayoreo por unidad
                unregister(`wholesale_prices.${k}`)
                clearErrors(`wholesale_prices.${k}`)
              })
            }}
            isInvalid={!!errors.bulk_units_available}
            errorMessage={errors.bulk_units_available?.message as string}
          >
            {bulkUnitsAvailable.map((unit) => (
              <Checkbox key={unit.key} value={unit.key} isReadOnly={baseUnit === unit.key}>
                {unit.label}
              </Checkbox>
            ))}
          </CheckboxGroup>
        )}
      />

      <div className='flex flex-row gap-2'>
        <Controller
          name='base_unit'
          control={control}
          render={({ field }) => (
            <Select
              variant='bordered'
              classNames={{ trigger: 'bg-white' }}
              label='Unidad base'
              size='sm'
              items={selectedUnits}
              selectionMode='single'
              disallowEmptySelection
              selectedKeys={field.value ? [String(field.value)] : []}
              onSelectionChange={(keys: Selection) => {
                const key = Array.from(keys)[0] as string | undefined
                field.onChange(key)
              }}
              isDisabled={selectedUnits.length === 0}
              isInvalid={!!errors.base_unit}
              errorMessage={errors.base_unit?.message as string}
            >
              {(unit) => <SelectItem key={unit.key}>{unit.label}</SelectItem>}
            </Select>
          )}
        />

        <Controller
          name='base_unit_price'
          control={control}
          render={({ field, fieldState }) => (
            <NumericFormat
              variant='bordered'
              classNames={{ inputWrapper: 'bg-white' }}
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
              isDisabled={selectedUnits.length === 0}
            />
          )}
        />
      </div>

      <section className='grid grid-cols-2 gap-2'>
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
                    setTimeout(() => setFocus('min_sale'), 0)
                  } else {
                    setValue('min_sale', undefined, { shouldDirty: true, shouldValidate: false })
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
                variant='bordered'
                classNames={{ inputWrapper: 'bg-white' }}
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
                    setTimeout(() => setFocus('max_sale'), 0)
                  } else {
                    setValue('max_sale', undefined, { shouldDirty: true, shouldValidate: false })
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
                variant='bordered'
                classNames={{ inputWrapper: 'bg-white' }}
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
      </section>

      <div className='grid grid-cols-2 gap-2'>
        <p className='text-sm text-danger pt-2'>{errors.min_sale?.type === 'custom' ? <>{(errors.min_sale as any).message}</> : null}</p>
        <p className='text-sm text-danger pt-2'>{errors.max_sale?.type === 'custom' ? <>{(errors.max_sale as any).message}</> : null}</p>
      </div>

      {selectedUnits.length > 1 && publicPrice != null && baseUnit && (
        <>
          <p className='text-medium text-foreground-500'>Precios por unidad</p>

          <section className='grid grid-cols-2 gap-2'>
            {selectedUnits
              .filter((u) => u.key !== baseUnit)
              .map((unit) => (
                <section key={unit.key} className='flex flex-col gap-2 p-2 border rounded border-foreground-200'>
                  <header className='flex flex-row gap-2 items-baseline'>
                    <p>{unit.label}</p>
                    <p className='text-xs text-foreground-500'>
                      {(() => {
                        const unitPrice = watch(`units.${unit.key}.price`) as number | undefined
                        if (unitPrice == null || !baseUnit) return null

                        const converted = convertUnitPrice(unitPrice, unit.key as 'gr' | 'oz' | 'lb', baseUnit as 'gr' | 'oz' | 'lb')
                        if (converted == null) return null

                        return `$${converted} por ${baseUnit}`
                      })()}
                    </p>
                  </header>

                  <div className='flex flex-row gap-2'>
                    {/* MARGEN / AJUSTE RELATIVO AL PRECIO BASE */}
                    <Controller
                      name={`units.${unit.key}.margin`}
                      control={control}
                      render={({ field, fieldState }) => (
                        <NumericFormat
                          variant='bordered'
                          classNames={{ inputWrapper: 'bg-white' }}
                          customInput={Input}
                          value={field.value ?? ''}
                          onBlur={() => setEditing(unit.key, null)}
                          onFocus={() => setEditing(unit.key, 'margin')}
                          prefix={`${unit.value > Number(selectedUnits.find((u) => u.key === baseUnit)?.value) ? '-' : '+'}`}
                          suffix='%'
                          label='Margen'
                          allowNegative={false}
                          decimalScale={0}
                          isInvalid={!!fieldState.error}
                          size='sm'
                          isClearable
                          onValueChange={(v) => {
                            if (v.value === '') {
                              field.onChange(undefined)
                              if (editingRef.current[unit.key] !== 'price') {
                                setValue(`units.${unit.key}.price`, undefined, { shouldDirty: true, shouldValidate: true })
                              }
                              return
                            }

                            const sign = v.formattedValue?.trim().startsWith('-') ? -1 : 1
                            const pct = sign * Number(v.value) // % entero
                            field.onChange(pct)

                            const basePrice = watch('base_unit_price') as number | undefined
                            const base = watch('base_unit') as string | undefined
                            if (!base || basePrice == null) return

                            // Si el user está editando precio en este momento, no lo sobreescribas
                            if (editingRef.current[unit.key] === 'price') return

                            const r = ratioFrom(unit.key, base)
                            const price = priceFromMarginPct(basePrice, r, pct)
                            setValue(`units.${unit.key}.price`, price, { shouldDirty: true, shouldValidate: true, shouldTouch: true })
                          }}
                          onClear={() => {
                            field.onChange(undefined)
                            if (editingRef.current[unit.key] !== 'price') {
                              setValue(`units.${unit.key}.price`, undefined, { shouldDirty: true, shouldValidate: true, shouldTouch: true })
                            }
                          }}
                        />
                      )}
                    />

                    {/* PRECIO CALCULADO / EDITABLE */}
                    <Controller
                      name={`units.${unit.key}.price`}
                      control={control}
                      render={({ field, fieldState }) => (
                        <NumericFormat
                          variant='bordered'
                          classNames={{ inputWrapper: 'bg-white' }}
                          label='Precio'
                          value={field.value ?? ''}
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
                          onBlur={() => {
                            // al terminar de escribir, ahora sí calcula margen desde el precio
                            const num = watch(`units.${unit.key}.price`) as number | undefined
                            const basePrice = watch('base_unit_price') as number | undefined
                            const base = watch('base_unit') as string | undefined

                            if (num == null || basePrice == null || !base) {
                              setValue(`units.${unit.key}.margin`, undefined, {
                                shouldDirty: true,
                                shouldValidate: true,
                                shouldTouch: true
                              })
                              setEditing(unit.key, null)
                              return
                            }

                            const r = ratioFrom(unit.key, base)
                            const pct = marginPctFromPrice(basePrice, r, num)
                            setValue(`units.${unit.key}.margin`, pct, { shouldDirty: true, shouldValidate: true, shouldTouch: true })
                            setEditing(unit.key, null)
                          }}
                          onValueChange={(v) => {
                            const num = v.value === '' ? undefined : Number(v.value)
                            if (num === undefined || Number.isNaN(num)) {
                              setValue(field.name, undefined, { shouldValidate: true, shouldDirty: true, shouldTouch: true })
                              return
                            }
                            // Solo ACTUALIZA el precio, sin tocar margen (evita loop)
                            setValue(field.name, num, { shouldValidate: true, shouldDirty: true, shouldTouch: true })
                          }}
                          thousandSeparator
                          decimalScale={2}
                          fixedDecimalScale
                          allowNegative={false}
                          prefix='$ '
                          inputMode='decimal'
                          customInput={Input}
                          size='sm'
                          isInvalid={!!fieldState.error}
                        />
                      )}
                    />
                  </div>

                  <footer>
                    <Controller
                      name={`units.${unit.key}.wholeSale`}
                      control={control}
                      defaultValue={false}
                      render={({ field }) => (
                        <Switch
                          aria-label='Habilitar Mayoreo'
                          size='sm'
                          isSelected={field.value}
                          onChange={(e) => {
                            const checked = e.target.checked
                            field.onChange(checked)

                            const pricesPath = `wholesale_prices.${unit.key}` as const

                            if (checked) {
                              // si no hay filas, crea una por default
                              const current = getValues(pricesPath)
                              if (!Array.isArray(current) || current.length === 0) {
                                setValue(pricesPath, [{ min: undefined, price: undefined }], { shouldDirty: true })
                              }
                            } else {
                              // limpia por completo esa unidad
                              unregister(pricesPath, { keepDirty: false, keepTouched: false, keepError: false })
                              clearErrors(pricesPath)
                            }
                          }}
                        >
                          Habilitar mayoreo
                        </Switch>
                      )}
                    />
                  </footer>
                </section>
              ))}
          </section>
        </>
      )}

      {wholesaleAvailableUnits.length > 0 && (
        <section>
          <p className='text-medium text-foreground-500'>Precios de Mayoreo</p>
          <Tabs
            aria-label='Dynamic tabs'
            items={bulkUnitsAvailable.filter((u) => wholesaleAvailableUnits.includes(u.key))}
            color='primary'
            classNames={{ panel: ' p-0', base: '-m-1 mt-1' }}
            hidden={wholesaleAvailableUnits.length > 1 ? false : true}
          >
            {(item) => (
              <Tab key={`wholesale-${item.key}`} title={item.label}>
                <WholesaleTab unitKey={item.key} />
              </Tab>
            )}
          </Tabs>
        </section>
      )}
    </form>
  )
}

export default ProductBulkForm
