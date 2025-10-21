import { Modal, ModalBody, ModalContent, ModalHeader } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { Wizard } from 'react-use-wizard'
import { providerInputProductSelectionSchema } from '../../../schemas/providers.schema'
import { providerService } from '../../../services/providerService'
import { requestJumpToStep, setWizardCurrentStep } from '../../../store/slices/uiSlice'
import type { RootState } from '../../../store/store'
import type { FormDataType, OrderItem, SupplyOrderInputCreate } from '../../../types/providers'
import type { Step } from '../../../types/ui'
import AnimatedStep from '../../common/wizard/AnimatedStep'
import RowSteps from '../../common/wizard/RowSteps'
import WizardFooter from '../../common/wizard/WizardFooter'
import OrderProductItems from '../../forms/admin/ProviderOrderNewWizard/OrderProductItems'
import OrderProductSelection from '../../forms/admin/ProviderOrderNewWizard/OrderProductSelection'

type Props = {
  isOpen: boolean
  onOpenChange: () => void
}

const ProviderOrderNewModal = ({ isOpen, onOpenChange }: Props) => {
  const { wizardCurrentIndex } = useSelector((state: RootState) => state.ui)
  const { selectedProvider } = useSelector((state: RootState) => state.providers)

  const dispatch = useDispatch()
  const selectedProducts = useForm({
    resolver: zodResolver(providerInputProductSelectionSchema),
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange',
    defaultValues: {
      selected_products: []
    }
  })
  const orderItems = useForm({
    //resolver: zodResolver(categoryInputSchema),
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange'
  })

  const WizardSteps: Step[] = [
    {
      title: 'Selección de productos',
      content: OrderProductSelection,
      form: selectedProducts
    },
    {
      title: 'Cantidades solicitadas',
      content: OrderProductItems,
      form: orderItems
    }
  ]

  const onStepClick = (stepIndex: number) => {
    if (stepIndex < wizardCurrentIndex) {
      dispatch(requestJumpToStep(stepIndex))
    }
  }

  const onConfirm = async () => {
    const isValid = await orderItems.trigger()
    if (!isValid) {
      console.error('Errores en el formulario:', orderItems.formState.errors)
      return
    }

    const products = orderItems.getValues() as FormDataType

    // 1) Si no hay items, que sea objeto vacío
    // 2) Limpia qty (quita símbolos) y convierte a número
    const items: OrderItem[] = Object.entries(products.items ?? {})
      .map(([key, value]) => {
        const id = Number(key.replace('p_', ''))
        const raw = value?.qty ?? '' // puede venir undefined
        const cleaned = raw.replace(/[^\d.-]/g, '') // quita "¨", espacios, etc.
        const qty = cleaned === '' ? NaN : Number(cleaned)
        return { id, qty }
      })
      // Opciones de filtrado según tu necesidad:
      // a) Sólo los que tienen cantidad válida y > 0:
      .filter(({ qty }) => Number.isFinite(qty) && qty > 0)
    // b) Si los quieres incluir con 0 en lugar de filtrarlos,
    //    quita el .filter() y cambia arriba:
    //    const qty = Number(cleaned) || 0

    if (!selectedProvider) {
      console.error('No hay proveedor seleccionado')
      return
    }

    const payload: SupplyOrderInputCreate = { provider_id: selectedProvider.id, provider_name: selectedProvider.name, items }

    const transaction = await providerService.createOrder(payload)

    if (transaction?.error) {
      console.error(transaction)
      return
    }

    onOpenChange()
  }

  useEffect(() => {
    selectedProducts.reset({ selected_products: [] })
    orderItems.reset()
  }, [isOpen, selectedProvider, selectedProducts, orderItems, dispatch])

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size='lg'
      backdrop='blur'
      isDismissable={false}
      classNames={{
        base: ' overflow-hidden pt-4 bg-gray-50',
        closeButton:
          'focus:outline-none focus:ring-0 data-[focus-visible=true]:outline-none data-[focus-visible=true]:ring-0 cursor-pointer'
      }}
    >
      <ModalContent>
        <ModalBody>
          <ModalHeader className='flex flex-col gap-1 px-0'>Nuevo pedido para: {selectedProvider?.name}</ModalHeader>

          <Wizard
            header={<RowSteps currentStep={wizardCurrentIndex} onStepChange={onStepClick} steps={WizardSteps} />}
            footer={<WizardFooter getStepForm={(idx) => WizardSteps[idx]?.form} onConfirm={onConfirm} />}
            wrapper={<AnimatePresence initial={false} mode='wait' />}
          >
            {WizardSteps.map(({ content: StepContent, form }, index) => (
              <AnimatedStep key={index} rxStep={setWizardCurrentStep}>
                {form ? (
                  <FormProvider {...form}>
                    <StepContent data={StepContent === OrderProductItems ? selectedProducts.getValues() : undefined} />
                  </FormProvider>
                ) : (
                  <StepContent data={orderItems.getValues()} />
                )}
              </AnimatedStep>
            ))}
          </Wizard>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default ProviderOrderNewModal
