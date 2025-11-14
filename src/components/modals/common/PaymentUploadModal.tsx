import { Modal, ModalBody, ModalContent, ModalHeader } from '@heroui/react'
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
  const { isMobile, isTablet, isDesktop } = useDevice()
  const { selectedOrder } = useAppSelector((state) => state.storeOrders)

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size='lg' backdrop='blur' classNames={{ base: 'pb-6' }}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className='flex flex-col gap-1'>Registro de pago</ModalHeader>
            <ModalBody>
              <FormProvider {...formUpload}>
                <UploaderR2
                  name='payment_proof'
                  prefix='payments'
                  mode='private'
                  uploadType='file'
                  maxFiles={1}
                  maxSize={10 * 1024 * 1024} // 10MB
                  previewExpiresIn={180}
                  instructions={
                    <div className='flex flex-col'>
                      <p className='font-medium'>
                        {isMobile || isTablet
                          ? 'Toma una foto o selecciona un archivo.'
                          : 'Arrastra y suelta, o haz clic para seleccionar '}
                      </p>
                      <p className='text-sm'>Sube una imagen o PDF como comprobante de pago (máx. 10MB).</p>
                    </div>
                  }
                  onUploadComplete={async (items) => {
                    const { error } = await storeOrderService.updateOrderStatus(selectedOrder!.id, 'paid')

                    if (error) {
                      console.error('Error updating order status after upload:', error)
                      formUpload.setError('payment_proof', {
                        type: 'manual',
                        message: 'Error al actualizar la orden intentalo de nuevo.'
                      })
                      return
                    }

                    console.log('Upload complete:', items)

                    onOpenChange()
                  }}
                />
              </FormProvider>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

export default PaymentUploadModal
