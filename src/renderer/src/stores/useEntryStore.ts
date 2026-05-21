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

  loadEntries: async (params) => {
    set({ isLoading: true })
    try {
      const entries = await window.api.entries.getAll(params)
      set({ entries, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  setActiveEntry: (id) => set({ activeEntryId: id }),

  createEntry: async () => {
    const entry = await window.api.entries.create({ title: '', content: '' })
    set((state) => ({
      entries: [entry, ...state.entries],
      activeEntryId: entry.id
    }))
  },

  updateEntry: async (data) => {
    await window.api.entries.update(data)
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === data.id ? { ...e, ...data } : e
      )
    }))
  },

  deleteEntry: async (id) => {
    await window.api.entries.softDelete(id)
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
      activeEntryId: state.activeEntryId === id ? null : state.activeEntryId
    }))
  },

  pinEntry: async (id, isPinned) => {
    await window.api.entries.pin({ id, is_pinned: isPinned })
    await get().loadEntries()
  },

  duplicateEntry: async (id) => {
    const entry = await window.api.entries.duplicate(id)
    set((state) => ({ entries: [entry, ...state.entries] }))
  },

  createVersion: async (entryId) => {
    await window.api.entries.createVersion(entryId)
    await get().loadVersions(entryId)
  },

  loadVersions: async (entryId) => {
    const versions = await window.api.entries.getVersions(entryId)
    set({ versions })
  },

  openVersionHistory: (entryId) => {
    get().loadVersions(entryId)
    set({
      isVersionHistoryOpen: true,
      selectedVersionId: null,
      compareFromId: null,
      compareToId: null,
      diffHtml: null
    })
  },

  closeVersionHistory: () => set({
    isVersionHistoryOpen: false,
    selectedVersionId: null,
    compareFromId: null,
    compareToId: null,
    diffHtml: null,
    versions: []
  }),

  selectVersion: (versionId) => set({ selectedVersionId: versionId }),

  restoreVersion: async (entryId, versionId) => {
    const entry = await window.api.entries.restoreVersion({ entryId, versionId })
    set((state) => ({
      entries: state.entries.map((e) => (e.id === entry.id ? entry : e)),
      activeEntryId: entry.id
    }))
    await get().loadVersions(entryId)
  },

  setCompareFrom: (id) => set({ compareFromId: id }),
  setCompareTo: (id) => set({ compareToId: id }),

  compareVersions: async (entryId, fromId, toId) => {
    const diffHtml = await window.api.entries.compareVersions({ entryId, fromId, toId })
    set({ diffHtml })
  }
}))
