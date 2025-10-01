import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { categorySchema } from '../../../schemas/category.schema'
import { categoryService } from '../../../services/categoryService'
import type { RootState } from '../../../store/store'
import CategoryForm from '../../forms/admin/CategoryForm'

type Props = {
  isOpen: boolean
  onOpenChange: () => void
  fetchData: () => void
}

const CategoryModal = ({ isOpen, onOpenChange, fetchData }: Props) => {
  const editMode = useSelector((state: RootState) => state.categories.editMode)
  const categoryForm = useForm({
    resolver: zodResolver(categorySchema),
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      slug_id: '',
      parent: undefined,
      color: undefined
    }
  })
  const handleAddCategory = async () => {
    const isValid = await categoryForm.trigger()
    if (!isValid) return
    const formData = categoryForm.getValues()
    console.log(formData)
    // Lógica para enviar los datos al servidor
    const categoryCreated = await categoryService.createCategory(formData)
    console.log('Categoría creada:', categoryCreated)
    if (categoryCreated) {
      onOpenChange() // Cierra el modal
      fetchData() // Refresca los datos en la tabla principal
      categoryForm.reset() // Resetea el formulario}
    }
  }
  useEffect(() => {
    if (!isOpen) {
      categoryForm.reset() // Resetea el formulario cuando se cierra el modal
      // fetchData() // Refresca los datos en la tabla principal
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size='sm' backdrop='blur'>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className='flex flex-col gap-1'>{editMode ? 'Editar' : 'Agregar'} categoría</ModalHeader>
            <ModalBody>
              <FormProvider {...categoryForm}>
                <CategoryForm />
              </FormProvider>
            </ModalBody>
            <ModalFooter>
              <Button color='danger' variant='light' onPress={onClose}>
                Cerrar
              </Button>
              <Button color='primary' onPress={handleAddCategory}>
                Aceptar
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

export default CategoryModal
