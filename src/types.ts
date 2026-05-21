export interface Entry {
  id: string
  title: string
  content: string
  content_preview: string | null
  mood: number | null
  is_pinned: number
  is_locked: number
  word_count: number
  created_at: string
  updated_at: string
  last_edited_at: string
  deleted_at: string | null
  tags?: Tag[]
}

export interface Tag {
  id: string
  name: string
  color: string
  entry_count?: number
}

export interface EntryVersion {
  id: string
  entry_id: string
  title: string
  content: string
  content_preview: string | null
  word_count: number
  version: number
  change_desc: string
  created_at: string
}

export interface Settings {
  theme: 'light' | 'dark' | 'system'
  accent_color: string
  editor_font: string
  editor_font_size: number
  auto_save_delay: number
  auto_lock_timeout: number
  spell_check: boolean
  markdown_shortcuts: boolean
  auto_backup: boolean
  auto_backup_path: string
  start_on_login: boolean
  show_in_menubar: boolean
  export_format: 'md' | 'pdf' | 'txt'
  first_day_of_week: 0 | 1
}

export interface DiffResult {
  fromVersion: number
  toVersion: number
  changes: DiffChange[]
}

export interface DiffChange {
  type: 'equal' | 'insert' | 'delete'
  text: string
}

export interface ElectronAPI {
  entries: {
    create: (data: { title?: string; content?: string; mood?: number }) => Promise<Entry>
    getAll: (params?: { tag?: string; search?: string; pinned?: boolean; includeDeleted?: boolean }) => Promise<Entry[]>
    getById: (id: string) => Promise<Entry | null>
    update: (data: { id: string; title?: string; content?: string; mood?: number }) => Promise<Entry>
    softDelete: (id: string) => Promise<boolean>
    pin: (data: { id: string; is_pinned: boolean }) => Promise<Entry>
    duplicate: (id: string) => Promise<Entry>
    createVersion: (entryId: string) => Promise<EntryVersion>
    getVersions: (entryId: string) => Promise<EntryVersion[]>
    getVersionById: (versionId: string) => Promise<EntryVersion | null>
    restoreVersion: (data: { entryId: string; versionId: string }) => Promise<Entry>
    compareVersions: (data: { entryId: string; fromId: string; toId: string }) => Promise<string>
  }
  tags: {
    getAll: () => Promise<(Tag & { entry_count: number })[]>
    create: (data: { name: string; color?: string }) => Promise<Tag>
    update: (data: { id: string; name?: string; color?: string }) => Promise<Tag>
    delete: (id: string) => Promise<boolean>
  }
  entryTags: {
    setTags: (data: { entryId: string; tagIds: string[] }) => Promise<void>
    getEntryTags: (entryId: string) => Promise<Tag[]>
  }
  settings: {
    get: (key: string) => Promise<string | null>
    set: (data: { key: string; value: string }) => Promise<void>
    getAll: () => Promise<Record<string, string>>
  }
  app: {
    lock: () => Promise<void>
    unlock: (pin: string) => Promise<boolean>
    setPin: (pin: string) => Promise<void>
    onLocked: (callback: () => void) => () => void
    getWindow: () => { minimize: () => void; maximize: () => void; close: () => void }
  }
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
