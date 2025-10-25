import { Checkbox, CheckboxGroup, Input, NumberInput, Select, SelectItem, Switch, type Selection } from '@heroui/react'
import { useEffect, useRef } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { NumericFormat } from 'react-number-format'
import { bulkUnitsAvailable } from '../../../../types/products'

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
  const selectedUnits = bulkUnitsAvailable.filter((u) => selectedKeys.includes(u.key))

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
              const expectedKeys = [...selected].filter((u) => u !== getValues('base_unit')) // solo no-base
              const units = getValues('units') ?? {}

              // 1) Quitar unidades que ya NO están seleccionadas
              const removed = prev.filter((u) => !selected.has(u))
              removed.forEach((k) => {
                // Solo si existía en units.* (y no es la base)
                if (units[k]) {
                  unregister(`units.${k}`)
                  clearErrors([`units.${k}`, 'units'])
                  // Borra del objeto units para evitar basura
                  const nextUnits = { ...(getValues('units') ?? {}) }
                  delete nextUnits[k]
                  setValue('units', nextUnits, { shouldDirty: true, shouldValidate: false })
                }
              })

              // 2) Si ahora solo queda la base seleccionada, deja units vacío
              if (expectedKeys.length === 0) {
                setValue('units', {}, { shouldDirty: true, shouldValidate: false })
                clearErrors('units')
                return
              }
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
                    trigger('min_sale')
                    setTimeout(() => setFocus('min_sale'), 0)
                  } else {
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
                isWheelDisabled
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
                    trigger('max_sale')
                    setTimeout(() => setFocus('max_sale'), 0)
                  } else {
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
                isWheelDisabled
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
      </section>
      <div className='grid grid-cols-2 gap-2'>
        <p className='text-sm text-danger pt-2'>{errors.min_sale?.type === 'custom' ? <>{errors.min_sale.message}</> : null}</p>
        <p className='text-sm text-danger pt-2'>{errors.max_sale?.type === 'custom' ? <>{errors.max_sale.message}</> : null}</p>
      </div>

      {selectedUnits.length > 1 && publicPrice != null && baseUnit && (
        <>
          <p className='text-medium text-foreground-500'>Ajuste por unidad</p>

          <section className='grid grid-cols-2 gap-2'>
            {selectedUnits
              .filter((u) => u.key !== baseUnit)
              .map((unit) => (
                <section key={unit.key} className='flex flex-col gap-2 p-2 border rounded border-foreground-200'>
                  <header className='flex flex-row gap-2 items-baseline'>
                    <p>{unit.label}</p>
                    {/* <p className='text-xs'>
                      ({publicPrice && baseUnit ? `$${money(publicPrice * ratioFrom(unit.key, baseUnit))} por ${unit.key}` : null})
                    </p> */}
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
                          label='Precio'
                          value={field.value ?? ''}
                          onFocus={() => setEditing(unit.key, 'price')}
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
                          isClearable
                          onClear={() => {
                            setValue(field.name, undefined, { shouldValidate: true, shouldDirty: true, shouldTouch: true })
                            setValue(`units.${unit.key}.margin`, undefined, { shouldValidate: true, shouldDirty: true, shouldTouch: true })
                          }}
                        />
                      )}
                    />
                  </div>
                </section>
              ))}
          </section>
        </>
      )}
    </form>
  )
}

export default ProductBulkForm
