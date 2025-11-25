import { Button, Card, CardBody, CardFooter, CardHeader, Tooltip } from '@heroui/react'
import { Rating } from '@smastrom/react-rating'
import { motion } from 'framer-motion'
import { HeartMinus, HeartPlus } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router'
import { userService } from '../../services/userService'
import type { ProductWithPromo } from '../../store/selectors/productsWithPromo'
import { addItem } from '../../store/slices/cartSlice'
import { setCartOpen } from '../../store/slices/uiSlice'
import { useAppSelector } from '../../store/store'
import { formatMoney } from '../../utils/money'
import PresignedImage from '../common/cloudflare-r2/PresignedImage'

type ProductItemProps = {
  item: ProductWithPromo
  isRelated?: boolean
}

const ProductItem = ({ item, isRelated }: ProductItemProps) => {
  const dispatch = useDispatch()
  const { favs, user } = useAppSelector((state) => state.auth)

  const rating = 4

  const isFav = favs.some((fav) => fav.product_id === item.id)

  const handleAddToCart = () => {
    // Lógica para agregar el producto al carrito

    dispatch(
      addItem({
        id: item.id,
        title: item.name,
        quantity: 1,
        price: item.price,
        stock: item.stock,
        discount: item.hasPromotion ? item.discountAmount : 0,
        image: item.main_image,
        saleType: item.sale_type,
        units: item.units,
        base_unit: item.base_unit,
        basePrice: item.price
      })
    )
    dispatch(setCartOpen(true))
  }

  const handleAddtoFavs = async () => {
    try {
      await userService.addProductFav({
        product_id: item.id
      })
    } catch (error) {
      console.error('Error adding product to favorites:', error)
    }
  }
  const handleRemovefromFavs = async () => {
    if (!user) return
    try {
      await userService.removeProductFav({
        product_id: item.id,
        user_id: user.id
      })
    } catch (error) {
      console.error('Error removing product from favorites:', error)
    }
  }

  return (
    <Card key={item.id} className='my-1 border-1 border-neutral-400  shadow-sm' radius='sm' shadow='none'>
      <CardHeader className='p-0'>
        <Link to={`${isRelated ? '/tienda/' : ''}producto/${item.slug}`} className='contents'>
          <div className='w-full aspect-square bg-neutral-100 border-b border-neutral-400 flex items-center justify-center text-neutral-500 text-xs'>
            {item.main_image ? <PresignedImage keyPath={item.main_image} expires={600} /> : 'Sin imagen'}
          </div>
        </Link>
      </CardHeader>

      <CardBody className='px-3 py-3 text-neutral-900 text-sm '>
        <p className='font-medium text-lg mb-2 truncate'>{item.name}</p>

        <div className='flex justify-between items-center'>
          {isFav ? (
            <motion.div
              key={item.id + 'fav'}
              initial={{ scale: 0 }}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              exit={{ opacity: 0 }}
            >
              <Tooltip content='Quitar de favoritos' placement='bottom-start'>
                <Button isIconOnly className='' variant='solid' color='danger' size='sm' onPress={handleRemovefromFavs}>
                  <HeartMinus />
                </Button>
              </Tooltip>
            </motion.div>
          ) : (
            <motion.div
              key={item.id + 'Notfav'}
              initial={{ scale: 1 }}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              exit={{ opacity: 0 }}
            >
              <Tooltip content='Agregar a favoritos' placement='bottom-start'>
                <Button isIconOnly className='' variant='ghost' color='danger' size='sm' onPress={handleAddtoFavs}>
                  <HeartPlus />
                </Button>
              </Tooltip>
            </motion.div>
          )}

          {item.hasPromotion ? (
            <div className='flex items-center justify-end gap-2'>
              <div className='text-right'>
                <del className='text-sm  leading-0'>{formatMoney(item.price)}</del>
                <div className='text-xs text-green-600 leading-3'>Promo -{item.discountPercent.toFixed(0)}% </div>
              </div>
              <span className='text-2xl font-semibold'>{formatMoney(item.finalPrice)}</span>
            </div>
          ) : (
            <p className='text-2xl font-semibold text-neutral-900  text-right'>{formatMoney(item.price)}</p>
          )}
        </div>
      </CardBody>

      <CardFooter className='flex items-center justify-end gap-2 px-3 pb-4 pt-0'>
        <div>
          <Rating className='max-w-2/3' value={rating} />
          <span className='text-sm ml-1'>95 Opiniones</span>
        </div>
        <Button
          radius='sm'
          className='bg-black text-white leading-none hover:bg-neutral-800'
          onPress={handleAddToCart}
          isDisabled={item.stock === 0}
        >
          Agregar
        </Button>
      </CardFooter>
    </Card>
  )
}

export default ProductItem
