import { motion } from 'framer-motion'

export default function Insights(): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-full overflow-y-auto p-8"
    >
      <h1 className="text-lg font-semibold text-text-primary mb-6">Insights</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-bg-secondary rounded-xl p-4">
          <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider mb-1">Total Entries</p>
          <p className="text-2xl font-semibold text-text-primary">0</p>
        </div>
        <div className="bg-bg-secondary rounded-xl p-4">
          <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider mb-1">Total Words</p>
          <p className="text-2xl font-semibold text-text-primary">0</p>
        </div>
        <div className="bg-bg-secondary rounded-xl p-4">
          <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider mb-1">Streak</p>
          <p className="text-2xl font-semibold text-text-primary">0 days</p>
        </div>
        <div className="bg-bg-secondary rounded-xl p-4">
          <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider mb-1">Avg Words/Entry</p>
          <p className="text-2xl font-semibold text-text-primary">0</p>
        </div>
        <div className="bg-bg-secondary rounded-xl p-4">
          <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider mb-1">Avg Mood</p>
          <p className="text-2xl font-semibold text-text-primary">—</p>
        </div>
        <div className="bg-bg-secondary rounded-xl p-4">
          <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider mb-1">Most Productive Day</p>
          <p className="text-2xl font-semibold text-text-primary">—</p>
        </div>
      </div>

      <div className="mt-8 bg-bg-secondary rounded-xl p-6">
        <h2 className="text-sm font-medium text-text-primary mb-4">Mood Chart (30 days)</h2>
        <div className="flex items-end gap-1 h-32">
          {Array.from({ length: 30 }, (_, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-sm"
              style={{
                height: `${Math.random() * 100}%`,
                backgroundColor: 'var(--accent)',
                opacity: 0.3 + Math.random() * 0.5
              }}
            />
          ))}
        </div>
        <p className="text-[11px] text-text-tertiary mt-3 text-center">Coming in v1.5 — Start writing to see insights</p>
      </div>
    </motion.div>
  )
}
