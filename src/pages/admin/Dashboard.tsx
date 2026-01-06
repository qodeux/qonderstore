import { Card, Select, SelectItem, Tab, Tabs, type Selection } from '@heroui/react'
import { Package } from 'lucide-react'
import { useState } from 'react'
import KpiStat, { type KpiStatProps } from '../../components/dashboard/KpiStat'
import ClusterMapChart from '../../components/dashboard/charts/ClusterMapChart'
import LollipopByDayChart from '../../components/dashboard/charts/LolipopChart'
import PieChart from '../../components/dashboard/charts/PieChart'
import type { SalesDay } from '../../components/dashboard/charts/SalesMonitoringChart'
import SalesMonitoringChart from '../../components/dashboard/charts/SalesMonitoringChart'
import type { UsersDay } from '../../components/dashboard/charts/UsersActiveVsNewChart'
import UsersActiveVsNewChart from '../../components/dashboard/charts/UsersActiveVsNewChart'
import VerticalBarBulletChart from '../../components/dashboard/charts/VerticalBarBulletChart'
import { useAppSelector } from '../../store/store'

const Dashboard = () => {
  const animals = [
    { key: 'day', label: 'Día' },
    { key: 'week', label: 'Semana' },
    { key: 'month', label: 'Mes' },
    { key: 'custom', label: 'Personalizado' }
  ]

  const [period, setPeriod] = useState<Selection>(new Set(['day']))

  const { selectedModule } = useAppSelector((state) => state.dashboard)

  const data = [
    {
      title: 'Productos',
      slug: 'products',
      value: 5400,
      change: '33%',
      changeType: 'positive',
      icon: Package
    },
    {
      title: 'Usuarios',
      slug: 'users',
      value: 5400,
      change: '33%',
      changeType: 'positive',
      icon: Package
    },

    {
      title: 'Paquetes enviados',
      slug: 'shipments',
      value: 5400,
      change: '0.0%',
      changeType: 'neutral',
      icon: Package
    },
    {
      title: 'Ventas totales',
      slug: 'sales',
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

  const deviceData = [
    { value: 100, category: 'PC' },
    { value: 60, category: 'Móvil' },
    { value: 30, category: 'Tablet' }
  ]

  const mapData = [
    { title: 'Ciudad de México', latitude: 19.4271, longitude: -99.1276 },
    { title: 'Guadalajara', latitude: 20.6597, longitude: -103.3496 },
    { title: 'Monterrey', latitude: 25.6866, longitude: -100.3161 },
    { title: 'Puebla', latitude: 19.0414, longitude: -98.2063 },
    { title: 'Mérida', latitude: 20.9674, longitude: -89.5926 }
  ]

  const dailyShipments = [
    { day: '2026-01-01', count: 12 },
    { day: '2026-01-02', count: 5 },
    { day: '2026-01-03', count: 18 },
    { day: '2026-01-04', count: 9 },
    { day: '2026-01-05', count: 14 },
    { day: '2026-01-06', count: 7 },
    { day: '2026-01-07', count: 21 },
    { day: '2026-01-08', count: 4 },
    { day: '2026-01-09', count: 16 },
    { day: '2026-01-10', count: 11 }
  ]

  const dataSales: SalesDay[] = Array.from({ length: 365 + 182 }, (_, i) => {
    const d = new Date(2026, 0, 1)
    d.setDate(d.getDate() + i)

    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const day = `${yyyy}-${mm}-${dd}`

    // “Estacionalidad” suave: fines de semana + tendencia ligera
    const dow = d.getDay() // 0=Dom ... 6=Sáb
    const weekendBoost = dow === 0 || dow === 6 ? 1.18 : 1.0
    const trend = 1 + i * 0.0006

    // base shipments 4..22 aprox (con estacionalidad)
    const baseShipments = 6 + Math.round(8 * Math.abs(Math.sin(i / 11)) + 4 * Math.abs(Math.cos(i / 23)))
    const shipments = Math.max(1, Math.min(28, Math.round(baseShipments * weekendBoost)))

    // avg ticket 750..2200 aprox (con variación)
    const avgTicketRaw = 900 + 450 * Math.abs(Math.sin(i / 17)) + 250 * Math.abs(Math.cos(i / 29)) + (dow === 5 ? 120 : 0)
    const avgTicket = Math.round(avgTicketRaw)

    // totalSales correlacionado con shipments * avgTicket + algo de ruido
    const noise = (Math.sin(i * 1.7) + Math.cos(i * 0.9)) * 0.06 + 1 // ~0.88..1.12
    const totalSales = Math.round(shipments * avgTicket * 0.95 * trend * noise)

    return { day, totalSales, shipments, avgTicket }
  })

  const usersData: UsersDay[] = [
    { day: '2026-01-01', activeUsers: 320, newUsers: 45 },
    { day: '2026-01-02', activeUsers: 340, newUsers: 38 },
    { day: '2026-01-03', activeUsers: 360, newUsers: 52 },
    { day: '2026-01-04', activeUsers: 355, newUsers: 41 },
    { day: '2026-01-05', activeUsers: 380, newUsers: 60 },
    { day: '2026-01-06', activeUsers: 395, newUsers: 55 },
    { day: '2026-01-07', activeUsers: 410, newUsers: 68 }
  ]

  const moduleStats = [
    {
      slug: 'products',
      tabs: ['Productos', 'Categorías'],
      charts: [<VerticalBarBulletChart data={topSellingProducts} />, <PieChart data={pieData} />]
    },
    {
      slug: 'users',
      value: 800,
      charts: [<UsersActiveVsNewChart data={usersData} height={520} defaultRange='week' />, <PieChart data={deviceData} />]
    },
    {
      slug: 'shipments',
      value: 1200,
      tabs: ['Envíos', 'Devoluciones'],
      charts: [
        <ClusterMapChart cities={mapData} />,
        <LollipopByDayChart
          data={dailyShipments}
          formatDayLabel={(iso) => iso.slice(5)} // "01-01", "01-02"...
        />
      ]
    },
    { slug: 'sales', value: 5400, charts: [<SalesMonitoringChart data={dataSales} />] }
  ]

  return (
    <section className='flex flex-col gap-4 h-full'>
      <dl className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4'>
        {data.map((item) => (
          <KpiStat {...(item as KpiStatProps)} key={item.title} />
        ))}
      </dl>

      {selectedModule !== 'sales' && (
        <section className='grid grid-cols-2'>
          {(() => {
            const mod = moduleStats.find((m) => m.slug === selectedModule)
            if (!mod?.tabs?.length) return <div></div>

            return (
              <Tabs aria-label='Options' color='primary' variant='bordered'>
                {mod.tabs.map((tabTitle) => (
                  <Tab
                    key={tabTitle.toLowerCase()}
                    title={
                      <div className='flex items-center space-x-2'>
                        <Package />
                        <span>{tabTitle}</span>
                      </div>
                    }
                  />
                ))}
              </Tabs>
            )
          })()}

          <div className='text-right'>
            <Select className='w-40' label='Periodo' size='sm' selectedKeys={period} onSelectionChange={setPeriod}>
              {animals.map((animal) => (
                <SelectItem key={animal.key}>{animal.label}</SelectItem>
              ))}
            </Select>
          </div>
        </section>
      )}

      <section className={`grid grid-cols-1  gap-4  grow ${selectedModule !== 'sales' && 'sm:grid-cols-2'}`}>
        {(() => {
          const mod = moduleStats.find((m) => m.slug === selectedModule)
          return (
            <>
              <Card className='flex items-center justify-center p-4'>{mod?.charts?.[0]}</Card>
              {mod?.charts?.[1] && <Card className='flex items-center justify-center p-4'>{mod?.charts?.[1]}</Card>}
            </>
          )
        })()}
      </section>
    </section>
  )
}

export default Dashboard
