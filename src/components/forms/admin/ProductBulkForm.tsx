import { Checkbox, CheckboxGroup, Input, Radio, RadioGroup, Select, SelectItem, Switch } from '@heroui/react'

const ProductBulkForm = () => {
  return (
    <form className='space-y-2'>
      <CheckboxGroup color='secondary' label='Unidades de venta disponibles' orientation='horizontal'>
        <Checkbox value='gr'>Gramos</Checkbox>
        <Checkbox value='oz'>Onzas</Checkbox>
        <Checkbox value='lb'>Libras</Checkbox>
      </CheckboxGroup>
      <div className='flex flex-row gap-2'>
        <Select label='Unidad base' size='sm'>
          <SelectItem key='gr'>Gramo</SelectItem>
          <SelectItem key='oz'>Onza</SelectItem>
          <SelectItem key='lb'>Libra</SelectItem>
        </Select>
        <Input label='Precio' type='text' size='sm' />
      </div>
      <RadioGroup label='Ajuste por unidad' orientation='horizontal'>
        <Radio value='gr'>
          Gramo
          <Input type='text' size='sm' label='Factor' />
        </Radio>
        <Radio value='oz'>
          Onza
          <Input type='text' size='sm' label='Factor' />
        </Radio>
        <Radio value='lb'>
          Libra
          <Input type='text' size='sm' label='Factor' />
        </Radio>
      </RadioGroup>

      <section className='flex flex-row justify-between'>
        <div className='flex flex-row justify-between'>
          <Switch aria-label='Compra mínima' size='sm'>
            Mínimo
          </Switch>
          <Input type='text' size='sm' maxLength={3} className='max-w-12 text-center' />
        </div>
        <div className='flex flex-row justify-between'>
          <Switch aria-label='Compra máxima' size='sm'>
            Máximo
          </Switch>
          <Input type='text' size='sm' maxLength={3} className='max-w-12 text-center' />
        </div>
      </section>

      <table className='w-full text-left'>
        <thead>
          <tr>
            <th>Unidad</th>
            <th>Margen</th>
            <th>Precio</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Gramo</td>
            <td>5%</td>
            <td>$10.00</td>
          </tr>
        </tbody>
      </table>
    </form>
  )
}

export default ProductBulkForm
