import { Modal, ModalBody, ModalContent } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import { Wizard } from 'react-use-wizard'
import { confirmPaymentSchema } from '../../../schemas/payments.schema'
import { storeOrderService } from '../../../services/storeOrderService'
import { requestJumpToStep, setWizardCurrentStep } from '../../../store/slices/uiSlice'
import { useAppSelector } from '../../../store/store'
import type { Step } from '../../../types/ui'
import AnimatedStep from '../../common/wizard/AnimatedStep'
import RowSteps from '../../common/wizard/RowSteps'
import WizardFooter from '../../common/wizard/WizardFooter'
import ConfirmPaymentForm from '../../forms/admin/ConfirmPaymentWizard/ConfirmPaymentForm'
import PaymentProof from '../../forms/admin/ConfirmPaymentWizard/PaymentProof'

type Props = {
  isOpen: boolean
  onOpenChange: () => void
}

const PaymentConfirmModal = ({ isOpen, onOpenChange }: Props) => {
  const confirmForm = useForm({
    resolver: zodResolver(confirmPaymentSchema)
  })
  const selectedOrder = useAppSelector((state) => state.storeOrders.selectedOrder)

  const dispatch = useDispatch()

  const WizardSteps: Step[] = [
    {
      title: 'Comprobante de pago',
      content: PaymentProof
    },
    {
      title: 'Confirmar pago',
      content: ConfirmPaymentForm,
      form: confirmForm
    }
  ]

  const onStepClick = (stepIndex: number) => {
    dispatch(requestJumpToStep(stepIndex))
  }

  const onConfirm = async () => {
    if (!selectedOrder) return

    const formData = confirmForm.getValues()

    const isValid = await confirmForm.trigger()
    if (!isValid) return

    const payload = {
      order_id: selectedOrder.id,
      status: 'credited',
      payment_proof: selectedOrder.payment_proof,
      confirm_proof: formData.confirm_proof![0],
      reference: formData.reference,
      amount: selectedOrder.order_total
    }

    console.log('Datos a enviar:', payload)

    try {
      await storeOrderService.upsertPayment(payload)
    } catch (error) {
      console.error('Error during payment confirmation:', error)
    }

    onOpenChange()
  }

  useEffect(() => {
    if (!isOpen) {
      confirmForm.reset()
      confirmForm.clearErrors()
    }
  }, [isOpen, confirmForm])

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size='xl'
      backdrop='blur'
      classNames={{
        base: ' overflow-hidden pt-4 bg-gray-50',
        closeButton:
          'focus:outline-none focus:ring-0 data-[focus-visible=true]:outline-none data-[focus-visible=true]:ring-0 cursor-pointer'
      }}
    >
      <ModalContent>
        <ModalBody>
          <Wizard
            header={<RowSteps onStepChange={onStepClick} steps={WizardSteps} allowAllSteps={true} />}
            footer={<WizardFooter getStepForm={(idx) => WizardSteps[idx]?.form} onConfirm={onConfirm} />}
            wrapper={<AnimatePresence initial={false} mode='wait' />}
          >
            {WizardSteps.map(({ content: StepContent, form }, index) => (
              <AnimatedStep key={index} rxStep={setWizardCurrentStep}>
                {form ? (
                  <FormProvider {...form}>
                    <StepContent />
                  </FormProvider>
                ) : (
                  <StepContent />
                )}
              </AnimatedStep>
            ))}
          </Wizard>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default PaymentConfirmModal
