# PRD — My Diary (Desktop App)
**Status:** Draft v1.0  
**Penulis:** Ndra  
**Tanggal:** Mei 2026  
**Platform:** Electron (macOS · Windows · Linux)

---

## 1. Overview

My Diary adalah aplikasi journaling desktop pribadi berbasis Electron yang dirancang untuk satu pengguna (awalnya), dengan kualitas animasi dan interaksi setara ekosistem Apple. Tujuan utamanya: mencatat kehidupan sehari-hari, ide, refleksi, dan catatan kerja dalam satu tempat yang terasa mewah untuk digunakan setiap hari.

Perbedaan dari app diary biasa: **pengalaman gerak dan transisi adalah fitur inti**, bukan afterthought. Setiap interaksi harus terasa fluid dan bertujuan — seperti membuka Notes.app di macOS.

---

## 2. Goals & Non-Goals

### Goals
- Pengalaman menulis yang nyaman, cepat, dan tidak mengganggu
- Animasi spring-based yang halus di setiap elemen interaktif
- Data sepenuhnya lokal dan terenkripsi
- Dapat berkembang menjadi produk publik tanpa refactor besar

### Non-Goals (v1)
- Kolaborasi multi-user
- Cloud sync (direncanakan v2)
- Mobile companion app
- Web version

---

## 3. Target User

**Primer:** Pemilik aplikasi sendiri (Ndra) — solo developer/vibecoder, familiar dengan tooling modern, butuh tempat journaling yang enak secara estetik.

**Sekunder (jika publish):** Profesional kreatif, developer, dan writer yang menghargai privacy-first dan desain berkualitas tinggi.

---

## 4. Tech Stack

| Layer | Pilihan | Alasan |
|---|---|---|
| App framework | Electron v30+ | Cross-platform, mature |
| Build tool | `electron-vite` | Hot reload, Vite speed |
| UI | React 18 + TypeScript | Component model, ecosystem |
| State | Zustand | Minimal, no boilerplate |
| Database | SQLite via `better-sqlite3` | Lokal, cepat, no network |
| ORM | `drizzle-orm` | Type-safe, lightweight |
| Rich text editor | Tiptap v2 | Extensible, headless, markdown-shortcut support |
| Animasi | Framer Motion | Spring physics, layout animation, gesture |
| Styling | Tailwind CSS v4 | Utility-first, dark mode trivial |
| Enkripsi | Node.js `crypto` (AES-256-GCM) | Built-in, no deps |
| IPC | `electron-trpc` atau custom preload | Type-safe bridge main↔renderer |
| Packaging | `electron-builder` | Auto-update, code signing |

---

## 5. Arsitektur Aplikasi

```
diary-app/
├── src/
│   ├── main/
│   │   ├── index.ts          ← Bootstrap, window creation, app lifecycle
│   │   ├── db.ts             ← SQLite init & migration runner
│   │   ├── ipc/
│   │   │   ├── entries.ts    ← CRUD entries
│   │   │   ├── tags.ts       ← Tag management
│   │   │   ├── media.ts      ← Image/attachment handler
│   │   │   └── settings.ts   ← User preferences
│   │   ├── encryption.ts     ← AES-256-GCM wrapper
│   │   └── backup.ts         ← Export/backup logic
│   ├── preload/
│   │   └── index.ts          ← contextBridge API exposure
│   ├── renderer/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── Journal.tsx   ← Main 3-pane layout
│   │   │   ├── Calendar.tsx  ← Calendar view
│   │   │   ├── Insights.tsx  ← Mood chart & streak
│   │   │   └── Settings.tsx
│   │   ├── components/
│   │   │   ├── Sidebar/
│   │   │   ├── EntryList/
│   │   │   ├── Editor/
│   │   │   ├── MoodPicker/
│   │   │   ├── TagManager/
│   │   │   └── ui/           ← Primitives (Button, Input, Modal, etc.)
│   │   ├── stores/
│   │   │   ├── useEntryStore.ts
│   │   │   ├── useUIStore.ts  ← Sidebar open/close, active panel, dll
│   │   │   └── useSettingsStore.ts
│   │   ├── hooks/
│   │   └── styles/
│   │       └── globals.css
├── resources/
│   └── fonts/                ← Inter atau SF Pro subset
├── electron.vite.config.ts
├── drizzle/
│   └── schema.ts             ← DB schema definition
└── package.json
```

