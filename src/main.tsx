import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import { Layout } from './Layout'
import { AcasaPage } from './pages/AcasaPage'
import { CartePage } from './pages/CartePage'
import { CartiPage } from './pages/CartiPage'
import { LoginPage } from './pages/LoginPage'
import { RezervarilePage } from './pages/RezervarilePage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<AcasaPage />} />
          <Route path="carti" element={<CartiPage />} />
          <Route path="carti/:specialistId" element={<CartePage />} />
          <Route path="rezervarile-mele" element={<RezervarilePage />} />
          <Route path="login" element={<LoginPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
