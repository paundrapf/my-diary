export interface MoodItem {
  id: number
  emoji: string
  label: string
  color: string
  category: string
}

export const quickMoods: MoodItem[] = [
  { id: 1, emoji: '😁', label: 'Gembira', color: '#10B981', category: 'gembira' },
  { id: 2, emoji: '😂', label: 'Lucu', color: '#3B82F6', category: 'lucu' },
  { id: 3, emoji: '😖', label: 'Frustasi', color: '#EF4444', category: 'frustasi' },
  { id: 4, emoji: '😊', label: 'Baik', color: '#F59E0B', category: 'baik' },
  { id: 5, emoji: '🔥', label: 'Semangat', color: '#8B5CF6', category: 'semangat' }
]

export const extendedMoods: MoodItem[] = [
  // Gembira
  { id: 6, emoji: '😄', label: 'Ceria', color: '#34D399', category: 'gembira' },
  { id: 7, emoji: '😍', label: 'Sayang', color: '#6EE7B7', category: 'gembira' },
  { id: 8, emoji: '🥰', label: 'Menyayangi', color: '#A7F3D0', category: 'gembira' },
  { id: 9, emoji: '🤗', label: 'Hangat', color: '#059669', category: 'gembira' },
  { id: 10, emoji: '😎', label: 'Keren', color: '#047857', category: 'gembira' },
  { id: 11, emoji: '🙌', label: 'Bersyukur', color: '#065F46', category: 'gembira' },

  // Lucu
  { id: 12, emoji: '🤣', label: 'Tertawa', color: '#60A5FA', category: 'lucu' },
  { id: 13, emoji: '😜', label: 'Nakal', color: '#93C5FD', category: 'lucu' },
  { id: 14, emoji: '😝', label: 'Ledek', color: '#2563EB', category: 'lucu' },
  { id: 15, emoji: '🤪', label: 'Konyol', color: '#1D4ED8', category: 'lucu' },
  { id: 16, emoji: '😏', label: 'Meremehkan', color: '#1E40AF', category: 'lucu' },
  { id: 17, emoji: '😉', label: 'Kedip', color: '#1E3A8A', category: 'lucu' },

  // Frustasi
  { id: 18, emoji: '😢', label: 'Sedih', color: '#F87171', category: 'frustasi' },
  { id: 19, emoji: '😭', label: 'Menangis', color: '#FCA5A5', category: 'frustasi' },
  { id: 20, emoji: '😞', label: 'Kecewa', color: '#DC2626', category: 'frustasi' },
  { id: 21, emoji: '😔', label: 'Lesu', color: '#B91C1C', category: 'frustasi' },
  { id: 22, emoji: '😤', label: 'Kesal', color: '#991B1B', category: 'frustasi' },
  { id: 23, emoji: '😩', label: 'Lelah', color: '#7F1D1D', category: 'frustasi' },

  // Baik
  { id: 24, emoji: '🥳', label: 'Pesta', color: '#FBBF24', category: 'baik' },
  { id: 25, emoji: '😇', label: 'Polos', color: '#FDE68A', category: 'baik' },
  { id: 26, emoji: '😌', label: 'Tenang', color: '#D97706', category: 'baik' },
  { id: 27, emoji: '😋', label: 'Nikmat', color: '#B45309', category: 'baik' },
  { id: 28, emoji: '🥹', label: 'Haru', color: '#92400E', category: 'baik' },
  { id: 29, emoji: '🫂', label: 'Peluk', color: '#78350F', category: 'baik' },

  // Semangat
  { id: 30, emoji: '🎉', label: 'Rayakan', color: '#A78BFA', category: 'semangat' },
  { id: 31, emoji: '⭐', label: 'Bintang', color: '#C4B5FD', category: 'semangat' },
  { id: 32, emoji: '💪', label: 'Kuat', color: '#7C3AED', category: 'semangat' },
  { id: 33, emoji: '🚀', label: 'Melaju', color: '#6D28D9', category: 'semangat' },
  { id: 34, emoji: '✨', label: 'Cemerlang', color: '#5B21B6', category: 'semangat' },
  { id: 35, emoji: '🏆', label: 'Juara', color: '#4C1D95', category: 'semangat' }
]

export function getMoodById(id: number | null): MoodItem | undefined {
  if (id === null) return undefined
  const q = quickMoods.find((m) => m.id === id)
  if (q) return q
  return extendedMoods.find((m) => m.id === id)
}

export function getPrettyLabel(id: number | null): string {
  const mood = getMoodById(id)
  return mood ? mood.emoji : ''
}

export function getMoodColor(id: number | null): string {
  const mood = getMoodById(id)
  return mood ? mood.color : ''
}
