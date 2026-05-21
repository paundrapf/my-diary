/* ══════════════════════════════════════════════════════════════
   My Diary — Interactive Demo Script
   ══════════════════════════════════════════════════════════════ */

/* ─── Mood Data ─── */
const QUICK_MOODS = [
  { id: 1, emoji: '\u{1F601}', label: 'Gembira', color: '#10B981', category: 'gembira' },
  { id: 2, emoji: '\u{1F602}', label: 'Lucu', color: '#3B82F6', category: 'lucu' },
  { id: 3, emoji: '\u{1F616}', label: 'Frustasi', color: '#EF4444', category: 'frustasi' },
  { id: 4, emoji: '\u{1F60A}', label: 'Baik', color: '#F59E0B', category: 'baik' },
  { id: 5, emoji: '\u{1F525}', label: 'Semangat', color: '#8B5CF6', category: 'semangat' }
]

const EXTENDED_MOODS = [
  { id: 6, emoji: '\u{1F604}', label: 'Ceria', color: '#34D399', category: 'gembira' },
  { id: 7, emoji: '\u{1F60D}', label: 'Sayang', color: '#6EE7B7', category: 'gembira' },
  { id: 8, emoji: '\u{1F970}', label: 'Menyayangi', color: '#A7F3D0', category: 'gembira' },
  { id: 9, emoji: '\u{1F917}', label: 'Hangat', color: '#059669', category: 'gembira' },
  { id: 10, emoji: '\u{1F60E}', label: 'Keren', color: '#047857', category: 'gembira' },
  { id: 11, emoji: '\u{1F64C}', label: 'Bersyukur', color: '#065F46', category: 'gembira' },
  { id: 12, emoji: '\u{1F923}', label: 'Tertawa', color: '#60A5FA', category: 'lucu' },
  { id: 13, emoji: '\u{1F61C}', label: 'Nakal', color: '#93C5FD', category: 'lucu' },
  { id: 14, emoji: '\u{1F61D}', label: 'Ledek', color: '#2563EB', category: 'lucu' },
  { id: 15, emoji: '\u{1F92A}', label: 'Konyol', color: '#1D4ED8', category: 'lucu' },
  { id: 16, emoji: '\u{1F60F}', label: 'Meremehkan', color: '#1E40AF', category: 'lucu' },
  { id: 17, emoji: '\u{1F609}', label: 'Kedip', color: '#1E3A8A', category: 'lucu' },
  { id: 18, emoji: '\u{1F622}', label: 'Sedih', color: '#F87171', category: 'frustasi' },
  { id: 19, emoji: '\u{1F62D}', label: 'Menangis', color: '#FCA5A5', category: 'frustasi' },
  { id: 20, emoji: '\u{1F61E}', label: 'Kecewa', color: '#DC2626', category: 'frustasi' },
  { id: 21, emoji: '\u{1F614}', label: 'Lesu', color: '#B91C1C', category: 'frustasi' },
  { id: 22, emoji: '\u{1F624}', label: 'Kesal', color: '#991B1B', category: 'frustasi' },
  { id: 23, emoji: '\u{1F629}', label: 'Lelah', color: '#7F1D1D', category: 'frustasi' },
  { id: 24, emoji: '\u{1F973}', label: 'Pesta', color: '#FBBF24', category: 'baik' },
  { id: 25, emoji: '\u{1F607}', label: 'Polos', color: '#FDE68A', category: 'baik' },
  { id: 26, emoji: '\u{1F60C}', label: 'Tenang', color: '#D97706', category: 'baik' },
  { id: 27, emoji: '\u{1F60B}', label: 'Nikmat', color: '#B45309', category: 'baik' },
  { id: 28, emoji: '\u{1F979}', label: 'Haru', color: '#92400E', category: 'baik' },
  { id: 29, emoji: '\u{1FAC2}', label: 'Peluk', color: '#78350F', category: 'baik' },
  { id: 30, emoji: '\u{1F389}', label: 'Rayakan', color: '#A78BFA', category: 'semangat' },
  { id: 31, emoji: '\u{2B50}', label: 'Bintang', color: '#C4B5FD', category: 'semangat' },
  { id: 32, emoji: '\u{1F4AA}', label: 'Kuat', color: '#7C3AED', category: 'semangat' },
  { id: 33, emoji: '\u{1F680}', label: 'Melaju', color: '#6D28D9', category: 'semangat' },
  { id: 34, emoji: '\u{2728}', label: 'Cemerlang', color: '#5B21B6', category: 'semangat' },
  { id: 35, emoji: '\u{1F3C6}', label: 'Juara', color: '#4C1D95', category: 'semangat' }
]

const ALL_MOODS = [...QUICK_MOODS, ...EXTENDED_MOODS]

function getMood(id) {
  return ALL_MOODS.find(function(m) { return m.id === id })
}

