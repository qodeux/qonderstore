import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { paymentMethodSchema } from '../../../schemas/config.schema'
import { configService } from '../../../services/configService'
import { useAppSelector } from '../../../store/store'
import PaymentMethodsForm from '../../forms/admin/PaymentMethodsForm'

type Props = {
  isOpen: boolean
  onOpenChange: () => void
}

const PaymentMethodsModal = ({ isOpen, onOpenChange }: Props) => {
  const { isEditing } = useAppSelector((state) => state.config)
  const { selectedPaymentMethod: selectedPaymentMethod } = useAppSelector((state) => state.config)

  const paymentMethodForm = useForm({
    resolver: zodResolver(paymentMethodSchema),
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
        type: selectedPaymentMethod?.data.type ?? '',
        banck: selectedPaymentMethod?.data.bank ?? undefined,
        account: selectedPaymentMethod?.data.account ?? '',
        holder_name: selectedPaymentMethod?.data.holder_name ?? ''
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

    if (isEditing && selectedPaymentMethod?.id) {
      formData = { ...formData, id: selectedPaymentMethod.id }
      transaction = await configService.createPaymentMethod(formData)
    } else {
      transaction = await configService.updatePaymentMethod(formData)
    }

    if (!transaction.error && transaction) {
      onOpenChange()
      paymentMethodForm.reset()
    } else {
      console.error('Error al guardar método de pago')
      console.error(transaction.error)

      if (transaction.error.code === '23505') {
        // Manejo de error: clave duplicada
        const details = transaction.error?.details ?? ''
        if (details.includes('Key (name)')) {
          paymentMethodForm.setError('name', { message: 'El nombre ya existe' })
        } else if (details.includes('Key (slug)')) {
          paymentMethodForm.setError('slug', { message: 'El slug ya existe' })
        } else {
          console.error('Error desconocido:', details)
        }
      }
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
