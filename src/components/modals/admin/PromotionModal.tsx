import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { promotionsSchema } from '../../../schemas/promotions.schema'
import type { RootState } from '../../../store/store'
import PromotionForm from '../../forms/admin/PromotionForm'

type Props = {
  isOpen: boolean
  onOpenChange: () => void
}

const PromotionModal = ({ isOpen, onOpenChange }: Props) => {
  const editMode = useSelector((state: RootState) => state.promotions.editMode)
  const promotionForm = useForm({
    resolver: zodResolver(promotionsSchema),
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange',
    defaultValues: {
      promo_type: '',
      category: undefined,
      subcategory: '',
      products: undefined,
      discount_type: '',
      frequency: '',
      date: [],
      week_days: [],
      day_month: [],
      code: '',
      mode: '',
      mode_value: undefined,
      valid_until: '',
      limit: undefined,
      condition: '',
      is_active: true
    }
  })
  const handleAddPromotion = async () => {
    console.log(promotionForm.getValues())
    const isValid = await promotionForm.trigger()
    console.log(promotionForm.formState.errors)
    if (!isValid) return
    // Lógica para enviar los datos al servidor
    // const promotionCreated = await promotionsService.createPromotion(formData)
    // console.log('Promoción creada:', promotionCreated)
    // if (promotionCreated) {
    //   onOpenChange() // Cierra el modal
    //   fetchData() // Refresca los datos en la tabla principal
    //   promotionForm.reset() // Resetea el formulario
    // }
  }

  useEffect(() => {
    if (!isOpen) {
      promotionForm.reset() // Resetea el formulario cuando se cierra el modal
      // fetchData() // Refresca los datos en la tabla principal
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

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
