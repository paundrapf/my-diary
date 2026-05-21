import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import CharacterCount from '@tiptap/extension-character-count'
import Typography from '@tiptap/extension-typography'
import Highlight from '@tiptap/extension-highlight'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import type { Entry } from '../../../../types'
import { useEntryStore } from '../../stores/useEntryStore'
import { useSettingsStore } from '../../stores/useSettingsStore'
import MoodPicker from '../MoodPicker/MoodPicker'
import TagManager from '../TagManager/TagManager'
import VersionHistory from '../VersionHistory/VersionHistory'

interface EditorProps {
  entry: Entry
  onBack?: () => void
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = String(d.getFullYear()).slice(-2)
  const hours = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')
  return `${day}-${month}-${year} ${hours}:${mins}`
}

export default function Editor({ entry, onBack }: EditorProps): JSX.Element {
  const updateEntry = useEntryStore((s) => s.updateEntry)
  const createVersion = useEntryStore((s) => s.createVersion)
  const openVersionHistory = useEntryStore((s) => s.openVersionHistory)
  const isVersionHistoryOpen = useEntryStore((s) => s.isVersionHistoryOpen)
  const settings = useSettingsStore((s) => s.settings)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved')
  const [title, setTitle] = useState(entry.title)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const titleRef = useRef(title)
  const entryIdRef = useRef(entry.id)
  const entryMoodRef = useRef(entry.mood)
  const handleSaveRef = useRef<(() => void) | null>(null)

  // Keep refs in sync with latest values
  titleRef.current = title
  entryIdRef.current = entry.id
  entryMoodRef.current = entry.mood

  const autoSaveDelay = settings?.auto_save_delay ?? 800

  const editorExtensions = useMemo(() => [
    StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
    Placeholder.configure({ placeholder: 'Start writing...' }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Image,
    Link.configure({ openOnClick: false }),
    CharacterCount,
    Typography,
    Highlight,
    Table.configure({ resizable: true }),
    TableRow,
    TableCell,
    TableHeader
  ], [])

  const editor = useEditor({
    extensions: editorExtensions,
    content: entry.content || '',
    onUpdate: () => {
      setSaveStatus('unsaved')
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
      autoSaveTimer.current = setTimeout(() => {
        handleSaveRef.current?.()
      }, autoSaveDelay)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none'
      }
    }
  })

  // Sync editor content when entry changes externally (version restore, etc.)
  useEffect(() => {
    if (editor && entry.content !== undefined) {
      editor.commands.setContent(entry.content)
    }
    setTitle(entry.title)
  }, [entry.id, entry.content, editor])

  // Cleanup auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current)
        autoSaveTimer.current = null
      }
    }
  }, [])

  const handleSave = useCallback(async (): Promise<void> => {
    const currentTitle = titleRef.current
    const currentId = entryIdRef.current
    const currentContent = editor?.getHTML() || ''
    const currentMood = entryMoodRef.current

    setSaveStatus('saving')
    try {
      await updateEntry({
        id: currentId,
        title: currentTitle,
        content: currentContent,
        mood: currentMood ?? undefined
      })
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
    }
  }, [editor, updateEntry])

  // Keep handleSaveRef synced so onUpdate always calls latest
  useEffect(() => {
    handleSaveRef.current = handleSave
  }, [handleSave])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setTitle(e.target.value)
    setSaveStatus('unsaved')
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      handleSaveRef.current?.()
    }, autoSaveDelay)
  }

  const handleSaveVersion = async (): Promise<void> => {
    await createVersion(entry.id)
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault()
      handleSave()
    }
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'S') {
      e.preventDefault()
      handleSaveVersion()
    }
    if ((e.metaKey || e.ctrlKey) && e.altKey && e.key === 'h') {
      e.preventDefault()
      openVersionHistory(entry.id)
    }
  }

  const wordCount = editor?.storage.characterCount?.words?.() || entry.word_count || 0

  return (
    <div className="flex flex-col h-full" onKeyDown={handleKeyDown}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle bg-bg-primary/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="lg:hidden p-1 rounded hover:bg-bg-tertiary text-text-secondary">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <div className="flex items-center gap-1">
            <motion.button
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded text-xs ${editor?.isActive('bold') ? 'bg-bg-tertiary text-text-primary' : 'text-text-secondary hover:bg-bg-tertiary'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <strong>B</strong>
            </motion.button>
            <motion.button
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded text-xs ${editor?.isActive('italic') ? 'bg-bg-tertiary text-text-primary' : 'text-text-secondary hover:bg-bg-tertiary'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <em>I</em>
            </motion.button>
            <motion.button
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              className={`p-1.5 rounded text-xs ${editor?.isActive('strike') ? 'bg-bg-tertiary text-text-primary' : 'text-text-secondary hover:bg-bg-tertiary'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <s>S</s>
            </motion.button>
            <span className="w-px h-4 bg-border-subtle mx-1" />
            <motion.button
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-1.5 rounded text-xs ${editor?.isActive('heading', { level: 2 }) ? 'bg-bg-tertiary text-text-primary' : 'text-text-secondary hover:bg-bg-tertiary'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              H2
            </motion.button>
            <motion.button
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={`p-1.5 rounded text-xs ${editor?.isActive('bulletList') ? 'bg-bg-tertiary text-text-primary' : 'text-text-secondary hover:bg-bg-tertiary'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              •≡
            </motion.button>
            <motion.button
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={`p-1.5 rounded text-xs ${editor?.isActive('orderedList') ? 'bg-bg-tertiary text-text-primary' : 'text-text-secondary hover:bg-bg-tertiary'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              1.
            </motion.button>
            <motion.button
              onClick={() => editor?.chain().focus().toggleTaskList().run()}
              className={`p-1.5 rounded text-xs ${editor?.isActive('taskList') ? 'bg-bg-tertiary text-text-primary' : 'text-text-secondary hover:bg-bg-tertiary'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ☐
            </motion.button>
            <motion.button
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              className={`p-1.5 rounded text-xs ${editor?.isActive('blockquote') ? 'bg-bg-tertiary text-text-primary' : 'text-text-secondary hover:bg-bg-tertiary'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              "
            </motion.button>
            <motion.button
              onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
              className={`p-1.5 rounded text-xs ${editor?.isActive('codeBlock') ? 'bg-bg-tertiary text-text-primary' : 'text-text-secondary hover:bg-bg-tertiary'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              &lt;/&gt;
            </motion.button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <MoodPicker entryId={entry.id} currentMood={entry.mood} />
          <motion.button
            onClick={() => openVersionHistory(entry.id)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-text-secondary hover:bg-bg-tertiary transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title="Version History (⌘⌥H)"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 4v4l2.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Versions
          </motion.button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-3xl mx-auto">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled"
            className="w-full text-xl font-semibold text-text-primary bg-transparent border-none outline-none placeholder:text-text-tertiary mb-4"
          />

          <div className="flex items-center gap-2 mb-4">
            <TagManager entryId={entry.id} />
          </div>

          <div className="text-editor-base leading-relaxed">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-1.5 border-t border-border-subtle bg-bg-secondary/50 text-[11px] text-text-tertiary">
        <div className="flex items-center gap-3">
          <motion.span
            animate={{ opacity: saveStatus === 'saving' ? 0.5 : 1 }}
            transition={{ duration: 0.2 }}
          >
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'unsaved' ? 'Unsaved changes' : saveStatus === 'error' ? 'Failed to save' : `Saved ${formatDate(entry.last_edited_at || entry.updated_at)}`}
          </motion.span>
          <span className="w-px h-3 bg-border-subtle" />
          <span>{wordCount} words</span>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            onClick={handleSaveVersion}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-text-secondary hover:bg-bg-tertiary transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title="Save Version (⌘⇧S)"
          >
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
              <path d="M13 4l-7 7L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Save Version
          </motion.button>
          <span className="text-[10px]">
            {entry.created_at ? `Created ${formatDate(entry.created_at)}` : ''}
          </span>
        </div>
      </div>

      {isVersionHistoryOpen && <VersionHistory entryId={entry.id} />}
    </div>
  )
}
