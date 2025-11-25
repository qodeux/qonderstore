import { useSelector } from 'react-redux'
import { selectProductsWithBestPromo, type ProductWithPromo } from '../../store/selectors/productsWithPromo'
import { useAppSelector } from '../../store/store'
import ProductItem from '../store/ProductItem'

const Favs = () => {
  const { favs } = useAppSelector((state) => state.auth)
  const products = useSelector(selectProductsWithBestPromo)

  const favoriteProducts: ProductWithPromo[] = products.filter((product: ProductWithPromo) =>
    favs.find((fav) => fav.product_id === product.id)
  )

  return (
    <div>
      {favs.length === 0 ? (
        <p className='text-gray-600'>No tienes productos favoritos aún.</p>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
          {favoriteProducts.map((product) => (
            <ProductItem key={product.id} item={product} isRelated />
          ))}
        </div>
      )}
    </div>
  )
}

export default Favs
