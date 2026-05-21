import { contextBridge, ipcRenderer } from 'electron'

const api = {
  entries: {
    create: (data: { title?: string; content?: string; mood?: number }) =>
      ipcRenderer.invoke('entries:create', data),
    getAll: (params?: { tag?: string; search?: string; pinned?: boolean; includeDeleted?: boolean }) =>
      ipcRenderer.invoke('entries:getAll', params),
    getById: (id: string) => ipcRenderer.invoke('entries:getById', id),
    update: (data: { id: string; title?: string; content?: string; mood?: number }) =>
      ipcRenderer.invoke('entries:update', data),
    softDelete: (id: string) => ipcRenderer.invoke('entries:softDelete', id),
    pin: (data: { id: string; is_pinned: boolean }) => ipcRenderer.invoke('entries:pin', data),
    duplicate: (id: string) => ipcRenderer.invoke('entries:duplicate', id),
    createVersion: (entryId: string) => ipcRenderer.invoke('entries:createVersion', entryId),
    getVersions: (entryId: string) => ipcRenderer.invoke('entries:getVersions', entryId),
    getVersionById: (versionId: string) => ipcRenderer.invoke('entries:getVersionById', versionId),
    restoreVersion: (data: { entryId: string; versionId: string }) =>
      ipcRenderer.invoke('entries:restoreVersion', data),
    compareVersions: (data: { entryId: string; fromId: string; toId: string }) =>
      ipcRenderer.invoke('entries:compareVersions', data)
  },
  tags: {
    getAll: () => ipcRenderer.invoke('tags:getAll'),
    create: (data: { name: string; color?: string }) => ipcRenderer.invoke('tags:create', data),
    update: (data: { id: string; name?: string; color?: string }) => ipcRenderer.invoke('tags:update', data),
    delete: (id: string) => ipcRenderer.invoke('tags:delete', id)
  },
  entryTags: {
    setTags: (data: { entryId: string; tagIds: string[] }) =>
      ipcRenderer.invoke('entryTags:setTags', data),
    getEntryTags: (entryId: string) => ipcRenderer.invoke('entryTags:getEntryTags', entryId)
  },
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (data: { key: string; value: string }) => ipcRenderer.invoke('settings:set', data),
    getAll: () => ipcRenderer.invoke('settings:getAll')
  },
  insights: {
    getStats: () => ipcRenderer.invoke('insights:getStats')
  },
  export: {
    entry: (data: { entryId: string; format: 'md' | 'pdf' | 'txt' }) =>
      ipcRenderer.invoke('entries:export', data),
    all: (data: { format: 'md' | 'txt' }) =>
      ipcRenderer.invoke('entries:exportAll', data)
  },
  app: {
    lock: () => ipcRenderer.invoke('app:lock'),
    unlock: (pin: string) => ipcRenderer.invoke('app:unlock', pin),
    setPin: (pin: string) => ipcRenderer.invoke('app:setPin', pin),
    log: (level: string, message: string) => ipcRenderer.invoke('app:log', level, message),
    openLogsFolder: () => ipcRenderer.invoke('app:openLogsFolder'),
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    checkForUpdate: () => ipcRenderer.invoke('app:checkForUpdate'),
    repairDatabase: () => ipcRenderer.invoke('app:repairDatabase'),
    quitAndInstall: () => ipcRenderer.invoke('app:quit-and-install'),
    openReleases: () => ipcRenderer.invoke('app:openReleases'),
    onLocked: (callback: () => void) => {
      const handler = (): void => callback()
      ipcRenderer.on('app:locked', handler)
      return () => ipcRenderer.removeListener('app:locked', handler)
    },
    onUpdateAvailable: (callback: (version: string) => void) => {
      const handler = (_event: unknown, version: string): void => callback(version)
      ipcRenderer.on('app:update-available', handler)
      return () => ipcRenderer.removeListener('app:update-available', handler)
    },
    onUpdateDownloaded: (callback: (version: string) => void) => {
      const handler = (_event: unknown, version: string): void => callback(version)
      ipcRenderer.on('app:update-downloaded', handler)
      return () => ipcRenderer.removeListener('app:update-downloaded', handler)
    },
    onUpdateNotAvailable: (callback: () => void) => {
      const handler = (): void => callback()
      ipcRenderer.on('app:update-not-available', handler)
      return () => ipcRenderer.removeListener('app:update-not-available', handler)
    },
    onUpdateError: (callback: (msg: string) => void) => {
      const handler = (_event: unknown, msg: string): void => callback(msg)
      ipcRenderer.on('app:update-error', handler)
      return () => ipcRenderer.removeListener('app:update-error', handler)
    },
    getWindow: () => ({
      minimize: () => ipcRenderer.invoke('window:minimize'),
      maximize: () => ipcRenderer.invoke('window:maximize'),
      close: () => ipcRenderer.invoke('window:close')
    })
  }
}

contextBridge.exposeInMainWorld('api', api)
