// Re-export Database type from generated Supabase types
export type { Database, Json } from './supabase'
import type { Database } from './supabase'

// Custom type aliases for convenience
export type BookingStatus = 'pending' | 'confirmed' | 'paid' | 'completed' | 'cancelled' | 'no_show'
export type BookingType = 'package' | 'hourly'

export interface HourlyBookingSettings {
  hourly_rate: number
  min_hours: number
  max_hours: number
  enabled: boolean
}
export type BlockType = 'maintenance' | 'internal_event' | 'private_booking' | 'preparation' | 'other'
export type SpecialDateType = 'holiday' | 'closed' | 'special_hours'
export type PriceType = 'fixed' | 'per_hour' | 'per_person'
export type UserRole = 'user' | 'admin'

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Commonly used types
export type Profile = Tables<'profiles'>
export type OpeningHours = Tables<'opening_hours'>
export type SpecialDate = Tables<'special_dates'>
export type TimeSlot = Tables<'time_slots'>
export type Extra = Tables<'extras'>
export type InternalBlock = Tables<'internal_blocks'>
export type Booking = Tables<'bookings'>
export type BookingExtra = Tables<'booking_extras'>
export type BlockedDate = Tables<'blocked_dates'>
export type Setting = Tables<'settings'>

// Billing address type
export interface BillingAddress {
  zip: string
  city: string
  street: string
  country: string
}

// Settings types
export interface CancellationRule {
  days_before: number
  fee_percent: number
}

export interface CancellationPolicy {
  rules: CancellationRule[]
}

export interface BookingSettings {
  min_days_ahead: number
  max_days_ahead: number
  require_approval: boolean
  slot_duration_minutes: number
  buffer_between_slots: number
}

export interface SiteSettings {
  studio_name: string
  studio_address: string
  studio_phone: string
  studio_email: string
  currency: string
  locale: string
}

export interface SzamlazzHuSettings {
  agent_key: string
  prefix: string
  seller_name: string
  seller_bank: string
  seller_bank_account: string
}

export interface EmailSettings {
  from_name: string
  from_email: string
  admin_email: string
}

// Booking with relations
export interface BookingWithRelations extends Booking {
  profiles?: Profile
  time_slots?: TimeSlot
  booking_extras?: (BookingExtra & { extras?: Extra })[]
}
