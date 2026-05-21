import { ipcMain, dialog, BrowserWindow } from 'electron'
import { eq, isNull } from 'drizzle-orm'
import { getDb } from '../db'
import { entries, entryTags, tags } from '../../../drizzle/schema'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

function htmlToMarkdown(html: string): string {
  let md = html
    .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n')
    .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n')
    .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i>(.*?)<\/i>/gi, '*$1*')
    .replace(/<s>(.*?)<\/s>/gi, '~~$1~~')
    .replace(/<strike>(.*?)<\/strike>/gi, '~~$1~~')
    .replace(/<code>(.*?)<\/code>/gi, '`$1`')
    .replace(/<pre><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```')
    .replace(/<blockquote>(.*?)<\/blockquote>/gi, '> $1\n')
    .replace(/<ul>(.*?)<\/ul>/gis, (match) => {
      return match.replace(/<li>(.*?)<\/li>/gi, '- $1\n')
    })
    .replace(/<ol>(.*?)<\/ol>/gis, (match) => {
      let i = 1
      return match.replace(/<li>(.*?)<\/li>/gi, () => `${i++}. $1\n`)
    })
    .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<hr\s*\/?>/gi, '---\n')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)')
    .replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)')

  return md.replace(/<[^>]*>/g, '').trim()
}

export function registerExportHandlers(): void {
  ipcMain.handle('entries:export', async (_event, { entryId, format }: { entryId: string; format: 'md' | 'pdf' | 'txt' }) => {
    const db = getDb()
    const entry = db.select().from(entries).where(eq(entries.id, entryId)).get() as any
    if (!entry) throw new Error('Entry not found')

    const entryTagList = db.select({ name: tags.name })
      .from(entryTags)
      .innerJoin(tags, eq(entryTags.tag_id, tags.id))
      .where(eq(entryTags.entry_id, entryId))
      .all() as { name: string }[]

    const safeTitle = (entry.title || 'Untitled').replace(/[^a-zA-Z0-9\u00C0-\u017F\s-]/g, '').trim() || 'Untitled'
    const dateStr = new Date(entry.created_at).toISOString().split('T')[0]

    if (format === 'md') {
      const tagsStr = entryTagList.map((t) => t.name).join(', ')
      const md = `---\ntitle: ${entry.title || 'Untitled'}\ndate: ${entry.created_at}\ntags: ${tagsStr}\n---\n\n${htmlToMarkdown(entry.content || '')}`
      const result = await dialog.showSaveDialog({
        defaultPath: `${dateStr}_${safeTitle}.md`,
        filters: [{ name: 'Markdown', extensions: ['md'] }]
      })
      if (!result.canceled && result.filePath) {
        writeFileSync(result.filePath, md, 'utf-8')
      }
      return result.filePath
    }

    if (format === 'txt') {
      const txt = stripHtml(entry.content || '')
      const result = await dialog.showSaveDialog({
        defaultPath: `${dateStr}_${safeTitle}.txt`,
        filters: [{ name: 'Text', extensions: ['txt'] }]
      })
      if (!result.canceled && result.filePath) {
        writeFileSync(result.filePath, txt, 'utf-8')
      }
      return result.filePath
    }

    if (format === 'pdf') {
      const win = BrowserWindow.getFocusedWindow()
      if (!win) throw new Error('No window available for PDF export')

      const result = await dialog.showSaveDialog({
        defaultPath: `${dateStr}_${safeTitle}.pdf`,
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      })
      if (!result.canceled && result.filePath) {
        const data = await win.webContents.printToPDF({
          pageSize: 'A4',
          printBackground: true
        })
        writeFileSync(result.filePath, data)
      }
      return result.filePath
    }

    throw new Error('Unsupported format')
  })

  ipcMain.handle('entries:exportAll', async (_event, { format }: { format: 'md' | 'txt' }) => {
    const db = getDb()
    const allEntries = db.select().from(entries).where(isNull(entries.deleted_at)).all() as any[]

    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      buttonLabel: 'Export Here'
    })
    if (result.canceled || !result.filePaths[0]) return null

    const exportDir = result.filePaths[0]

    for (const entry of allEntries) {
      const safeTitle = (entry.title || 'Untitled').replace(/[^a-zA-Z0-9\u00C0-\u017F\s-]/g, '').trim() || 'Untitled'
      const dateStr = new Date(entry.created_at).toISOString().split('T')[0]
      const filename = `${dateStr}_${safeTitle}.${format}`
      const filepath = join(exportDir, filename)

      if (format === 'md') {
        writeFileSync(filepath, htmlToMarkdown(entry.content || ''), 'utf-8')
      } else {
        writeFileSync(filepath, stripHtml(entry.content || ''), 'utf-8')
      }
    }

    return exportDir
  })
}
