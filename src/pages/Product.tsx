import { Button, NumberInput, Progress, Select, SelectItem } from '@heroui/react'
import { Rating } from '@smastrom/react-rating'
import { ChevronRight, HeartPlus, Minus, Plus } from 'lucide-react'

import '@smastrom/react-rating/style.css'
import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router'
import Lightbox from 'yet-another-react-lightbox'
import Inline from 'yet-another-react-lightbox/plugins/inline'
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails'
import PresignedImage from '../components/common/cloudflare-r2/PresignedImage'
import ProductItem from '../components/store/ProductItem'
import { usePresignedImages } from '../hooks/usePresignedImages'
import { makeSelectProductWithPromoBySlug, selectProductsWithBestPromo } from '../store/selectors/productsWithPromo'
import type { RootState } from '../store/store'
import { formatMoney } from '../utils/money'

const Product = () => {
  const { slug } = useParams()

  const categories = useSelector((state: RootState) => state.categories.items)
  const brands = useSelector((state: RootState) => state.products.brands)
  const selectBySlug = makeSelectProductWithPromoBySlug(slug ?? '')
  const product = useSelector(selectBySlug)

  const products = useSelector(selectProductsWithBestPromo)

  const rating = 4
  const [quantity, setQuantity] = useState(1)
  const price = product?.price ?? 0
  const [total, setTotal] = useState(0)

  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [index, setIndex] = useState(0)

  // Memoiza las imágenes base
  const images = useMemo(() => product?.images ?? [], [product?.images])

  const mainImage = product?.main_image ?? null

  // Memoiza el orden de las imágenes
  const orderedImages = useMemo(() => {
    return mainImage ? [mainImage, ...images.filter((img: string) => img !== mainImage)] : images
  }, [images, mainImage])

  // Usa el hook de presigned URLs (depende de images)
  const { urls } = usePresignedImages(images, 200)

  // Memoiza los slides del Lightbox
  const slides = useMemo(
    () =>
      orderedImages.map((key) => ({
        src: urls[key] || '/placeholder.png'
      })),
    [urls, orderedImages]
  )

  const handleSetQuantity = (action: 'add' | 'remove') => {
    if (action === 'add') {
      setQuantity((prev) => prev + 1)
    } else {
      setQuantity((prev) => (prev > 1 ? prev - 1 : 1))
    }
  }

  useEffect(() => {
    setTotal(price * quantity)
  }, [quantity, price])

  useEffect(() => {
    // Aquí podrías cargar los datos del producto usando el slug
    // Por ahora, solo simulamos una carga
    console.log('Cargando datos del producto para el slug:', slug)
  }, [slug])

  if (!product) {
    return <div>Producto no encontrado</div>
  }

  return (
    <>
      <section className='container flex flex-col md:flex-row gap-8 mx-auto'>
        <div className='w-full md:w-1/2'>
          <>
            <div className='relative border-1 border-gray-400 rounded-lg overflow-hidden'>
              {!product.main_image && (
                <figure className='w-full aspect-square bg-neutral-100 rounded-xl border-b border-neutral-300 flex items-center justify-center text-neutral-500 text-lg'>
                  Sin imagen
                </figure>
              )}

              {orderedImages.length === 1 ? (
                <figure onClick={() => setLightboxOpen(true)}>
                  <PresignedImage keyPath={product.main_image ?? ''} expires={180} />
                </figure>
              ) : (
                orderedImages.length > 1 && (
                  <Lightbox
                    index={index}
                    slides={slides}
                    plugins={[Inline]}
                    on={{
                      view: ({ index: current }) => {
                        if (lightboxOpen === false) setIndex(current)
                      },
                      click: () => setLightboxOpen(true)
                    }}
                    carousel={{ padding: 0, spacing: 0, imageFit: 'cover' }}
                    inline={{
                      style: { width: '100%', maxWidth: '900px', aspectRatio: '1/1', margin: '0 auto' }
                    }}
                    styles={{
                      button: {
                        color: 'black',
                        filter: 'none',
                        padding: 1,
                        background: 'white',
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
                      },
                      container: { backgroundColor: 'white' }
                    }}
                  />
                )
              )}
            </div>
            <Lightbox
              open={lightboxOpen}
              close={() => setLightboxOpen(false)}
              index={index}
              slides={slides}
              on={{
                view: ({ index: current }) => {
                  if (lightboxOpen === true) setIndex(current)
                }
              }}
              animation={{ fade: 0 }}
              controller={{ closeOnPullDown: true, closeOnBackdropClick: true }}
              plugins={[Thumbnails]}
            />
          </>
        </div>
        <div className='w-full md:w-1/2 space-y-4'>
          <header>
            <div className='flex items-center gap-2'>
              <div className='flex flex-col'>
                <span className='text-lg'>{product.category}</span>
              </div>
              {product.subcategory && (
                <>
                  <ChevronRight size={16} />
                  <div className='flex flex-col'>
                    <span className='text-lg'>{categories.find((cat) => cat.id === Number(product.subcategory))?.name}</span>
                  </div>
                </>
              )}
            </div>
            <div className='flex items-center justify-between'>
              <h2 className='text-3xl md:text-4xl font-bold'>{product.name}</h2>
              <Button isIconOnly radius='full' size='md'>
                <HeartPlus size={36} className='m-2' />
              </Button>
            </div>
            {product.brand && (
              <div className='flex flex-col'>
                <span className='text-xl font-medium'>{brands.find((b) => b.id === product.brand)?.name}</span>
                <span className='text-xs font-medium'>Marca</span>
              </div>
            )}
          </header>
          <div className='flex items-center gap-8'>
            <div className='flex flex-col max-w-1/2 md:max-w-1/3'>
              <Rating className='pr-5' value={rating} />
              <span> Opiniones (999)</span>
            </div>
            <Progress
              aria-label='Disponibilidad'
              label='Quedan'
              size='sm'
              value={((product.stock ?? 0) * 10) / 2}
              showValueLabel
              className='w-full max-w-1/2  md:max-w-1/3'
              formatOptions={{ style: 'decimal' }}
              valueLabel={`${product.stock ?? 0} unidades`}
              color={product.stock && product.stock > 5 ? 'success' : 'danger'}
            />
          </div>
          <p>{product.description}</p>
          <div className='flex items-center justify-between'>
            <div className='flex flex-col'>
              <span className='text-3xl font-bold'>{formatMoney(price)}</span>
              <span>Precio</span>
            </div>
            {quantity > 1 && (
              <div className='flex flex-col'>
                <span className='text-3xl font-bold'>{formatMoney(total)}</span>
                <span className='text-right'>Total</span>
              </div>
            )}
          </div>
          <section className='flex flex-col lg:flex-row gap-6 md:gap-2'>
            <div className='flex items-center gap-2 w-full'>
              <div className='flex items-center max-w-fit'>
                <Button
                  isIconOnly
                  size='lg'
                  className='rounded-r-none bg-black text-white '
                  variant='ghost'
                  onPress={() => handleSetQuantity('remove')}
                >
                  <Minus />
                </Button>
                <NumberInput
                  size='sm'
                  maxLength={3}
                  aria-label='Cantidad'
                  minValue={1}
                  value={quantity}
                  onValueChange={(value) => setQuantity(value || 1)}
                  radius='none'
                  classNames={{ mainWrapper: 'w-14', input: 'text-center' }}
                  hideStepper
                />
                <Button
                  isIconOnly
                  size='lg'
                  className='rounded-l-none  bg-black text-white'
                  variant='ghost'
                  onPress={() => handleSetQuantity('add')}
                >
                  <Plus />
                </Button>
              </div>
              <Select label='Unidad' size='sm' className='w-full md:max-w-[160px]' defaultSelectedKeys={['oz']}>
                <SelectItem key='gr'>{quantity > 1 ? 'Gramos' : 'Gramo'}</SelectItem>
                <SelectItem key='oz'>{quantity > 1 ? 'Onzas' : 'Onza'}</SelectItem>
                <SelectItem key='lb'>{quantity > 1 ? 'Libras' : 'Libra'}</SelectItem>
              </Select>
            </div>
            <Button className='bg-black text-white hover:bg-neutral-800' size='lg'>
              Agregar
            </Button>
          </section>
        </div>
      </section>
      <section className='my-8 container mx-auto '>
        <header className='mb-4 '>
          <h3 className='text-2xl font-semibold '>Productos relacionados</h3>
        </header>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8'>
          {products
            .filter((p) => p.id !== product.id)
            .sort(() => 0.5 - Math.random())
            .slice(0, 4)
            .map((item) => (
              <ProductItem key={item.id} item={item} isRelated />
            ))}
        </div>
      </section>
    </>
  )
}

export default Product
