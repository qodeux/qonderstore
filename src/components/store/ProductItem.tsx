import { Button, Card, CardBody, CardFooter, CardHeader } from '@heroui/react'
import { Rating } from '@smastrom/react-rating'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router'
import type { ProductWithPromo } from '../../store/selectors/productsWithPromo'
import { addItem } from '../../store/slices/cartSlice'
import { setCartOpen } from '../../store/slices/uiSlice'
import { formatMoney } from '../../utils/money'
import PresignedImage from '../common/cloudflare-r2/PresignedImage'

type ProductItemProps = {
  item: ProductWithPromo
  isRelated?: boolean
}

const ProductItem = ({ item, isRelated }: ProductItemProps) => {
  const dispatch = useDispatch()

  const rating = 4
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

  return (
    <Card key={item.id} className='m-0 border-1 border-neutral-400  shadow-sm' radius='sm' shadow='none'>
      <CardHeader className='p-0'>
        <Link to={`${isRelated ? '/tienda/' : ''}producto/${item.slug}`} className='contents'>
          <div className='w-full aspect-square bg-neutral-100 border-b border-neutral-400 flex items-center justify-center text-neutral-500 text-xs'>
            {item.main_image ? <PresignedImage keyPath={item.main_image} expires={600} /> : 'Sin imagen'}
          </div>
        </Link>
      </CardHeader>

      <CardBody className='px-3 py-3 text-neutral-900 text-sm '>
        <p className='font-medium text-lg mb-2 truncate'>{item.name}</p>

        <div>
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
