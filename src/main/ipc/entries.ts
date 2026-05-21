import { ipcMain } from 'electron'
import { eq, desc, sql, and, isNull } from 'drizzle-orm'
import { getDb, generateId, nowISO, getSqliteDb, rebuildFts5 } from '../db'
import { entries, entryVersions, entryTags, tags } from '../../../drizzle/schema'
import { computeDiffHtml } from '../diff'
import { logger } from '../logger'

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim().slice(0, 200)
}

function countWords(text: string): number {
  const stripped = text.replace(/<[^>]*>/g, '')
  return stripped.split(/\s+/).filter(Boolean).length
}

export function registerEntryHandlers(): void {
  ipcMain.handle('entries:create', async (_event, data: { title?: string; content?: string; mood?: number }) => {
    const db = getDb()
    const sqliteDb = getSqliteDb()
    const id = generateId()
    const now = nowISO()
    const title = data.title || ''
    const content = data.content || ''

    const entry = {
      id,
      title,
      content,
      content_preview: stripHtml(content),
      mood: data.mood ?? null,
      is_pinned: 0,
      is_locked: 0,
      word_count: countWords(content),
      last_edited_at: now,
      created_at: now,
      updated_at: now,
      deleted_at: null
    }

    const createEntryTx = sqliteDb.transaction(() => {
      db.insert(entries).values(entry).run()
      db.insert(entryVersions).values({
        id: generateId(),
        entry_id: id,
        title,
        content,
        content_preview: stripHtml(content),
        word_count: countWords(content),
        version: 1,
        change_desc: 'Initial',
        created_at: now
      }).run()
    })
    createEntryTx()

    return { ...entry, tags: [] }
  })

  ipcMain.handle('entries:getAll', async (_event, params?: { tag?: string; search?: string; pinned?: boolean; includeDeleted?: boolean }) => {
    const db = getDb()
    const conditions = []

    if (!params?.includeDeleted) {
      conditions.push(isNull(entries.deleted_at))
    }

    if (params?.pinned) {
      conditions.push(eq(entries.is_pinned, 1))
    }

    let query = db.select({
      id: entries.id,
      title: entries.title,
      content: entries.content,
      content_preview: entries.content_preview,
      mood: entries.mood,
      is_pinned: entries.is_pinned,
      is_locked: entries.is_locked,
      word_count: entries.word_count,
      last_edited_at: entries.last_edited_at,
      created_at: entries.created_at,
      updated_at: entries.updated_at,
      deleted_at: entries.deleted_at
    }).from(entries)

    if (params?.tag) {
      query = query.innerJoin(entryTags, eq(entries.id, entryTags.entry_id))
        .innerJoin(tags, eq(entryTags.tag_id, tags.id))
        .where(and(...conditions, eq(tags.name, params.tag)))
        .orderBy(desc(entries.is_pinned), desc(entries.last_edited_at))
    } else if (params?.search) {
      const sqliteDb = getSqliteDb()
      const searchResults = sqliteDb.prepare(
        `SELECT rowid FROM entries_fts WHERE entries_fts MATCH ?`
      ).all(params.search) as { rowid: number }[]

      if (searchResults.length === 0) return []

      const rowids = searchResults.map(r => r.rowid)
      const result = db.select({
        id: entries.id,
        title: entries.title,
        content: entries.content,
        content_preview: entries.content_preview,
        mood: entries.mood,
        is_pinned: entries.is_pinned,
        is_locked: entries.is_locked,
        word_count: entries.word_count,
        last_edited_at: entries.last_edited_at,
        created_at: entries.created_at,
        updated_at: entries.updated_at,
        deleted_at: entries.deleted_at
      }).from(entries)
        .where(and(...conditions, sql`rowid IN ${sql.raw('(' + rowids.join(',') + ')')}`))
        .orderBy(desc(entries.is_pinned), desc(entries.last_edited_at))
        .all()

      const allTags = db.select({
        entry_id: entryTags.entry_id,
        id: tags.id,
        name: tags.name,
        color: tags.color
      }).from(entryTags)
        .innerJoin(tags, eq(entryTags.tag_id, tags.id))
        .all()

      return result.map(e => ({
        ...e,
        tags: allTags.filter(t => t.entry_id === e.id).map(t => ({ id: t.id, name: t.name, color: t.color }))
      }))
    } else {
      query = query.where(and(...conditions))
        .orderBy(desc(entries.is_pinned), desc(entries.last_edited_at))
    }

    const result = query.all() as any[]

    const allTags = db.select({
      entry_id: entryTags.entry_id,
      id: tags.id,
      name: tags.name,
      color: tags.color
    }).from(entryTags)
      .innerJoin(tags, eq(entryTags.tag_id, tags.id))
      .all()

    return result.map((e: any) => ({
      ...e,
      tags: allTags.filter((t: any) => t.entry_id === e.id).map((t: any) => ({ id: t.id, name: t.name, color: t.color }))
    }))
  })

  ipcMain.handle('entries:getById', async (_event, id: string) => {
    const db = getDb()
    const result = db.select().from(entries).where(eq(entries.id, id)).get() as any
    if (!result) return null

    const entryTagsResult = db.select({
      id: tags.id,
      name: tags.name,
      color: tags.color
    }).from(entryTags)
      .innerJoin(tags, eq(entryTags.tag_id, tags.id))
      .where(eq(entryTags.entry_id, id))
      .all()

    return { ...result, tags: entryTagsResult }
  })

  ipcMain.handle('entries:update', async (_event, data: { id: string; title?: string; content?: string; mood?: number }) => {
    const db = getDb()
    const now = nowISO()
    const updateData: Record<string, unknown> = { updated_at: now, last_edited_at: now }

    if (data.title !== undefined) updateData.title = data.title
    if (data.content !== undefined) {
      updateData.content = data.content
      updateData.content_preview = stripHtml(data.content)
      updateData.word_count = countWords(data.content)
    }
    if (data.mood !== undefined) updateData.mood = data.mood

    db.update(entries)
      .set(updateData)
      .where(eq(entries.id, data.id))
      .run()

    const result = db.select().from(entries).where(eq(entries.id, data.id)).get() as any
    const entryTagsResult = db.select({
      id: tags.id,
      name: tags.name,
      color: tags.color
    }).from(entryTags)
      .innerJoin(tags, eq(entryTags.tag_id, tags.id))
      .where(eq(entryTags.entry_id, data.id))
      .all()

    return { ...result, tags: entryTagsResult }
  })

  ipcMain.handle('entries:softDelete', async (_event, id: string) => {
    const sqliteDb = getSqliteDb()
    try {
      const db = getDb()
      db.update(entries)
        .set({ deleted_at: nowISO() })
        .where(eq(entries.id, id))
        .run()
      return true
    } catch (err: any) {
      if (err?.code?.includes?.('CORRUPT')) {
        logger.warn(`Corruption detected (${err.code}). Rebuilding FTS5 and retrying...`)
        rebuildFts5(sqliteDb)
        try {
          sqliteDb.prepare('UPDATE entries SET deleted_at = ? WHERE id = ?').run(nowISO(), id)
          return true
        } catch {
          logger.warn('Soft delete failed after rebuild. Performing hard delete...')
          sqliteDb.prepare('DELETE FROM entries WHERE id = ?').run(id)
          return true
        }
      }
      throw err
    }
  })

  ipcMain.handle('entries:pin', async (_event, data: { id: string; is_pinned: boolean }) => {
    const db = getDb()
    db.update(entries)
      .set({ is_pinned: data.is_pinned ? 1 : 0, updated_at: nowISO() })
      .where(eq(entries.id, data.id))
      .run()
    return db.select().from(entries).where(eq(entries.id, data.id)).get()
  })

  ipcMain.handle('entries:duplicate', async (_event, id: string) => {
    const db = getDb()
    const sqliteDb = getSqliteDb()
    const original = db.select().from(entries).where(eq(entries.id, id)).get() as any
    if (!original) throw new Error('Entry not found')

    const newId = generateId()
    const now = nowISO()
    const newEntry = {
      ...original,
      id: newId,
      title: `${original.title} (Copy)`,
      created_at: now,
      updated_at: now,
      last_edited_at: now,
      deleted_at: null
    }
    delete newEntry.tags

    const originalTags = db.select({ tag_id: entryTags.tag_id })
      .from(entryTags)
      .where(eq(entryTags.entry_id, id))
      .all() as { tag_id: string }[]

    const duplicateTx = sqliteDb.transaction(() => {
      db.insert(entries).values(newEntry).run()
      for (const { tag_id } of originalTags) {
        db.insert(entryTags).values({ entry_id: newId, tag_id }).run()
      }
    })
    duplicateTx()

    return db.select().from(entries).where(eq(entries.id, newId)).get()
  })

  ipcMain.handle('entries:createVersion', async (_event, entryId: string) => {
    const db = getDb()
    const entry = db.select().from(entries).where(eq(entries.id, entryId)).get() as any
    if (!entry) throw new Error('Entry not found')

    const lastVersion = db.select({ version: entryVersions.version })
      .from(entryVersions)
      .where(eq(entryVersions.entry_id, entryId))
      .orderBy(desc(entryVersions.version))
      .limit(1)
      .get() as any

    const nextVersion = (lastVersion?.version || 0) + 1
    const now = nowISO()
    const versionId = generateId()

    const version = {
      id: versionId,
      entry_id: entryId,
      title: entry.title,
      content: entry.content,
      content_preview: stripHtml(entry.content),
      word_count: entry.word_count,
      version: nextVersion,
      change_desc: 'Manual Save',
      created_at: now
    }

    db.insert(entryVersions).values(version).run()
    return version
  })

  ipcMain.handle('entries:getVersions', async (_event, entryId: string) => {
    const db = getDb()
    return db.select()
      .from(entryVersions)
      .where(eq(entryVersions.entry_id, entryId))
      .orderBy(desc(entryVersions.version))
      .all()
  })

  ipcMain.handle('entries:getVersionById', async (_event, versionId: string) => {
    const db = getDb()
    return db.select().from(entryVersions).where(eq(entryVersions.id, versionId)).get() || null
  })

  ipcMain.handle('entries:restoreVersion', async (_event, data: { entryId: string; versionId: string }) => {
    const db = getDb()
    const version = db.select().from(entryVersions).where(eq(entryVersions.id, data.versionId)).get() as any
    if (!version) throw new Error('Version not found')

    const now = nowISO()

    db.update(entries)
      .set({
        title: version.title,
        content: version.content,
        content_preview: version.content_preview,
        word_count: version.word_count,
        last_edited_at: now,
        updated_at: now
      })
      .where(eq(entries.id, data.entryId))
      .run()

    const lastVersion = db.select({ version: entryVersions.version })
      .from(entryVersions)
      .where(eq(entryVersions.entry_id, data.entryId))
      .orderBy(desc(entryVersions.version))
      .limit(1)
      .get() as any

    const nextVersion = (lastVersion?.version || 0) + 1

    db.insert(entryVersions).values({
      id: generateId(),
      entry_id: data.entryId,
      title: version.title,
      content: version.content,
      content_preview: version.content_preview,
      word_count: version.word_count,
      version: nextVersion,
      change_desc: `Restored from v${version.version}`,
      created_at: now
    }).run()

    const updated = db.select().from(entries).where(eq(entries.id, data.entryId)).get() as any
    const entryTagsResult = db.select({
      id: tags.id,
      name: tags.name,
      color: tags.color
    }).from(entryTags)
      .innerJoin(tags, eq(entryTags.tag_id, tags.id))
      .where(eq(entryTags.entry_id, data.entryId))
      .all()

    return { ...updated, tags: entryTagsResult }
  })

  ipcMain.handle('entries:compareVersions', async (_event, data: { entryId: string; fromId: string; toId: string }) => {
    const db = getDb()
    const fromVersion = db.select().from(entryVersions).where(eq(entryVersions.id, data.fromId)).get() as any
    const toVersion = db.select().from(entryVersions).where(eq(entryVersions.id, data.toId)).get() as any

    if (!fromVersion || !toVersion) throw new Error('Version not found')

    return computeDiffHtml(
      fromVersion.content_preview || '',
      toVersion.content_preview || ''
    )
  })
}
