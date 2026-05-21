import { ipcMain } from 'electron'
import { eq, and } from 'drizzle-orm'
import { getDb } from '../db'
import { entryTags, tags } from '../../../drizzle/schema'

export function registerEntryTagHandlers(): void {
  ipcMain.handle('entryTags:setTags', async (_event, data: { entryId: string; tagIds: string[] }) => {
    const db = getDb()
    db.delete(entryTags).where(eq(entryTags.entry_id, data.entryId)).run()
    for (const tagId of data.tagIds) {
      db.insert(entryTags).values({ entry_id: data.entryId, tag_id: tagId }).run()
    }
  })

  ipcMain.handle('entryTags:getEntryTags', async (_event, entryId: string) => {
    const db = getDb()
    return db.select({
      id: tags.id,
      name: tags.name,
      color: tags.color
    })
      .from(entryTags)
      .innerJoin(tags, eq(entryTags.tag_id, tags.id))
      .where(eq(entryTags.entry_id, entryId))
      .all()
  })
}
