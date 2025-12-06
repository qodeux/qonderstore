import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { inputPaymentMethodSchema } from '../../../schemas/config.schema'
import { configService } from '../../../services/configService'
import { useAppSelector } from '../../../store/store'
import PaymentMethodsForm from '../../forms/admin/PaymentMethodsForm'

type Props = {
  isOpen: boolean
  onOpenChange: () => void
}

const PaymentMethodsModal = ({ isOpen, onOpenChange }: Props) => {
  const { isEditing } = useAppSelector((state) => state.ui)
  const { selectedPaymentMethod: selectedPaymentMethod } = useAppSelector((state) => state.config)

  const paymentMethodForm = useForm({
    resolver: zodResolver(inputPaymentMethodSchema),
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange',

    defaultValues: {
      type: '',
      bank: undefined,
      account: '',
      holder_name: ''
    }
  })

  const {
    formState: { isDirty, errors }
  } = paymentMethodForm

  const buildFormValues = () => {
    if (isEditing) {
      return {
        type: selectedPaymentMethod?.type ?? '',
        bank: selectedPaymentMethod?.bank ?? undefined,
        account: selectedPaymentMethod?.account ?? '',
        holder_name: selectedPaymentMethod?.holder_name ?? ''
      }
    } else {
      return {
        type: '',
        bank: undefined,
        account: '',
        holder_name: ''
      }
    }
  }

  const handleSubmitPaymentMethod = async () => {
    const isValid = await paymentMethodForm.trigger()
    if (!isValid) return
    let formData = paymentMethodForm.getValues()
    let transaction

    console.log('Esta editando?', isEditing)
    console.log(selectedPaymentMethod?.id)

    if (isEditing && selectedPaymentMethod?.id) {
      formData = { ...formData, id: selectedPaymentMethod.id }
      transaction = await configService.updatePaymentMethod(formData)
    } else {
      transaction = await configService.createPaymentMethod(formData)
    }

    if (transaction) {
      onOpenChange()
      paymentMethodForm.reset()
    }
  }

  useEffect(() => {
    if (isOpen) {
      // Al abrir, setea valores actuales
      paymentMethodForm.reset(buildFormValues())
    }
  }, [isOpen, selectedPaymentMethod, paymentMethodForm]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size='sm' backdrop='blur'>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className='flex flex-col gap-1'>{isEditing ? 'Editar' : 'Agregar'} método de pago</ModalHeader>
            <ModalBody>
              <FormProvider {...paymentMethodForm}>
                <PaymentMethodsForm />
              </FormProvider>
            </ModalBody>
            <ModalFooter>
              <Button color='danger' variant='light' onPress={onClose}>
                Cerrar
              </Button>
              {(!isEditing || isDirty) && (
                <Button color='primary' onPress={handleSubmitPaymentMethod} isDisabled={Object.keys(errors).length > 0}>
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

export default PaymentMethodsModal
