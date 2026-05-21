import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core'

export const entries = sqliteTable('entries', {
  id: text('id').primaryKey().notNull(),
  title: text('title').notNull().default(''),
  content: text('content').notNull().default(''),
  content_preview: text('content_preview'),
  mood: integer('mood'),
  is_pinned: integer('is_pinned').default(0),
  is_locked: integer('is_locked').default(0),
  word_count: integer('word_count').default(0),
  last_edited_at: text('last_edited_at').notNull(),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
  deleted_at: text('deleted_at')
})

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey().notNull(),
  name: text('name').unique().notNull(),
  color: text('color').default('#7F77DD')
})

export const entryTags = sqliteTable('entry_tags', {
  entry_id: text('entry_id').references(() => entries.id, { onDelete: 'cascade' }).notNull(),
  tag_id: text('tag_id').references(() => tags.id, { onDelete: 'cascade' }).notNull()
}, (table) => ({
  pk: primaryKey({ columns: [table.entry_id, table.tag_id] })
}))

export const attachments = sqliteTable('attachments', {
  id: text('id').primaryKey().notNull(),
  entry_id: text('entry_id').references(() => entries.id, { onDelete: 'cascade' }).notNull(),
  filename: text('filename').notNull(),
  mime_type: text('mime_type').notNull(),
  size_bytes: integer('size_bytes'),
  path: text('path').notNull(),
  created_at: text('created_at').notNull()
})

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey().notNull(),
  value: text('value').notNull()
})

export const entryVersions = sqliteTable('entry_versions', {
  id: text('id').primaryKey().notNull(),
  entry_id: text('entry_id').references(() => entries.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull().default(''),
  content: text('content').notNull().default(''),
  content_preview: text('content_preview'),
  word_count: integer('word_count').default(0),
  version: integer('version').notNull(),
  change_desc: text('change_desc').default(''),
  created_at: text('created_at').notNull()
})
