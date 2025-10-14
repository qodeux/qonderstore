import { Modal, ModalBody, ModalContent } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence } from 'framer-motion'
import { useCallback, useEffect } from 'react'
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { Wizard } from 'react-use-wizard'
import {
  providerInputBankDataSchema,
  providerInputContactDataSchema,
  providerInputProductSelectionSchema,
  type ProviderInputBankData,
  type ProviderInputContactData,
  type ProviderInputProductSelection
} from '../../../schemas/providers.schema'
import { providerService } from '../../../services/providerService'
import { setPreviousStep } from '../../../store/slices/providersSlice'
import type { RootState } from '../../../store/store'
import AnimatedStep from '../../common/wizard/AnimatedStep'
import RowSteps from '../../common/wizard/RowSteps'
import WizardFooter from '../../common/wizard/WizardFooter'
import BankDataForm from '../../forms/admin/ProviderWizard/BankDataForm'
import Confirmation from '../../forms/admin/ProviderWizard/Confirmation'
import ContactDataForm from '../../forms/admin/ProviderWizard/ContactDataForm'
import ProductSelection from '../../forms/admin/ProviderWizard/ProductSelection'

type Props = {
  isOpen: boolean
  onOpenChange: () => void
}

type Step = {
  title: string
  content: React.FC<any> // permitirá pasar props al paso de Confirmación
  form?: UseFormReturn<any>
}

// ===== Tipo combinado para Confirmación =====
type ProviderCombinedData = {
  contactData: ProviderInputContactData
  bankData: ProviderInputBankData
  productSelection: ProviderInputProductSelection
}

const ProviderModal = ({ isOpen, onOpenChange }: Props) => {
  const { selectedProvider, previousStep } = useSelector((state: RootState) => state.providers)

  const currentStep = previousStep + 1

  const defaultValues: ProviderCombinedData = {
    contactData: {
      alias: selectedProvider?.alias || '',
      name: selectedProvider?.name || '',
      phone: selectedProvider?.phone || '',
      email: selectedProvider?.email || '',
      postal_code: selectedProvider?.postal_code || '',
      address: selectedProvider?.address || '',
      neighborhood: selectedProvider?.neighborhood || undefined
    },
    bankData: {
      bank: selectedProvider?.bank || '',
      account_type: selectedProvider?.account_type || 'clabe',
      account: selectedProvider?.account || '',
      holder_name: selectedProvider?.holder || '',
      rfc: selectedProvider?.rfc || ''
    },
    productSelection: {
      selected_products: selectedProvider?.selected_products || []
    }
  }

  // ===== 3 formularios (uno por paso) =====
  const contactDataForm = useForm<ProviderInputContactData>({
    resolver: zodResolver(providerInputContactDataSchema),
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange',
    defaultValues: defaultValues.contactData
  })

  const bankDataForm = useForm<ProviderInputBankData>({
    resolver: zodResolver(providerInputBankDataSchema),
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange',
    defaultValues: defaultValues.bankData
  })

  const productSelectionForm = useForm<ProviderInputProductSelection>({
    resolver: zodResolver(providerInputProductSelectionSchema),
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange',
    defaultValues: defaultValues.productSelection
  })

  // Resetea valores cuando abre/cierra o cambia selectedProvider
  useEffect(() => {
    contactDataForm.reset(defaultValues.contactData)
    bankDataForm.reset(defaultValues.bankData)
    productSelectionForm.reset(defaultValues.productSelection)
  }, [isOpen, selectedProvider])

  const getCombined = useCallback((): ProviderCombinedData => {
    const c = providerInputContactDataSchema.safeParse(contactDataForm.getValues())
    const b = providerInputBankDataSchema.safeParse(bankDataForm.getValues())
    const p = providerInputProductSelectionSchema.safeParse(productSelectionForm.getValues())

    const contactData = c.success ? c.data : contactDataForm.getValues()
    const bankData = b.success ? b.data : bankDataForm.getValues()
    const productSelection = p.success ? p.data : productSelectionForm.getValues()

    return { contactData, bankData, productSelection }
  }, [contactDataForm, bankDataForm, productSelectionForm])

  const WizardSteps: Step[] = [
    {
      title: 'Datos de contacto',
      content: ContactDataForm,
      form: contactDataForm
    },
    {
      title: 'Datos bancarios',
      content: BankDataForm,
      form: bankDataForm
    },
    {
      title: 'Selección de productos',
      content: ProductSelection,
      form: productSelectionForm
    },
    // En Confirmación pasamos los datos combinados como prop
    {
      title: 'Confirmar y guardar',
      content: Confirmation
    }
  ]

  const onConfirm = async () => {
    const { contactData, bankData, productSelection } = getCombined()
    // Si vas a enviar plano:
    // const payload = { ...contactData, ...bankData, ...productSelection }
    // Si quieres mantener la estructura de 3 bloques:
    const payload = { ...contactData, ...bankData, ...productSelection }
    console.log('Datos a enviar:', payload)

    const insertedProvider = await providerService.createProvider(payload)
    // await api.post('/providers', payload)

    console.log(insertedProvider)
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size={currentStep > 2 ? 'lg' : 'sm'}
      backdrop='blur'
      classNames={{ base: ' overflow-hidden pt-4 bg-gray-50' }}
    >
      <ModalContent>
        <ModalBody>
          <section className='flex flex-col items-center'>
            <RowSteps currentStep={previousStep} steps={WizardSteps} />
          </section>

          <Wizard
            footer={<WizardFooter getStepForm={(idx) => WizardSteps[idx]?.form} onConfirm={onConfirm} />}
            wrapper={<AnimatePresence initial={false} mode='wait' />}
          >
            {WizardSteps.map(({ content: StepContent, form }, index) => (
              <AnimatedStep key={index} rxStep={setPreviousStep}>
                {form ? (
                  <FormProvider {...form}>
                    <StepContent />
                  </FormProvider>
                ) : (
                  <StepContent data={getCombined()} />
                )}
              </AnimatedStep>
            ))}
          </Wizard>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default ProviderModal
