import { app } from 'electron'
import { join } from 'path'
import { existsSync, statSync, renameSync, appendFileSync, mkdirSync } from 'fs'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_BACKUPS = 3

let logDir: string | null = null
let logFile: string | null = null

function initPaths(): void {
  if (logDir && logFile) return
  logDir = join(app.getPath('userData'), 'logs')
  logFile = join(logDir, 'app.log')
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true })
  }
}

function rotate(): void {
  if (!logFile) return
  if (!existsSync(logFile)) return

  const stats = statSync(logFile)
  if (stats.size < MAX_SIZE) return

  // Rotate backups: app.log.2 -> app.log.3, app.log.1 -> app.log.2, app.log -> app.log.1
  for (let i = MAX_BACKUPS; i > 0; i--) {
    const from = `${logFile}.${i - 1}`
    const to = `${logFile}.${i}`
    if (existsSync(to)) {
      try { renameSync(to, `${logFile}.${i}.tmp`) } catch { /* ignore */ }
    }
  }
  for (let i = MAX_BACKUPS; i > 0; i--) {
    const from = `${logFile}.${i - 1}`
    const to = `${logFile}.${i}`
    if (existsSync(from)) {
      try { renameSync(from, to) } catch { /* ignore */ }
    }
  }
  try { renameSync(logFile, `${logFile}.1`) } catch { /* ignore */ }
}

function write(level: string, message: string): void {
  initPaths()
  rotate()
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const line = `[${timestamp}] [${level}] ${message}\n`
  try {
    appendFileSync(logFile!, line, 'utf8')
  } catch {
    // If logging fails, we can't log the failure — silent catch
  }
}

export const logger = {
  debug: (msg: string) => write('DEBUG', msg),
  info: (msg: string) => write('INFO', msg),
  warn: (msg: string) => write('WARN', msg),
  error: (msg: string) => write('ERROR', msg)
}
