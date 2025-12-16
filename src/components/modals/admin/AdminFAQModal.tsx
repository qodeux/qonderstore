import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { FAQSchema } from '../../../schemas/config.schema'
import { configService } from '../../../services/configService'
import { useAppSelector } from '../../../store/store'
import AdminFAQForm from '../../forms/admin/AdminFAQForm'

type Props = {
  isOpen: boolean
  onOpenChange: () => void
}

const AdminFAQModal = ({ isOpen, onOpenChange }: Props) => {
  const { isEditing } = useAppSelector((state) => state.ui)
  const { selectedFAQ: selectedFAQ } = useAppSelector((state) => state.config)

  const adminFAQForm = useForm({
    resolver: zodResolver(FAQSchema),
    shouldUnregister: false
  })

  const {
    formState: { isDirty, errors }
  } = adminFAQForm

  const handleSubmitPaymentMethod = async () => {
    const isValid = await adminFAQForm.trigger()
    if (!isValid) return
    let formData = adminFAQForm.getValues()
    let transaction

    console.log('Esta editando?', isEditing)
    console.log(selectedFAQ?.id)

    if (isEditing && selectedFAQ?.id) {
      formData = { ...formData, id: selectedFAQ.id }
      transaction = await configService.updateAdminFAQ(formData)
    } else {
      transaction = await configService.createAdminFAQ(formData)
    }
    if (transaction) {
      onOpenChange()
      adminFAQForm.reset()
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size='sm' backdrop='blur'>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className='flex flex-col gap-1'>{isEditing ? 'Editar' : 'Agregar'} pregunta frecuente</ModalHeader>
            <ModalBody>
              <FormProvider {...adminFAQForm}>
                <AdminFAQForm />
              </FormProvider>
            </ModalBody>
            <ModalFooter>
              <Button color='danger' variant='light' onPress={onClose}>
                Cerrar
              </Button>
              {(!isEditing || isDirty) && (
                <Button color='primary' variant='light' onPress={handleSubmitPaymentMethod} isDisabled={Object.keys(errors).length > 0}>
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

export default AdminFAQModal
