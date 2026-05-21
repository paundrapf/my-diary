import { ipcMain, BrowserWindow, powerMonitor, shell } from 'electron'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'
import { app } from 'electron'
import { join } from 'path'
import { getDb, getSqliteDb, rebuildFts5 } from '../db'
import { settings } from '../../../drizzle/schema'
import { logger } from '../logger'

let pinHash: string | null = null
let lockoutUntil: number | null = null
let lockoutAttempts = 0
let idleTimer: ReturnType<typeof setTimeout> | null = null

function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(pin, salt, 100000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

function verifyPin(pin: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  const verify = crypto.pbkdf2Sync(pin, salt, 100000, 64, 'sha512').toString('hex')
  return hash === verify
}

function loadPersistentLockout(): void {
  try {
    const db = getDb()
    const stored = db.select().from(settings).where(eq(settings.key, 'lockout_until')).get() as any
    if (stored?.value) {
      const val = parseInt(stored.value, 10)
      if (!isNaN(val) && val > Date.now()) lockoutUntil = val
    }
    const attempts = db.select().from(settings).where(eq(settings.key, 'lockout_attempts')).get() as any
    if (attempts?.value) {
      const val = parseInt(attempts.value, 10)
      if (!isNaN(val)) lockoutAttempts = val
    }
  } catch {
    // DB not ready
  }
}

function savePersistentLockout(): void {
  try {
    const db = getDb()
    db.insert(settings).values({ key: 'lockout_until', value: String(lockoutUntil || 0) })
      .onConflictDoUpdate({ target: settings.key, set: { value: String(lockoutUntil || 0) } }).run()
    db.insert(settings).values({ key: 'lockout_attempts', value: String(lockoutAttempts) })
      .onConflictDoUpdate({ target: settings.key, set: { value: String(lockoutAttempts) } }).run()
  } catch {
    // silent
  }
}

function startIdleTimer(minutes: number): void {
  if (idleTimer) clearTimeout(idleTimer)
  if (minutes <= 0) return
  idleTimer = setTimeout(() => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) {
      win.webContents.send('app:locked')
    }
  }, minutes * 60 * 1000)
}

export function registerAppHandlers(): void {
  ipcMain.handle('app:log', async (_event, level: string, message: string) => {
    switch (level) {
      case 'debug':
        logger.debug(message)
        break
      case 'warn':
        logger.warn(message)
        break
      case 'error':
        logger.error(message)
        break
      default:
        logger.info(message)
    }
  })

  ipcMain.handle('app:openLogsFolder', async () => {
    const logPath = join(app.getPath('userData'), 'logs')
    shell.openPath(logPath)
  })

  ipcMain.handle('app:getVersion', async () => {
    return app.getVersion()
  })

  ipcMain.handle('app:repairDatabase', async () => {
    try {
      const sqliteDb = getSqliteDb()
      const integrity = sqliteDb.pragma('integrity_check') as { integrity_check: string }[]
      const isCorrupt = integrity.some((row) => row.integrity_check !== 'ok')
      if (isCorrupt) {
        logger.warn('Database integrity check failed. Rebuilding FTS5...')
      }
      rebuildFts5(sqliteDb)
      logger.info('FTS5 rebuilt successfully')
      return { success: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error(`Database repair failed: ${msg}`)
      return { success: false, error: msg }
    }
  })

  // Window controls
  ipcMain.handle('window:minimize', () => {
    BrowserWindow.getFocusedWindow()?.minimize()
  })
  ipcMain.handle('window:maximize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win?.isMaximized()) win.unmaximize()
    else win?.maximize()
  })
  ipcMain.handle('window:close', () => {
    BrowserWindow.getFocusedWindow()?.close()
  })

  ipcMain.handle('app:lock', async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) {
      win.webContents.send('app:locked')
    }
  })

  ipcMain.handle('app:unlock', async (_event, pin: string) => {
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000)
      throw new Error(`Locked out for ${remaining}s`)
    }

    if (!pinHash) return true

    if (verifyPin(pin, pinHash)) {
      lockoutAttempts = 0
      lockoutUntil = null
      savePersistentLockout()
      return true
    }

    lockoutAttempts++
    if (lockoutAttempts >= 5) {
      const backoff = Math.min(Math.pow(2, lockoutAttempts - 5), 300) * 1000
      lockoutUntil = Date.now() + backoff
    }
    savePersistentLockout()

    return false
  })

  ipcMain.handle('app:setPin', async (_event, pin: string) => {
    if (!/^\d{4,6}$/.test(pin)) {
      throw new Error('PIN must be 4-6 digits')
    }
    pinHash = hashPin(pin)
    const db = getDb()
    db.insert(settings).values({ key: 'pin_hash', value: pinHash })
      .onConflictDoUpdate({ target: settings.key, set: { value: pinHash } }).run()
    // Read auto-lock timeout and start timer
    const autoLock = db.select().from(settings).where(eq(settings.key, 'auto_lock_timeout')).get() as any
    const mins = autoLock?.value ? parseInt(autoLock.value, 10) : 15
    startIdleTimer(mins)
  })

  // Listen for power events to reset idle timer
  powerMonitor.on('suspend', () => {
    if (idleTimer) clearTimeout(idleTimer)
  })
  powerMonitor.on('resume', () => {
    try {
      const db = getDb()
      const autoLock = db.select().from(settings).where(eq(settings.key, 'auto_lock_timeout')).get() as any
      const mins = autoLock?.value ? parseInt(autoLock.value, 10) : 15
      startIdleTimer(mins)
    } catch { /* silent */ }
  })

  loadPersistentLockout()
}
