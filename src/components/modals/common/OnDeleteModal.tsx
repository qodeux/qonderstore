import { Alert, Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react'
import { useSelector } from 'react-redux'
import { categoryService } from '../../../services/categoryService'
import type { RootState } from '../../../store/store'

export type ItemType = 'product' | 'category' | 'brand' | 'provider'

type Props = {
  isOpenDelete: boolean
  onOpenChangeDelete: () => void
  deleteType: ItemType
}

const deleteTypeMap = {
  product: { name: 'producto', article: 'el' },
  category: { name: 'categoría', article: 'la' },
  brand: { name: 'marca', article: 'la' },
  provider: { name: 'proveedor', article: 'el' }
}

const OnDeleteModal = ({ isOpenDelete, onOpenChangeDelete, deleteType }: Props) => {
  const categories = useSelector((state: RootState) => state.categories.categories) ?? []
  const selectedCategory = useSelector((state: RootState) => state.categories.selectedCategory)

  async function deleteItem() {
    if (!selectedCategory) return
    switch (deleteType) {
      case 'product':
        //await productService.deleteProduct(itemId)
        //console.log('Product deleted successfully')
        break
      case 'category':
        await categoryService.deleteCategory(selectedCategory.id)
        console.log('Category deleted successfully')
        //await supabase.from('categories').delete().eq('id', itemId)
        break
      case 'brand':
        //await supabase.from('brands').delete().eq('id', itemId)
        break
      case 'provider':
        //await supabase.from('providers').delete().eq('id', itemId)
        break
    }
    onOpenChangeDelete()
  }

  let subcategories = 0
  if (deleteType === 'category' && selectedCategory) {
    subcategories = categories.filter((cat) => cat.parent === selectedCategory.id).length
  }

  return (
    <Modal isOpen={isOpenDelete} onOpenChange={onOpenChangeDelete} backdrop='blur'>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className='flex flex-col gap-1'>Eliminar {deleteTypeMap[deleteType].name}</ModalHeader>
            <ModalBody>
              <p>
                ¿Estás seguro de que deseas eliminar: <span className='font-bold'>{selectedCategory?.name}</span>?
              </p>
              {deleteType === 'category' && typeof selectedCategory?.total_products === 'number' && selectedCategory.total_products > 0 && (
                <Alert
                  color='danger'
                  hideIconWrapper
                  className='mt-4'
                  classNames={{ title: 'font-bold', description: 'text-xs' }}
                  description={`${deleteTypeMap[deleteType].article === 'el' ? 'Este' : 'Esta'} ${deleteTypeMap[deleteType].name} tiene ${
                    subcategories > 0 ? `${subcategories} subcategorías y ` : ''
                  }${selectedCategory?.total_products} productos, al eliminarla, todos sus productos quedarán sin categoría.`}
                  title='Advertencia'
                />
              )}
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
