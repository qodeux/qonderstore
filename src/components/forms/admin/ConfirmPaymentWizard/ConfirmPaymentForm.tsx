import { Input } from '@heroui/react'
import { Controller, useFormContext } from 'react-hook-form'
import { useDevice } from '../../../../hooks/useDevice'
import { storeOrderService } from '../../../../services/storeOrderService'
import { useAppSelector } from '../../../../store/store'
import UploaderR2 from '../../../common/UploaderR2'

const ConfirmPaymentForm = () => {
  const selectedOrder = useAppSelector((state) => state.storeOrders.selectedOrder)
  const { isMobile, isTablet } = useDevice()
  const { control } = useFormContext()

  return (
    <form>
      <Controller
        name='confirm_proof'
        render={() => (
          <UploaderR2
            name='confirm_proof'
            prefix='payments'
            mode='private'
            uploadType='file'
            maxFiles={1}
            maxSize={10 * 1024 * 1024}
            previewExpiresIn={180}
            uploadLabel='Cargar archivo'
            instructions={
              <div className='flex flex-col'>
                <p className='font-medium'>
                  {isMobile || isTablet ? 'Toma una foto o selecciona un archivo.' : 'Arrastra y suelta, o haz clic para seleccionar '}
                </p>
                <p className='text-sm'>Sube una imagen o PDF como comprobante de pago (máx. 10MB).</p>
              </div>
            }
            onUploadComplete={async (items) => {
              try {
                await storeOrderService.upsertPayment({
                  order_id: selectedOrder!.id,
                  status: 'paid',
                  amount: selectedOrder!.order_total,
                  payment_proof: items[0].key
                })

                //onOpenChange()
              } catch (error) {
                console.error('Error during payment upload:', error)
              }
            }}
          />
        )}
      />

      <Controller
        name='reference'
        control={control}
        render={({ field, fieldState }) => (
          <Input
            label='Referencia de pago'
            type='text'
            size='sm'
            variant='bordered'
            value={field.value ?? ''}
            onValueChange={(v) => {
              field.onChange(v)
            }}
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message as string}
            classNames={{ inputWrapper: 'bg-white', base: 'mt-4' }}
          />
        )}
      />
    </form>
  )
}

export default ConfirmPaymentForm
