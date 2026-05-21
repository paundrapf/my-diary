import { create } from 'zustand'
import type { Entry, EntryVersion } from '../../../types'

interface EntryStore {
  entries: Entry[]
  activeEntryId: string | null
  versions: EntryVersion[]
  isVersionHistoryOpen: boolean
  selectedVersionId: string | null
  compareFromId: string | null
  compareToId: string | null
  diffHtml: string | null
  isLoading: boolean
  error: string | null
  currentFilter: { tag?: string; search?: string; pinned?: boolean } | null

  loadEntries: (params?: { tag?: string; search?: string; pinned?: boolean }) => Promise<void>
  setActiveEntry: (id: string | null) => void
  createEntry: () => Promise<void>
  updateEntry: (data: { id: string; title?: string; content?: string; mood?: number }) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  pinEntry: (id: string, isPinned: boolean) => Promise<void>
  duplicateEntry: (id: string) => Promise<void>

  createVersion: (entryId: string) => Promise<void>
  loadVersions: (entryId: string) => void
  openVersionHistory: (entryId: string) => void
  closeVersionHistory: () => void
  selectVersion: (versionId: string | null) => void
  restoreVersion: (entryId: string, versionId: string) => Promise<void>
  setCompareFrom: (id: string | null) => void
  setCompareTo: (id: string | null) => void
  compareVersions: (entryId: string, fromId: string, toId: string) => Promise<void>
}

export const useEntryStore = create<EntryStore>((set, get) => ({
  entries: [],
  activeEntryId: null,
  versions: [],
  isVersionHistoryOpen: false,
  selectedVersionId: null,
  compareFromId: null,
  compareToId: null,
  diffHtml: null,
  isLoading: false,
  error: null,
  currentFilter: null,

  loadEntries: async (params) => {
    set({ isLoading: true, error: null, currentFilter: params || null })
    try {
      const entries = await window.api.entries.getAll(params)
      set({ entries, isLoading: false })
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Failed to load entries' })
    }
  },

  setActiveEntry: (id) => set({ activeEntryId: id }),

  createEntry: async () => {
    try {
      const entry = await window.api.entries.create({ title: '', content: '' })
      set((state) => ({
        entries: [entry, ...state.entries],
        activeEntryId: entry.id,
        error: null
      }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to create entry' })
    }
  },

  updateEntry: async (data) => {
    try {
      const updatedEntry = await window.api.entries.update(data)
      set((state) => ({
        entries: state.entries.map((e) =>
          e.id === updatedEntry.id ? { ...e, ...updatedEntry } : e
        ),
        error: null
      }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to update entry' })
    }
  },

  deleteEntry: async (id) => {
    try {
      await window.api.entries.softDelete(id)
      set((state) => ({
        entries: state.entries.filter((e) => e.id !== id),
        activeEntryId: state.activeEntryId === id ? null : state.activeEntryId,
        error: null
      }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to delete entry' })
    }
  },

  pinEntry: async (id, isPinned) => {
    try {
      await window.api.entries.pin({ id, is_pinned: isPinned })
      // Reload with current filter preserved
      const filter = get().currentFilter
      await get().loadEntries(filter || undefined)
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to pin entry' })
    }
  },

  duplicateEntry: async (id) => {
    try {
      const entry = await window.api.entries.duplicate(id)
      set((state) => ({ entries: [entry, ...state.entries], error: null }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to duplicate entry' })
    }
  },

  createVersion: async (entryId) => {
    try {
      await window.api.entries.createVersion(entryId)
      await get().loadVersions(entryId)
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to save version' })
    }
  },

  loadVersions: async (entryId) => {
    try {
      const versions = await window.api.entries.getVersions(entryId)
      set({ versions })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load versions' })
    }
  },

  openVersionHistory: (entryId) => {
    get().loadVersions(entryId)
    set({
      isVersionHistoryOpen: true,
      selectedVersionId: null,
      compareFromId: null,
      compareToId: null,
      diffHtml: null,
      error: null
    })
  },

  closeVersionHistory: () => set({
    isVersionHistoryOpen: false,
    selectedVersionId: null,
    compareFromId: null,
    compareToId: null,
    diffHtml: null,
    versions: [],
    error: null
  }),

  selectVersion: (versionId) => set({ selectedVersionId: versionId }),

  restoreVersion: async (entryId, versionId) => {
    try {
      const entry = await window.api.entries.restoreVersion({ entryId, versionId })
      set((state) => ({
        entries: state.entries.map((e) => (e.id === entry.id ? entry : e)),
        activeEntryId: entry.id,
        error: null
      }))
      await get().loadVersions(entryId)
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to restore version' })
    }
  },

  setCompareFrom: (id) => set({ compareFromId: id }),
  setCompareTo: (id) => set({ compareToId: id }),

  compareVersions: async (entryId, fromId, toId) => {
    try {
      const diffHtml = await window.api.entries.compareVersions({ entryId, fromId, toId })
      set({ diffHtml })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to compare versions' })
    }
  }
}))
