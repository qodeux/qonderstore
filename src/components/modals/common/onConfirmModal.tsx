import { Alert, Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react'

type onConfirmModalProps = {
  isOpen: boolean
  onOpenChange: () => void
  title: string
  action: 'delete' | 'archive'
  message: string
  onConfirm: () => void
}

const OnConfirmModal = ({ isOpen, onOpenChange, title, action, message, onConfirm }: onConfirmModalProps) => {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size='sm'>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className='flex flex-col gap-1 '>{title}</ModalHeader>
            <ModalBody>
              <p>{message}</p>

              {action === 'delete' && (
                <Alert
                  color='danger'
                  hideIconWrapper
                  className='mt-4'
                  classNames={{ title: 'font-bold', description: 'text-xs' }}
                  title='Advertencia'
                  description={`Esto no se puede deshacer. La imagen sera eliminada de forma permanente.`}
                />
              )}
            </ModalBody>
            <ModalFooter>
              <Button color='primary' variant='light' onPress={onClose}>
                Cancelar
              </Button>
              {action === 'delete' && (
                <Button color='danger' onPress={() => onConfirm()}>
                  Eliminar
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

export default OnConfirmModal
