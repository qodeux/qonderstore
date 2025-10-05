import { Button, Input, NumberInput, Select, SelectItem, Switch } from '@heroui/react'
import { useEffect, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { NumericFormat } from 'react-number-format'

export type WholeSalePrice = {
  min: number | undefined
  price: number | undefined
}

const ProductUnitForm = () => {
  const [wholeSaleSwitch, setWholeSaleSwitch] = useState<boolean>(false)
  const [wholeSalePrices, setWholeSalePrices] = useState<Array<WholeSalePrice>>([])

  const {
    control,
    trigger,
    clearErrors,
    setFocus,
    setValue,
    watch,
    formState: { errors }
  } = useFormContext()

  const lowStockSwitch = watch('lowStockSwitch')
  const minSaleSwitch = watch('minSaleSwitch')
  const maxSaleSwitch = watch('maxSaleSwitch')

  useEffect(() => {
    if (lowStockSwitch) {
      // pequeño defer para asegurar que el input esté montado/habilitado
      const id = setTimeout(() => setFocus('low_stock'), 0)
      return () => clearTimeout(id)
    } else {
      // si se desactiva, limpia errores del campo
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

  return (
    <form className='space-y-2' name='product-unit-form'>
      <Controller
        name='sale_unit'
        control={control}
        render={({ field }) => (
          <Select
            label='Unidad de venta'
            size='sm'
            selectedKeys={field.value ? [String(field.value)] : []}
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0]
              field.onChange(value)
            }}
            isInvalid={!!errors.sale_unit}
            errorMessage={errors.sale_unit?.message as string}
            disallowEmptySelection
          >
            <SelectItem key='pz'>Pieza</SelectItem>
            <SelectItem key='pk'>Paquete</SelectItem>
            <SelectItem key='box'>Caja</SelectItem>
          </Select>
        )}
      />
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

      <div className='flex flex-row gap-2'>
        <Controller
          name='base_cost'
          control={control}
          render={({ field, fieldState }) => (
            <NumericFormat
              // 1) Controlado por RHF: si no hay valor, muestra vacío
              value={field.value ?? ''}
              // 2) Siempre manda undefined cuando está vacío
              onValueChange={(v) => {
                const num = v.floatValue === undefined ? undefined : v.floatValue
                setValue('base_cost', num, {
                  shouldValidate: true,
                  shouldDirty: true,
                  shouldTouch: true
                })
              }}
              thousandSeparator
              decimalScale={2}
              fixedDecimalScale
              allowNegative={false}
              prefix='$ '
              inputMode='decimal'
              customInput={Input}
              label='Costo base'
              size='sm'
              isInvalid={!!fieldState.error}
              errorMessage={fieldState.error?.message}
              isClearable
              onClear={() => {
                setValue('base_cost', undefined, {
                  shouldValidate: true,
                  shouldDirty: true,
                  shouldTouch: true
                })
                // opcional: clearErrors('base_cost')
              }}
            />
          )}
        />

        <Controller
          name='public_price'
          control={control}
          render={({ field, fieldState }) => (
            <NumericFormat
              // 1) Controlado por RHF: si no hay valor, muestra vacío
              value={field.value ?? ''}
              // 2) Siempre manda undefined cuando está vacío
              onValueChange={(v) => {
                const num = v.floatValue === undefined ? undefined : v.floatValue
                setValue('public_price', num, {
                  shouldValidate: true,
                  shouldDirty: true,
                  shouldTouch: true
                })
              }}
              thousandSeparator
              decimalScale={2}
              fixedDecimalScale
              allowNegative={false}
              prefix='$ '
              inputMode='decimal'
              customInput={Input}
              label='Precio público'
              size='sm'
              isInvalid={!!fieldState.error}
              errorMessage={fieldState.error?.message}
              isClearable
              onClear={() => {
                setValue('public_price', undefined, {
                  shouldValidate: true,
                  shouldDirty: true,
                  shouldTouch: true
                })
                // opcional: clearErrors('public_price')
              }}
            />
          )}
        />
      </div>

      <section>
        <div className='flex flex-row justify-between'>
          <Switch
            aria-label='Compra máxima'
            size='sm'
            defaultSelected={wholeSaleSwitch}
            onChange={(e) => {
              setWholeSaleSwitch(e.target.checked)
              if (!e.target.checked) setWholeSalePrices([{ min: undefined, price: undefined }]) // reset
            }}
          >
            Mayoreo
          </Switch>
          {wholeSaleSwitch && <Button>Agregar precio</Button>}
        </div>
        {wholeSaleSwitch && (
          <div className='mt-2 p-2 border border-gray-200 rounded bg-gray-50'>
            {wholeSalePrices.length > 1 &&
              wholeSalePrices.map((wp, index) => (
                <div className='flex flex-row gap-2' key={index}>
                  <Input label='Mínimo' type='text' size='sm' value={String(wp.min)} />
                  <Input label='Precio' type='text' size='sm' value={String(wp.price)} />
                </div>
              ))}
          </div>
        )}
      </section>
    </form>
  )
}

export default ProductUnitForm
