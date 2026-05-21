import { useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Sidebar from './components/Sidebar/Sidebar'
import ErrorBoundary from './components/ui/ErrorBoundary'
import LockScreen from './components/LockScreen/LockScreen'
import UpdateModal from './components/UpdateModal/UpdateModal'
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

  const settings = useSettingsStore((s) => s.settings)
  const isLocked = useUIStore((s) => s.isLocked)
  const setLocked = useUIStore((s) => s.setLocked)

  useEffect(() => {
    loadEntries()
    loadSettings()

    // Listen for lock events from main process
    const unsubscribe = window.api.app.onLocked(() => {
      setLocked(true)
    })
    return unsubscribe
  }, [])

  // Apply theme, accent color, and font size
  useEffect(() => {
    if (!settings) return

    // Theme
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const resolvedTheme =
      settings.theme === 'system' ? (prefersDark ? 'dark' : 'light') : settings.theme
    document.documentElement.className = resolvedTheme

    // Accent color
    document.documentElement.style.setProperty('--accent', settings.accent_color)
    document.documentElement.style.setProperty(
      '--accent-soft',
      settings.accent_color + '20'
    )

    // Editor font size
    document.documentElement.style.setProperty(
      '--editor-font-size',
      `${settings.editor_font_size}px`
    )
  }, [settings])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Don't trigger shortcuts when typing in inputs or editor
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow Cmd+S, Cmd+Z, Cmd+B, Cmd+I even in editor
        if (!((e.metaKey || e.ctrlKey) && ['s', 'z', 'b', 'i', 'k'].includes(e.key.toLowerCase()))) {
          return
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault()
        toggleSidebar()
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        useEntryStore.getState().createEntry()
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault()
        const activeId = useEntryStore.getState().activeEntryId
        if (activeId) {
          window.api.app.log('info', `Export shortcut triggered for entry: ${activeId}`)
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        const activeId = useEntryStore.getState().activeEntryId
        if (activeId) {
          const entry = useEntryStore.getState().entries.find((e) => e.id === activeId)
          if (entry) {
            useEntryStore.getState().pinEntry(activeId, !entry.is_pinned)
          }
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'w') {
        e.preventDefault()
        useEntryStore.getState().setActiveEntry(null)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault()
        navigate('/settings')
      }
      if ((e.metaKey || e.ctrlKey) && ['1', '2', '3', '4', '5'].includes(e.key)) {
        e.preventDefault()
        const activeId = useEntryStore.getState().activeEntryId
        if (activeId) {
          const mood = parseInt(e.key, 10)
          useEntryStore.getState().updateEntry({ id: activeId, mood })
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar, navigate])

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
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Journal />} />
              <Route path="/pinned" element={<Journal />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/trash" element={<Trash />} />
              <Route path="/tags/:tag" element={<Journal />} />
            </Routes>
          </AnimatePresence>
        </ErrorBoundary>
      </main>
      {isLocked && <LockScreen onUnlock={() => setLocked(false)} />}
      <UpdateModal />
    </div>
  )
}
