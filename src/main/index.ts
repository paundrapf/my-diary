import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import { initDb } from './db'
import { registerEntryHandlers } from './ipc/entries'
import { registerTagHandlers } from './ipc/tags'
import { registerEntryTagHandlers } from './ipc/entry-tags'
import { registerSettingsHandlers } from './ipc/settings'
import { registerInsightsHandlers } from './ipc/insights'
import { registerExportHandlers } from './ipc/export'
import { registerAppHandlers } from './ipc/app'
import { logger } from './logger'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    titleBarStyle: 'hiddenInset',
    titleBarOverlay: false,
    trafficLightPosition: { x: 12, y: 12 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.mydiary.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  initDb()
  registerEntryHandlers()
  registerTagHandlers()
  registerEntryTagHandlers()
  registerSettingsHandlers()
  registerInsightsHandlers()
  registerExportHandlers()
  registerAppHandlers()

  // Auto-updater
  autoUpdater.logger = null as any // we use our own logger
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = false

  autoUpdater.on('checking-for-update', () => {
    logger.info('Checking for update...')
  })

  autoUpdater.on('update-available', (info) => {
    logger.info(`Update available: ${info.version}`)
    if (mainWindow) {
      mainWindow.webContents.send('app:update-available', info.version)
    }
  })

  autoUpdater.on('update-not-available', () => {
    logger.info('Update not available')
  })

  autoUpdater.on('error', (err) => {
    logger.error(`Auto-updater error: ${err.message}`)
  })

  autoUpdater.on('update-downloaded', (info) => {
    logger.info(`Update downloaded: ${info.version}`)
    if (mainWindow) {
      mainWindow.webContents.send('app:update-downloaded', info.version)
    }
  })

  ipcMain.handle('app:quit-and-install', () => {
    autoUpdater.quitAndInstall()
  })

  createWindow()

  // Delayed update check (10s after ready)
  setTimeout(() => {
    if (!is.dev) {
      autoUpdater.checkForUpdates().catch((err) => {
        logger.error(`Failed to check for updates: ${err.message}`)
      })
    }
  }, 10000)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
