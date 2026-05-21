import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function UpdateModal(): JSX.Element | null {
  const [version, setVersion] = useState<string | null>(null)
  const [downloaded, setDownloaded] = useState(false)

  useEffect(() => {
    const unsubAvailable = window.api.app.onUpdateAvailable((v) => {
      setVersion(v)
    })
    const unsubDownloaded = window.api.app.onUpdateDownloaded((v) => {
      setVersion(v)
      setDownloaded(true)
    })
    return () => {
      unsubAvailable()
      unsubDownloaded()
    }
  }, [])

  const handleUpdate = (): void => {
    window.api.app.quitAndInstall()
  }

  return (
    <AnimatePresence>
      {version && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-2.5 rounded-xl bg-bg-secondary border border-border-default shadow-lg"
        >
          <span className="text-xs text-text-primary">
            {downloaded
              ? `Update ${version} is ready to install`
              : `Update ${version} is available`}
          </span>
          {downloaded ? (
            <button
              onClick={handleUpdate}
              className="px-3 py-1 rounded-lg bg-accent text-white text-[11px] font-medium hover:opacity-90 transition-opacity"
            >
              Update Now
            </button>
          ) : (
            <span className="text-[11px] text-text-secondary">Downloading...</span>
          )}
          <button
            onClick={() => setVersion(null)}
            className="text-text-tertiary hover:text-text-secondary text-xs leading-none"
            aria-label="Dismiss"
          >
            &times;
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
