import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16
const HEX_REGEX = /^[0-9a-f]+$/i

export function deriveKey(pin: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(pin, salt, 100000, 32, 'sha256')
}

export function encrypt(text: string, pin: string): string {
  const salt = crypto.randomBytes(32)
  const key = deriveKey(pin, salt)
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag()

  return `${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`
}

export function decrypt(encryptedData: string, pin: string): string | null {
  try {
    if (!encryptedData || typeof encryptedData !== 'string') return null

    const parts = encryptedData.split(':')
    if (parts.length !== 4) return null

    const [saltHex, ivHex, tagHex, encrypted] = parts
    if (!saltHex || !ivHex || !tagHex || !encrypted) return null
    if (!HEX_REGEX.test(saltHex) || !HEX_REGEX.test(ivHex) || !HEX_REGEX.test(tagHex)) return null

    const salt = Buffer.from(saltHex, 'hex')
    const iv = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')

    if (salt.length !== 32 || iv.length !== IV_LENGTH || tag.length !== TAG_LENGTH) return null

    const key = deriveKey(pin, salt)
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch {
    return null
  }
}
