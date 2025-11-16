import { Modal, ModalBody, ModalContent, ModalHeader } from '@heroui/react'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useDevice } from '../../../hooks/useDevice'
import { storeOrderService } from '../../../services/storeOrderService'
import { useAppSelector } from '../../../store/store'
import UploaderR2 from '../../common/UploaderR2'

type Props = {
  isOpen: boolean
  onOpenChange: () => void
}

const PaymentUploadModal = ({ isOpen, onOpenChange }: Props) => {
  const formUpload = useForm()
  const { isMobile, isTablet } = useDevice()
  const { selectedOrder } = useAppSelector((state) => state.storeOrders)

  useEffect(() => {
    if (!isOpen) {
      formUpload.reset()
      formUpload.clearErrors()
    }
  }, [isOpen, formUpload])

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size='lg' backdrop='blur' classNames={{ base: 'pb-6' }}>
      <ModalContent>
        <ModalHeader className='flex flex-col gap-1'>Registro de pago</ModalHeader>
        <ModalBody>
          <FormProvider {...formUpload}>
            <UploaderR2
              name='payment_proof'
              prefix='payments'
              mode='private'
              uploadType='file'
              uploadLabel='Cargar archivo'
              maxFiles={1}
              maxSize={10 * 1024 * 1024}
              previewExpiresIn={180}
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

                  onOpenChange()
                } catch (error) {
                  console.error('Error during payment upload:', error)
                  formUpload.setError('payment_proof', {
                    type: 'manual',
                    message: 'Error al actualizar la orden intentalo de nuevo.'
                  })
                }
              }}
            />
          </FormProvider>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default PaymentUploadModal
