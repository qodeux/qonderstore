import { Alert, Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react'
import { ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { categoryService } from '../../../services/categoryService'
import { productService } from '../../../services/productService'
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

  const selectedProduct = useSelector((state: RootState) => state.products.selectedProduct)

  const [confirmDelete, setConfirmDelete] = useState(false)

  let itemToDelete: string | undefined
  switch (deleteType) {
    case 'product':
      itemToDelete = selectedProduct?.name
      break
    case 'category':
      itemToDelete = selectedCategory?.name
      break
  }

  async function deleteItem() {
    if (!itemToDelete) return
    switch (deleteType) {
      case 'product':
        if (selectedProduct) {
          await productService.deleteProduct(String(selectedProduct.id))
          console.log('Product deleted successfully')
        }
        break
      case 'category':
        if (selectedCategory) {
          await categoryService.deleteCategory(selectedCategory.id)
          console.log('Category deleted successfully')
          //await supabase.from('categories').delete().eq('id', itemId)
        }
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

  const canBeDeleted = () => {
    if (deleteType === 'category') {
      // if ((selectedCategory?.total_products ?? 0) > 0) return false
      // if (subcategories > 0) return false
      return true
    }

    if (deleteType === 'product') {
      if ((selectedProduct?.stock ?? 0) > 0) {
        return confirmDelete
      } else {
        return true
      }
    }
  }

  useEffect(() => {
    if (!isOpenDelete) {
      setConfirmDelete(false)
    }
  }, [isOpenDelete])

  return (
    <Modal isOpen={isOpenDelete} onOpenChange={onOpenChangeDelete} backdrop='blur'>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className='flex flex-col gap-1 '>Eliminar {deleteTypeMap[deleteType].name}</ModalHeader>
            <ModalBody>
              <p>
                ¿Estás seguro de que deseas eliminar: <span className='font-bold'>{itemToDelete}</span>?
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

              {deleteType === 'product' && (selectedProduct?.stock ?? 0) > 0 && (
                <Alert
                  color='danger'
                  icon={<ShieldAlert />}
                  hideIconWrapper
                  className='mt-4'
                  classNames={{ title: 'font-bold', description: 'text-xs', alertIcon: 'fill-none', iconWrapper: 'bg-blue-100' }}
                  description={
                    <>
                      Este {deleteTypeMap[deleteType].name} tiene existencias (<span className='font-bold'>{selectedProduct?.stock}</span>).
                      Al eliminarlo, los datos de inventario se perderán. <strong>Esto no se puede deshacer. </strong> Para continuar debes
                      confirmar la eliminación.
                      <div className='flex items-center gap-1 mt-3'>
                        {!confirmDelete && (
                          <Button color='danger' className=' shadow-small' size='sm' variant='solid' onPress={() => setConfirmDelete(true)}>
                            Confirmar eliminación
                          </Button>
                        )}
                        {confirmDelete && <span className='text-sm'>¡Listo! Ya puedes eliminar.</span>}
                      </div>
                    </>
                  }
                  title='Advertencia'
                />
              )}
            </ModalBody>
            <ModalFooter>
              <Button color='primary' variant='light' onPress={onClose}>
                Cancelar
              </Button>
              {canBeDeleted() && (
                <Button color='danger' onPress={() => deleteItem()}>
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

export default OnDeleteModal
