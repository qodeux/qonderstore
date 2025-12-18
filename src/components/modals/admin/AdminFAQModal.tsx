import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
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
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange',

    defaultValues: {
      question: '',
      answer: '',
      order: undefined,
      type: ''
    }
  })

  const {
    formState: { isDirty, errors }
  } = adminFAQForm

  const buildFormValues = () => {
    if (isEditing) {
      return {
        question: selectedFAQ?.question ?? '',
        answer: selectedFAQ?.answer ?? '',
        order: selectedFAQ?.order ?? undefined,
        type: selectedFAQ?.type ?? ''
      }
    } else {
      return {
        question: '',
        answer: '',
        order: undefined,
        type: ''
      }
    }
  }

  const handleSubmitAdminFAQ = async () => {
    console.log('handle submit ')

    const isValid = await adminFAQForm.trigger()
    console.log(adminFAQForm.formState.errors)
    console.log(isValid)
    if (!isValid) return

    let formData = adminFAQForm.getValues()
    let transaction

    console.log('Esta editando?', isEditing)
    console.log(selectedFAQ?.id)

    if (isEditing && selectedFAQ?.id) {
      console.log('create_update')
      formData = { ...formData, id: selectedFAQ.id }
      transaction = await configService.updateAdminFAQ(formData)
    } else {
      console.log('create_new')
      transaction = await configService.createAdminFAQ(formData)
    }
    if (transaction) {
      console.log('onop')
      onOpenChange()
      adminFAQForm.reset()
    }
  }

  useEffect(() => {
    if (isOpen) {
    }
    adminFAQForm.reset(buildFormValues())
  }, [isOpen, selectedFAQ, adminFAQForm])

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
                <Button color='primary' variant='light' onPress={handleSubmitAdminFAQ} isDisabled={Object.keys(errors).length > 0}>
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
