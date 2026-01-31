import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Quiz from './pages/quiz'
import Loading from './pages/loading'
import GetInfos from './pages/getInfos'
import CheckMate from './pages/checkMate'
import '../global.css'

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
