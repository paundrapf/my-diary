import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Tag } from '../../../../types'

interface TagManagerProps {
  entryId: string
}

export default function TagManager({ entryId }: TagManagerProps): JSX.Element {
  const [tags, setTags] = useState<Tag[]>([])
  const [allTags, setAllTags] = useState<(Tag & { entry_count?: number })[]>([])
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadTags()
    loadAllTags()
  }, [entryId])

  const loadTags = async (): Promise<void> => {
    try {
      const result = await window.api.entryTags.getEntryTags(entryId)
      setTags(result)
    } catch {
      // silent
    }
  }

  const loadAllTags = async (): Promise<void> => {
    try {
      const result = await window.api.tags.getAll()
      setAllTags(result)
    } catch {
      // silent
    }
  }

  const addTag = async (name: string): Promise<void> => {
    const existing = allTags.find((t) => t.name.toLowerCase() === name.toLowerCase())
    let tagId: string

    if (existing) {
      tagId = existing.id
    } else {
      const created = await window.api.tags.create({ name, color: randomColor() })
      tagId = created.id
      setAllTags((prev) => [...prev, created])
    }

    const currentIds = tags.map((t) => t.id)
    if (!currentIds.includes(tagId)) {
      const tagColor = existing?.color || '#7F77DD'
      const newTags = [...tags, { id: tagId, name, color: tagColor }]
      await window.api.entryTags.setTags({ entryId, tagIds: newTags.map((t) => t.id) })
      setTags(newTags)
    }

    setInputValue('')
    setShowSuggestions(false)
  }

  const removeTag = async (tagId: string): Promise<void> => {
    const newTags = tags.filter((t) => t.id !== tagId)
    await window.api.entryTags.setTags({ entryId, tagIds: newTags.map((t) => t.id) })
    setTags(newTags)
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      addTag(inputValue.trim())
    }
    if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1].id)
    }
  }

  const suggestions = allTags.filter(
    (t) =>
      t.name.toLowerCase().includes(inputValue.toLowerCase()) &&
      !tags.some((tag) => tag.id === t.id)
  )

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <AnimatePresence>
        {tags.map((tag) => (
          <motion.span
            key={tag.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{
              backgroundColor: tag.color + '20',
              color: tag.color
            }}
          >
            {tag.name}
            <button
              onClick={() => removeTag(tag.id)}
              className="hover:opacity-70 transition-opacity"
            >
              ×
            </button>
          </motion.span>
        ))}
      </AnimatePresence>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? 'Add tag...' : ''}
          className="w-20 text-xs bg-transparent border-none outline-none text-text-secondary placeholder:text-text-tertiary"
        />
        <AnimatePresence>
          {showSuggestions && inputValue && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full left-0 mt-1 w-40 bg-bg-primary border border-border-default rounded-lg shadow-lg z-50 overflow-hidden"
            >
              {suggestions.slice(0, 5).map((s) => (
                <button
                  key={s.id}
                  onMouseDown={() => addTag(s.name)}
                  className="w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:bg-bg-tertiary transition-colors flex items-center gap-2"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  {s.name}
                  {s.entry_count !== undefined && (
                    <span className="ml-auto text-text-tertiary text-[10px]">
                      {s.entry_count}
                    </span>
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function randomColor(): string {
  const colors = ['#7F77DD', '#14B8A6', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#10B981', '#F97316']
  return colors[Math.floor(Math.random() * colors.length)]
}
