import { Checkbox, CheckboxGroup, DatePicker, Input, Radio, RadioGroup, Select, SelectItem, Switch } from '@heroui/react'
import { useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { discount_types, isDiscountType, promo_frequencies, promo_mode, promo_types, type DiscountType } from '../../../types/products'

const PromotionForm = () => {
  const {
    register,
    control,
    formState: { errors }
  } = useFormContext()

  const [discountType, setDiscountType] = useState<DiscountType | undefined>(undefined)

  const [isLimited, setIsLimited] = useState(false)

  const [isConditioned, setIsConditioned] = useState(false)

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
            isInvalid={!!errors.parent}
            errorMessage={errors.parent?.message as string}
            disallowEmptySelection
          >
            {promo_types.map((type) => (
              <SelectItem key={type.key}>{type.name}</SelectItem>
            ))}
          </Select>
        )}
      />
      {discountType}
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
            isInvalid={!!errors.parent}
            errorMessage={errors.parent?.message as string}
            disallowEmptySelection
          >
            {discount_types.map((type) => (
              <SelectItem key={type.key}>{type.name}</SelectItem>
            ))}
          </Select>
        )}
      />
      {discountType === 'season' && (
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
              isInvalid={!!errors.parent}
              errorMessage={errors.parent?.message as string}
              disallowEmptySelection
            >
              {promo_frequencies.map((type) => (
                <SelectItem key={type.key}>{type.name}</SelectItem>
              ))}
            </Select>
          )}
        />
      )}
      <Controller
        name='valid_until'
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
      <CheckboxGroup
        color='secondary'
        defaultValue={['buenos-aires', 'san-francisco']}
        label='Selecciona los dias'
        orientation='horizontal'
      >
        <Checkbox value='lun'>L</Checkbox>
        <Checkbox value='mar'>M</Checkbox>
        <Checkbox value='mie'>M</Checkbox>
        <Checkbox value='jue'>J</Checkbox>
        <Checkbox value='vie'>V</Checkbox>
        <Checkbox value='sab'>S</Checkbox>
        <Checkbox value='dom'>D</Checkbox>
      </CheckboxGroup>

      <Controller
        name='valid_until'
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

      {discountType === 'code' && (
        <Input
          label='Código'
          type='text'
          size='sm'
          isInvalid={!!errors.name}
          errorMessage={errors.name?.message as string}
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
            isInvalid={!!errors.parent}
            errorMessage={errors.parent?.message as string}
            disallowEmptySelection
          >
            {promo_mode.map((type) => (
              <SelectItem key={type.key}>{type.name}</SelectItem>
            ))}
          </Select>
        )}
      />
      <Input
        label='Valor'
        type='text'
        size='sm'
        isInvalid={!!errors.name}
        errorMessage={errors.name?.message as string}
        {...register('name')}
      />
      <Controller
        name='valid_until'
        control={control}
        rules={{ required: 'La fecha es obligatoria' }}
        render={({ field }) => (
          <div className='flex flex-col items-start'>
            <DatePicker
              {...field}
              label='Vigencia'
              size='sm'
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
          <RadioGroup orientation='horizontal' size='sm'>
            <Radio value='user'>Por usuario</Radio>
            <Radio value='global'>Global</Radio>
          </RadioGroup>
          <Input
            label='Total'
            type='text'
            size='sm'
            isInvalid={!!errors.name}
            errorMessage={errors.name?.message as string}
            {...register('name')}
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
          <RadioGroup orientation='horizontal' size='sm'>
            <Radio value='min_sale'>Compra mínima</Radio>
            <Radio value='quantity'>Cantidad</Radio>
          </RadioGroup>
          <Input
            label='Cantidad'
            type='text'
            size='sm'
            isInvalid={!!errors.name}
            errorMessage={errors.name?.message as string}
            {...register('name')}
          />
        </>
      )}
    </form>
  )
}

export default PromotionForm
