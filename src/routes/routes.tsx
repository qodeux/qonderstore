import React from 'react'
import { Route, Routes } from 'react-router'

import ProtectedRoute from '../components/ProtectedRoute'
import AdminLayout from '../layouts/AdminLayout'
import FrontwebLayout from '../layouts/FrontwebLayout'
import SidebarLayout from '../layouts/SidebarLayout'
import NotFound from '../pages/404'
import Brands from '../pages/admin/Brands'
import Categories from '../pages/admin/Categories'
import Dashboard from '../pages/admin/Dashboard'
import Products from '../pages/admin/Products'
import Promos from '../pages/admin/Promos'
import Providers from '../pages/admin/Providers'
import Requests from '../pages/admin/Requests'
import OrderDetails from '../pages/admin/store-orders/OrderDetails'
import PedidosTienda from '../pages/admin/StoreOrders'
import EnviosTienda from '../pages/admin/StoreShipments'
import SupplyOrders from '../pages/admin/SupplyOrders'
import Users from '../pages/admin/Users'
import Login from '../pages/auth/Login'
import CreateAccount from '../pages/CreateAccount'
import Account from '../pages/customer/Account'
import Home from '../pages/Home'
import FAQ from '../pages/public/FAQ'
import MailVerify from '../pages/public/MailVerify'
import Privacidad from '../pages/public/Privacidad'
import Terminos from '../pages/public/Terminos'
import Catalog from '../pages/store/Catalog'
import Category from '../pages/store/Category'
import Checkout from '../pages/store/Checkout'
import OrderConfirmation from '../pages/store/OrderConfirmation'
import Product from '../pages/store/Product'
import Store from '../pages/store/Store'

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path='/' element={<FrontwebLayout />}>
      <Route index element={<Home />} />
      <Route path='/login' element={<Login />} />
      <Route path='/terminos-y-condiciones' element={<Terminos />} />
      <Route path='/privacidad' element={<Privacidad />} />
      <Route path='/faq' element={<FAQ />} />
      <Route path='/verificacion-email' element={<MailVerify />} />
      <Route path='/crear-cuenta' element={<CreateAccount />} />
      <Route path='*' element={<NotFound />} />
    </Route>

    <Route
      path='/tienda/productos'
      element={
        <ProtectedRoute>
          <SidebarLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<Catalog />} />
    </Route>

    <Route
      path='/tienda'
      element={
        <ProtectedRoute>
          <FrontwebLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<Store />} />
      <Route path='categoria/:slug' element={<Category />} />
      <Route path='categoria/:category/producto/:slug' element={<Product />} />
      <Route path='producto/:slug' element={<Product />} />
      <Route path='checkout' element={<Checkout />} />
      <Route path='checkout/confirmacion/:oid' element={<OrderConfirmation />} />

      <Route path='*' element={<NotFound />} />
    </Route>

    <Route
      path='/admin'
      element={
        <ProtectedRoute allowedRoles={['admin', 'staff']}>
          <AdminLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<Dashboard />} />
      <Route path='dashboard' element={<Dashboard />} />
      <Route path='categorias' element={<Categories />} />
      <Route path='marcas' element={<Brands />} />
      <Route path='productos' element={<Products />} />
      <Route path='promociones' element={<Promos />} />
      <Route path='ordenes' element={<PedidosTienda />} />
      <Route path='orden/:id' element={<OrderDetails />} />
      <Route path='envios' element={<EnviosTienda />} />

      <Route
        path='proveedores'
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Providers />
          </ProtectedRoute>
        }
      />
      <Route
        path='pedidos-proveedores'
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <SupplyOrders />
          </ProtectedRoute>
        }
      />
      <Route path='solicitudes-acceso' element={<Requests />} />
      <Route
        path='usuarios'
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Users />
          </ProtectedRoute>
        }
      />
      <Route path='*' element={<NotFound />} />
    </Route>

    <Route
      path='/mi-cuenta'
      element={
        <ProtectedRoute>
          <FrontwebLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<Account />} />
    </Route>
  </Routes>
)

export default AppRoutes
