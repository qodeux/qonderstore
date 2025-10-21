import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { promotionsInputSchema } from '../../../schemas/promotions.schema'
import { promotionService } from '../../../services/promotionService'
import type { RootState } from '../../../store/store'
import { fromDbToDateValue } from '../../../utils/date'
import PromotionForm from '../../forms/admin/PromotionForm'

type Props = {
  isOpen: boolean
  onOpenChange: () => void
}

const PromotionModal = ({ isOpen, onOpenChange }: Props) => {
  const { isEditing, selectedPromotion } = useSelector((state: RootState) => state.promotions)
  const categories = useSelector((state: RootState) => state.categories.categories)

  // Calcula los default values ANTES de crear el form
  const defaultValues = useMemo(() => {
    console.log('📋 Recalculando defaultValues:', { isEditing, promotionId: selectedPromotion?.id })

    // ⚠️ CRÍTICO: Solo usar selectedPromotion si isEditing es TRUE
    if (!isEditing) {
      return {
        promo_type: undefined,
        promo_type_target_id: '',
        category: undefined,
        subcategory: undefined,
        products: undefined,
        discount_type: undefined,
        frequency: undefined,
        date: undefined,
        week_days: undefined,
        day_month: undefined,
        code: '',
        mode: undefined,
        mode_value: '',
        valid_until: undefined,
        is_limited: false,
        limit: '',
        is_conditioned: false,
        condition_type: undefined,
        condition: undefined,
        is_active: true
      }
    }

    // Si llegamos aquí, isEditing es TRUE y debe haber un selectedPromotion
    if (!selectedPromotion) {
      console.error('⚠️ isEditing es true pero no hay selectedPromotion!')
      // Fallback a valores vacíos
      return {
        promo_type: undefined,
        promo_type_target_id: '',
        category: undefined,
        subcategory: undefined,
        products: undefined,
        discount_type: undefined,
        frequency: undefined,
        date: undefined,
        week_days: undefined,
        day_month: undefined,
        code: '',
        mode: undefined,
        mode_value: undefined,
        valid_until: undefined,
        is_limited: false,
        limit: '',
        is_conditioned: false,
        condition_type: undefined,
        condition: undefined,
        is_active: true
      }
    }

    const categoryTarget =
      selectedPromotion.promo_type === 'category' ? categories.find((cat) => cat.id === selectedPromotion.promo_type_target_id) : undefined

    const hasParentCat = !!categoryTarget?.parent

    console.log('🚀 Calculando defaultValues:', {
      hasParentCat,
      categoryTarget,
      categoryId: categoryTarget?.id,
      parentId: categoryTarget?.parent
    })

    return {
      promo_type: selectedPromotion.promo_type,
      promo_type_target_id: selectedPromotion.promo_type_target_id,
      category: selectedPromotion.promo_type === 'category' && hasParentCat ? categoryTarget.parent : categoryTarget?.id,
      subcategory: selectedPromotion.promo_type === 'category' && hasParentCat ? categoryTarget.id : undefined,
      product: selectedPromotion.promo_type === 'product' ? selectedPromotion.promo_type_target_id : undefined,
      discount_type: selectedPromotion.discount_type,
      frequency: selectedPromotion.frequency,
      code: selectedPromotion.code ?? '',
      mode: selectedPromotion.mode,
      mode_value: selectedPromotion.mode_value,
      valid_until: fromDbToDateValue(selectedPromotion.valid_until ?? null),
      is_limited: !!selectedPromotion.limit,
      limit_type: selectedPromotion.limit_type ?? undefined,
      limit: selectedPromotion.limit ?? '',
      is_conditioned: !!selectedPromotion.condition,
      condition_type: selectedPromotion.condition_type ?? undefined,
      condition: selectedPromotion.condition,
      is_active: selectedPromotion.is_active
    }
  }, [isEditing, selectedPromotion?.id, categories])
  // ☝️ Usa selectedPromotion?.id en vez del objeto completo para evitar recálculos innecesarios

  // Ahora el form se crea CON los defaultValues
  const promotionForm = useForm({
    resolver: zodResolver(promotionsInputSchema),
    defaultValues, // ← Aquí están los valores iniciales
    shouldUnregister: true,
    mode: 'all',
    reValidateMode: 'onChange'
  })

  // Este useEffect SOLO resetea cuando cambian los valores y el modal está abierto
  useEffect(() => {
    if (isOpen) {
      console.log('✅ Reseteando form con:', { isEditing, defaultValues })
      // Forzar reset incluso si promotionForm no cambió
      const resetValues =
        isEditing && selectedPromotion
          ? defaultValues
          : {
              promo_type: undefined,
              promo_type_target_id: '',
              category: undefined,
              subcategory: undefined,
              products: undefined,
              discount_type: undefined,
              frequency: undefined,
              date: undefined,
              week_days: undefined,
              day_month: undefined,
              code: '',
              mode: undefined,
              mode_value: undefined,
              valid_until: undefined,
              is_limited: false,
              limit: '',
              is_conditioned: false,
              condition_type: undefined,
              condition: undefined,
              is_active: true
            }
      promotionForm.reset(resetValues, { keepDefaultValues: true })
    }
  }, [isOpen, isEditing, selectedPromotion?.id, promotionForm.reset])
  // ☝️ Agregamos isEditing y selectedPromotion?.id para forzar reset al cambiar modo

  const handleSubmitPromotion = async () => {
    console.log(promotionForm.getValues())
    const isValid = await promotionForm.trigger()
    console.log(promotionForm.formState.errors)
    if (!isValid) return

    const payload = promotionForm.getValues()
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
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size='md' backdrop='blur'>
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
