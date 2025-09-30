import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react'

type Props = {
  isOpenDeleteProduct: boolean
  onOpenChangeDeleteProduct: () => void
  deleteProduct: (id: string | null) => void
  deleteProductId: string | null
  deleteType: 'product' | 'category' | 'brand'
}

const deleteTypeMap = {
  product: { name: 'producto', article: 'el' },
  category: { name: 'categoría', article: 'la' },
  brand: { name: 'marca', article: 'la' }
}

const OnDeleteModal = ({ isOpenDeleteProduct, onOpenChangeDeleteProduct, deleteProduct, deleteProductId, deleteType }: Props) => {
  return (
    <Modal isOpen={isOpenDeleteProduct} onOpenChange={onOpenChangeDeleteProduct}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className='flex flex-col gap-1'>Eliminar {deleteTypeMap[deleteType].name}</ModalHeader>
            <ModalBody>
              <p>
                ¿Estás seguro de que deseas eliminar {deleteTypeMap[deleteType].article === 'el' ? 'este' : 'esta'}{' '}
                {deleteTypeMap[deleteType].name}? Esta acción no se puede deshacer.
              </p>
            </ModalBody>
            <ModalFooter>
              <Button color='danger' variant='light' onPress={onClose}>
                Cerrar
              </Button>
              <Button color='primary' onPress={() => deleteProduct(deleteProductId)}>
                Aceptar
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

export default OnDeleteModal
