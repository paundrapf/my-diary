import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PenLine, Pin } from 'lucide-react'
import { useEntryStore } from '../../stores/useEntryStore'
import { formatDate } from '../../lib/utils'
import { getMoodById } from '../../lib/moodData'
import type { Entry } from '../../../../types'

interface EntryListProps {
  entries: Entry[]
  activeEntryId: string | null
  onSelect?: () => void
}

export default function EntryList({ entries, activeEntryId, onSelect }: EntryListProps): JSX.Element {
  const setActiveEntry = useEntryStore((s) => s.setActiveEntry)
  const createEntry = useEntryStore((s) => s.createEntry)

  const pinnedEntries = entries.filter((e) => e.is_pinned)
  const normalEntries = entries.filter((e) => !e.is_pinned)

  const handleSelect = (id: string): void => {
    setActiveEntry(id)
    if (onSelect) onSelect()
  }

  return (
    <div className="w-[260px] h-full bg-bg-secondary border-r border-border-subtle flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <h2 className="text-xs font-medium text-text-primary">Entries</h2>
        <motion.button
          onClick={createEntry}
          className="w-6 h-6 flex items-center justify-center rounded-md bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          +
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <PenLine strokeWidth={1.5} size={40} className="text-text-tertiary mb-3" />
            <p className="text-text-secondary text-xs mb-2">Belum ada entri</p>
            <p className="text-text-tertiary text-[10px]">
              Klik + atau tekan ⌘N untuk memulai
            </p>
          </div>
        ) : (
          <>
            {pinnedEntries.length > 0 && (
              <div>
                <div className="px-4 py-1.5 text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
                  Disematkan
                </div>
                <AnimatePresence>
                  {pinnedEntries.map((entry) => (
                    <EntryListItem
                      key={entry.id}
                      entry={entry}
                      isActive={entry.id === activeEntryId}
                      onSelect={handleSelect}
                    />
                  ))}
                </AnimatePresence>
                <div className="mx-4 my-1 border-t border-border-subtle" />
              </div>
            )}
            <div className="px-4 py-1.5 text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
              {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </div>
            <AnimatePresence>
              {normalEntries.map((entry, i) => (
                <EntryListItem
                  key={entry.id}
                  entry={entry}
                  isActive={entry.id === activeEntryId}
                  onSelect={handleSelect}
                  index={i}
                />
              ))}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  )
}

function EntryListItem({ entry, isActive, onSelect, index = 0 }: {
  entry: Entry
  isActive: boolean
  onSelect: (id: string) => void
  index?: number
}): JSX.Element {
  const preview = entry.content_preview || 'No content'
  const title = entry.title || 'Untitled'
  const pinEntry = useEntryStore((s) => s.pinEntry)
  const duplicateEntry = useEntryStore((s) => s.duplicateEntry)
  const deleteEntry = useEntryStore((s) => s.deleteEntry)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)

  const handleContextMenu = (e: React.MouseEvent): void => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  const handlePin = async (): Promise<void> => {
    setContextMenu(null)
    await pinEntry(entry.id, !entry.is_pinned)
  }

  const handleDuplicate = async (): Promise<void> => {
    setContextMenu(null)
    await duplicateEntry(entry.id)
  }

  const handleDelete = async (): Promise<void> => {
    setContextMenu(null)
    if (window.confirm('Delete this entry? It will be moved to Trash.')) {
      await deleteEntry(entry.id)
    }
  }

  return (
    <>
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 35,
          delay: Math.min(index * 0.02, 0.3)
        }}
        onClick={() => onSelect(entry.id)}
        onContextMenu={handleContextMenu}
        className={`w-full text-left px-4 py-2.5 transition-colors ${
          isActive ? 'bg-accent-soft/50' : 'hover:bg-bg-tertiary/50'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className={`text-xs font-medium truncate ${isActive ? 'text-accent' : 'text-text-primary'}`}>
                {title}
              </h3>
              {entry.is_pinned ? (
                <Pin strokeWidth={1.5} size={12} className="text-accent flex-shrink-0" aria-label="Pinned" />
              ) : null}
            </div>
            <p className="text-[11px] text-text-secondary truncate leading-relaxed">
              {preview}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-text-tertiary">
                {formatDate(entry.last_edited_at || entry.updated_at)}
              </span>
            </div>
          </div>
          {entry.mood && (
            <span className="text-sm flex-shrink-0 mt-0.5" aria-label={`Mood ${entry.mood}`}>
              {getMoodById(entry.mood)?.emoji ?? ''}
            </span>
          )}
        </div>
      </motion.button>

      <AnimatePresence>
        {contextMenu && (
          <>
            <div
              className="fixed inset-0 z-50"
              onClick={() => setContextMenu(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              className="fixed z-[60] bg-bg-primary border border-border-default rounded-lg shadow-xl py-1 min-w-[140px]"
              style={{ top: contextMenu.y, left: contextMenu.x }}
            >
              <button
                onClick={handlePin}
                className="w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:bg-bg-tertiary transition-colors"
              >
                {entry.is_pinned ? 'Unpin' : 'Pin'}
              </button>
              <button
                onClick={handleDuplicate}
                className="w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:bg-bg-tertiary transition-colors"
              >
                Duplicate
              </button>
              <div className="mx-2 my-0.5 border-t border-border-subtle" />
              <button
                onClick={handleDelete}
                className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
