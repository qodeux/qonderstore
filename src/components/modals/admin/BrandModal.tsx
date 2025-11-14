import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { brandInputSchema } from '../../../schemas/brand.schema'
import { productService } from '../../../services/productService'
import { useAppSelector } from '../../../store/store'
import BrandForm from '../../forms/admin/BrandForm'

type Props = {
  isOpen: boolean
  onOpenChange: () => void
}

const BrandModal = ({ isOpen, onOpenChange }: Props) => {
  const { isEditing } = useAppSelector((state) => state.ui)
  const { selectedBrand } = useAppSelector((state) => state.products)

  const brandForm = useForm({
    resolver: zodResolver(brandInputSchema),
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange',

    defaultValues: {
      name: '',
      slug: '',
      color: undefined
    }
  })

  const {
    formState: { isDirty, errors }
  } = brandForm

  const buildFormValues = () => {
    if (isEditing) {
      return {
        name: selectedBrand?.name ?? '',
        color: selectedBrand?.color ?? null,
        slug: selectedBrand?.slug ?? ''
      }
    } else {
      return {
        name: '',
        color: null,
        slug: ''
      }
    }
  }

  const handleSubmitBrand = async () => {
    const isValid = await brandForm.trigger()
    if (!isValid) return
    let formData = brandForm.getValues()
    let transaction

    if (isEditing && selectedBrand?.id) {
      formData = { ...formData, id: selectedBrand.id }
      transaction = await productService.updateBrand(formData)
    } else {
      transaction = await productService.createBrand(formData)
    }

    if (!transaction.error && transaction) {
      onOpenChange()
      brandForm.reset()
    } else {
      console.error('Error al guardar categoría')
      console.error(transaction.error)

      if (transaction.error.code === '23505') {
        // Manejo de error: clave duplicada
        const details = transaction.error?.details ?? ''
        if (details.includes('Key (name)')) {
          brandForm.setError('name', { message: 'El nombre ya existe' })
        } else if (details.includes('Key (slug)')) {
          brandForm.setError('slug', { message: 'El slug ya existe' })
        } else {
          console.error('Error desconocido:', details)
        }
      }
    }
  }

  useEffect(() => {
    if (isOpen) {
      // Al abrir, setea valores actuales
      brandForm.reset(buildFormValues())
    }
  }, [isOpen, selectedBrand, brandForm]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size='sm' backdrop='blur'>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className='flex flex-col gap-1'>{isEditing ? 'Editar' : 'Agregar'} categoría</ModalHeader>
            <ModalBody>
              <FormProvider {...brandForm}>
                <BrandForm />
              </FormProvider>
            </ModalBody>
            <ModalFooter>
              <Button color='danger' variant='light' onPress={onClose}>
                Cerrar
              </Button>
              {(!isEditing || isDirty) && (
                <Button color='primary' onPress={handleSubmitBrand} isDisabled={Object.keys(errors).length > 0}>
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

export default BrandModal
