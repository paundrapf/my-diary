import { create } from 'zustand'
import type { Settings } from '../../../types'

interface SettingsStore {
  settings: Settings | null
  isLoading: boolean
  loadSettings: () => Promise<void>
  updateSetting: (key: string, value: string) => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: null,
  isLoading: false,

  loadSettings: async () => {
    set({ isLoading: true })
    try {
      const raw = await window.api.settings.getAll()
      const settings: Settings = {
        theme: (raw.theme as Settings['theme']) || 'system',
        accent_color: raw.accent_color || '#7F77DD',
        editor_font: raw.editor_font || 'Inter',
        editor_font_size: parseInt(raw.editor_font_size || '16', 10),
        auto_save_delay: parseInt(raw.auto_save_delay || '1000', 10),
        auto_lock_timeout: parseInt(raw.auto_lock_timeout || '15', 10),
        spell_check: raw.spell_check === 'true',
        markdown_shortcuts: raw.markdown_shortcuts === 'true',
        auto_backup: raw.auto_backup === 'true',
        auto_backup_path: raw.auto_backup_path || '',
        start_on_login: raw.start_on_login === 'true',
        show_in_menubar: raw.show_in_menubar === 'true',
        export_format: (raw.export_format as Settings['export_format']) || 'md',
        first_day_of_week: (parseInt(raw.first_day_of_week || '1') as 0 | 1)
      }
      set({ settings, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  updateSetting: async (key, value) => {
    await window.api.settings.set({ key, value })
    // Optimistically update local state without full refetch
    set((state) => {
      if (!state.settings) return state
      const updated = { ...state.settings, [key]: value }
      // Parse numeric fields
      if (key === 'editor_font_size') updated.editor_font_size = parseInt(value, 10)
      if (key === 'auto_save_delay') updated.auto_save_delay = parseInt(value, 10)
      if (key === 'auto_lock_timeout') updated.auto_lock_timeout = parseInt(value, 10)
      if (key === 'first_day_of_week') updated.first_day_of_week = parseInt(value, 10) as 0 | 1
      if (key === 'spell_check' || key === 'markdown_shortcuts' || key === 'auto_backup' || key === 'start_on_login' || key === 'show_in_menubar') {
        updated[key as keyof Settings] = (value === 'true') as any
      }
      return { settings: updated }
    })
  }
}))
