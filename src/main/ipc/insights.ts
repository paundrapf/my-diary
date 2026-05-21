import { ipcMain } from 'electron'
import { sql, desc, isNull, eq, and } from 'drizzle-orm'
import { getDb } from '../db'
import { entries, entryTags, tags } from '../../../drizzle/schema'

export function registerInsightsHandlers(): void {
  ipcMain.handle('insights:getStats', async () => {
    const db = getDb()

    // Total entries
    const totalEntriesResult = db.select({ count: sql<number>`count(*)` }).from(entries).where(isNull(entries.deleted_at)).get()
    const totalEntries = totalEntriesResult?.count || 0

    // Total words
    const totalWordsResult = db.select({ sum: sql<number>`sum(word_count)` }).from(entries).where(isNull(entries.deleted_at)).get()
    const totalWords = totalWordsResult?.sum || 0

    // Average mood (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const avgMoodResult = db.select({ avg: sql<number>`avg(mood)` })
      .from(entries)
      .where(and(isNull(entries.deleted_at), sql`created_at >= ${thirtyDaysAgo.toISOString()}`))
      .get()
    const avgMood = avgMoodResult?.avg ? parseFloat(avgMoodResult.avg.toFixed(1)) : null

    // Streak calculation
    const allDates = db.select({ created_at: entries.created_at })
      .from(entries)
      .where(isNull(entries.deleted_at))
      .orderBy(desc(entries.created_at))
      .all()

    const dateSet = new Set<string>()
    for (const row of allDates) {
      const d = new Date(row.created_at)
      dateSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    }

    let streak = 0
    const checkDate = new Date()
    checkDate.setHours(0, 0, 0, 0)

    while (true) {
      const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`
      if (dateSet.has(dateStr)) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    // Most productive day
    const dayCounts: Record<string, number> = {}
    for (const row of allDates) {
      const d = new Date(row.created_at)
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' })
      dayCounts[dayName] = (dayCounts[dayName] || 0) + 1
    }
    const mostProductiveDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null

    // Top tags
    const topTags = db.select({
      name: tags.name,
      count: sql<number>`count(${entryTags.tag_id})`
    })
      .from(entryTags)
      .innerJoin(tags, eq(entryTags.tag_id, tags.id))
      .groupBy(tags.id)
      .orderBy(sql`count(${entryTags.tag_id}) DESC`)
      .limit(5)
      .all()

    return {
      totalEntries,
      totalWords,
      avgWordsPerEntry: totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0,
      avgMood,
      streak,
      mostProductiveDay,
      topTags
    }
  })
}
