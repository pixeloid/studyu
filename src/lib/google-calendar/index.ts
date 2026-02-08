import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

const SCOPES = ['https://www.googleapis.com/auth/calendar.events']
const SETTINGS_KEY = 'google_calendar'
const TIMEZONE = 'Europe/Budapest'

// Encryption helpers for storing refresh tokens securely
function getEncryptionKey(): Buffer {
  const key = process.env.GOOGLE_CALENDAR_ENCRYPTION_KEY
  if (!key) throw new Error('GOOGLE_CALENDAR_ENCRYPTION_KEY is not set')
  return crypto.createHash('sha256').update(key).digest()
}

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', getEncryptionKey(), iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

function decrypt(text: string): string {
  const [ivHex, encrypted] = text.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', getEncryptionKey(), iv)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  )
}

export function getAuthUrl(): string {
  const oauth2Client = getOAuth2Client()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  })
}

export async function exchangeCode(code: string): Promise<void> {
  const oauth2Client = getOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)

  if (!tokens.refresh_token) {
    throw new Error('No refresh token received. Please revoke access and try again.')
  }

  const supabase = await createClient()
  const encryptedRefreshToken = encrypt(tokens.refresh_token)

  const settingsValue = {
    refresh_token: encryptedRefreshToken,
    connected_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('settings')
    .upsert(
      { key: SETTINGS_KEY, value: settingsValue },
      { onConflict: 'key' },
    )

  if (error) {
    throw new Error(`Failed to store Google Calendar tokens: ${error.message}`)
  }
}

async function getStoredRefreshToken(): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', SETTINGS_KEY)
    .single()

  if (!data?.value) return null

  const value = data.value as { refresh_token?: string }
  if (!value.refresh_token) return null

  try {
    return decrypt(value.refresh_token)
  } catch {
    return null
  }
}

export async function getCalendarClient() {
  const refreshToken = await getStoredRefreshToken()
  if (!refreshToken) return null

  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  return google.calendar({ version: 'v3', auth: oauth2Client })
}

export async function isConnected(): Promise<boolean> {
  const refreshToken = await getStoredRefreshToken()
  return refreshToken !== null
}

export async function disconnect(): Promise<void> {
  const refreshToken = await getStoredRefreshToken()

  if (refreshToken) {
    try {
      const oauth2Client = getOAuth2Client()
      await oauth2Client.revokeToken(refreshToken)
    } catch {
      // Token may already be revoked, continue with cleanup
    }
  }

  const supabase = await createClient()
  await supabase.from('settings').delete().eq('key', SETTINGS_KEY)
}

// Color IDs for Google Calendar events
// https://developers.google.com/calendar/api/v3/reference/colors
const STATUS_COLORS: Record<string, string> = {
  pending: '5',     // Banana (yellow)
  confirmed: '9',   // Blueberry (blue)
  paid: '10',       // Basil (green)
  completed: '8',   // Graphite (gray)
}

interface BookingEventData {
  clientName: string
  bookingDate: string
  startTime: string
  endTime: string
  status: string
  totalPrice: number
  timeSlotName?: string
  userNotes?: string | null
  adminNotes?: string | null
}

function buildEvent(data: BookingEventData) {
  const dateStr = data.bookingDate // e.g. "2024-02-15"
  // Time may come as "09:00" or "09:00:00" — normalize to "HH:mm:ss"
  const normalizeTime = (t: string) => t.length === 5 ? `${t}:00` : t
  const startDateTime = `${dateStr}T${normalizeTime(data.startTime)}`
  const endDateTime = `${dateStr}T${normalizeTime(data.endTime)}`

  const statusLabels: Record<string, string> = {
    pending: 'Fuggőben',
    confirmed: 'Visszaigazolva',
    paid: 'Fizetve',
    completed: 'Teljesítve',
  }

  const descriptionParts = [
    `Státusz: ${statusLabels[data.status] || data.status}`,
    `Ár: ${data.totalPrice.toLocaleString('hu-HU')} Ft`,
  ]
  if (data.timeSlotName) descriptionParts.push(`Időpont: ${data.timeSlotName}`)
  if (data.userNotes) descriptionParts.push(`Ügyfél megjegyzése: ${data.userNotes}`)
  if (data.adminNotes) descriptionParts.push(`Admin megjegyzés: ${data.adminNotes}`)

  return {
    summary: `${data.clientName} - ${data.timeSlotName || 'Foglalás'}`,
    description: descriptionParts.join('\n'),
    start: {
      dateTime: startDateTime,
      timeZone: TIMEZONE,
    },
    end: {
      dateTime: endDateTime,
      timeZone: TIMEZONE,
    },
    colorId: STATUS_COLORS[data.status] || '5',
  }
}

export async function createBookingEvent(data: BookingEventData): Promise<string | null> {
  const calendar = await getCalendarClient()
  if (!calendar) return null

  try {
    const event = buildEvent(data)
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    })
    return response.data.id || null
  } catch (error) {
    console.error('Failed to create Google Calendar event:', error)
    return null
  }
}

export async function updateBookingEvent(eventId: string, data: BookingEventData): Promise<boolean> {
  const calendar = await getCalendarClient()
  if (!calendar) return false

  try {
    const event = buildEvent(data)
    await calendar.events.update({
      calendarId: 'primary',
      eventId,
      requestBody: event,
    })
    return true
  } catch (error) {
    console.error('Failed to update Google Calendar event:', error)
    return false
  }
}

export async function deleteBookingEvent(eventId: string): Promise<boolean> {
  const calendar = await getCalendarClient()
  if (!calendar) return false

  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    })
    return true
  } catch (error) {
    console.error('Failed to delete Google Calendar event:', error)
    return false
  }
}
