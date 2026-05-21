import { useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Sidebar from './components/Sidebar/Sidebar'
import Journal from './pages/Journal'
import Calendar from './pages/Calendar'
import Insights from './pages/Insights'
import Settings from './pages/Settings'
import Trash from './pages/Trash'
import { useUIStore } from './stores/useUIStore'
import { useEntryStore } from './stores/useEntryStore'
import { useSettingsStore } from './stores/useSettingsStore'

export default function App(): JSX.Element {
  const isSidebarOpen = useUIStore((s) => s.isSidebarOpen)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const setActivePage = useUIStore((s) => s.setActivePage)
  const loadEntries = useEntryStore((s) => s.loadEntries)
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const navigate = useNavigate()

  useEffect(() => {
    loadEntries()
    loadSettings()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar])

  return (
    <div className="app-layout">
      <Sidebar />
      <main
        className="flex-1 overflow-hidden"
        style={{
          marginLeft: isSidebarOpen ? 'var(--sidebar-width, 220px)' : '48px',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Journal />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/trash" element={<Trash />} />
            <Route path="/tags/:tag" element={<Journal />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  )
}
