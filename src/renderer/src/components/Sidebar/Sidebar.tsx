import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUIStore } from '../../stores/useUIStore'
import { useEntryStore } from '../../stores/useEntryStore'
import { useEffect } from 'react'

const navItems = [
  { icon: '📖', label: 'Semua Entri', page: 'journal' as const, path: '/' },
  { icon: '📅', label: 'Kalender', page: 'calendar' as const, path: '/calendar' },
  { icon: '📌', label: 'Disematkan', page: 'journal' as const, path: '/pinned' },
  { icon: '📊', label: 'Insights', page: 'insights' as const, path: '/insights' },
  { icon: '🗂', label: 'Kategori', page: 'tags' as const, path: '/' }
]

interface TagItem {
  id: string
  name: string
  color: string
  entry_count: number
}

export default function Sidebar(): JSX.Element {
  const isSidebarOpen = useUIStore((s) => s.isSidebarOpen)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const activePage = useUIStore((s) => s.activePage)
  const setActivePage = useUIStore((s) => s.setActivePage)
  const searchQuery = useUIStore((s) => s.searchQuery)
  const setSearchQuery = useUIStore((s) => s.setSearchQuery)
  const isSearchFocused = useUIStore((s) => s.isSearchFocused)
  const setSearchFocused = useUIStore((s) => s.setSearchFocused)
  const loadEntries = useEntryStore((s) => s.loadEntries)
  const navigate = useNavigate()
  const location = useLocation()
  const [tags, setTags] = useState<TagItem[]>([])
  const [isPeeking, setIsPeeking] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    loadTags()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        setShowSearch(true)
        setSearchFocused(true)
      }
      if (e.key === 'Escape') {
        setShowSearch(false)
        setSearchFocused(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const loadTags = async (): Promise<void> => {
    try {
      const result = await window.api.tags.getAll()
      setTags(result)
    } catch {
      // silent
    }
  }

  const handleNav = (item: typeof navItems[0]): void => {
    setActivePage(item.page)
    if (item.path === '/pinned') {
      loadEntries({ pinned: true })
    } else {
      loadEntries()
    }
    navigate(item.path)
  }

  const handleTagClick = (tagName: string): void => {
    navigate(`/tags/${tagName}`)
    loadEntries({ tag: tagName })
  }

  const handleSearch = (value: string): void => {
    setSearchQuery(value)
    if (value.length >= 2) {
      loadEntries({ search: value })
    } else if (value.length === 0) {
      loadEntries()
    }
  }

  const sidebarVariants = {
    open: {
      width: 220,
      opacity: 1,
      x: 0,
      transition: { type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }
    },
    closed: {
      width: 0,
      opacity: 0,
      x: -220,
      transition: { type: 'spring', stiffness: 400, damping: 40, mass: 0.6 }
    }
  }

  const contentVariants = {
    open: { opacity: 1, transition: { delay: 0.05 } },
    closed: { opacity: 0, transition: { duration: 0.05 } }
  }

  return (
    <>
      <motion.aside
        className="fixed left-0 top-0 h-full z-40 bg-bg-secondary border-r border-border-subtle overflow-hidden"
        animate={isSidebarOpen || isPeeking ? 'open' : 'closed'}
        variants={sidebarVariants}
        onHoverStart={() => !isSidebarOpen && setIsPeeking(true)}
        onHoverEnd={() => {
          setIsPeeking(false)
        }}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border-subtle">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-sm font-semibold text-text-primary tracking-tight">
                My Diary
              </h1>
              <button
                onClick={toggleSidebar}
                className="p-1 rounded-md hover:bg-bg-tertiary transition-colors text-text-secondary"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 4h10M3 8h10M3 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {(isSidebarOpen || isPeeking) && (
              <motion.div
                className="flex-1 flex flex-col overflow-hidden"
                variants={contentVariants}
                initial="closed"
                animate="open"
                exit="closed"
              >
                <div className="px-3 py-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search entries..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                      className="w-full px-3 py-1.5 text-xs bg-bg-tertiary rounded-lg border-none outline-none text-text-primary placeholder:text-text-tertiary"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary text-[10px]">
                      ⌘F
                    </span>
                  </div>
                </div>

                <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
                  {navItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => handleNav(item)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                        activePage === item.page && location.pathname === item.path
                          ? 'bg-accent-soft text-accent font-medium'
                          : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                      }`}
                    >
                      <span className="text-sm">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}

                  <div className="my-3 border-t border-border-subtle" />

                  <div className="px-2.5 pb-1 text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
                    Tags
                  </div>
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => handleTagClick(tag.name)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span>{tag.name}</span>
                      </div>
                      <span className="text-text-tertiary text-[10px]">{tag.entry_count}</span>
                    </button>
                  ))}
                </nav>

                <div className="p-2 border-t border-border-subtle">
                  <button
                    onClick={() => navigate('/settings')}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-all"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M8 10a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M12.5 8a4.5 4.5 0 01-.5 2l1.5 1-1 1.5-1.5-1a4.5 4.5 0 01-4 0l-1.5 1-1-1.5L5.5 10a4.5 4.5 0 010-4L4 5l1-1.5L6.5 4.5a4.5 4.5 0 014 0L12 3.5 13 5l-1.5 1c.3.6.5 1.3.5 2z" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                    <span>Settings</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {!isSidebarOpen && (
        <div
          className="fixed left-0 top-0 h-full w-[48px] z-30 bg-bg-secondary border-r border-border-subtle flex flex-col items-center py-4 gap-4"
          onMouseEnter={() => setIsPeeking(true)}
          onMouseLeave={() => setIsPeeking(false)}
        >
          <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">M</span>
          </div>
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNav(item)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-tertiary transition-colors"
              title={item.label}
            >
              <span className="text-sm">{item.icon}</span>
            </button>
          ))}
          <div className="mt-auto">
            <button
              onClick={() => navigate('/settings')}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-tertiary transition-colors text-text-secondary"
              title="Settings"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 10a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12.5 8a4.5 4.5 0 01-.5 2l1.5 1-1 1.5-1.5-1a4.5 4.5 0 01-4 0l-1.5 1-1-1.5L5.5 10a4.5 4.5 0 010-4L4 5l1-1.5L6.5 4.5a4.5 4.5 0 014 0L12 3.5 13 5l-1.5 1c.3.6.5 1.3.5 2z" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