/* ─── Default Entries ─── */
const DEFAULT_ENTRIES = [
  {
    id: '1',
    title: 'First day with My Diary',
    content: '<p>Found this amazing journaling app. The editor feels great, and I love how version history works. No more losing my thoughts.</p><h2>Things I like so far</h2><ul><li>Rich text editing with formatting</li><li>Mood tracking</li><li>Full privacy</li></ul>',
    mood: 4,
    created_at: '2026-05-20T10:00:00Z',
    updated_at: '2026-05-20T10:30:00Z'
  },
  {
    id: '2',
    title: 'Rainy afternoon thoughts',
    content: '<p>It has been raining all day. Perfect weather for journaling. I spent the afternoon reading and writing.</p><blockquote>The sound of rain is the best background music for writing.</blockquote>',
    mood: 3,
    created_at: '2026-05-21T14:00:00Z',
    updated_at: '2026-05-21T15:00:00Z'
  },
  {
    id: '3',
    title: 'Productivity breakthrough',
    content: '<p>Discovered a new workflow today that combines my journaling with task management. Writing down thoughts first, then organizing them into action items.</p><ol><li>Free write for 10 minutes</li><li>Review and extract action items</li><li>Set priorities</li></ol><p>Game changer.</p>',
    mood: 5,
    created_at: '2026-05-21T20:00:00Z',
    updated_at: '2026-05-21T20:45:00Z'
  }
]

/* ─── Entry Store ─── */
var entries = []
var activeEntryId = null
var dirty = false

function loadEntries() {
  try {
    var stored = sessionStorage.getItem('diary_entries')
    if (stored) {
      entries = JSON.parse(stored)
    } else {
      entries = JSON.parse(JSON.stringify(DEFAULT_ENTRIES))
    }
  } catch (e) {
    entries = JSON.parse(JSON.stringify(DEFAULT_ENTRIES))
  }
  if (entries.length > 0) {
    activeEntryId = entries[0].id
  }
}

function saveEntries() {
  try {
    sessionStorage.setItem('diary_entries', JSON.stringify(entries))
  } catch (e) { /* sessionStorage full or unavailable */ }
}

function getActiveEntry() {
  return entries.find(function(e) { return e.id === activeEntryId })
}

function createEntry() {
  var now = new Date().toISOString()
  var newEntry = {
    id: 'entry_' + Date.now(),
    title: '',
    content: '',
    mood: null,
    created_at: now,
    updated_at: now
  }
  entries.unshift(newEntry)
  activeEntryId = newEntry.id
  dirty = true
  saveEntries()
  renderList()
  loadEditor()
}

function deleteEntry(id) {
  if (!confirm('Delete this entry?')) return
  entries = entries.filter(function(e) { return e.id !== id })
  if (activeEntryId === id) {
    activeEntryId = entries.length > 0 ? entries[0].id : null
  }
  dirty = true
  saveEntries()
  renderList()
  loadEditor()
}

function updateEntry(id, data) {
  var entry = entries.find(function(e) { return e.id === id })
  if (!entry) return
  if (data.title !== undefined) entry.title = data.title
  if (data.content !== undefined) entry.content = data.content
  if (data.mood !== undefined) entry.mood = data.mood
  entry.updated_at = new Date().toISOString()
  dirty = true
  saveEntries()
  renderList()
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  var d = new Date(dateStr)
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear()
}

/* ─── Render Entry List ─── */
function renderList() {
  var container = document.getElementById('listItems')
  if (!container) return
  container.innerHTML = ''
  entries.forEach(function(entry) {
    var item = document.createElement('div')
    item.className = 'list-item' + (entry.id === activeEntryId ? ' active' : '')
    item.dataset.id = entry.id

    var titleEl = document.createElement('div')
    titleEl.className = 'list-item-title'
    titleEl.textContent = entry.title || 'Untitled'

    var metaEl = document.createElement('div')
    metaEl.className = 'list-item-meta'

    var dateEl = document.createElement('span')
    dateEl.className = 'list-item-date'
    dateEl.textContent = formatDate(entry.updated_at || entry.created_at)

    metaEl.appendChild(dateEl)

    if (entry.mood) {
      var moodEl = document.createElement('span')
      moodEl.className = 'list-item-mood'
      var mood = getMood(entry.mood)
      moodEl.textContent = mood ? mood.emoji : ''
      metaEl.appendChild(moodEl)
    }

    item.appendChild(titleEl)
    item.appendChild(metaEl)

    item.addEventListener('click', function() {
      activeEntryId = entry.id
      renderList()
      loadEditor()
    })

    item.addEventListener('contextmenu', function(e) {
      e.preventDefault()
      if (confirm('Delete "' + (entry.title || 'Untitled') + '"?')) {
        deleteEntry(entry.id)
      }
    })

    container.appendChild(item)
  })
}

