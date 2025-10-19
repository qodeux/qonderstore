import { Outlet } from 'react-router'
import Footer from '../components/common/Footer'
import Header from '../components/common/Header'

const FrontwebLayout = () => {
  return (
    <main className='flex flex-col min-h-screen'>
      <Header />
      <section className='flex-grow container mx-auto px-4 py-8 '>
        <Outlet />
      </section>
      <Footer />
    </main>
  )
}

export default FrontwebLayout
