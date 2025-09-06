import React from 'react'
import { Route, Routes } from 'react-router'

import FrontwebLayout from '../layouts/FrontwebLayout'
import NotFound from '../pages/404'
import Login from '../pages/auth/Login'
import BackOffice from '../pages/BackOffice'
import Home from '../pages/Home'
import Store from '../pages/Store'

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path='/' element={<FrontwebLayout />}>
      <Route index element={<Home />} />
      <Route path='/login' element={<Login />} />
      <Route path='/tienda' element={<Store />} />
      <Route path='/admin' element={<BackOffice />} />
      <Route path='*' element={<NotFound />} />
    </Route>
  </Routes>
)

export default AppRoutes