/* ─── Load Editor ─── */
function loadEditor() {
  var entry = getActiveEntry()
  if (!entry) {
    document.getElementById('editorTitle').value = ''
    document.getElementById('editorContent').innerHTML = ''
    document.getElementById('wordCount').textContent = '0 words'
    document.getElementById('saveStatus').textContent = ''
    renderMoodPicker(null)
    return
  }

  document.getElementById('editorTitle').value = entry.title || ''
  document.getElementById('editorContent').innerHTML = entry.content || ''
  document.getElementById('saveStatus').textContent = 'Saved'
  updateWordCount()
  renderMoodPicker(entry.mood)
}

/* ─── Word Count ─── */
function updateWordCount() {
  var editor = document.getElementById('editorContent')
  var text = editor.innerText || editor.textContent || ''
  var words = text.trim() ? text.trim().split(/\s+/).length : 0
  document.getElementById('wordCount').textContent = words + ' word' + (words !== 1 ? 's' : '')
}

/* ─── Editor Auto-save ─── */
var autoSaveTimer = null

function scheduleSave() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(function() {
    saveEditorContent()
  }, 800)
}

function saveEditorContent() {
  var entry = getActiveEntry()
  if (!entry) return
  var title = document.getElementById('editorTitle').value
  var content = document.getElementById('editorContent').innerHTML
  updateEntry(entry.id, { title: title, content: content })
  document.getElementById('saveStatus').textContent = 'Saved'
}

/* ─── Toolbar ─── */
function setupToolbar() {
  var toolbar = document.getElementById('editorToolbar')
  if (!toolbar) return
  toolbar.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-cmd]')
    if (!btn) return
    var cmd = btn.dataset.cmd

    if (cmd === 'heading') {
      document.execCommand('formatBlock', false, '<h2>')
    } else {
      document.execCommand(cmd, false, null)
    }

    // Update active states
    toolbar.querySelectorAll('[data-cmd]').forEach(function(b) {
      var c = b.dataset.cmd
      if (c === 'heading') {
        b.classList.toggle('is-active', document.queryCommandState('formatBlock'))
      } else {
        b.classList.toggle('is-active', document.queryCommandState(c))
      }
    })

    document.getElementById('editorContent').focus()
    document.getElementById('saveStatus').textContent = 'Unsaved changes'
    scheduleSave()
    updateWordCount()
  })

  // Track formatting changes on click/selection within editor
  document.getElementById('editorContent').addEventListener('mouseup', updateToolbarState)
  document.getElementById('editorContent').addEventListener('keyup', updateToolbarState)
}

function updateToolbarState() {
  var toolbar = document.getElementById('editorToolbar')
  toolbar.querySelectorAll('[data-cmd]').forEach(function(b) {
    var c = b.dataset.cmd
    if (c === 'heading') {
      b.classList.toggle('is-active', document.queryCommandState('formatBlock'))
    } else {
      b.classList.toggle('is-active', document.queryCommandState(c))
    }
  })
}

/* ─── Editor Event Listeners ─── */
function setupEditorEvents() {
  var titleInput = document.getElementById('editorTitle')
  var editor = document.getElementById('editorContent')

  titleInput.addEventListener('input', function() {
    document.getElementById('saveStatus').textContent = 'Unsaved changes'
    scheduleSave()
  })

  editor.addEventListener('input', function() {
    document.getElementById('saveStatus').textContent = 'Unsaved changes'
    scheduleSave()
    updateWordCount()
  })
}

/* ─── Mood Picker ─── */
var currentMood = null
var moodPopupOpen = false

function renderMoodPicker(moodId) {
  currentMood = moodId
  var container = document.getElementById('moodPicker')
  if (!container) return
  container.innerHTML = ''

  QUICK_MOODS.forEach(function(mood) {
    var btn = document.createElement('button')
    btn.className = 'mood-btn' + (currentMood === mood.id ? ' selected' : '')
    btn.textContent = mood.emoji
    btn.title = mood.label

    if (currentMood === mood.id) {
      var dot = document.createElement('span')
      dot.className = 'mood-btn-dot'
      dot.style.backgroundColor = mood.color
      btn.appendChild(dot)
    }

    btn.addEventListener('click', function(e) {
      e.stopPropagation()
      selectMood(mood.id)
    })

    container.appendChild(btn)
  })

  // Plus button
  var plusBtn = document.createElement('button')
  plusBtn.className = 'mood-plus'
  plusBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
  plusBtn.title = 'More moods'
  plusBtn.addEventListener('click', function(e) {
    e.stopPropagation()
    if (moodPopupOpen) { closeMoodPopup() } else { openMoodPopup(plusBtn) }
  })
  container.appendChild(plusBtn)
}

