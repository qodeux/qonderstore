import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react'
import { productService } from '../../../services/productService'

export type ItemType = 'product' | 'category' | 'brand' | 'provider'

type Props = {
  isOpenDelete: boolean
  onOpenChangeDelete: () => void
  deleteType: ItemType
  itemId: string | null
}

const deleteTypeMap = {
  product: { name: 'producto', article: 'el' },
  category: { name: 'categoría', article: 'la' },
  brand: { name: 'marca', article: 'la' },
  provider: { name: 'proveedor', article: 'el' }
}

const OnDeleteModal = ({ isOpenDelete, onOpenChangeDelete, deleteType, itemId }: Props) => {
  async function deleteItem() {
    if (!itemId) return
    switch (deleteType) {
      case 'product':
        await productService.deleteProduct(itemId)
        break
      case 'category':
        //await supabase.from('categories').delete().eq('id', itemId)
        break
      case 'brand':
        //await supabase.from('brands').delete().eq('id', itemId)
        break
      case 'provider':
        //await supabase.from('providers').delete().eq('id', itemId)
        break
    }

    console.log('Product deleted successfully')
    onOpenChangeDelete()
  }

  return (
    <Modal isOpen={isOpenDelete} onOpenChange={onOpenChangeDelete}>
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
              <Button color='primary' onPress={() => deleteItem()}>
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
