import React from 'react'
import { Route, Routes } from 'react-router'

import ProtectedRoute from '../components/ProtectedRoute'
import AdminLayout from '../layouts/AdminLayout'
import FrontwebLayout from '../layouts/FrontwebLayout'
import NotFound from '../pages/404'
import Categories from '../pages/admin/Categories'
import Dashboard from '../pages/admin/Dashboard'
import Products from '../pages/admin/Products'
import Promos from '../pages/admin/Promos'
import Providers from '../pages/admin/Providers'
import Requests from '../pages/admin/Requests'
import Users from '../pages/admin/Users'
import Login from '../pages/auth/Login'
import Home from '../pages/Home'
import Store from '../pages/Store'

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path='/' element={<FrontwebLayout />}>
      <Route index element={<Home />} />
      <Route path='/login' element={<Login />} />
      <Route path='*' element={<NotFound />} />
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
      <Route path='*' element={<NotFound />} />
    </Route>

    <Route
      path='/admin'
      element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<Dashboard />} />
      <Route path='dashboard' element={<Dashboard />} />
      <Route path='categorias' element={<Categories />} />
      <Route path='productos' element={<Products />} />
      <Route path='promociones' element={<Promos />} />
      <Route path='proveedores' element={<Providers />} />
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
  </Routes>
)

export default AppRoutes
