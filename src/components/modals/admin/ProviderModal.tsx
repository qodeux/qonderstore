import { Modal, ModalBody, ModalContent } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { Wizard } from 'react-use-wizard'
import { providerInputSchema } from '../../../schemas/providers.schema'
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

const ProviderModal = ({ isOpen, onOpenChange }: Props) => {
  const editMode = useSelector((state: RootState) => state.providers.editMode)
  const { selectedProvider, previousStep } = useSelector((state: RootState) => state.providers)

  const currentStep = previousStep + 1

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
            <RowSteps
              currentStep={previousStep}
              steps={[
                {
                  title: 'Datos de contacto'
                },
                {
                  title: 'Datos bancarios'
                },
                {
                  title: 'Selección de productos'
                },
                {
                  title: 'Confirmar y guardar'
                }
              ]}
            />
          </section>
          <Wizard footer={<WizardFooter />} wrapper={<AnimatePresence initial={false} mode='wait' />}>
            <AnimatedStep rxStep={setPreviousStep}>
              <ContactDataForm />
            </AnimatedStep>
            <AnimatedStep rxStep={setPreviousStep}>
              <BankDataForm />
            </AnimatedStep>
            <AnimatedStep rxStep={setPreviousStep}>
              <ProductSelection />
            </AnimatedStep>
            <AnimatedStep rxStep={setPreviousStep}>
              <Confirmation />
            </AnimatedStep>
          </Wizard>

          <footer className='self-center'>
            Step {currentStep} - {Object.keys(errors).length} errores
          </footer>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default ProviderModal
