import { Modal, ModalBody, ModalContent } from '@heroui/react'
import { Rating } from '@smastrom/react-rating'
import { useProductRatings } from '../../../hooks/useProductRatings'
import { useAppSelector } from '../../../store/store'
import { formatDate } from '../../../utils/date'

type Props = {
  isOpen: boolean
  onOpenChange: () => void
  productId: number
  averageRating: number
  totalRatings: number
}

const ViewRatingsModal = ({ isOpen, onOpenChange, productId, averageRating, totalRatings }: Props) => {
  useProductRatings({ productId }) // Example usage of a custom hook to fetch product ratings

  const { productRatings } = useAppSelector((state) => state.products)

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size='md'
      backdrop='blur'
      classNames={{
        base: 'pt-6 pb-2'
      }}
    >
      <ModalContent>
        <ModalBody>
          <section className=' text-center flex items-center gap-4'>
            <h2 className='text-5xl font-bold'>{averageRating.toFixed(1)}</h2>
            <div className='text-left'>
              <Rating value={averageRating} readOnly className='max-w-42' />
              <p className='text-xs '>
                {totalRatings} {totalRatings > 1 ? 'Calificaciones' : 'Calificación'}
              </p>
            </div>
          </section>
          <section>
            <h3 className='font-semibold text-xl'>Comentarios de usuarios</h3>
            {productRatings && productRatings.length > 0 && (
              <section className='max-h-96 overflow-y-auto pr-2'>
                {productRatings.map((rating, index) => {
                  if (rating.rating_comment && rating.rating_comment.trim() === '') return
                  return (
                    <div
                      key={`rating-${rating.id}`}
                      className={`${index === productRatings.length - 1 ? '' : 'border-b border-gray-300'} py-2`}
                    >
                      <div className='flex items-center justify-between'>
                        <span>{formatDate(rating.created_at)}</span>
                        <Rating value={rating.rating_score} readOnly className='mt-1 max-w-24' />
                      </div>
                      <p>{rating.rating_comment}</p>
                    </div>
                  )
                })}
              </section>
            )}

            {/* <div>
              <p className='text-sm mt-4'>
                Has comprado este producto 1 vez y aún no lo has calificado, gana puntos por dejar una opinión y ayúdanos a mejorar.
              </p>
              <Button variant='solid' className='mt-2'>
                Calificar producto
              </Button>
            </div> */}
          </section>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default ViewRatingsModal
