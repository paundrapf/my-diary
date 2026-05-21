import { useEffect, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import EntryList from '../components/EntryList/EntryList'
import Editor from '../components/Editor/Editor'
import { useEntryStore } from '../stores/useEntryStore'
import { useUIStore } from '../stores/useUIStore'

export default function Journal(): JSX.Element {
  const entries = useEntryStore((s) => s.entries)
  const activeEntryId = useEntryStore((s) => s.activeEntryId)
  const loadEntries = useEntryStore((s) => s.loadEntries)
  const searchQuery = useUIStore((s) => s.searchQuery)
  const activeTag = useUIStore((s) => s.activeTag)
  const [isMobileListOpen, setIsMobileListOpen] = useState(false)
  const location = useLocation()

  const activeEntry = entries.find((e) => e.id === activeEntryId) || null

  useEffect(() => {
    const isPinnedRoute = location.pathname === '/pinned'
    loadEntries({
      search: searchQuery || undefined,
      tag: activeTag || undefined,
      pinned: isPinnedRoute || undefined
    })
  }, [searchQuery, activeTag, location.pathname])

  const handleBack = useCallback(() => {
    setIsMobileListOpen(false)
  }, [])

  return (
    <div className="flex h-full">
      <motion.div
        className="hidden lg:block"
        layout
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <EntryList
          entries={entries}
          activeEntryId={activeEntryId}
        />
      </motion.div>

      <AnimatePresence>
        {isMobileListOpen && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <EntryList
              entries={entries}
              activeEntryId={activeEntryId}
              onSelect={() => setIsMobileListOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="flex-1 min-w-0"
        layout
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {activeEntry ? (
          <Editor
            key={activeEntry.id}
            entry={activeEntry}
            onBack={handleBack}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-text-secondary text-sm">Select an entry or create a new one</p>
              <p className="text-text-tertiary text-xs mt-2">
                ⌘N to create
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
