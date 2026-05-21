import { motion } from 'framer-motion'
import { useState } from 'react'
import { useSettingsStore } from '../stores/useSettingsStore'

const ACCENT_COLORS = [
  { name: 'Purple', value: '#7F77DD' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Coral', value: '#F97316' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Green', value: '#10B981' },
  { name: 'Gray', value: '#71717A' }
]

const EDITOR_FONTS = [
  { name: 'Inter', value: 'Inter' },
  { name: 'Merriweather', value: 'Merriweather' },
  { name: 'JetBrains Mono', value: 'JetBrains Mono' }
]

export default function Settings(): JSX.Element {
  const settings = useSettingsStore((s) => s.settings)
  const updateSetting = useSettingsStore((s) => s.updateSetting)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')

  if (!settings) return <div className="p-8 text-text-tertiary text-sm">Loading...</div>

  const isValidPin = /^\d{4,6}$/.test(pin)

  const handleSetPin = async (): Promise<void> => {
    if (!isValidPin) {
      setPinError('PIN must be 4-6 digits')
      return
    }
    setPinError('')
    try {
      await window.api.app.setPin(pin)
      setPin('')
    } catch (err) {
      setPinError(err instanceof Error ? err.message : 'Failed to set PIN')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-full overflow-y-auto p-8"
    >
      <h1 className="text-lg font-semibold text-text-primary mb-6">Settings</h1>

      <div className="max-w-xl space-y-6">
        <Section title="Theme">
          <div className="flex gap-2 mb-4">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                onClick={() => updateSetting('theme', t)}
                className={`px-4 py-1.5 rounded-lg text-xs transition-colors ${
                  settings.theme === t
                    ? 'bg-accent text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/70'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <div>
            <label className="text-[11px] text-text-secondary block mb-2">Accent Color</label>
            <div className="flex gap-2 flex-wrap">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => updateSetting('accent_color', c.value)}
                  className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                    settings.accent_color === c.value ? 'ring-2 ring-offset-2 ring-text-primary' : ''
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </Section>

        <Section title="Editor">
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-text-secondary block mb-1">Font</label>
              <select
                value={settings.editor_font}
                onChange={(e) => updateSetting('editor_font', e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-bg-tertiary rounded-lg border-none outline-none text-text-primary"
              >
                {EDITOR_FONTS.map((f) => (
                  <option key={f.value} value={f.value}>{f.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-text-secondary block mb-1">Font Size</label>
              <input
                type="range"
                min={14}
                max={20}
                value={settings.editor_font_size}
                onChange={(e) => updateSetting('editor_font_size', e.target.value)}
                className="w-full accent-accent"
              />
              <span className="text-[10px] text-text-tertiary">{settings.editor_font_size}px</span>
            </div>
            <div>
              <label className="text-[11px] text-text-secondary block mb-1">Auto-save Delay</label>
              <select
                value={settings.auto_save_delay}
                onChange={(e) => updateSetting('auto_save_delay', e.target.value)}
                className="px-2 py-1 text-xs bg-bg-tertiary rounded-lg border-none outline-none text-text-primary"
              >
                <option value={500}>0.5s</option>
                <option value={1000}>1s</option>
                <option value={2000}>2s</option>
                <option value={5000}>5s</option>
              </select>
            </div>
            <SettingRow label="Spell Check">
              <Toggle
                checked={settings.spell_check}
                onChange={(v) => updateSetting('spell_check', String(v))}
              />
            </SettingRow>
            <SettingRow label="Markdown Shortcuts">
              <Toggle
                checked={settings.markdown_shortcuts}
                onChange={(v) => updateSetting('markdown_shortcuts', String(v))}
              />
            </SettingRow>
          </div>
        </Section>

        <Section title="Security">
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-text-secondary block mb-1">PIN Code</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value)
                    setPinError('')
                  }}
                  placeholder="Enter PIN (4-6 digits)"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="\d*"
                  className="flex-1 px-3 py-1.5 text-xs bg-bg-tertiary rounded-lg border-none outline-none text-text-primary placeholder:text-text-tertiary"
                />
                <button
                  onClick={handleSetPin}
                  disabled={!isValidPin}
                  className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Set
                </button>
              </div>
              {pinError && (
                <p className="text-[11px] text-red-500 mt-1">{pinError}</p>
              )}
            </div>
            <SettingRow label="Auto-lock">
              <select
                value={settings.auto_lock_timeout}
                onChange={(e) => updateSetting('auto_lock_timeout', e.target.value)}
                className="px-2 py-1 text-xs bg-bg-tertiary rounded-lg border-none outline-none text-text-primary"
              >
                <option value={5}>5 min</option>
                <option value={10}>10 min</option>
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={0}>Never</option>
              </select>
            </SettingRow>
          </div>
        </Section>

        <Section title="Export">
          <SettingRow label="Default Format">
            <select
              value={settings.export_format}
              onChange={(e) => updateSetting('export_format', e.target.value)}
              className="px-2 py-1 text-xs bg-bg-tertiary rounded-lg border-none outline-none text-text-primary"
            >
              <option value="md">Markdown</option>
              <option value="pdf">PDF</option>
              <option value="txt">Plain Text</option>
            </select>
          </SettingRow>
        </Section>

        <Section title="Backup">
          <SettingRow label="Auto-backup">
            <Toggle
              checked={settings.auto_backup}
              onChange={(v) => updateSetting('auto_backup', String(v))}
            />
          </SettingRow>
        </Section>

        <Section title="General">
          <SettingRow label="Start on Login">
            <Toggle
              checked={settings.start_on_login}
              onChange={(v) => updateSetting('start_on_login', String(v))}
            />
          </SettingRow>
          <SettingRow label="First Day of Week">
            <select
              value={settings.first_day_of_week}
              onChange={(e) => updateSetting('first_day_of_week', e.target.value)}
              className="px-2 py-1 text-xs bg-bg-tertiary rounded-lg border-none outline-none text-text-primary"
            >
              <option value={0}>Sunday</option>
              <option value={1}>Monday</option>
            </select>
          </SettingRow>
        </Section>
      </div>
    </motion.div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className="bg-bg-secondary rounded-xl p-4">
      <h2 className="text-xs font-medium text-text-primary mb-3">{title}</h2>
      {children}
    </div>
  )
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[11px] text-text-secondary">{label}</span>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }): JSX.Element {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-8 h-4 rounded-full transition-colors relative ${
        checked ? 'bg-accent' : 'bg-bg-tertiary'
      }`}
    >
      <motion.div
        animate={{ x: checked ? 16 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="w-3 h-3 bg-white rounded-full absolute top-0.5 left-0.5"
      />
    </button>
  )
}
