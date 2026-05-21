import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEntryStore } from '../../stores/useEntryStore'
import { sanitizeHtml } from '../../lib/sanitize'
import { formatDate } from '../../lib/utils'
import type { EntryVersion } from '../../../../types'

interface VersionHistoryProps {
  entryId: string
}

type ViewMode = 'list' | 'preview' | 'diff'

export default function VersionHistory({ entryId }: VersionHistoryProps): JSX.Element {
  const versions = useEntryStore((s) => s.versions)
  const selectedVersionId = useEntryStore((s) => s.selectedVersionId)
  const compareFromId = useEntryStore((s) => s.compareFromId)
  const compareToId = useEntryStore((s) => s.compareToId)
  const diffHtml = useEntryStore((s) => s.diffHtml)
  const isVersionHistoryOpen = useEntryStore((s) => s.isVersionHistoryOpen)
  const closeVersionHistory = useEntryStore((s) => s.closeVersionHistory)
  const selectVersion = useEntryStore((s) => s.selectVersion)
  const restoreVersion = useEntryStore((s) => s.restoreVersion)
  const setCompareFrom = useEntryStore((s) => s.setCompareFrom)
  const setCompareTo = useEntryStore((s) => s.setCompareTo)
  const compareVersions = useEntryStore((s) => s.compareVersions)
  const loadVersions = useEntryStore((s) => s.loadVersions)

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [previewContent, setPreviewContent] = useState<string>('')
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null)

  useEffect(() => {
    loadVersions(entryId)
  }, [entryId])

  const selectedVersion = versions.find((v) => v.id === selectedVersionId)

  const handlePreview = async (versionId: string): Promise<void> => {
    selectVersion(versionId)
    try {
      const version = await window.api.entries.getVersionById(versionId)
      if (version) {
        setPreviewContent(sanitizeHtml(version.content || ''))
        setViewMode('preview')
      }
    } catch {
      // silent
    }
  }

  const handleRestore = async (versionId: string): Promise<void> => {
    await restoreVersion(entryId, versionId)
    setConfirmRestore(null)
    setViewMode('list')
  }

  const handleCompare = async (): Promise<void> => {
    if (compareFromId && compareToId) {
      await compareVersions(entryId, compareFromId, compareToId)
      setViewMode('diff')
    }
  }

  const handleBack = (): void => {
    setViewMode('list')
    setPreviewContent('')
    selectVersion(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ type: 'spring', stiffness: 350, damping: 32 }}
      className="fixed right-0 top-0 h-full w-[400px] bg-bg-primary border-l border-border-default z-50 shadow-2xl flex flex-col"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          {viewMode !== 'list' && (
            <button
              onClick={handleBack}
              className="p-1 rounded hover:bg-bg-tertiary text-text-secondary"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
          <h2 className="text-sm font-medium text-text-primary">
            {viewMode === 'list' && 'Version History'}
            {viewMode === 'preview' && `v${selectedVersion?.version || ''} Preview`}
            {viewMode === 'diff' && 'Compare Versions'}
          </h2>
        </div>
        <button
          onClick={closeVersionHistory}
          className="p-1 rounded hover:bg-bg-tertiary text-text-secondary"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {viewMode === 'list' && (
        <div className="flex-1 overflow-y-auto">
          {versions.length === 0 ? (
            <div className="flex items-center justify-center h-full text-text-tertiary text-xs">
              No versions yet. Save a version to track changes.
            </div>
          ) : (
            <div className="p-3 space-y-1">
              <AnimatePresence>
                {versions.map((version, i) => (
                  <motion.div
                    key={version.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`p-3 rounded-lg transition-colors ${
                      selectedVersionId === version.id
                        ? 'bg-accent-soft/50'
                        : 'hover:bg-bg-tertiary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-text-primary">
                          v{version.version}
                        </span>
                        <span className="text-[11px] text-text-tertiary">
                          {formatDate(version.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <motion.button
                          onClick={() => handlePreview(version.id)}
                          className="px-2 py-0.5 rounded text-[10px] text-text-secondary hover:bg-bg-tertiary transition-colors"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Preview
                        </motion.button>
                        {confirmRestore === version.id ? (
                          <div className="flex items-center gap-1">
                            <motion.button
                              onClick={() => handleRestore(version.id)}
                              className="px-2 py-0.5 rounded text-[10px] bg-accent text-white transition-colors"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              Confirm
                            </motion.button>
                            <button
                              onClick={() => setConfirmRestore(null)}
                              className="px-2 py-0.5 rounded text-[10px] text-text-secondary hover:bg-bg-tertiary transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <motion.button
                            onClick={() => setConfirmRestore(version.id)}
                            className="px-2 py-0.5 rounded text-[10px] text-accent hover:bg-accent-soft/50 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Restore
                          </motion.button>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-text-secondary line-clamp-2 mb-1">
                      {version.content_preview || 'No content'}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-text-tertiary">
                      <span>{version.word_count} words</span>
                      {version.change_desc && (
                        <>
                          <span>·</span>
                          <span>{version.change_desc}</span>
                        </>
                      )}
                      <span className="ml-auto">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={compareFromId === version.id}
                            onChange={() => {
                              if (compareFromId === version.id) {
                                setCompareFrom(null)
                              } else {
                                setCompareFrom(version.id)
                                if (compareToId === version.id) setCompareTo(null)
                              }
                            }}
                            className="w-3 h-3 accent-accent"
                          />
                          <span>From</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer ml-2">
                          <input
                            type="checkbox"
                            checked={compareToId === version.id}
                            onChange={() => {
                              if (compareToId === version.id) {
                                setCompareTo(null)
                              } else {
                                setCompareTo(version.id)
                                if (compareFromId === version.id) setCompareFrom(null)
                              }
                            }}
                            className="w-3 h-3 accent-accent"
                          />
                          <span>To</span>
                        </label>
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {viewMode === 'preview' && (
        <div className="flex-1 overflow-y-auto p-4">
          <div
            className="prose prose-sm max-w-none text-text-primary text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: previewContent }}
          />
        </div>
      )}

      {viewMode === 'diff' && (
        <div className="flex-1 overflow-y-auto p-4">
          {diffHtml ? (
            <div
              className="text-sm leading-relaxed [&_.diff-insert]:bg-green-100 [&_.diff-insert]:dark:bg-green-900/30 [&_.diff-delete]:bg-red-100 [&_.diff-delete]:dark:bg-red-900/30 [&_.diff-delete]:line-through [&_.diff-equal]:text-text-primary"
              dangerouslySetInnerHTML={{ __html: diffHtml }}
            />
          ) : (
            <div className="text-text-tertiary text-xs">
              Select two versions to compare using the checkboxes.
            </div>
          )}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="p-3 border-t border-border-subtle">
          {compareFromId && compareToId ? (
            <motion.button
              onClick={handleCompare}
              className="w-full py-1.5 rounded-lg bg-accent text-white text-xs font-medium transition-colors"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              Compare Selected Versions
            </motion.button>
          ) : compareFromId || compareToId ? (
            <p className="text-[11px] text-text-tertiary text-center">
              Select both From and To versions to compare
            </p>
          ) : null}
        </div>
      )}
    </motion.div>
  )
}
