#!/usr/bin/env npx ts-node

/**
 * Seed Test Data Script
 *
 * Creates test users via Supabase Admin API and inserts bookings via SQL.
 * Run after `supabase db reset` to populate test data.
 *
 * Usage:
 *   npx ts-node scripts/seed-test-data.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

interface TestUser {
  email: string
  password: string
  name: string
  role?: 'admin' | 'user'
  phone?: string
  company_name?: string
  tax_number?: string
  billing_address?: Record<string, string>
}

const TEST_USERS: TestUser[] = [
  {
    email: 'admin@studyu.hu',
    password: 'Admin123!',
    name: 'Admin User',
    role: 'admin',
  },
  {
    email: 'kovacs.anna@example.com',
    password: 'Test1234!',
    name: 'Kovács Anna',
    phone: '+36 30 111 2222',
    company_name: 'Anna Photography Kft.',
    tax_number: '12345678-2-42',
    billing_address: { zip: '1052', city: 'Budapest', street: 'Váci utca 10.' },
  },
  {
    email: 'nagy.peter@example.com',
    password: 'Test1234!',
    name: 'Nagy Péter',
    phone: '+36 20 333 4444',
  },
  {
    email: 'szabo.eszter@example.com',
    password: 'Test1234!',
    name: 'Szabó Eszter',
    phone: '+36 70 555 6666',
    company_name: 'Eszter Design Studio',
    billing_address: { zip: '6720', city: 'Szeged', street: 'Kárász utca 5.' },
  },
]

async function createUser(user: TestUser): Promise<string> {
  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: { full_name: user.name },
  })

  if (error) {
    if (error.message.includes('already been registered')) {
      // User exists, find their ID
      const { data: users } = await supabase.auth.admin.listUsers()
      const existing = users?.users.find(u => u.email === user.email)
      if (existing) {
        console.log(`  User exists: ${user.email} (${existing.id})`)
        return existing.id
      }
    }
    throw new Error(`Failed to create ${user.email}: ${error.message}`)
  }

  console.log(`  Created: ${user.email} (${data.user.id})`)

  // Update profile
  const profileUpdate: Record<string, unknown> = {
    full_name: user.name,
  }
  if (user.role) profileUpdate.role = user.role
  if (user.phone) profileUpdate.phone = user.phone
  if (user.company_name) profileUpdate.company_name = user.company_name
  if (user.tax_number) profileUpdate.tax_number = user.tax_number
  if (user.billing_address) profileUpdate.billing_address = user.billing_address

  await supabase.from('profiles').update(profileUpdate).eq('id', data.user.id)

  return data.user.id
}

async function seedBookings(userIds: Record<string, string>) {
  // Get time slot IDs
  const { data: slots } = await supabase.from('time_slots').select('id, name')
  const slotMap = Object.fromEntries((slots || []).map(s => [s.name, s.id]))

  // Get extra IDs
  const { data: extras } = await supabase.from('extras').select('id, name')
  const extraMap = Object.fromEntries((extras || []).map(e => [e.name, e.id]))

  const today = new Date()
  const dateStr = (daysOffset: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() + daysOffset)
    return d.toISOString().split('T')[0]
  }
  const ago = (hours: number) => new Date(Date.now() - hours * 3600000).toISOString()

  // Booking 1: Pending (Kovács Anna, tomorrow morning)
  const { data: b1 } = await supabase.from('bookings').insert({
    user_id: userIds['kovacs.anna@example.com'],
    time_slot_id: slotMap['Délelőtt'],
    booking_date: dateStr(1),
    base_price: 35000,
    extras_price: 15000,
    total_price: 50000,
    status: 'pending',
    user_notes: 'Portréfotózás, természetes fények kellenek.',
  }).select('id').single()
  console.log(`  Booking 1 (pending): ${b1?.id}`)

  // Booking 1 extras: Smink
  if (b1) {
    await supabase.from('booking_extras').insert({
      booking_id: b1.id,
      extra_id: extraMap['Smink'],
      quantity: 1,
      unit_price: 15000,
      total_price: 15000,
    })
  }

  // Booking 2: Confirmed with proforma (Kovács Anna, next week afternoon)
  const { data: b2 } = await supabase.from('bookings').insert({
    user_id: userIds['kovacs.anna@example.com'],
    time_slot_id: slotMap['Délután'],
    booking_date: dateStr(7),
    base_price: 35000,
    extras_price: 20000,
    total_price: 55000,
    status: 'confirmed',
    proforma_number: 'D-MIS-100',
    proforma_url: 'https://www.szamlazz.hu/szamla/fiokok',
    proforma_sent_at: ago(24),
    user_notes: 'Esküvői próbafotózás, stylisttal.',
  }).select('id').single()
  console.log(`  Booking 2 (confirmed): ${b2?.id}`)

  if (b2) {
    await supabase.from('booking_extras').insert({
      booking_id: b2.id,
      extra_id: extraMap['Stylist'],
      quantity: 1,
      unit_price: 20000,
      total_price: 20000,
    })
  }

  // Booking 3: Paid with invoice (Nagy Péter, in 3 days, full day)
  const { data: b3 } = await supabase.from('bookings').insert({
    user_id: userIds['nagy.peter@example.com'],
    time_slot_id: slotMap['Egész nap'],
    booking_date: dateStr(3),
    base_price: 65000,
    extras_price: 33000,
    total_price: 98000,
    status: 'paid',
    proforma_number: 'D-MIS-101',
    invoice_number: 'E-MIS-2026-100',
    invoice_url: 'https://www.szamlazz.hu/szamla/fiokok',
    paid_at: ago(12),
    user_notes: 'Termékfotózás, kb. 50 termék. Kérek asszisztenst is.',
  }).select('id').single()
  console.log(`  Booking 3 (paid): ${b3?.id}`)

  if (b3) {
    await supabase.from('booking_extras').insert([
      { booking_id: b3.id, extra_id: extraMap['Asszisztens'], quantity: 5, unit_price: 5000, total_price: 25000 },
      { booking_id: b3.id, extra_id: extraMap['Extra háttér'], quantity: 1, unit_price: 8000, total_price: 8000 },
    ])
  }

  // Booking 4: Completed (Szabó Eszter, 2 days ago, morning)
  const { data: b4 } = await supabase.from('bookings').insert({
    user_id: userIds['szabo.eszter@example.com'],
    time_slot_id: slotMap['Délelőtt'],
    booking_date: dateStr(-2),
    base_price: 35000,
    extras_price: 0,
    total_price: 35000,
    status: 'completed',
    proforma_number: 'D-MIS-99',
    invoice_number: 'E-MIS-2026-99',
    invoice_url: 'https://www.szamlazz.hu/szamla/fiokok',
    paid_at: ago(96),
    admin_notes: 'Minden rendben lezajlott. Ügyfél elégedett volt.',
  }).select('id').single()
  console.log(`  Booking 4 (completed): ${b4?.id}`)

  // Booking 5: Cancelled (Nagy Péter)
  const { data: b5 } = await supabase.from('bookings').insert({
    user_id: userIds['nagy.peter@example.com'],
    time_slot_id: slotMap['Délelőtt'],
    booking_date: dateStr(5),
    base_price: 35000,
    extras_price: 0,
    total_price: 35000,
    status: 'cancelled',
    cancellation_reason: 'Személyes okok miatt lemondta.',
    cancelled_at: ago(24),
    cancellation_fee: 0,
  }).select('id').single()
  console.log(`  Booking 5 (cancelled): ${b5?.id}`)

  // Booking 6: Pending with coupon (Szabó Eszter, in 10 days)
  // First get/create coupon
  const { data: coupon } = await supabase.from('coupons').select('id').eq('code', 'WELCOME10').single()
  const { data: b6 } = await supabase.from('bookings').insert({
    user_id: userIds['szabo.eszter@example.com'],
    time_slot_id: slotMap['Délután'],
    booking_date: dateStr(10),
    base_price: 35000,
    extras_price: 27000,
    total_price: 55800,
    discount_percent: 10,
    discount_amount: 6200,
    coupon_id: coupon?.id,
    coupon_code: 'WELCOME10',
    status: 'pending',
    user_notes: 'Családi fotózás, 2 felnőtt + 2 gyerek.',
  }).select('id').single()
  console.log(`  Booking 6 (pending+coupon): ${b6?.id}`)

  if (b6) {
    await supabase.from('booking_extras').insert([
      { booking_id: b6.id, extra_id: extraMap['Smink'], quantity: 1, unit_price: 15000, total_price: 15000 },
      { booking_id: b6.id, extra_id: extraMap['Fodrász'], quantity: 1, unit_price: 12000, total_price: 12000 },
    ])
  }

  // Booking 7: Confirmed (Nagy Péter, in 14 days, full day)
  const { data: b7 } = await supabase.from('bookings').insert({
    user_id: userIds['nagy.peter@example.com'],
    time_slot_id: slotMap['Egész nap'],
    booking_date: dateStr(14),
    base_price: 65000,
    extras_price: 0,
    total_price: 65000,
    status: 'confirmed',
    proforma_number: 'D-MIS-102',
    proforma_url: 'https://www.szamlazz.hu/szamla/fiokok',
    proforma_sent_at: ago(48),
    user_notes: 'Céges csoportkép, 15 fő.',
  }).select('id').single()
  console.log(`  Booking 7 (confirmed): ${b7?.id}`)
}

async function main() {
  console.log('Creating test users...')
  const userIds: Record<string, string> = {}

  for (const user of TEST_USERS) {
    userIds[user.email] = await createUser(user)
  }

  console.log('\nCreating test bookings...')
  await seedBookings(userIds)

  console.log('\nDone! Test data seeded successfully.')
}

main().catch(console.error)
