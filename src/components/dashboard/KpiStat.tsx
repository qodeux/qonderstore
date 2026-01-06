import { Button, Card, Chip, cn } from '@heroui/react'
import { MoveDownRight, MoveRight, MoveUpRight, type LucideIcon } from 'lucide-react'
import { setSelectedModule } from '../../store/slices/dashboardSlice'
import { useAppDispatch } from '../../store/store'

export type KpiStatProps = {
  title: string
  slug: string
  value: number
  change: string
  changeType: 'positive' | 'neutral' | 'negative'
  icon: LucideIcon
}

const KpiStat = ({ title, slug, value, change, changeType, icon: Icon }: KpiStatProps) => {
  const dispatch = useAppDispatch()
  return (
    <Card className='dark:border-default-100 border border-transparent'>
      <div className='flex p-4 items-center  relative'>
        <div className={cn('mt-1 flex h-10 w-10 items-center justify-center rounded-md', 'bg-success-50')}>
          <Icon size={24} />
        </div>

        <div className='flex flex-col gap-y-2'>
          <dt className='text-small text-default-500 mx-4 font-medium'>{title}</dt>
          <dd className='text-default-700 px-4 text-2xl font-semibold'>{value}</dd>
        </div>

        <Chip
          className='absolute right-4 bottom-4'
          classNames={{
            content: 'font-semibold text-[0.65rem]'
          }}
          color={changeType === 'positive' ? 'success' : changeType === 'neutral' ? 'primary' : 'danger'}
          radius='sm'
          size='sm'
          startContent={
            changeType === 'positive' ? (
              <MoveUpRight className='text-success' />
            ) : changeType === 'neutral' ? (
              <MoveRight className='text-primary' />
            ) : (
              <MoveDownRight className='text-danger' />
            )
          }
          variant='flat'
        >
          {change}
        </Chip>
      </div>

      <div className='bg-default-100'>
        <Button
          fullWidth
          className='text-default-500 flex justify-start text-xs data-pressed:scale-100'
          radius='none'
          variant='light'
          onPress={() => dispatch(setSelectedModule(slug))}
        >
          Ver detalles
        </Button>
      </div>
    </Card>
  )
}
export default KpiStat
