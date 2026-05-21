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
        editor_font_size: parseInt(raw.editor_font_size || '16'),
        auto_save_delay: parseInt(raw.auto_save_delay || '1000'),
        auto_lock_timeout: parseInt(raw.auto_lock_timeout || '15'),
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
    await get().loadSettings()
  }
}))
