import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useEntryStore } from '../../stores/useEntryStore'
import { quickMoods, extendedMoods, getMoodColor } from '../../lib/moodData'

interface MoodPickerProps {
  entryId: string
  currentMood: number | null
}

export default function MoodPicker({ entryId, currentMood }: MoodPickerProps): JSX.Element {
  const [selected, setSelected] = useState<number | null>(currentMood)
  const [isOpen, setIsOpen] = useState(false)
  const updateEntry = useEntryStore((s) => s.updateEntry)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSelected(currentMood)
  }, [currentMood])

  const handleSelect = async (level: number): Promise<void> => {
    const newMood = selected === level ? null : level
    setSelected(newMood)
    setIsOpen(false)
    await updateEntry({ id: entryId, mood: newMood || undefined })
  }

  const color = getMoodColor(selected)

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-0.5">
        {quickMoods.map((mood) => (
          <motion.button
            key={mood.id}
            onClick={() => handleSelect(mood.id)}
            className="relative p-1 rounded-md transition-colors"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            title={mood.label}
          >
            <motion.span
              className="text-base block leading-none"
              animate={
                selected === mood.id
                  ? { scale: 1.25, rotate: [0, -5, 5, 0] }
                  : { scale: 1 }
              }
              transition={
                selected === mood.id
                  ? { type: 'spring', stiffness: 500, damping: 15 }
                  : { duration: 0.15 }
              }
            >
              {mood.emoji}
            </motion.span>
            {selected === mood.id && (
              <motion.div
                layoutId="mood-indicator"
                className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                style={{ backgroundColor: mood.color }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              />
            )}
          </motion.button>
        ))}

        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50 transition-colors"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          title="More moods"
        >
          <Plus size={15} strokeWidth={1.5} />
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="fixed inset-0 z-50"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: -6, originX: 1, originY: 0 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: -6 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-full right-0 z-50 mt-1.5 p-2 bg-bg-primary border border-border-default rounded-xl shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="grid grid-cols-5 gap-1 overflow-y-auto"
                style={{ maxHeight: '170px' }}
              >
                {extendedMoods.map((mood) => (
                  <motion.button
                    key={mood.id}
                    onClick={() => handleSelect(mood.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors relative"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    title={mood.label}
                  >
                    <span className="text-sm leading-none">{mood.emoji}</span>
                    {selected === mood.id && (
                      <motion.div
                        layoutId="mood-extended-dot"
                        className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                        style={{ backgroundColor: mood.color }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {selected !== null && !isOpen && (
        <motion.div
          className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full mx-4"
          style={{ backgroundColor: color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </div>
  )
}
