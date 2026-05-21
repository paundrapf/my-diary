import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEntryStore } from '../stores/useEntryStore'
import { useNavigate } from 'react-router-dom'
import { getMoodColor } from '../lib/moodData'
import type { Entry } from '../../../types'

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Calendar(): JSX.Element {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [entriesByDate, setEntriesByDate] = useState<Map<string, Entry[]>>(new Map())
  const loadEntries = useEntryStore((s) => s.loadEntries)
  const entries = useEntryStore((s) => s.entries)
  const navigate = useNavigate()

  useEffect(() => {
    loadEntries()
  }, [])

  useEffect(() => {
    const map = new Map<string, Entry[]>()
    for (const entry of entries) {
      if (entry.deleted_at) continue
      const d = new Date(entry.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const list = map.get(key) || []
      list.push(entry)
      map.set(key, list)
    }
    setEntriesByDate(map)
  }, [entries])

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay()

  const emptyCells = Array.from({ length: firstDayOfWeek }, (_, i) => i)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const goToPrevMonth = (): void => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  const goToNextMonth = (): void => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  const handleDayClick = (day: number): void => {
    const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dayEntries = entriesByDate.get(dateKey)
    if (dayEntries && dayEntries.length > 0) {
      navigate('/')
      setTimeout(() => {
        const setActive = useEntryStore.getState().setActiveEntry
        setActive(dayEntries[0].id)
      }, 50)
    } else {
      // Create new entry for this date
      const createEntry = useEntryStore.getState().createEntry
      createEntry().then(() => {
        navigate('/')
      })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-full overflow-y-auto p-8"
    >
      <h1 className="text-lg font-semibold text-text-primary mb-6">Calendar</h1>

      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-text-primary">
            {new Date(currentYear, currentMonth).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex gap-1">
            <button onClick={goToPrevMonth} className="p-1.5 rounded-lg hover:bg-bg-tertiary text-text-secondary transition-colors">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <button onClick={goToNextMonth} className="p-1.5 rounded-lg hover:bg-bg-tertiary text-text-secondary transition-colors">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-border-subtle rounded-lg overflow-hidden">
          {dayNames.map((name) => (
            <div key={name} className="bg-bg-secondary px-2 py-1.5 text-[10px] font-medium text-text-tertiary text-center">
              {name}
            </div>
          ))}
          {emptyCells.map((i) => (
            <div key={`empty-${i}`} className="bg-bg-primary p-2 min-h-[60px]" />
          ))}
          {days.map((day) => {
            const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dayEntries = entriesByDate.get(dateKey)
            const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()
            const hasEntries = dayEntries && dayEntries.length > 0

            return (
              <motion.button
                key={day}
                onClick={() => handleDayClick(day)}
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`p-2 min-h-[60px] text-left transition-colors relative ${
                  isToday ? 'bg-accent-soft' : 'bg-bg-primary hover:bg-bg-tertiary/50'
                }`}
              >
                <span className={`text-xs ${isToday ? 'text-accent font-semibold' : 'text-text-secondary'}`}>
                  {day}
                </span>
                {hasEntries && (
                  <div className="flex gap-0.5 mt-1 flex-wrap">
                    {dayEntries.slice(0, 3).map((e, i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: e.mood ? getMoodColor(e.mood) || 'var(--text-tertiary)' : 'var(--text-tertiary)' }}
                      />
                    ))}
                    {dayEntries.length > 3 && (
                      <span className="text-[8px] text-text-tertiary">+</span>
                    )}
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
