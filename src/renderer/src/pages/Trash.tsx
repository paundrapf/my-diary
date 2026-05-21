import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useEntryStore } from '../stores/useEntryStore'
import type { Entry } from '../../../types'

export default function Trash(): JSX.Element {
  const [trashedEntries, setTrashedEntries] = useState<Entry[]>([])

  useEffect(() => {
    loadTrash()
  }, [])

  const loadTrash = async (): Promise<void> => {
    try {
      const all = await window.api.entries.getAll({ includeDeleted: true })
      setTrashedEntries(all.filter((e) => e.deleted_at))
    } catch {
      // silent
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-full overflow-y-auto p-8"
    >
      <h1 className="text-lg font-semibold text-text-primary mb-6">Trash</h1>
      {trashedEntries.length === 0 ? (
        <p className="text-text-tertiary text-sm">Trash is empty</p>
      ) : (
        <div className="space-y-2">
          {trashedEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-bg-secondary rounded-xl p-3 flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-medium text-text-primary">{entry.title || 'Untitled'}</p>
                <p className="text-[11px] text-text-tertiary">{entry.content_preview}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
