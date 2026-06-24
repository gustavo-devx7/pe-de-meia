import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Quiz from './pages/quiz'
import Loading from './pages/loading'
import GetInfos from './pages/getInfos'
import CheckMate from './pages/checkMate'
import { captureUtms } from './utils/utm'
import '../global.css'

// Captura os UTMs da URL (?utm_source=...&utm_campaign=...) o quanto antes,
// antes de qualquer navegação acontecer, e os guarda na sessão. Sem essa
// chamada, captureUtms()/getUtms() nunca executam e os parâmetros de
// tracking se perdem assim que o usuário navega para outra página.
captureUtms()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Quiz />} />
        <Route path="/getInfos" element={<GetInfos />} />
        <Route path="/loading" element={<Loading />} />
        <Route path="/checkMate" element={<CheckMate />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
