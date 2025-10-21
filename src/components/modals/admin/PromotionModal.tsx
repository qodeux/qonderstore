import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { promotionsInputSchema } from '../../../schemas/promotions.schema'
import { promotionService } from '../../../services/promotionService'
import type { RootState } from '../../../store/store'
import PromotionForm from '../../forms/admin/PromotionForm'

type Props = {
  isOpen: boolean
  onOpenChange: () => void
}

const PromotionModal = ({ isOpen, onOpenChange }: Props) => {
  const editMode = useSelector((state: RootState) => state.promotions.editMode)

  const prevIsOpenRef = useRef(isOpen)

  const promotionForm = useForm({
    resolver: zodResolver(promotionsInputSchema),
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange'
  })
  const handleAddPromotion = async () => {
    console.log(promotionForm.getValues())
    const isValid = await promotionForm.trigger()
    console.log(promotionForm.formState.errors)
    if (!isValid) return
    // Lógica para enviar los datos al servidor

    const formData = promotionForm.getValues()

    const promotionCreated = await promotionService.createPromotion(promotionsInputSchema.parse(formData))

    console.log(promotionCreated)

    console.log('Promoción creada:', promotionCreated)
    if (promotionCreated) {
      onOpenChange() // Cierra el modal
    }
  }

  const buildFormValues = () => {
    const defaultValues = {
      promo_type: undefined,
      category: undefined,
      subcategory: undefined,
      products: undefined,
      discount_type: undefined,
      frequency: undefined,
      date: undefined,
      week_days: undefined,
      day_month: undefined,
      code: undefined,
      mode: undefined,
      mode_value: undefined,
      valid_until: undefined,
      limit: undefined,
      condition: undefined,
      is_active: true,
      promo_type_target_id: 0
    }

    return defaultValues
  }

  useEffect(() => {
    const wasOpen = prevIsOpenRef.current
    if (isOpen && !wasOpen) {
      console.log('Modal Abierto')
      //Al abrir modal
    }

    if (!isOpen && wasOpen) {
      console.log('Modal Cerrado')
      //Al cerrar modal
    }

    promotionForm.reset(buildFormValues())

    prevIsOpenRef.current = isOpen
  }, [isOpen, promotionForm])

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size='md' backdrop='blur'>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className='flex flex-col gap-1'>{editMode ? 'Editar' : 'Agregar'} promoción</ModalHeader>
            <ModalBody>
              <FormProvider {...promotionForm}>
                <PromotionForm />
              </FormProvider>
            </ModalBody>
            <ModalFooter>
              <Button color='danger' variant='light' onPress={onClose}>
                Cancelar
              </Button>
              <Button color='primary' onPress={handleAddPromotion}>
                Aceptar
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

export default PromotionModal