---

## 6. Database Schema

```sql
-- Entri utama
CREATE TABLE entries (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title       TEXT NOT NULL DEFAULT '',
  content     TEXT NOT NULL DEFAULT '',  -- JSON (Tiptap doc)
  content_preview TEXT,                  -- Plain text 200 char untuk list
  mood        INTEGER CHECK(mood BETWEEN 1 AND 5),
  is_pinned   INTEGER DEFAULT 0,
  is_locked   INTEGER DEFAULT 0,
  word_count  INTEGER DEFAULT 0,
  created_at  TEXT NOT NULL,             -- ISO 8601
  updated_at  TEXT NOT NULL,
  deleted_at  TEXT                       -- Soft delete
);

-- Tags
CREATE TABLE tags (
  id    TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name  TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#7F77DD'           -- Hex color
);

-- Relasi many-to-many
CREATE TABLE entry_tags (
  entry_id TEXT REFERENCES entries(id) ON DELETE CASCADE,
  tag_id   TEXT REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (entry_id, tag_id)
);

-- Lampiran media
CREATE TABLE attachments (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  entry_id   TEXT REFERENCES entries(id) ON DELETE CASCADE,
  filename   TEXT NOT NULL,
  mime_type  TEXT NOT NULL,
  size_bytes INTEGER,
  path       TEXT NOT NULL,              -- Relative path dari app data dir
  created_at TEXT NOT NULL
);

-- Settings key-value
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Full-text search
CREATE VIRTUAL TABLE entries_fts USING fts5(
  title, content_preview,
  content='entries',
  content_rowid='rowid'
);
```

---

## 7. Layout & Navigation

### 7.1 Three-Pane Layout

```
┌──────────────┬──────────────────┬─────────────────────────────┐
│   Sidebar    │   Entry List     │        Editor               │
│  (220px)     │   (260px)        │     (flex: 1)               │
│              │                  │                             │
│  Nav items   │  Scrollable list │  Toolbar                    │
│  Tags        │  of entries      │  Title input                │
│  Settings    │  sorted by date  │  Rich text body             │
│              │                  │  Status bar                 │
└──────────────┴──────────────────┴─────────────────────────────┘
```

Pada layar ≤ 1000px (window kecil), Entry List collapse otomatis menjadi overlay sheet.

### 7.2 Sidebar Navigation Items

| Icon | Label | Target |
|---|---|---|
| 📖 | Semua Entri | Seluruh entri, sort by date |
| 📅 | Kalender | Calendar view |
| 📌 | Disematkan | Entri is_pinned = 1 |
| 📊 | Insights | Mood chart & statistik |
| 🗂 | Kategori | Browsing by tag |

Di bawah nav: daftar tags dinamis dari database.

Di paling bawah: Settings & Lock button.

---

## 8. Animasi & Motion System

Ini adalah bagian paling kritis dari produk. Semua animasi harus menggunakan **spring physics**, bukan `ease-in-out` atau `linear`. Target feel: identik dengan macOS Sonoma — transisi yang terasa punya "massa" dan "momentum".

### 8.1 Sidebar Slide

**Perilaku:** Sidebar bisa di-toggle (collapse/expand) via tombol atau keyboard shortcut `⌘\`. Saat collapse, sidebar slide keluar ke kiri dengan animasi spring. Entry List mengisi ruang yang ditinggalkan secara otomatis.

**Spesifikasi animasi:**

```tsx
// Framer Motion config untuk sidebar
const sidebarVariants = {
  open: {
    width: 220,
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      mass: 0.8
    }
  },
  closed: {
    width: 0,
    opacity: 0,
    x: -220,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 40,
      mass: 0.6
    }
  }
}

