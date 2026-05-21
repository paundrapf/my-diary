# BOOTSTRAP.md — My Diary Developer Guide

> Step-by-step guide from zero to release. Follow EXACTLY, especially the release workflow.

## 1. Project Overview

Offline-first desktop journaling app with git-like version history.

- **Stack:** Electron v33 + React 18 + TypeScript + Tailwind CSS v3 + Tiptap + SQLite (better-sqlite3) + Drizzle ORM
- **UI:** Apple-style minimalism, `lucide-react` icons (`strokeWidth={1.5}`), Framer Motion spring animations
- **Architecture:** 3-process (main / preload / renderer), `contextBridge` for IPC
- **Repo:** `https://github.com/paundrapf/my-diary`
- **License:** MIT
- **Target:** Windows `.exe` (NSIS), Linux `.AppImage`

## 2. First Time Setup

```powershell
git clone https://github.com/paundrapf/my-diary.git
cd my-diary
npm install
npx electron-vite dev
```

> `npm install` runs `postinstall` → `electron-builder install-app-deps` for native modules.

## 3. Development Workflow

```powershell
# 1. Buat branch fitur
git checkout -b feat/xxx

# 2. Implementasi
# ... code changes ...

# 3. Verify build
npx electron-vite build
# Expected output: main ~48KB, preload ~4KB, renderer ~1.5MB
# Pastikan ZERO errors.

# 4. Commit
git add -A
git commit -m "feat(xxx): deskripsi singkat"

# 5. Push ke origin
git push origin feat/xxx

# 6. GitHub → Create PR → merge ke master
```

### Build Commands

| Command | Description |
|---------|-------------|
| `npx electron-vite dev` | Dev server with hot reload |
| `npx electron-vite build` | Production build (verify before commit) |
| `npm run dist` | Package installer via electron-builder (local) |
| `npx electron-builder --dir` | Package to directory (skip installer) |

> **CRITICAL:** Always use `npx electron-vite build`, NOT `npm run build`. The latter may fail on Windows due to `.bin` resolution.

## 4. Release Workflow — FOLLOW EXACTLY

> This is the MOST IMPORTANT section. Every release bug has been caused by deviating from this flow.

### Step-by-Step

```powershell
# ─────────────────────────────────────────────
# STEP 1: Update VERSION FIRST (before any code)
# ─────────────────────────────────────────────
# Buka package.json, ubah "version" ke versi baru
# Contoh: "version": "0.1.4"

# ─────────────────────────────────────────────
# STEP 2: Commit version bump ONLY
# ─────────────────────────────────────────────
git add package.json
git commit -m "vX.Y.Z"
#            ^^^^^^^^^^^^^
# Commit message HARUS persis nama versi, 
# bukan deskripsi panjang. Contoh: "v0.1.4"

# ─────────────────────────────────────────────
# STEP 3: Create tag
# ─────────────────────────────────────────────
git tag vX.Y.Z
# Tag name harus sama dengan commit message + "v"
# Contoh: tag "v0.1.4" + commit "v0.1.4"

# ─────────────────────────────────────────────
# STEP 4: Push BOTH master AND tag
# ─────────────────────────────────────────────
git push origin master
git push origin vX.Y.Z
```

### ⚠️ CRITICAL RULES

| # | Rule | If broken |
|---|------|-----------|
| 1 | **Update `package.json` version FIRST** sebelum code changes | Release gagal / salah versi |
| 2 | **Commit message HARUS `"vX.Y.Z"`** — bukan deskripsi | Release title jadi aneh / kebaca deskripsi |
| 3 | **Tag HARUS match `package.json` version** — `v0.1.4` → `"0.1.4"` | `electron-builder` publish ke release salah |
| 4 | **Jangan commit code lain setelah tag dibuat** | Cuma versi yang boleh di commit terakhir |
| 5 | **Cek Actions setelah push** | Release mungkin gagal bikin |

### Checklist Before Pushing Tag

```
□ package.json version sudah bener?
□ Git commit message = "vX.Y.Z"?
□ Tag name = "vX.Y.Z"?
□ npx electron-vite build — zero errors?
□ git push origin master done?
□ git push origin vX.Y.Z done?
□ GitHub Actions running?
□ Release muncul di Releases page?
```

### Jika Release Gagal

```powershell
# 1. Fix code
git add -A
git commit -m "fix: deskripsi"

# 2. Delete remote tag yang salah
git push origin --delete vX.Y.Z

# 3. Delete local tag
git tag -d vX.Y.Z

# 4. Push fix
git push origin master

# 5. Create NEW tag (versi naik)
# Update package.json version → X.Y.Z+1
git add package.json
git commit -m "vX.Y.Z+1"
git tag vX.Y.Z+1
git push origin master
git push origin vX.Y.Z+1
```

> **JANGAN** recreate tag yang sama. Naikkan versi minor/patch. Tag yang di-delete lalu recreate bisa bikin release kacau.

