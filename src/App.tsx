import { Routes, Route } from 'react-router-dom'
import ScrollRestoration from './components/ScrollRestoration'
import ListPage from './pages/ListPage'
import DetailPage from './pages/DetailPage'

function App() {
  return (
    <>
      <ScrollRestoration />
      <Routes>
        <Route path="/" element={<ListPage />} />
        <Route path="/album/:id" element={<DetailPage />} />
      </Routes>
    </>
  )
}

export default App
