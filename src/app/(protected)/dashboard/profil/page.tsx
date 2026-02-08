'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { BillingAddress } from '@/types/database'
import { BauhausCard } from '@/components/ui/bauhaus/BauhausCard'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'

interface Profile {
  id: string
  full_name: string
  phone: string | null
  company_name: string | null
  tax_number: string | null
  billing_address: BillingAddress | null
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    setEmail(user.email || '')

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile({
        ...data,
        billing_address: data.billing_address as BillingAddress | null,
      })
    }
    setLoading(false)
  }

  const handleChange = (field: keyof Profile, value: string | null) => {
    if (!profile) return
    setProfile({ ...profile, [field]: value })
  }

  const handleAddressChange = (field: keyof BillingAddress, value: string) => {
    if (!profile) return
    const address = profile.billing_address || { zip: '', city: '', street: '', country: 'Magyarország' }
    setProfile({
      ...profile,
      billing_address: { ...address, [field]: value },
    })
  }

  const saveProfile = async () => {
    if (!profile) return
    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        company_name: profile.company_name,
        tax_number: profile.tax_number,
        billing_address: profile.billing_address ? {
          zip: profile.billing_address.zip,
          city: profile.billing_address.city,
          street: profile.billing_address.street,
          country: profile.billing_address.country,
        } : null,
      })
      .eq('id', profile.id)

    if (error) {
      setMessage({ type: 'error', text: 'Hiba történt a mentés során' })
    } else {
      setMessage({ type: 'success', text: 'Profil sikeresen mentve!' })
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-10 w-48 bg-gray-200 mb-8" />
          <div className="h-96 bg-gray-100 border-[3px] border-gray-200" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-bauhaus-heading mb-2">Profil beállítások</h1>
        <div className="flex items-center gap-2">
          <div className="w-8 h-[3px] bg-black" />
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--bauhaus-red)' }} />
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 border-[3px] ${
            message.type === 'success'
              ? 'border-green-500 bg-green-50'
              : 'border-[var(--bauhaus-red)] bg-red-50'
          }`}
          style={{
            boxShadow: message.type === 'success'
              ? '4px 4px 0 #22c55e'
              : '4px 4px 0 var(--bauhaus-red)'
          }}
        >
          <p className={`text-sm font-medium ${
            message.type === 'success' ? 'text-green-700' : 'text-[var(--bauhaus-red)]'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      <div className="space-y-8">
        {/* Personal info */}
        <BauhausCard padding="lg" accentColor="blue" hasCornerAccent accentPosition="top-left">
          <h2 className="font-bugrino text-lg uppercase tracking-wider mb-6">Személyes adatok</h2>
          <div className="space-y-5">
            <div>
              <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">
                Email cím
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 border-[3px] border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">Az email cím nem módosítható</p>
            </div>

            <div>
              <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">
                Teljes név *
              </label>
              <input
                type="text"
                value={profile.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
              />
            </div>

            <div>
              <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">
                Telefonszám
              </label>
              <input
                type="tel"
                value={profile.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value || null)}
                placeholder="+36 30 123 4567"
                className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
              />
            </div>
          </div>
        </BauhausCard>

        {/* Company info */}
        <BauhausCard padding="lg" accentColor="yellow" hasCornerAccent accentPosition="top-right">
          <h2 className="font-bugrino text-lg uppercase tracking-wider mb-2">Céges adatok</h2>
          <p className="text-sm text-gray-500 mb-6">
            Opcionális. Töltse ki, ha céges számlát szeretne kapni.
          </p>
          <div className="space-y-5">
            <div>
              <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">
                Cégnév
              </label>
              <input
                type="text"
                value={profile.company_name || ''}
                onChange={(e) => handleChange('company_name', e.target.value || null)}
                placeholder="Példa Kft."
                className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
              />
            </div>

            <div>
              <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">
                Adószám
              </label>
              <input
                type="text"
                value={profile.tax_number || ''}
                onChange={(e) => handleChange('tax_number', e.target.value || null)}
                placeholder="12345678-1-23"
                className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
              />
            </div>
          </div>
        </BauhausCard>

        {/* Billing address */}
        <BauhausCard padding="lg" accentColor="red" hasCornerAccent accentPosition="bottom-left">
          <h2 className="font-bugrino text-lg uppercase tracking-wider mb-6">Számlázási cím</h2>
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">
                  Irányítószám
                </label>
                <input
                  type="text"
                  value={profile.billing_address?.zip || ''}
                  onChange={(e) => handleAddressChange('zip', e.target.value)}
                  placeholder="1111"
                  className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">
                  Város
                </label>
                <input
                  type="text"
                  value={profile.billing_address?.city || ''}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  placeholder="Budapest"
                  className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
                />
              </div>
            </div>

            <div>
              <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">
                Utca, házszám
              </label>
              <input
                type="text"
                value={profile.billing_address?.street || ''}
                onChange={(e) => handleAddressChange('street', e.target.value)}
                placeholder="Példa utca 1."
                className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
              />
            </div>

            <div>
              <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">
                Ország
              </label>
              <input
                type="text"
                value={profile.billing_address?.country || 'Magyarország'}
                onChange={(e) => handleAddressChange('country', e.target.value)}
                className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
              />
            </div>
          </div>
        </BauhausCard>

        {/* Save button */}
        <div className="flex justify-end">
          <BauhausButton
            onClick={saveProfile}
            disabled={saving}
            variant="primary"
            size="lg"
          >
            {saving ? 'Mentés...' : 'Változtatások mentése'}
          </BauhausButton>
        </div>
      </div>
    </div>
  )
}