// Layout animation pada pane kanan agar ikut smooth
// Gunakan Framer Motion <motion.div layout> pada wrapper Entry List & Editor
```

**Detail:**
- Saat sidebar menutup, icon-only "rail" selebar 48px tetap terlihat (seperti Finder sidebar di macOS)
- Hover pada rail menampilkan sidebar sementara (peek), seperti macOS Dock auto-hide
- Konten sidebar fade out lebih cepat dari width animation (stagger)
- Tidak ada jank pada saat window resize

### 8.2 Daftar Animasi Lengkap

| Elemen | Trigger | Animasi | Spring Config |
|---|---|---|---|
| Sidebar | Toggle ⌘\ atau tombol | Slide left/right + width | stiffness 300, damping 30 |
| Entry item (masuk list) | Entry baru dibuat | Slide in dari bawah + fade | stiffness 400, damping 35 |
| Entry item (dihapus) | Delete | Slide out ke kiri + fade + height collapse | stiffness 500, damping 40 |
| Active entry highlight | Klik entry lain | Background pill slide (shared layout) | stiffness 350, damping 28 |
| Editor content | Ganti entry | Fade out → fade in (crossfade) | duration 120ms |
| Editor title | Focus | Subtle scale 1.0 → 1.002 | duration 80ms |
| Mood picker | Hover | Scale 1.0 → 1.3 | stiffness 600, damping 20 |
| Mood picker | Selected | Scale 1.3 + bounce | stiffness 500, damping 15 |
| Tag badge | Added | Scale in dari 0 | stiffness 400, damping 22 |
| Tag badge | Removed | Scale out ke 0 | duration 100ms |
| Modal/Sheet | Open | Slide up dari bawah | stiffness 350, damping 32 |
| Modal/Sheet | Close | Slide down | stiffness 400, damping 40 |
| Toast notification | Show | Slide in dari atas kanan | stiffness 350, damping 30 |
| Toast notification | Dismiss | Slide out + fade | stiffness 400, damping 38 |
| Context menu | Open | Scale dari 0.95 → 1.0 + fade | duration 100ms |
| Calendar cell | Hover | Background fill + scale 1.05 | stiffness 500, damping 30 |
| Pinned indicator | Toggle | Rotation 0 → -45deg + color | stiffness 300, damping 20 |
| Auto-save indicator | Save | Fade in "Tersimpan" → fade out 2s | duration 300ms |
| Page transition | Route change | Shared layout + fade | stiffness 300, damping 30 |
| Scroll | Momentum scroll | Native macOS momentum scroll via CSS | native |
| Window open | App launch | Fade in + scale 0.96 → 1.0 | stiffness 200, damping 25 |

### 8.3 Prinsip Animasi

1. **Spring, bukan easing** — Semua motion menggunakan `type: "spring"`. Gunakan `ease` hanya untuk opacity murni.
2. **Tidak ada durasi tetap untuk motion** — Spring physics yang menentukan durasi, bukan `duration: 0.3`.
3. **Layout animation wajib** — Setiap perubahan layout (width, height, position) pakai `<motion.div layout>` agar Framer otomatis menghitung FLIP.
4. **Stagger untuk list** — Saat list pertama kali load, items masuk dengan `staggerChildren: 0.04`.
5. **Reduced motion respected** — Deteksi `prefers-reduced-motion`, disable semua spring dan ganti dengan instant/fade.
6. **60fps minimum** — Animasi harus GPU-accelerated. Hindari animasi pada `width` dan `height` langsung; gunakan `scaleX`/`scaleY` + `transform-origin` bila mungkin.
7. **Momentum scroll** — Entry list dan editor body menggunakan `-webkit-overflow-scrolling: touch` dan `scroll-behavior: smooth`.

---

## 9. Fitur Detail

### 9.1 Entry Management

**Membuat entri baru:**
- Tombol `+` di header Entry List, atau shortcut `⌘N`
- Entry baru langsung muncul di atas list dengan animasi slide-in
- Cursor otomatis fokus ke title field
- Title default kosong, placeholder "Untitled"
- Date dan time otomatis terisi (bisa diedit manual)

**Auto-save:**
- Debounce 800ms setelah user berhenti mengetik
- Indikator "Menyimpan..." → "Tersimpan" di status bar
- Tidak pernah kehilangan data; backup every 5 menit ke file `.bak`

**Soft delete:**
- Entri dihapus masuk ke "Trash" selama 30 hari
- Setelah 30 hari, terhapus permanen
- Entry di-trash: `deleted_at` di-set, tidak muncul di main list
- Halaman Trash tersedia di Settings

**Pin entry:**
- Entri pinned muncul di atas list dengan separator visual
- Maksimal 10 entri pinned

**Entry locking:**
- Entri individual bisa dikunci dengan PIN lokal
- Konten terenkripsi di-db untuk entri yang locked
- Membuka entri locked: minta PIN → decrypt on-the-fly

### 9.2 Rich Text Editor (Tiptap)

**Extensions yang dipakai:**

```ts
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import CharacterCount from '@tiptap/extension-character-count'
import Typography from '@tiptap/extension-typography'  // Smart quotes, dashes
import Highlight from '@tiptap/extension-highlight'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
```

**Toolbar items:**
- Bold, Italic, Underline, Strikethrough
- Heading 1, Heading 2, Heading 3
- Bullet list, Ordered list, Task list (checkbox)
- Horizontal rule
- Block quote
- Code block (dengan syntax highlighting via `lowlight`)
- Image insert
- Link insert
- Highlight/mark
- Table insert

**Markdown shortcuts aktif:**
- `## ` → Heading 2
- `- ` atau `* ` → Bullet list
- `1. ` → Ordered list
- `- [ ] ` → Task item
- `> ` → Blockquote
- ` ``` ` → Code block
- `**bold**` → Bold
- `*italic*` → Italic
- `---` → Horizontal rule

**Format dokumen tersimpan:** JSON (Tiptap ProseMirror doc format), bukan HTML. Lebih portable dan mudah di-parse untuk plain text preview.

### 9.3 Mood Tracker

5 level mood, masing-masing dengan:
- Emoji representatif
- Warna background subtle
- Label teks

| Level | Emoji | Label | Warna |
|---|---|---|---|
| 1 | 😢 | Sangat buruk | Red |
| 2 | 😞 | Kurang baik | Amber |
| 3 | 😐 | Biasa aja | Gray |
| 4 | 😊 | Baik | Teal |
| 5 | 🔥 | Luar biasa | Purple |

Mood bisa diubah kapan saja. Tersimpan di kolom `mood` di tabel entries.

### 9.4 Tagging System

- Tag dibuat on-the-fly saat mengetik di tag input
- Autocomplete dari tag yang sudah ada
- Tag punya nama dan warna (user bisa set)
- Sidebar menampilkan daftar semua tags dengan entry count
- Klik tag di sidebar → filter entry list
- Keyboard: `Enter` untuk tambah tag, `Backspace` untuk hapus tag terakhir

### 9.5 Search

- Full-text search menggunakan SQLite FTS5
- Search bar di atas sidebar, shortcut `⌘F`
- Search real-time dengan debounce 200ms
- Hasil highlight kata yang matching
- Filter combinasi: cari berdasarkan tag + keyword + date range
- Search tidak case-sensitive, tapi bisa toggle

### 9.6 Calendar View

- Grid kalender bulanan
- Setiap hari yang ada entri: dot indicator dengan warna berdasarkan mood
- Hover pada hari: popover kecil menampilkan judul entri
- Klik hari: langsung buka atau buat entri untuk hari tersebut
- Navigation bulanan dengan animasi slide kiri/kanan (shared layout Framer)
- Heatmap intensity berdasarkan jumlah entri per hari

### 9.7 Insights

- **Mood chart:** Line chart 30 hari terakhir, mood sebagai sumbu Y
- **Streak tracker:** "Nulis X hari berturut-turut 🔥" — hari tanpa entri break streak
- **Statistik:**
  - Total entri
  - Total kata ditulis
  - Rata-rata kata per entri
  - Mood rata-rata bulan ini
  - Hari paling produktif (hari dalam seminggu)
  - Tag paling sering dipakai
- **Word cloud:** Tag cloud dari kata-kata yang sering muncul

### 9.8 Keamanan & Privasi

**App-level lock:**
- PIN 4-6 digit untuk membuka aplikasi
- PIN di-hash dengan bcrypt, tersimpan di settings table
- Setelah 5x salah PIN: lockout 30 detik (exponential backoff)
- Option: auto-lock setelah X menit idle (5, 10, 15, 30, never)
- Shortcut `⌘L` untuk lock manual

**Enkripsi database:**
- SQLite database di-encrypt dengan SQLCipher atau manual per-field enkripsi
- Untuk v1: encrypt hanya kolom `content` pada locked entries (AES-256-GCM)
- Key derivasi dari PIN menggunakan PBKDF2 (100.000 iterations)

**File location:**
```
macOS: ~/Library/Application Support/MyDiary/
Windows: %APPDATA%\MyDiary\
Linux: ~/.config/MyDiary/
```

### 9.9 Export & Backup

**Export per-entri:**
- Export ke Markdown (`.md`)
- Export ke PDF via Electron's `webContents.printToPDF()`
- Export ke plain text (`.txt`)

**Export semua:**
- Export semua entri sebagai ZIP berisi file `.md` per entri
- Nama file: `YYYY-MM-DD_judul-entry.md`
- Sertakan lampiran media dalam subfolder

**Auto-backup:**
- Backup otomatis setiap 7 hari ke lokasi yang user pilih
- Format: `MyDiary_backup_YYYY-MM-DD.db` (raw SQLite)
- Restore dari file backup via Settings

### 9.10 Settings

| Setting | Tipe | Default |
|---|---|---|
| Theme | Light / Dark / System | System |
| Accent color | 8 pilihan warna | Purple |
| Font editor | Inter / Merriweather / JetBrains Mono | Inter |
| Font size editor | 14px – 20px | 16px |
| Auto-save delay | 0.5s / 1s / 2s / 5s | 1s |
| Auto-lock timeout | 5m / 10m / 30m / Never | 15m |
| PIN | Set / Change / Remove | — |
| Spell check | On/Off | On |
| Markdown shortcuts | On/Off | On |
| Auto-backup | On/Off + lokasi folder | Off |
| Start on login | On/Off | Off |
| Show in menu bar | On/Off | Off |
| Export format default | MD / PDF / TXT | MD |
| First day of week | Minggu / Senin | Senin |

---

## 10. Keyboard Shortcuts

| Shortcut | Aksi |
|---|---|
| `⌘N` | Entri baru |
| `⌘F` | Fokus ke search |
| `⌘\` | Toggle sidebar |
| `⌘L` | Lock app |
| `⌘S` | Force save (meski ada auto-save) |
| `⌘W` | Tutup entry / kembali ke list |
| `⌘,` | Buka Settings |
| `⌘Z` / `⌘⇧Z` | Undo / Redo (editor) |
| `⌘B` | Bold |
| `⌘I` | Italic |
| `⌘K` | Insert link |
| `⌘E` | Export entry aktif |
| `⌘D` | Duplikasi entry |
| `⌘⌫` | Hapus entry (dengan confirm) |
| `⌘1` – `⌘5` | Set mood 1–5 |
| `⌘P` | Toggle pin entry |
| `⌃⌘F` | Toggle fullscreen |
| `Esc` | Tutup modal / deselect |

---

## 11. Tema & Visual Design

### 11.1 Color System

Setiap tema punya token warna lengkap:

```css
/* Light theme */
:root {
  --bg-primary: #FFFFFF;
  --bg-secondary: #F5F4F0;
  --bg-tertiary: #EEECEA;
  --text-primary: #1A1A1A;
  --text-secondary: #6B6B6B;
  --text-tertiary: #A8A8A8;
  --border-subtle: rgba(0,0,0,0.08);
  --border-default: rgba(0,0,0,0.12);
  --accent: #7F77DD;        /* Purple default */
  --accent-soft: #EEEDFE;
}

