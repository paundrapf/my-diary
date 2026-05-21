import { create } from 'zustand'

type Page = 'journal' | 'calendar' | 'insights' | 'settings' | 'trash' | 'tags'

interface UIStore {
  isSidebarOpen: boolean
  activePage: Page
  isLocked: boolean
  activeTag: string | null
  searchQuery: string
  isSearchFocused: boolean

  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setActivePage: (page: Page) => void
  setLocked: (locked: boolean) => void
  setActiveTag: (tag: string | null) => void
  setSearchQuery: (query: string) => void
  setSearchFocused: (focused: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  isSidebarOpen: true,
  activePage: 'journal',
  isLocked: false,
  activeTag: null,
  searchQuery: '',
  isSearchFocused: false,

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setActivePage: (page) => set({ activePage: page }),
  setLocked: (locked) => set({ isLocked: locked }),
  setActiveTag: (tag) => set({ activeTag: tag }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchFocused: (focused) => set({ isSearchFocused: focused })
}))
