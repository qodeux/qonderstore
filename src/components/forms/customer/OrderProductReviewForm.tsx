import { Button, Chip, Textarea } from '@heroui/react'
import { Rating } from '@smastrom/react-rating'
import { AnimatePresence, motion } from 'framer-motion'
import { CircleCheckBig } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { CartItem } from '../../../store/slices/cartSlice'
import PresignedImage from '../../common/cloudflare-r2/PresignedImage'

type Props = {
  item: CartItem
}
const OrderProductReviewForm = ({ item }: Props) => {
  const { control, handleSubmit, watch, setValue } = useForm({
    mode: 'all',
    defaultValues: {
      review_product: item?.id,
      rating_product: 0,
      review_comment: ''
    }
  })
  const [showReviewForm, setShowReviewForm] = useState(false)
  const watchComment = watch('review_product')

  const handleSubmitReview = handleSubmit((data) => {
    console.log('Review data:', data)
  })

  const cancelReview = () => {
    // lógica para cancelar la reseña
    setShowReviewForm(false)
    setValue('review_product', '')
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
        <Controller name={`rating_product`} control={control} render={({ field }) => <Rating {...field} className='pl-8' />} />
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
                name={`review_comment`}
                control={control}
                render={({ field }) => (
                  <Textarea {...field} maxRows={2} radius='sm' placeholder='Escribe tu reseña...' classNames={{ inputWrapper: 'pe-0' }} />
                )}
              />
              <footer className='flex gap-2 justify-end'>
                <Button size='sm' onPress={cancelReview} color='danger' variant='light'>
                  Cancelar
                </Button>
                {watchComment && (
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
