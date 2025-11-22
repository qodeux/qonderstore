import { Button, Chip, Textarea } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Rating } from '@smastrom/react-rating'
import { AnimatePresence, motion } from 'framer-motion'
import { CircleCheckBig, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm, type Resolver } from 'react-hook-form'
import { productRatingSchema, type ProductRating } from '../../../schemas/storeOrders.schema'
import { storeOrderService } from '../../../services/storeOrderService'
import type { CartItem } from '../../../store/slices/cartSlice'
import { useAppSelector } from '../../../store/store'
import { formatDate } from '../../../utils/date'
import PresignedImage from '../../common/cloudflare-r2/PresignedImage'

type Props = {
  item: CartItem
}
const OrderProductReviewForm = ({ item }: Props) => {
  const { selectedOrder } = useAppSelector((state) => state.storeOrders)
  const { productRatings } = useAppSelector((state) => state.users)

  //Revisar si el producto ya tiene una reseña
  const existingRating = productRatings?.find((rating) => rating.product_id === item.id && rating.order_id === selectedOrder?.id)

  const { control, handleSubmit, watch, setValue } = useForm<ProductRating>({
    resolver: zodResolver(productRatingSchema) as Resolver<ProductRating>,
    mode: 'all',
    defaultValues: {
      order_id: selectedOrder?.id,
      product_id: item?.id,
      rating_score: existingRating ? existingRating.rating_score : 0,
      rating_comment: existingRating ? existingRating.rating_comment : ''
    }
  })
  const [showReviewForm, setShowReviewForm] = useState(false)
  const watchComment = watch('rating_comment')

  console.log(productRatings)

  const handleSubmitReview = handleSubmit(
    async (data) => {
      console.log('Review data:', data)

      try {
        await storeOrderService.createProductRating(data)
      } catch (error) {
        console.error('Error submitting product review:', error)
      }
    },
    (errors) => {
      console.log('Review errors:', errors)
    }
  )

  const cancelReview = () => {
    // lógica para cancelar la reseña
    setShowReviewForm(false)
    setValue('rating_comment', '')
  }

  const toggleReviewForm = () => {
    // lógica para mostrar/ocultar el formulario de reseña
    setShowReviewForm(!showReviewForm)
  }

  return (
    <form className='flex gap-2 overflow-hidden' onSubmit={handleSubmitReview}>
      <figure className='aspect-square w-1/3 bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-500 text-xs rounded-xl overflow-hidden relative'>
        {item.image ? <PresignedImage keyPath={item.image} expires={300} /> : 'Sin imagen'}
        <Chip className='absolute top-0 -right-0 rounded-bl-xl' radius='none' color='success' size='sm'>
          +5 puntos
        </Chip>
      </figure>
      <section className='flex flex-col w-2/3 items-start relative '>
        <h3 className='md:text-lg font-semibold'>{item.title}</h3>
        <Controller
          name={`rating_score`}
          control={control}
          render={({ field }) => <Rating {...field} className='pl-8' readOnly={!!existingRating} />}
        />
        {!existingRating ? (
          <footer className='flex justify-end w-full gap-2 items-center mt-1 '>
            {!watchComment ? (
              <Button size='sm' onPress={toggleReviewForm} variant='light'>
                Agregar reseña
              </Button>
            ) : (
              <span className='text-xs text-gray-500 '>Reseña agregada</span>
            )}
            <Button size='sm' color='primary' variant='ghost' type='submit'>
              Calificar
              <CircleCheckBig className='p-0.5' />
            </Button>
          </footer>
        ) : (
          <footer className='flex items-center justify-end w-full gap-2 mt-1'>
            <div className=' text-xs  font-medium flex flex-col text-right'>
              {formatDate(existingRating?.created_at)} <span>Reseña enviada</span>{' '}
            </div>
            {existingRating?.rating_comment && (
              <div>
                <MessageCircle />
              </div>
            )}
          </footer>
        )}
        <AnimatePresence>
          {showReviewForm && (
            <motion.div
              initial={{ opacity: 0, y: 120 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 120 }}
              transition={{ duration: 0.2, type: 'tween' }}
              className='absolute bg-white text-right w-full h-full  space-y-3'
            >
              <Controller
                name={`rating_comment`}
                control={control}
                render={({ field }) => (
                  <Textarea
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    maxRows={2}
                    radius='sm'
                    placeholder='Escribe tu reseña...'
                    classNames={{ inputWrapper: 'pe-0' }}
                  />
                )}
              />
              <footer className='flex gap-2 justify-end'>
                <Button size='sm' onPress={cancelReview} color='danger' variant='light'>
                  Cancelar
                </Button>
                {watchComment !== '' && (
                  <Button size='sm' color='primary' onPress={toggleReviewForm} variant='ghost'>
                    Guardar
                  </Button>
                )}
              </footer>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </form>
  )
}

export default OrderProductReviewForm
