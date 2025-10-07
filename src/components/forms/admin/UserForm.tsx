import { Input } from '@heroui/react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { useSelector } from 'react-redux'
import type { RootState } from '../../../store/store'

const colorsOptions = [
  { label: 'Rojo', key: 'red' },
  { label: 'Azul', key: 'blue' },
  { label: 'Verde', key: 'green' },
  { label: 'Amarillo', key: 'yellow' },
  { label: 'Negro', key: 'black' }
]

const UserForm = () => {
  const categories = useSelector((state: RootState) => state.categories.categories) ?? []
  //const editMode = useSelector((state: RootState) => state.categories.editMode)

  const {
    control,
    formState: { errors }
  } = useFormContext()

  const categoryName = useWatch({ control, name: 'name' })
  //const categorySelected = categories.find((cat) => cat.name === categoryName)
  //const hasChildren = categorySelected ? categories.some((cat) => cat.parent === categorySelected.id) : false

  return (
    <form className='space-y-2'>
      <Controller
        name='name'
        control={control}
        render={({ field }) => (
          <Input label='Nombre' type='text' size='sm' isInvalid={!!errors.name} errorMessage={errors.name?.message as string} {...field} />
        )}
      />
    </form>
  )
}

export default UserForm
