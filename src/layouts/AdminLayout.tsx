import { Outlet } from 'react-router'
import AdminFooter from '../components/common/AdminFooter'
import AdminSidebar from '../components/common/AdminSidebar'
import Header from '../components/common/Header'
import { useProviders } from '../hooks/useProviders'

const AdminLayout = () => {
  useProviders()

  return (
    <main className='flex flex-col min-h-screen'>
      <Header />
      <section className='flex-grow bg-amber-100 flex flex-row overflow-hidden'>
        <AdminSidebar isOpen={true} />
        <div className='relative flex min-h-0 flex-1 flex-col '>
          <div className='p-6 flex-grow overflow-auto pb-20'>
            <Outlet />
          </div>
          <AdminFooter />
        </div>
      </section>
    </main>
  )
}

export default AdminLayout
