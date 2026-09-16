import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import { Layout } from './Layout'
import { AcasaPage } from './pages/AcasaPage'
import { CartePage } from './pages/CartePage'
import { CartiPage } from './pages/CartiPage'
import { InregistrarePage } from './pages/InregistrarePage'
import { ConfirmarePage } from './pages/ConfirmarePage'
import { ConfidentialitatePage } from './pages/ConfidentialitatePage'
import { DevinoCartePage } from './pages/DevinoCartePage'
import { LoginPage } from './pages/LoginPage'
import { ParolaUitataPage } from './pages/ParolaUitataPage'
import { ResetareParolaPage } from './pages/ResetareParolaPage'
import { RezervarilePage } from './pages/RezervarilePage'
import { SetariPage } from './pages/SetariPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<AcasaPage />} />
          <Route path="carti" element={<CartiPage />} />
          <Route path="carti/:specialistId" element={<CartePage />} />
          <Route path="rezervarile-mele" element={<RezervarilePage />} />
          <Route path="setari" element={<SetariPage />} />
          <Route path="devino-carte" element={<DevinoCartePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="inregistrare" element={<InregistrarePage />} />
          <Route path="parola-uitata" element={<ParolaUitataPage />} />
          <Route path="reset" element={<ResetareParolaPage />} />
          <Route path="confirm" element={<ConfirmarePage />} />
          <Route path="confidentialitate" element={<ConfidentialitatePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
