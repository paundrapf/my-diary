import { ipcMain } from 'electron'
import { eq, sql } from 'drizzle-orm'
import { getDb, generateId } from '../db'
import { tags, entryTags } from '../../../drizzle/schema'

export function registerTagHandlers(): void {
  ipcMain.handle('tags:getAll', async () => {
    const db = getDb()
    const result = db.select({
      id: tags.id,
      name: tags.name,
      color: tags.color,
      entry_count: sql<number>`COUNT(${entryTags.entry_id})`.as('entry_count')
    })
      .from(tags)
      .leftJoin(entryTags, eq(tags.id, entryTags.tag_id))
      .groupBy(tags.id)
      .orderBy(tags.name)
      .all()

    return result
  })

  ipcMain.handle('tags:create', async (_event, data: { name: string; color?: string }) => {
    const db = getDb()
    const id = generateId()
    const tag = { id, name: data.name, color: data.color || '#7F77DD' }
    db.insert(tags).values(tag).run()
    return tag
  })

  ipcMain.handle('tags:update', async (_event, data: { id: string; name?: string; color?: string }) => {
    const db = getDb()
    const updateData: Record<string, string> = {}
    if (data.name) updateData.name = data.name
    if (data.color) updateData.color = data.color
    db.update(tags).set(updateData).where(eq(tags.id, data.id)).run()
    return db.select().from(tags).where(eq(tags.id, data.id)).get()
  })

  ipcMain.handle('tags:delete', async (_event, id: string) => {
    const db = getDb()
    db.delete(tags).where(eq(tags.id, id)).run()
    return true
  })
}
