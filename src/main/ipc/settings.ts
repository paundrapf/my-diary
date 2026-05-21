import { ipcMain } from 'electron'
import { eq } from 'drizzle-orm'
import { getDb } from '../db'
import { settings } from '../../../drizzle/schema'

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', async (_event, key: string) => {
    const db = getDb()
    const result = db.select().from(settings).where(eq(settings.key, key)).get() as any
    return result?.value || null
  })

  ipcMain.handle('settings:set', async (_event, data: { key: string; value: string }) => {
    const db = getDb()
    db.insert(settings).values(data).onConflictDoUpdate({ target: settings.key, set: { value: data.value } }).run()
  })

  ipcMain.handle('settings:getAll', async () => {
    const db = getDb()
    const rows = db.select().from(settings).all() as { key: string; value: string }[]
    const result: Record<string, string> = {}
    for (const row of rows) {
      result[row.key] = row.value
    }
    return result
  })
}
