import { Button, Input, NumberInput, Select, SelectItem, Switch } from '@heroui/react'
import { useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

const ProductUnitForm = () => {
  const [lowStockSwitch, setLowStockSwitch] = useState<boolean>(false)
  const [minSaleSwitch, setMinSaleSwitch] = useState<boolean>(false)
  const [maxSaleSwitch, setMaxSaleSwitch] = useState<boolean>(false)
  const {
    register,
    control,
    formState: { errors }
  } = useFormContext()
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
      <div className='flex flex-row justify-between'>
        <Switch
          aria-label='Alerta de stock bajo'
          size='sm'
          isSelected={lowStockSwitch}
          onChange={(e) => setLowStockSwitch(e.target.checked)}
        >
          Alerta de stock bajo
        </Switch>

        <NumberInput
          isDisabled={!lowStockSwitch}
          size='sm'
          className='max-w-20 text-center'
          maxValue={999}
          minValue={1}
          // {...register('lowStockAlert')}
        />
      </div>
      <div className='flex flex-row justify-between'>
        <Switch aria-label='Compra mínima' size='sm' isSelected={minSaleSwitch} onChange={(e) => setMinSaleSwitch(e.target.checked)}>
          Mínimo de compra
        </Switch>

        <NumberInput size='sm' className='max-w-20 text-center' isDisabled={!minSaleSwitch} maxValue={999} minValue={1} />
      </div>
      <div className='flex flex-row justify-between'>
        <Switch aria-label='Compra máxima' size='sm' isSelected={maxSaleSwitch} onChange={(e) => setMaxSaleSwitch(e.target.checked)}>
          Máximo por transacción
        </Switch>
        <NumberInput size='sm' className='max-  w-20 text-center' isDisabled={!maxSaleSwitch} maxValue={999} minValue={1} />
      </div>

      <div className='flex flex-row gap-2'>
        <Input
          label='Costo base'
          type='number'
          size='sm'
          {...register('base_cost')}
          errorMessage={errors.base_cost?.message as string}
          isInvalid={!!errors.base_cost}
        />
        <Input
          label='Precio'
          type='number'
          size='sm'
          {...register('public_price')}
          errorMessage={errors.public_price?.message as string}
          isInvalid={!!errors.public_price}
        />
      </div>

      <section>
        <div className='flex flex-row justify-between'>
          <Switch aria-label='Compra máxima' size='sm'>
            Mayoreo
          </Switch>
          <Button>Agregar precio</Button>
        </div>
        <div>
          <div className='flex flex-row gap-2'>
            <Input label='Mínimo' type='text' size='sm' />
            <Input label='Precio' type='text' size='sm' />
          </div>
        </div>
      </section>
    </form>
  )
}

export default ProductUnitForm
