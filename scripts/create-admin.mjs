#!/usr/bin/env node

/**
 * Create Admin User Script
 *
 * Usage:
 *   node scripts/create-admin.mjs <email> <password> <name>
 *
 * Example:
 *   node scripts/create-admin.mjs admin@studyu.hu Admin123 "Admin User"
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

async function createAdmin() {
  const args = process.argv.slice(2)

  if (args.length < 3) {
    console.log('Usage: node scripts/create-admin.mjs <email> <password> <name>')
    console.log('Example: node scripts/create-admin.mjs admin@studyu.hu Admin123 "Admin User"')
    process.exit(1)
  }

  const [email, password, name] = args

  console.log(`Creating admin user: ${email}`)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: name
    }
  })

  if (authError) {
    console.error('Error creating auth user:', authError.message)
    process.exit(1)
  }

  console.log('Auth user created:', authData.user.id)

  // Update profile to admin role
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      role: 'admin',
      full_name: name
    })
    .eq('id', authData.user.id)

  if (profileError) {
    console.error('Error updating profile:', profileError.message)
    process.exit(1)
  }

  console.log('✅ Admin user created successfully!')
  console.log(`   Email: ${email}`)
  console.log(`   Name: ${name}`)
  console.log(`   ID: ${authData.user.id}`)
}

createAdmin().catch(console.error)
