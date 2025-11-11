import { Alert, Button, Checkbox, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, NumberInput, Textarea } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { inventoryAdjustmentSchema } from '../../../schemas/inventoryAdjusment.schema'
import { productService } from '../../../services/productService'
import { useAppSelector } from '../../../store/store'
import { saleUnitsAvailable } from '../../../types/products'
import UnitSelector from '../../store/UnitSelector'

type InventoryAdjustmentProps = {
  isOpen: boolean
  onOpenChange: () => void
}

type SaleUnit = 'pz' | 'pk' | 'box' | 'gr' | 'oz' | 'lb' | 'kg'

const InventoryAdjustmentModal = ({ isOpen, onOpenChange }: InventoryAdjustmentProps) => {
  const { user } = useAppSelector((state) => state.auth)
  const { items: products, selectedProduct } = useAppSelector((state) => state.products)
  const product = products.find((p) => p.id === selectedProduct?.id)
  const { control, watch, handleSubmit, register, setValue, reset } = useForm({
    resolver: zodResolver(inventoryAdjustmentSchema),
    shouldUnregister: true,
    reValidateMode: 'onChange',
    defaultValues: {
      quantity: undefined,
      //unit: undefined,
      add_comment: false
    }
  })

  const addComment = watch('add_comment', false)

  const quantity = watch('quantity')

  const handleSendAdjustment = handleSubmit(
    async (data) => {
      if (!product || !user) return
      console.log('Ajuste enviado:', data)
      //onOpenChange()

      try {
        await productService.inventoryAdjustment(product, user.id, data)
      } catch (error) {
        console.error('Error al realizar ajuste de inventario:', error)
        return
      }

      onOpenChange()
    },
    (error) => {
      console.log('Errores en el formulario:', error)
    }
  )

  useEffect(() => {
    register('unit')

    if (product?.sale_type === 'unit') {
      setValue('unit', product.unit as SaleUnit, { shouldValidate: true })
    }
    if (product?.sale_type === 'bulk') {
      reset({ unit: product.base_unit as SaleUnit })
    }
  }, [product, register, setValue])

  if (!product) return null

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size='sm' backdrop='blur' className='bg-gray-50'>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className='flex flex-col gap-1'>Ajuste de inventario</ModalHeader>
            <ModalBody>
              <form className='space-y-8'>
                <Alert
                  color='primary'
                  hideIcon
                  classNames={{ title: 'font-bold text-md', description: 'text-xs' }}
                  description={
                    <div>
                      Estás a punto de realizar un ajuste en el inventario. Por favor, asegúrate de que{' '}
                      <strong>la información es correcta</strong> antes de proceder, se creará un registro de cada movimiento, con los datos
                      del usuario que realiza el cambio. No se recomienda modificar el estado del inventario{' '}
                      <strong>sin una razón válida.</strong>
                    </div>
                  }
                  title={
                    <div className='flex items-center gap-2 mb-2'>
                      <AlertTriangle />
                      <span>Advertencia</span>
                    </div>
                  }
                />

                <div className='grid grid-cols-2 gap-4 items-start'>
                  <Controller
                    name='quantity'
                    control={control}
                    render={({ field, fieldState }) => (
                      <NumberInput
                        label='Cantidad'
                        variant='bordered'
                        classNames={{ inputWrapper: 'bg-white border-2 border-black' }}
                        aria-label='Cantidad a ajustar'
                        value={field.value ?? undefined}
                        size='sm'
                        minValue={1}
                        maxLength={4}
                        onChange={(v) => {
                          field.onChange(v)
                        }}
                        isInvalid={!!fieldState.error}
                        errorMessage={fieldState.error?.message}
                      />
                    )}
                  />
                  {product.sale_type === 'unit' && (
                    <motion.div
                      key={`unit-label`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, type: 'spring' }}
                      exit={{ opacity: 0, y: 20 }}
                      className='pt-2'
                    >
                      <span className='font-medium text-lg'>
                        {saleUnitsAvailable.find((unit) => unit.key === product.unit)?.label}
                        {quantity && quantity > 1 && 's'}
                      </span>
                    </motion.div>
                  )}
                  {product.sale_type === 'bulk' && (
                    <motion.div
                      key='unit-selector'
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, type: 'spring' }}
                      className='w-full'
                    >
                      <Controller
                        name='unit'
                        control={control}
                        render={({ field }) => (
                          <UnitSelector
                            quantity={quantity}
                            baseUnit={product.base_unit}
                            units='all'
                            value={field.value ?? product.base_unit}
                            onChange={(u) => field.onChange(u)}
                          />
                        )}
                      />
                    </motion.div>
                  )}

                  <div className='col-span-2'>
                    <Controller
                      name='add_comment'
                      control={control}
                      render={({ field }) => (
                        <Checkbox isSelected={field.value} onValueChange={field.onChange}>
                          Agregar comentario
                        </Checkbox>
                      )}
                    />

                    {addComment && (
                      <Controller
                        name='comment'
                        control={control}
                        render={({ field, fieldState }) => (
                          <Textarea
                            placeholder='Escribe un comentario sobre este ajuste...'
                            variant='bordered'
                            maxRows={2}
                            className='mt-2'
                            classNames={{ inputWrapper: 'bg-white' }}
                            {...field}
                            isInvalid={!!fieldState.error}
                            errorMessage={fieldState.error?.message}
                          />
                        )}
                      />
                    )}
                  </div>
                </div>
              </form>
            </ModalBody>
            <ModalFooter>
              <Button color='danger' variant='light' onPress={onClose}>
                Cerrar
              </Button>
              <Button color='primary' onPress={() => handleSendAdjustment()}>
                Aceptar
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

export default InventoryAdjustmentModal
