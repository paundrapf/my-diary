import { ipcMain, BrowserWindow } from 'electron'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'
import { getDb } from '../db'
import { settings } from '../../../drizzle/schema'

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

export function registerAppHandlers(): void {
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
      return true
    }

    lockoutAttempts++
    if (lockoutAttempts >= 5) {
      const backoff = Math.min(Math.pow(2, lockoutAttempts - 5), 300) * 1000
      lockoutUntil = Date.now() + backoff
    }

    return false
  })

  ipcMain.handle('app:setPin', async (_event, pin: string) => {
    pinHash = hashPin(pin)
    const db = getDb()
    db.insert(settings).values({ key: 'pin_hash', value: pinHash })
      .onConflictDoUpdate({ target: settings.key, set: { value: pinHash } }).run()
  })

  try {
    const db = getDb()
    const stored = db.select().from(settings).where(eq(settings.key, 'pin_hash')).get() as any
    if (stored) pinHash = stored.value
  } catch {
    // DB not initialized yet, that's ok
  }
}
