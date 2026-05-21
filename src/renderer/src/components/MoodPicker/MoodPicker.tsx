import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useEntryStore } from '../../stores/useEntryStore'

interface MoodPickerProps {
  entryId: string
  currentMood: number | null
}

const moodLevels = [
  { level: 1, emoji: '😢', label: 'Sangat buruk', color: '#EF4444' },
  { level: 2, emoji: '😞', label: 'Kurang baik', color: '#F59E0B' },
  { level: 3, emoji: '😐', label: 'Biasa aja', color: '#9CA3AF' },
  { level: 4, emoji: '😊', label: 'Baik', color: '#14B8A6' },
  { level: 5, emoji: '🔥', label: 'Luar biasa', color: '#8B5CF6' }
]

export default function MoodPicker({ entryId, currentMood }: MoodPickerProps): JSX.Element {
  const [selected, setSelected] = useState<number | null>(currentMood)
  const updateEntry = useEntryStore((s) => s.updateEntry)

  useEffect(() => {
    setSelected(currentMood)
  }, [currentMood])

  const handleSelect = async (level: number): Promise<void> => {
    const newMood = selected === level ? null : level
    setSelected(newMood)
    await updateEntry({ id: entryId, mood: newMood || undefined })
  }

  return (
    <div className="flex items-center gap-0.5">
      {moodLevels.map((mood) => (
        <motion.button
          key={mood.level}
          onClick={() => handleSelect(mood.level)}
          className="relative p-1 rounded-md transition-colors"
          whileHover={{ scale: 1.3 }}
          whileTap={{ scale: 0.9 }}
          title={mood.label}
        >
          <motion.span
            className="text-base block leading-none"
            animate={
              selected === mood.level
                ? { scale: 1.3, rotate: [0, -5, 5, 0] }
                : { scale: 1 }
            }
            transition={
              selected === mood.level
                ? { type: 'spring', stiffness: 500, damping: 15 }
                : { duration: 0.15 }
            }
          >
            {mood.emoji}
          </motion.span>
          {selected === mood.level && (
            <motion.div
              layoutId="mood-indicator"
              className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
              style={{ backgroundColor: mood.color }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            />
          )}
        </motion.button>
      ))}
    </div>
  )
}