## 5. Project Conventions

### Code Style
- TypeScript strict; no `any` unless unavoidable (use `unknown`)
- Preload API names match IPC channel names → `entries.create` invokes `entries:create`
- Use `generateId()` (16-byte hex) for all primary keys
- Use `nowISO()` for all timestamps

### UI Conventions
- **No emojis** in UI — use `lucide-react` icons with `strokeWidth={1.5}`
- **Mood emojis are the ONLY exception** (intentional user-facing indicator)
- All motion → Framer Motion `spring` (stiffness ~300-500, damping ~20-30)
- CSS custom properties in `globals.css` for theming (`--bg-primary`, `--text-primary`, `--accent`)

### Versioning (Semver)
- `x.0.0` = major breaking change
- `0.x.0` = new feature
- `0.0.x` = bug fix
- CI/CD triggers on git tags matching `v*` only

## 6. Common Gotchas

| # | Gotcha | Fix |
|---|--------|-----|
| 1 | Editor auto-save stale closure | `useRef` for `handleSaveRef`, update in `useEffect` |
| 2 | Auto-save timer leak | `clearTimeout` in `useEffect` cleanup |
| 3 | `SQLITE_CORRUPT_VTAB` on soft delete | `rebuildFts5()` auto-recovery; hard delete fallback |
| 4 | Compound DB ops not atomic | Wrap in `sqliteDb.transaction()` |
| 5 | IPC handler not registered before `app.whenReady()` | Import + call `registerXHandlers()` BEFORE `createWindow()` |
| 6 | `npm run build` fails on Windows | Use `npx electron-vite build` directly |
| 7 | Renderer logs via `console.log` | Use `window.api.app.log(level, msg)` instead |
| 8 | Mood data duplicated (hardcoded maps) | Always import from `moodData.ts`; search codebase for `moodEmojis`/`moodColors` |
| 9 | **`package.json` version != git tag** | **This is the most common mistake. Follow release workflow exactly.** |

## 7. Quick Reference

### File Locations

| Asset | Location |
|-------|----------|
| App icon source | `assets/my-diary-logo.png` |
| Build icons (ICO/PNG) | `build/icon.ico`, `build/icon.png` |
| Database (dev) | `%APPDATA%\my-diary\diary.db` |
| Database (packaged) | `%APPDATA%\com.mydiary.app\diary.db` |
| Logs | `%APPDATA%\my-diary\logs\app.log` |
| Build output | `out/` (code), `dist/` (installers) |

### IPC: Adding a New Channel

Update **ALL THREE** files:

1. `src/main/ipc/xxx.ts` — Handler dengan `ipcMain.handle()`
2. `src/preload/index.ts` — Method di object `api`
3. `src/types.ts` — Type di interface `ElectronAPI`

Template:
```typescript
// ipc/xxx.ts
ipcMain.handle('xxx:doSomething', async (_event, param: string) => {
  // synchronous logic
  return result
})

// preload/index.ts
doSomething: (param: string) => ipcRenderer.invoke('xxx:doSomething', param),

// types.ts
doSomething: (param: string) => Promise<ResultType>
```

### DB Schema Migrations

When modifying `entries` schema:
1. Update `drizzle/schema.ts`
2. Update migration SQL in `db.ts` → `runMigrations()`
3. Update FTS5 column list in `rebuildFts5()`
4. Add migration block for existing databases

Migration example (remove old CHECK constraint):
```typescript
const tableDef = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='entries'").get() as any
if (tableDef && tableDef.sql.includes('CHECK(...)')) {
  db.exec(`PRAGMA foreign_keys = OFF`)
  db.exec(`CREATE TABLE entries_v2 (... same schema without CHECK ...)`)
  // ... copy, drop, rename ...
  db.exec(`PRAGMA foreign_keys = ON`)
}
```

## 8. Bug Registry Summary

| ID | Description | Root Cause | Status |
|----|-------------|------------|--------|
| B-001 | Editor stale closure | Tiptap `onUpdate` captures initial `handleSave` | Fixed |
| B-002 | Auto-save timer leak | Timer not cleared on unmount | Fixed |
| B-003 | `SQLITE_CORRUPT_VTAB` | FTS5 desync → double trigger on soft delete | Fixed (v0.1.3) |
| B-004 | `npm run build` fails | `.bin` path on Windows | Workaround |
| B-005 | Release not created | `package.json` version != git tag | Fixed (policy) |

## 9. Logging & Debugging

### Main process logs
```typescript
import { logger } from './logger'
logger.info('message')
logger.warn('message')
logger.error('message')
```

### Renderer logs (bridged to same file)
```typescript
window.api.app.log('info', 'message')
window.api.app.log('error', 'message')
```

### View logs
- Open app → Settings → About → View Logs
- Or navigate to `%APPDATA%\my-diary\logs\app.log`
