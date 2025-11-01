import { Card, CardFooter } from '@heroui/react'
import { Link } from 'react-router'
import type { Category } from '../../schemas/category.schema'
import PresignedImage from '../common/cloudflare-r2/PresignedImage'

type CategoryItemProps = {
  category: Category
}

const CategoryItem = ({ category }: CategoryItemProps) => {
  return (
    <Card key={category.slug_id} shadow='sm' isPressable className='relative aspect-square overflow-hidden border border-neutral-400 p-0'>
      <Link to={`/tienda/categoria/${category.slug_id}`}>
        <figure>
          {category.main_image ? (
            <PresignedImage keyPath={category.main_image} expires={180} />
          ) : (
            //className='absolute inset-0 w-full h-full object-cover'
            <div className='absolute inset-0 bg-gradient-to-b from-neutral-200 to-neutral-600' />
          )}
        </figure>
      </Link>

      {/* Overlay oscuro de abajo hacia arriba */}
      <div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/100 via-black/40 to-transparent' />

      {/* Contenido inferior izquierda */}
      <CardFooter className='absolute bottom-0 left-0 right-0 z-10 flex flex-col items-start bg-transparent text-white p-3'>
        <h4 className='text-xl font-bold leading-tight text-white'>{category.name}</h4>
        <p className='text-lg leading-tight text-neutral-200'>{category.total_products} Productos</p>
      </CardFooter>
    </Card>
  )
}

export default CategoryItem
