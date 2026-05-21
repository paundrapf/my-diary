import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getMoodById } from '../lib/moodData'

interface Stats {
  totalEntries: number
  totalWords: number
  avgWordsPerEntry: number
  avgMood: number | null
  streak: number
  mostProductiveDay: string | null
  topTags: { name: string; count: number }[]
}

export default function Insights(): JSX.Element {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async (): Promise<void> => {
    try {
      const data = await window.api.insights.getStats()
      setStats(data)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-full overflow-y-auto p-8"
    >
      <h1 className="text-lg font-semibold text-text-primary mb-6">Insights</h1>

      {error && <p className="text-red-500 text-xs mb-4">{error}</p>}

      {!stats ? (
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-bg-secondary rounded-xl p-4 h-20" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard label="Total Entries" value={String(stats.totalEntries)} />
            <StatCard label="Total Words" value={String(stats.totalWords.toLocaleString())} />
            <StatCard label="Streak" value={`${stats.streak} day${stats.streak !== 1 ? 's' : ''}`} emoji={stats.streak > 0 ? '🔥' : ''} />
            <StatCard label="Avg Words/Entry" value={String(stats.avgWordsPerEntry)} />
            <StatCard
              label="Avg Mood (30d)"
              value={stats.avgMood ? `${stats.avgMood.toFixed(1)} ${getMoodById(Math.round(stats.avgMood))?.emoji ?? ''}` : '—'}
            />
            <StatCard
              label="Most Productive Day"
              value={stats.mostProductiveDay || '—'}
            />
          </div>

          {stats.topTags.length > 0 && (
            <div className="mt-8 bg-bg-secondary rounded-xl p-6">
              <h2 className="text-sm font-medium text-text-primary mb-4">Top Tags</h2>
              <div className="flex flex-wrap gap-2">
                {stats.topTags.map((tag) => (
                  <span
                    key={tag.name}
                    className="px-3 py-1 rounded-full text-xs bg-accent-soft text-accent"
                  >
                    {tag.name} ({tag.count})
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 bg-bg-secondary rounded-xl p-6">
            <h2 className="text-sm font-medium text-text-primary mb-4">Mood Chart (30 days)</h2>
            {stats.totalEntries === 0 ? (
              <p className="text-text-tertiary text-xs">Start writing to see mood insights</p>
            ) : (
              <MoodChart />
            )}
          </div>
        </>
      )}
    </motion.div>
  )
}

function StatCard({ label, value, emoji }: { label: string; value: string; emoji?: string }): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="bg-bg-secondary rounded-xl p-4"
    >
      <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-semibold text-text-primary">
        {value} {emoji && <span className="text-lg">{emoji}</span>}
      </p>
    </motion.div>
  )
}

function MoodChart(): JSX.Element {
  // Placeholder for actual 30-day mood chart
  // In a real implementation, we'd fetch daily mood data
  return (
    <div className="flex items-end gap-1 h-32">
      {Array.from({ length: 30 }, (_, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm bg-accent/30 hover:bg-accent/50 transition-colors"
          style={{ height: `${Math.max(10, Math.random() * 100)}%` }}
        />
      ))}
    </div>
  )
}
