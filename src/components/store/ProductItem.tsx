import { Button, Card, CardBody, CardFooter, CardHeader } from '@heroui/react'
import { Star } from 'lucide-react'
import { Link } from 'react-router'
import type { ProductWithPromo } from '../../store/selectors/productsWithPromo'
import { formatMoney } from '../../utils/money'
import PresignedImage from '../common/cloudflare-r2/PresignedImage'

type ProductItemProps = {
  item: ProductWithPromo
}
const ProductItem = ({ item }: ProductItemProps) => {
  return (
    <Card key={item.id} shadow='sm' className='border border-neutral-300'>
      <CardHeader className='p-0'>
        <Link to={`/producto/${item.slug}`} className='contents'>
          <div className='w-full aspect-square bg-neutral-100 border-b border-neutral-300 flex items-center justify-center text-neutral-500 text-xs'>
            {item.main_image ? <PresignedImage keyPath={item.main_image} expires={600} /> : 'Sin imagen'}
          </div>
        </Link>
      </CardHeader>

      <CardBody className='px-3 py-3 text-neutral-900 text-sm leading-tight'>
        <p className='font-medium text-lg'>{item.name}</p>

        <div className='flex items-center gap-1 text-[11px] text-neutral-800 mt-1'>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className='h-3 w-3 fill-black stroke-black' />
          ))}
        </div>

        <div>
          {item.hasPromotion ? (
            <div className='flex items-center justify-between'>
              <div className='flex items-center text-green-600'>Promo -{item.discountPercent}% </div>
              <div className='flex items-center justify-end gap-2'>
                <del className='text-sm  mt-1'>{formatMoney(item.price)}</del>
                <span className='text-2xl font-semibold  mt-1'>{formatMoney(item.finalPrice)}</span>
              </div>
            </div>
          ) : (
            <p className='text-2xl font-semibold text-neutral-900 mt-1 text-right'>{formatMoney(item.price)}</p>
          )}
        </div>
      </CardBody>

      <CardFooter className='flex items-center justify-end gap-2 px-3 pb-4 pt-0'>
        <Button radius='sm' className='bg-black text-white leading-none hover:bg-neutral-800'>
          Agregar
        </Button>
      </CardFooter>
    </Card>
  )
}

export default ProductItem
