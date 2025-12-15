import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { FAQSchema } from '../../../schemas/config.schema'
import { useAppSelector } from '../../../store/store'
import AdminFAQForm from '../../forms/admin/AdminFAQForm'

type Props = {
  isOpen: boolean
  onOpenChange: () => void
}

const AdminFAQModal = ({ isOpen, onOpenChange }: Props) => {
  const { isEditing } = useAppSelector((state) => state.ui)

  const adminFAQForm = useForm({
    resolver: zodResolver(FAQSchema),
    shouldUnregister: false
  })

  const {
    formState: { isDirty, errors }
  } = adminFAQForm

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size='sm' backdrop='blur'>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className='flex flex-col gap-1'>{isEditing ? 'Editar' : 'Agregar'} método de pago</ModalHeader>
            <ModalBody>
              <FormProvider {...adminFAQForm}>
                <AdminFAQForm />
              </FormProvider>
            </ModalBody>
            <ModalFooter>
              <Button color='danger' variant='light' onPress={onClose}>
                Cerrar
              </Button>

              <Button color='primary' variant='light' onPress={onClose}>
                Aceptar
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

export default AdminFAQModal
