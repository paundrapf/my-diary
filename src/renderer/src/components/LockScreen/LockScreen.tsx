import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'

interface LockScreenProps {
  onUnlock: () => void
}

export default function LockScreen({ onUnlock }: LockScreenProps): JSX.Element {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [isShaking, setIsShaking] = useState(false)
  const [lockoutRemaining, setLockoutRemaining] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (lockoutRemaining > 0) {
      const timer = setTimeout(() => setLockoutRemaining((r) => r - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [lockoutRemaining])

  const handleUnlock = async (): Promise<void> => {
    if (!pin) return
    try {
      const result = await window.api.app.unlock(pin)
      if (result) {
        setPin('')
        setError('')
        onUnlock()
      } else {
        setError('Incorrect PIN')
        setIsShaking(true)
        setTimeout(() => setIsShaking(false), 500)
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('Locked out')) {
        const match = err.message.match(/(\d+)/)
        if (match) setLockoutRemaining(parseInt(match[0], 10))
        setError(err.message)
      } else {
        setError(err instanceof Error ? err.message : 'Unlock failed')
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleUnlock()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-bg-primary/95 backdrop-blur-md flex items-center justify-center"
    >
      <motion.div
        animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="text-center px-8"
      >
        <Lock strokeWidth={1.5} size={40} className="text-text-tertiary mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-text-primary mb-2">App Locked</h2>
        <p className="text-sm text-text-secondary mb-6">Enter your PIN to continue</p>

        <div className="flex flex-col items-center gap-3">
          <input
            ref={inputRef}
            type="password"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value)
              setError('')
            }}
            onKeyDown={handleKeyDown}
            maxLength={6}
            inputMode="numeric"
            pattern="\d*"
            placeholder="Enter PIN"
            className="w-48 px-4 py-2 text-center text-lg bg-bg-tertiary rounded-xl border-none outline-none text-text-primary placeholder:text-text-tertiary tracking-widest"
          />
          <button
            onClick={handleUnlock}
            disabled={lockoutRemaining > 0}
            className="w-48 px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-40"
          >
            {lockoutRemaining > 0 ? `Wait ${lockoutRemaining}s` : 'Unlock'}
          </button>
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