/* Dark theme */
[data-theme="dark"] {
  --bg-primary: #1C1C1E;
  --bg-secondary: #2C2C2E;
  --bg-tertiary: #3A3A3C;
  --text-primary: #F5F5F5;
  --text-secondary: #ABABAB;
  --text-tertiary: #6B6B6B;
  --border-subtle: rgba(255,255,255,0.06);
  --border-default: rgba(255,255,255,0.10);
  --accent: #9D97E8;
  --accent-soft: #26215C;
}
```

**8 pilihan accent color:** Purple, Teal, Coral, Blue, Pink, Amber, Green, Gray.

### 11.2 Typography

- **UI font:** Inter Variable (semua text navigasi, label, metadata)
- **Editor font:** User-pilih. Default Inter. Option Merriweather untuk feel journal, JetBrains Mono untuk dev notes.
- **Skala:** 11px (meta) · 12px (secondary) · 13px (list preview) · 14px (editor body default) · 16px (editor body large) · 20px (entry title) · 24px (page title)

### 11.3 Window Chrome

- **macOS:** Titlebar transparan dengan vibrancy sidebar (`NSVisualEffectView`), traffic light buttons retain. Gunakan `titleBarStyle: 'hiddenInset'` di Electron.
- **Windows:** Custom titlebar dengan minimize/maximize/close buttons yang styled.
- **Vibrancy:** Sidebar background pakai `backgroundMaterial: 'sidebar'` di Electron (macOS Monterey+).

---

## 12. States & Edge Cases

| Kondisi | Behavior |
|---|---|
| Tidak ada entri sama sekali | Empty state dengan ilustrasi, CTA "Mulai hari ini" |
| Search tidak menemukan hasil | "Tidak ada entri yang cocok" dengan tombol clear search |
| Entry terlalu panjang (>50.000 kata) | Warning toast, tetap bisa ditulis |
| Database corrupt | Dialog error, tawarkan restore dari backup |
| Disk penuh saat save | Toast error merah, retry otomatis setelah 10s |
| App crash saat nulis | Recovery dari write-ahead log SQLite |
| Coba hapus entry yang locked | Minta PIN dulu sebelum hapus |
| Import backup format lama | Migration handler, tetap bisa baca |

---

## 13. Roadmap

### v1.0 — Personal Release
- [x] Three-pane layout dengan sidebar slide animation
- [x] Rich text editor (Tiptap)
- [x] Mood tracker
- [x] Tags
- [x] Full-text search
- [x] Calendar view
- [x] App PIN lock
- [x] Export MD / PDF
- [x] Dark mode
- [x] Auto-save

### v1.5 — Polish Release
- [ ] Insights / mood chart
- [ ] Word count & reading time
- [ ] Image attachment
- [ ] Streak tracker
- [ ] Auto-backup ke folder lokal
- [ ] Custom accent colors
- [ ] Editor font pilihan

### v2.0 — Public Release
- [ ] Cloud sync via Supabase (opsional, opt-in)
- [ ] End-to-end encryption untuk sync
- [ ] Onboarding flow untuk new users
- [ ] Import dari Day One, Journey, Bear
- [ ] In-app purchase untuk fitur premium
- [ ] macOS menu bar mini widget
- [ ] Spotlight / Alfred search integration
- [ ] Widgets macOS Sonoma

### v2.5 — Power User
- [ ] Templates entri
- [ ] Recurring prompts ("Hari ini gua bersyukur untuk...")
- [ ] AI-powered refleksi mingguan (optional, local LLM via Ollama)
- [ ] Audio memo attachment
- [ ] Drawing/sketch attachment

---

## 14. Acceptance Criteria (v1.0)

Setiap fitur dianggap selesai jika memenuhi semua kriteria berikut:

**Sidebar slide:**
- [ ] Sidebar buka/tutup dengan animasi spring, tidak ada jank
- [ ] Icon rail 48px tetap visible saat sidebar tertutup
- [ ] Layout kanan ikut bergerak smooth (layout animation)
- [ ] Shortcut `⌘\` bekerja
- [ ] State sidebar persist saat app restart

**Editor:**
- [ ] Semua Tiptap extensions berjalan
- [ ] Markdown shortcuts aktif
- [ ] Auto-save tidak lebih dari 1 detik setelah berhenti ketik
- [ ] Tidak kehilangan data saat crash (WAL mode SQLite)
- [ ] Ganti entry: crossfade konten editor, tidak ada flash putih

**Animasi:**
- [ ] Semua animasi di tabel Section 8.2 terimplemen
- [ ] 60fps pada mesin target (Intel i5 Gen 10+, 8GB RAM)
- [ ] `prefers-reduced-motion` dihormati
- [ ] Tidak ada animasi yang "stuck" atau infinite loop

**Keamanan:**
- [ ] PIN lock bekerja, 5x salah → lockout
- [ ] Auto-lock setelah idle berjalan
- [ ] Entri locked tidak bisa dibaca tanpa PIN

---

## 15. Open Questions

1. Apakah v1 perlu vibrancy effect untuk sidebar di macOS, atau solid color dulu?
2. Sidebar "peek on hover" (auto-hide style): implement di v1 atau v1.5?
3. Untuk editor font Merriweather: perlu embed di app bundle atau download on-demand?
4. Entry date: apakah boleh edit manual (misal nulis entri untuk tanggal kemarin)?
5. Apakah perlu photo strip (multiple images per entry) atau single cover image cukup?

---

*PRD ini living document — update seiring development berjalan.*
