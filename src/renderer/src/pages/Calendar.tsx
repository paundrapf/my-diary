import { motion } from 'framer-motion'

export default function Calendar(): JSX.Element {
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay()

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const emptyCells = Array.from({ length: firstDayOfWeek }, (_, i) => i)

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
            {today.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex gap-1">
            <button className="p-1.5 rounded-lg hover:bg-bg-tertiary text-text-secondary transition-colors">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <button className="p-1.5 rounded-lg hover:bg-bg-tertiary text-text-secondary transition-colors">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-border-subtle rounded-lg overflow-hidden">
          {dayNames.map((name) => (
            <div
              key={name}
              className="bg-bg-secondary px-2 py-1.5 text-[10px] font-medium text-text-tertiary text-center"
            >
              {name}
            </div>
          ))}
          {emptyCells.map((i) => (
            <div key={`empty-${i}`} className="bg-bg-primary p-2 min-h-[60px]" />
          ))}
          {days.map((day) => {
            const isToday = day === today.getDate()
            return (
              <motion.button
                key={day}
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`p-2 min-h-[60px] text-left transition-colors ${
                  isToday ? 'bg-accent-soft' : 'bg-bg-primary hover:bg-bg-tertiary/50'
                }`}
              >
                <span
                  className={`text-xs ${
                    isToday
                      ? 'text-accent font-semibold'
                      : 'text-text-secondary'
                  }`}
                >
                  {day}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