function selectMood(id) {
  var newMood = currentMood === id ? null : id
  currentMood = newMood
  var entry = getActiveEntry()
  if (entry) {
    updateEntry(entry.id, { mood: newMood })
    document.getElementById('saveStatus').textContent = 'Saved'
  }
  closeMoodPopup()
  renderMoodPicker(newMood)
}

function openMoodPopup(anchor) {
  moodPopupOpen = true

  // Backdrop
  var backdrop = document.createElement('div')
  backdrop.className = 'mood-popup-backdrop'
  backdrop.id = 'moodBackdrop'
  backdrop.addEventListener('click', closeMoodPopup)
  document.body.appendChild(backdrop)

  // Popup
  var popup = document.createElement('div')
  popup.className = 'mood-popup'
  popup.id = 'moodPopup'
  popup.style.position = 'fixed'

  // Position near the anchor
  var rect = anchor.getBoundingClientRect()
  popup.style.top = (rect.bottom + 6) + 'px'
  popup.style.right = (window.innerWidth - rect.right) + 'px'

  EXTENDED_MOODS.forEach(function(mood) {
    var item = document.createElement('button')
    item.className = 'mood-popup-item'
    item.textContent = mood.emoji
    item.title = mood.label

    if (currentMood === mood.id) {
      item.style.boxShadow = 'inset 0 0 0 2px ' + mood.color
    }

    item.addEventListener('click', function(e) {
      e.stopPropagation()
      selectMood(mood.id)
    })

    popup.appendChild(item)
  })

  document.body.appendChild(popup)
}

function closeMoodPopup() {
  moodPopupOpen = false
  var backdrop = document.getElementById('moodBackdrop')
  var popup = document.getElementById('moodPopup')
  if (backdrop) backdrop.remove()
  if (popup) popup.remove()
}

/* ─── MacOS Window Controls ─── */
var isMinimized = false
var isMaximized = false
var isClosed = false

function setupWindowControls() {
  var btnClose = document.getElementById('btnClose')
  var btnMinimize = document.getElementById('btnMinimize')
  var btnMaximize = document.getElementById('btnMaximize')
  var reopenBtn = document.getElementById('reopenBtn')
  var window = document.getElementById('demoWindow')
  var overlay = document.getElementById('closedOverlay')

  btnClose.addEventListener('click', function() {
    if (isClosed) return
    isClosed = true
    overlay.classList.add('show')
    window.style.transform = 'scale(0.95)'
    window.style.opacity = '0.5'
  })

  reopenBtn.addEventListener('click', function() {
    isClosed = false
    overlay.classList.remove('show')
    window.style.transform = ''
    window.style.opacity = ''
  })

  btnMinimize.addEventListener('click', function() {
    isMinimized = !isMinimized
    window.classList.toggle('is-minimized', isMinimized)
  })

  btnMaximize.addEventListener('click', function() {
    isMaximized = !isMaximized
    if (isMaximized) {
      var heroInner = document.querySelector('.hero-inner')
      window.style.position = 'fixed'
      window.style.top = '80px'
      window.style.left = '24px'
      window.style.right = '24px'
      window.style.width = 'auto'
      window.style.height = 'calc(100dvh - 160px)'
      window.style.maxWidth = 'none'
      window.style.zIndex = '40'
    } else {
      window.style.position = ''
      window.style.top = ''
      window.style.left = ''
      window.style.right = ''
      window.style.width = ''
      window.style.height = ''
      window.style.maxWidth = ''
      window.style.zIndex = ''
    }
  })
}

/* ─── Theme Toggle ─── */
function setupThemeToggle() {
  var btn = document.getElementById('themeToggle')
  if (!btn) return

  var html = document.documentElement
  var theme = localStorage.getItem('theme') || 'light'
  html.className = theme

  btn.addEventListener('click', function() {
    var current = html.className
    var next = current === 'light' ? 'dark' : 'light'
    html.className = next
    localStorage.setItem('theme', next)
  })
}

/* ─── New Entry ─── */
function setupNewEntry() {
  var btn = document.getElementById('newEntryBtn')
  if (!btn) return
  btn.addEventListener('click', createEntry)
}

/* ─── Keyboard Shortcuts ─── */
function setupKeyboard() {
  document.addEventListener('keydown', function(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault()
      saveEditorContent()
    }
  })
}

/* ─── Click Outside Listener for Mood Popup ─── */
document.addEventListener('click', function(e) {
  if (moodPopupOpen) {
    var popup = document.getElementById('moodPopup')
    if (popup && !popup.contains(e.target)) {
      closeMoodPopup()
    }
  }
})

/* ─── Init ─── */
document.addEventListener('DOMContentLoaded', function() {
  loadEntries()
  renderList()
  loadEditor()
  setupToolbar()
  setupEditorEvents()
  setupWindowControls()
  setupThemeToggle()
  setupNewEntry()
  setupKeyboard()
})
