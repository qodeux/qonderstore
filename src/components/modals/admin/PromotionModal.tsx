import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { promotionsInputSchema } from '../../../schemas/promotions.schema'
import { promotionService } from '../../../services/promotionService'
import type { RootState } from '../../../store/store'
import { fromDbToDateValue } from '../../../utils/date'
import PromotionForm from '../../forms/admin/PromoForm'

type Props = {
  isOpen: boolean
  onOpenChange: () => void
}

const PromotionModal = ({ isOpen, onOpenChange }: Props) => {
  const { isEditing, selectedPromotion } = useSelector((state: RootState) => state.promotions)
  const categories = useSelector((state: RootState) => state.categories.items)

  // Calcula los default values ANTES de crear el form
  const buildDefaultValues = useMemo(() => {
    //console.log('📋 Recalculando defaultValues:', { isEditing, promotionId: selectedPromotion })

    // ⚠️ CRÍTICO: Solo usar selectedPromotion si isEditing es TRUE
    if (!isEditing) {
      return {
        name: '',
        promo_type: null,
        promo_type_target_id: null,
        product_unit: null,
        category: null,
        subcategory: null,
        products: null,
        discount_type: null,
        frequency: null,
        date: null,
        week_days: null,
        day_month: null,
        code: '',
        mode: null,
        mode_value: null,
        valid_until: null,
        is_limited: false,
        limit: null,
        is_conditioned: false,
        condition_type: null,
        condition: null,
        is_active: true
      }
    }

    if (!selectedPromotion) {
      console.error('⚠️ isEditing es true pero no hay selectedPromotion!')
      return
    }

    const categoryTarget =
      selectedPromotion.promo_type === 'category' ? categories.find((cat) => cat.id === selectedPromotion.promo_type_target_id) : undefined

    const hasParentCat = !!categoryTarget?.parent

    // console.log('🚀 Calculando defaultValues:', {
    //   hasParentCat,
    //   categoryTarget,
    //   categoryId: categoryTarget?.id,
    //   parentId: categoryTarget?.parent
    // })

    return {
      name: selectedPromotion.name,
      promo_type: selectedPromotion.promo_type,
      promo_type_target_id: selectedPromotion.promo_type_target_id,
      product_unit: selectedPromotion.product_unit,
      category: selectedPromotion.promo_type === 'category' && hasParentCat ? categoryTarget.parent : categoryTarget?.id,
      subcategory: selectedPromotion.promo_type === 'category' && hasParentCat ? categoryTarget.id : undefined,
      product: selectedPromotion.promo_type === 'product' ? selectedPromotion.promo_type_target_id : undefined,
      discount_type: selectedPromotion.discount_type,
      frequency: selectedPromotion.frequency,
      frequency_value: selectedPromotion.frequency_value,
      date: selectedPromotion.frequency === 'once' && fromDbToDateValue(selectedPromotion.frequency_value?.date ?? null),
      week_days: selectedPromotion.frequency === 'weekly' ? selectedPromotion.frequency_value : undefined,
      day_month: selectedPromotion.frequency === 'monthly' ? selectedPromotion.frequency_value?.day : undefined,

      code: selectedPromotion.code ?? '',
      mode: selectedPromotion.mode,
      mode_value: selectedPromotion.mode_value,
      valid_until: fromDbToDateValue(selectedPromotion.valid_until ?? null),
      is_limited: !!selectedPromotion.limit,
      limit_type: selectedPromotion.limit_type ?? undefined,
      limit: selectedPromotion.limit ?? null,
      is_conditioned: !!selectedPromotion.condition,
      condition_type: selectedPromotion.condition_type ?? undefined,
      condition: selectedPromotion.condition,
      is_active: selectedPromotion.is_active
    }
  }, [isEditing, categories, selectedPromotion])
  // ☝️ Usa selectedPromotion?.id en vez del objeto completo para evitar recálculos innecesarios

  // Ahora el form se crea CON los defaultValues
  const promotionForm = useForm({
    resolver: zodResolver(promotionsInputSchema),
    defaultValues: buildDefaultValues, // ← Aquí están los valores iniciales
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange'
  })

  // Este useEffect SOLO resetea cuando cambian los valores y el modal está abierto
  useEffect(() => {
    if (isOpen) {
      //console.log('✅ Reseteando form con:', { isEditing, defaultValues: buildDefaultValues })
      // Forzar reset incluso si promotionForm no cambió

      promotionForm.reset(buildDefaultValues, { keepDefaultValues: true })
    }
  }, [isOpen, isEditing, selectedPromotion?.id, promotionForm, buildDefaultValues, selectedPromotion])
  // ☝️ Agregamos isEditing y selectedPromotion?.id para forzar reset al cambiar modo

  const handleSubmitPromotion = async () => {
    const isValid = await promotionForm.trigger()
    console.log('Erorres', promotionForm.formState.errors)
    if (!isValid) return

    const payload = promotionForm.getValues()

    console.log(payload)

    let transaction

    if (isEditing && selectedPromotion) {
      transaction = await promotionService.updatePromotion(selectedPromotion.id, promotionsInputSchema.parse(payload))
    } else {
      transaction = await promotionService.createPromotion(promotionsInputSchema.parse(payload))
      console.log('Promoción creada:', transaction)
    }

    if (transaction?.error) {
      console.error(transaction.error)
      return
    }

    onOpenChange()
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size='md'
      backdrop='blur'
      classNames={{
        base: 'bg-gray-50',
        closeButton:
          'focus:outline-none focus:ring-0 data-[focus-visible=true]:outline-none data-[focus-visible=true]:ring-0 cursor-pointer'
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className='flex flex-col gap-1'>{isEditing ? 'Editar' : 'Agregar'} promoción</ModalHeader>
            <ModalBody>
              <FormProvider key={isEditing ? selectedPromotion?.id : 'new'} {...promotionForm}>
                <PromotionForm />
              </FormProvider>
            </ModalBody>
            <ModalFooter>
              <Button color='danger' variant='light' onPress={onClose}>
                Cancelar
              </Button>
              <Button color='primary' onPress={handleSubmitPromotion}>
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
