import { Modal, ModalBody, ModalContent, ModalHeader } from '@heroui/react'

type Props = {
  isOpen: boolean
  onOpenChange: () => void
  children: React.ReactNode
}
const MobileFiltersModal = ({ isOpen, onOpenChange, children }: Props) => {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      classNames={{
        base: ' overflow-hidden bg-gray-50',
        closeButton:
          'focus:outline-none focus:ring-0 data-[focus-visible=true]:outline-none data-[focus-visible=true]:ring-0 cursor-pointer'
      }}
    >
      <ModalContent>
        <ModalHeader>Ajustar filtros</ModalHeader>
        <ModalBody>{children}</ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default MobileFiltersModal
