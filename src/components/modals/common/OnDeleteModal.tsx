import { addToast, Alert, Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react'
import { ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { categoryService } from '../../../services/categoryService'
import { productService } from '../../../services/productService'
import { promotionService } from '../../../services/promotionService'
import { providerService } from '../../../services/providerService'
import { userService } from '../../../services/userService'
import type { RootState } from '../../../store/store'

export type ItemType = 'product' | 'category' | 'brand' | 'provider' | 'user' | 'promotion'

type Props = {
  isOpenDelete: boolean
  onOpenChangeDelete: () => void
  deleteType: ItemType
}

const deleteTypeMap = {
  product: { name: 'producto', article: 'el' },
  category: { name: 'categoría', article: 'la' },
  brand: { name: 'marca', article: 'la' },
  provider: { name: 'proveedor', article: 'el' },
  user: { name: 'usuario', article: 'el' },
  promotion: { name: 'promoción', article: 'la' }
}

const OnDeleteModal = ({ isOpenDelete, onOpenChangeDelete, deleteType }: Props) => {
  const categories = useSelector((state: RootState) => state.categories.categories) ?? []
  const selectedCategory = useSelector((state: RootState) => state.categories.selectedCategory)
  const selectedProduct = useSelector((state: RootState) => state.products.selectedProduct)
  const selectedProvider = useSelector((state: RootState) => state.providers.selectedProvider)
  const selectedUser = useSelector((state: RootState) => state.users.selectedUser)
  const selectedPromotion = useSelector((state: RootState) => state.promotions.selectedPromotion)

  const [confirmDelete, setConfirmDelete] = useState(false)

  let itemToDelete: string | undefined
  switch (deleteType as ItemType) {
    case 'product':
      itemToDelete = selectedProduct?.name
      break
    case 'category':
      itemToDelete = selectedCategory?.name
      break
    case 'provider':
      itemToDelete = selectedProvider?.alias
      break
    case 'user':
      itemToDelete = selectedUser?.user_name
      break
    case 'promotion':
      itemToDelete = 'la promoción seleccionada'
      break
  }

  async function deleteItem() {
    if (!itemToDelete) return
    switch (deleteType as ItemType) {
      case 'product':
        if (selectedProduct) {
          await productService.deleteProduct(String(selectedProduct.id))

          addToast({
            title: 'Producto eliminado',
            description: `El producto "${itemToDelete}" ha sido eliminado correctamente.`,
            color: 'danger',
            variant: 'bordered',
            shouldShowTimeoutProgress: true
          })

          console.log('Product deleted successfully')
        }
        break
      case 'category':
        if (selectedCategory) {
          await categoryService.deleteCategory(selectedCategory.id)
          console.log('Category deleted successfully')
        }
        break
      case 'brand':
        //await supabase.from('brands').delete().eq('id', itemId)
        break
      case 'provider':
        console.log('Borrando:', selectedProvider)
        if (selectedProvider) {
          await providerService.deleteProvider(selectedProvider.id)
        }
        break
      case 'user':
        if (selectedUser) {
          await userService.deleteUser(selectedUser.id)
        }
        break
      case 'promotion':
        if (selectedPromotion) {
          await promotionService.deletePromotion(selectedPromotion.id)
        }
    }
    onOpenChangeDelete()
  }

  let subcategories = 0
  if (deleteType === 'category' && selectedCategory) {
    subcategories = categories.filter((cat) => cat.parent === selectedCategory.id).length
  }

  const canBeDeleted = () => {
    switch (deleteType) {
      case 'category':
        // if ((selectedCategory?.total_products ?? 0) > 0) return false
        // if (subcategories > 0) return false
        return true
        break
      case 'product':
        if ((selectedProduct?.stock ?? 0) > 0) {
          return confirmDelete
        } else {
          return true
        }
        break
      case 'provider':
        return true
        break
      case 'user':
        if (!selectedUser) return false

        if (selectedUser.role === 'admin') {
          return false
        }
        if (selectedUser.is_active === true) {
          return false
        }
        return true
        break
      case 'promotion':
        if (!selectedPromotion) return false
        return confirmDelete
        break
      default:
        return true
    }
  }

  const isPromotionActive = (() => {
    if (deleteType !== 'promotion') return false
    const promoValidUntil = selectedPromotion?.valid_until
    if (!promoValidUntil) return false

    const today = new Date()
    const validUntil = new Date(promoValidUntil)
    return today <= validUntil
  })()

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

              {deleteType === 'user' && (selectedUser?.is_active ?? false) && (
                <Alert
                  color='primary'
                  icon={<ShieldAlert />}
                  hideIconWrapper
                  className='mt-4'
                  classNames={{ title: 'font-bold', description: 'text-xs', alertIcon: 'fill-none', iconWrapper: 'bg-blue-100' }}
                  description={
                    <>
                      EL usuario esta <strong>activo</strong>, para poder eliminarlo, debes desactivarlo primero. Al eliminarlo, el usuario
                      ya no podrá iniciar sesión. <strong>Esto no se puede deshacer. </strong>
                    </>
                  }
                  title='Advertencia'
                />
              )}

              {deleteType === 'user' && !selectedUser?.is_active && (
                <Alert
                  color='danger'
                  icon={<ShieldAlert />}
                  hideIconWrapper
                  className='mt-4'
                  classNames={{ title: 'font-bold', description: 'text-xs', alertIcon: 'fill-none', iconWrapper: 'bg-blue-100' }}
                  description={
                    <>
                      Al eliminar, un usuario ya no podrá iniciar sesión. todos sus registros quedaran guardados.{' '}
                      <strong>Esto no se puede deshacer. </strong>
                    </>
                  }
                  title='Advertencia'
                />
              )}

              {isPromotionActive && (
                <Alert
                  color='danger'
                  icon={<ShieldAlert />}
                  hideIconWrapper
                  className='mt-4'
                  classNames={{ title: 'font-bold', description: 'text-xs', alertIcon: 'fill-none', iconWrapper: 'bg-blue-100' }}
                  description={
                    <>
                      Esta promoción esta vigente, si la eliminas ya no podrá ser utilizada, puedes desactivarla si quieres conservar los
                      datos, <strong>esto no se puede deshacer</strong>
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
