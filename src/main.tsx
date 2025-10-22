import { I18nProvider } from '@react-aria/i18n'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router'
import App from './App.tsx'
import './index.css'
import store from './store/store.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <I18nProvider locale='es-MX'>
          <App />
        </I18nProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>
)
