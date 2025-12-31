import { Card, Select, SelectItem, Tab, Tabs, type Selection } from '@heroui/react'
import { Package } from 'lucide-react'
import { useState } from 'react'
import KpiStat, { type KpiStatProps } from '../../components/dashboard/KpiStat'
import PieChart from '../../components/dashboard/charts/PieChart'
import VerticalBarBulletChart from '../../components/dashboard/charts/VerticalBarBulletChart'

const Dashboard = () => {
  const animals = [
    { key: 'day', label: 'Día' },
    { key: 'week', label: 'Semana' },
    { key: 'month', label: 'Mes' },
    { key: 'custom', label: 'Personalizado' }
  ]

  const [period, setPeriod] = useState<Selection>(new Set(['day']))

  const data = [
    {
      title: 'Productos',
      value: 5400,
      change: '33%',
      changeType: 'positive',
      icon: Package
    },
    {
      title: 'Usuarios',
      value: 5400,
      change: '33%',
      changeType: 'positive',
      icon: Package
    },

    {
      title: 'Paquetes enviados',
      value: 5400,
      change: '0.0%',
      changeType: 'neutral',
      icon: Package
    },
    {
      title: 'Ventas totales',
      value: 5400,
      change: '3.3%',
      changeType: 'negative',
      icon: Package
    }
  ]

  const topSellingProducts = [
    {
      name: 'Laptop Pro 15"',
      steps: 1240,
      pictureSettings: {
        src: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200&h=200&fit=crop'
      }
    },
    {
      name: 'Smartphone X',
      steps: 980,
      pictureSettings: {
        src: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&h=200&fit=crop'
      }
    },
    {
      name: 'Audífonos Wireless',
      steps: 860,
      pictureSettings: {
        src: 'https://images.unsplash.com/photo-1518445697863-8d7c5f0d4b19?w=200&h=200&fit=crop'
      }
    },
    {
      name: 'Smartwatch Active',
      steps: 640,
      pictureSettings: {
        src: 'https://images.unsplash.com/photo-1516575150278-77136aed6920?w=200&h=200&fit=crop'
      }
    },
    {
      name: 'Tablet Plus',
      steps: 420,
      pictureSettings: {
        src: 'https://images.unsplash.com/photo-1527698266440-12104e498b76?w=200&h=200&fit=crop'
      }
    }
  ] as const

  const pieData = [
    { value: 10, category: 'One' },
    { value: 9, category: 'Two' },
    { value: 6, category: 'Three' },
    { value: 5, category: 'Four' },
    { value: 4, category: 'Five' },
    { value: 3, category: 'Six' },
    { value: 1, category: 'Seven' }
  ]

  return (
    <section className='flex flex-col gap-4 h-full'>
      <dl className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4'>
        {data.map((item) => (
          <KpiStat {...(item as KpiStatProps)} key={item.title} />
        ))}
      </dl>

      <section className='grid grid-cols-2'>
        <Tabs aria-label='Options' color='primary' variant='bordered'>
          <Tab
            key='photos'
            title={
              <div className='flex items-center space-x-2'>
                <Package />
                <span>Photos</span>
              </div>
            }
          />
          <Tab
            key='music'
            title={
              <div className='flex items-center space-x-2'>
                <Package />
                <span>Music</span>
              </div>
            }
          />
          <Tab
            key='videos'
            title={
              <div className='flex items-center space-x-2'>
                <Package />
                <span>Videos</span>
              </div>
            }
          />
        </Tabs>

        <div className='text-right'>
          <Select className='w-40' label='Periodo' size='sm' selectedKeys={period} onSelectionChange={setPeriod}>
            {animals.map((animal) => (
              <SelectItem key={animal.key}>{animal.label}</SelectItem>
            ))}
          </Select>
        </div>
      </section>

      <section className='grid grid-cols-1 sm:grid-cols-2 gap-4  grow'>
        <Card className='flex items-center justify-center p-4'>
          Gráfico de productos
          <VerticalBarBulletChart data={topSellingProducts} height={'100%'} />
        </Card>
        <Card className=' flex items-center justify-center p-4'>
          Gráfico de distribucion
          <PieChart data={pieData} height={'100%'} />
        </Card>
      </section>
    </section>
  )
}

export default Dashboard
