import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react'

type Props = {
  isOpen: boolean
  onOpenChange: () => void
}

const CloseRouteModal = ({ isOpen, onOpenChange }: Props) => {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size='lg' backdrop='blur' classNames={{ base: 'pb-6' }}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className='flex flex-col gap-1'>Cerrar ruta de envíos</ModalHeader>
            <ModalBody></ModalBody>
            <ModalFooter>
              <Button variant='flat' color='danger' onPress={onClose}>
                Cancelar
              </Button>
              <Button color='primary' onPress={onClose}>
                Confirmar cierre
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

export default CloseRouteModal
