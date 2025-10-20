import { Outlet } from 'react-router'
import AdminFooter from '../components/common/AdminFooter'
import AdminSidebar from '../components/common/AdminSidebar'
import Header from '../components/common/Header'
import { useProviders } from '../hooks/useProviders'

const AdminLayout = () => {
  useProviders()

  return (
    <main className='flex min-h-screen flex-col'>
      <Header />
      {/* Área de trabajo exacta: alto del viewport menos el header (pt-16 = 64px) */}
      <section className='flex h-[calc(100vh)] flex-row bg-gray-100 pt-16 overflow-hidden'>
        {/* Sidebar fijo a toda la altura */}
        <div className='flex-shrink-0'>
          <AdminSidebar isOpen={true} />
        </div>

        {/* Contenedor principal: sin scroll aquí */}
        <div className='relative flex min-h-0 flex-1 flex-col overflow-hidden'>
          {/* Aquí sí hay scroll interno */}
          <div className='flex-1 overflow-auto p-6 '>
            <Outlet />
          </div>

          <AdminFooter />
        </div>
      </section>
    </main>
  )
}

export default AdminLayout
