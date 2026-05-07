import { useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import ScrollRestoration from './components/ScrollRestoration'
import TitleBar from './components/TitleBar'
import FabDrawer from './components/FabDrawer'
import ToastContainer from './components/ToastContainer'
import SettingsModal from './components/SettingsModal'
import ListPage from './pages/ListPage'
import DetailPage from './pages/DetailPage'

const isDesktop = import.meta.env.VITE_TRANSPORT === 'wails'

function App() {
  useEffect(() => {
    if (isDesktop) document.body.classList.add('has-titlebar')
  }, [])

  const [settingsOpen, setSettingsOpen] = useState(false)
  const queryClient = useQueryClient()
  const location = useLocation()

  return (
    <>
      <TitleBar />
      {location.pathname === '/' && (
        <FabDrawer onOpenSettings={() => setSettingsOpen(true)} />
      )}
      <ScrollRestoration />
      <ToastContainer />
      <Routes>
        <Route path="/" element={<ListPage />} />
        <Route path="/album/:id" element={<DetailPage />} />
      </Routes>
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onReloaded={() => {
          setSettingsOpen(false)
          queryClient.invalidateQueries({ queryKey: ['albums'] })
        }}
      />
    </>
  )
}

export default App
