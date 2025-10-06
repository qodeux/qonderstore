import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { categoryInputSchema } from '../../../schemas/category.schema'
import { categoryService } from '../../../services/categoryService'
import type { RootState } from '../../../store/store'
import CategoryForm from '../../forms/admin/CategoryForm'

type Props = {
  isOpen: boolean
  onOpenChange: () => void
}

const CategoryModal = ({ isOpen, onOpenChange }: Props) => {
  const editMode = useSelector((state: RootState) => state.categories.editMode)
  const selectedCategory = useSelector((state: RootState) => state.categories.selectedCategory)

  const categoryForm = useForm({
    resolver: zodResolver(categoryInputSchema),
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

  const {
    formState: { isDirty }
  } = categoryForm

  const buildFormValues = () => ({
    name: selectedCategory?.name ?? '',
    slug_id: selectedCategory?.slug_id ?? '',
    parent: selectedCategory?.parent ?? undefined,
    color: selectedCategory?.color ?? undefined
  })

  const handleSubmitCategory = async () => {
    const isValid = await categoryForm.trigger()
    if (!isValid) return
    let formData = categoryForm.getValues()
    let categorySuccess

    if (editMode && selectedCategory?.id) {
      formData = { ...formData, id: selectedCategory.id }
      categorySuccess = await categoryService.updateCategory(formData)
    } else {
      categorySuccess = await categoryService.createCategory(formData)
    }

    if (!categorySuccess.error && categorySuccess) {
      console.log('Categoría OK:', categorySuccess)

      onOpenChange() // Cierra el modal
      categoryForm.reset() // Resetea el formulario
    } else {
      console.error('Error al guardar categoría')
      console.error(categorySuccess.error)

      if (categorySuccess.error.code === '23505') {
        // Manejo de error: clave duplicada

        const details = categorySuccess.error?.details ?? ''

        if (details.includes('Key (name)')) {
          categoryForm.setError('name', { message: 'El nombre ya existe' })
        } else if (details.includes('Key (slug_id)')) {
          categoryForm.setError('slug_id', { message: 'La clave ya existe' })
        } else {
          console.error('Error desconocido:', details)
        }

        console.error('Error: La categoría ya existe')
        categoryForm.setError('slug_id', { message: 'La clave ya existe' })
      }
    }
  }

  useEffect(() => {
    if (isOpen) {
      // Al abrir, setea valores actuales
      categoryForm.reset(buildFormValues())
    } else {
      // Al cerrar, limpia
      categoryForm.reset({
        name: '',
        slug_id: '',
        parent: undefined,
        color: undefined
      })
    }
  }, [isOpen, selectedCategory, categoryForm]) // eslint-disable-line react-hooks/exhaustive-deps

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
              {(!editMode || isDirty) && (
                <Button color='primary' onPress={handleSubmitCategory}>
                  Aceptar
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

export default CategoryModal
