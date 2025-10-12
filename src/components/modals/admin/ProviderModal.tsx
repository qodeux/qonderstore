import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { providerInputSchema } from '../../../schemas/providers.schema'
import { providerService } from '../../../services/providerService'
import type { RootState } from '../../../store/store'
import ProviderForm from '../../forms/admin/ProviderForm'

type Props = {
  isOpen: boolean
  onOpenChange: () => void
}

const ProviderModal = ({ isOpen, onOpenChange }: Props) => {
  const editMode = useSelector((state: RootState) => state.providers.editMode)
  const selectedProvider = useSelector((state: RootState) => state.providers.selectedProvider)

  const providerForm = useForm({
    resolver: zodResolver(providerInputSchema),
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange'
  })

  const {
    formState: { isDirty, errors }
  } = providerForm

  const handleSubmitProvider = async () => {
    const isValid = await providerForm.trigger()
    if (!isValid) return
    let formData = providerForm.getValues()
    let providerSuccess

    if (editMode && selectedProvider?.id) {
      formData = { ...formData, id: selectedProvider.id }
      providerSuccess = await providerService.updateProvider(formData)
    } else {
      providerSuccess = await providerService.createProvider(formData)
    }

    if (!providerSuccess.error && providerSuccess) {
      console.log('Categoría OK:', providerSuccess)

      onOpenChange()
      providerForm.reset()
    } else {
      console.error('Error al guardar categoría')
      console.error(providerSuccess.error)

      if (providerSuccess.error.code === '23505') {
        // Manejo de error: clave duplicada
        const details = providerSuccess.error?.details ?? ''

        if (details.includes('Key (alias)')) {
          providerForm.setError('alias', { message: 'El alias ya existe' })
          console.error('Error: El alias ya existe')
        } else {
          console.error('Error desconocido:', details)
        }
      }
    }
  }

  useEffect(() => {
    if (isOpen) {
      // Al abrir, setea valores actuales
      providerForm.reset({
        alias: selectedProvider?.alias ?? '',
        name: selectedProvider?.name ?? '',
        phone: selectedProvider?.phone ?? '',
        email: selectedProvider?.email ?? '',
        postal_code: selectedProvider?.postal_code ?? '',
        address: selectedProvider?.address ?? ''
      })
    } else {
      // Al cerrar, limpia
      providerForm.reset({
        alias: '',
        name: '',
        phone: '',
        email: '',
        postal_code: '',
        address: ''
      })
    }
  }, [isOpen, selectedProvider, providerForm])

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size='sm' backdrop='blur'>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className='flex flex-col gap-1'>{editMode ? 'Editar' : 'Agregar'} proveedor</ModalHeader>
            <ModalBody>
              <FormProvider {...providerForm}>
                <ProviderForm />
              </FormProvider>
            </ModalBody>
            <ModalFooter>
              <Button color='danger' variant='light' onPress={onClose}>
                Cerrar
              </Button>
              {(!editMode || isDirty) && (
                <Button color='primary' onPress={handleSubmitProvider} isDisabled={Object.keys(errors).length > 0}>
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

export default ProviderModal
