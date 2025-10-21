import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react'

type Props = {
  isOpen: boolean
  onOpenChange: () => void
  onConfirm: () => void
}

const OrderSupplyConfirmModal = ({ isOpen, onOpenChange, onConfirm }: Props) => {
  const handleOrderSupply = () => {
    onConfirm()
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size='sm'>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className='flex flex-col gap-1 '>Confirmar suministro</ModalHeader>
            <ModalBody>
              <p>Los elementos suministrados no podrán ser modificados posteriormente. ¿Desea continuar?</p>

              <p>Todos los productos suministrados se agregarán al inventario.</p>
            </ModalBody>
            <ModalFooter className='flex items-center'>
              <Button color='danger' variant='light' onPress={onClose}>
                Cancelar
              </Button>
              <Button color='primary' onPress={handleOrderSupply}>
                Aceptar
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

export default OrderSupplyConfirmModal
