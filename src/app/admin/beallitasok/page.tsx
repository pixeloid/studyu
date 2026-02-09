'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Json } from '@/types/supabase'
import { BauhausCard } from '@/components/ui/bauhaus/BauhausCard'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'

interface CancellationRule {
  days_before: number
  fee_percent: number
}

interface BookingSettings {
  min_days_ahead: number
  max_days_ahead: number
}

interface ContactSettings {
  email: string
  phone: string
  address: string
}

interface HourlyBookingSettings {
  hourly_rate: number
  min_hours: number
  max_hours: number
  enabled: boolean
}

interface Settings {
  cancellation_policy: { rules: CancellationRule[] }
  booking_settings: BookingSettings
  contact_info: ContactSettings
  hourly_booking: HourlyBookingSettings
}

const defaultSettings: Settings = {
  cancellation_policy: {
    rules: [
      { days_before: 7, fee_percent: 0 },
      { days_before: 3, fee_percent: 50 },
      { days_before: 2, fee_percent: 70 },
      { days_before: 1, fee_percent: 100 },
    ],
  },
  booking_settings: {
    min_days_ahead: 1,
    max_days_ahead: 90,
  },
  contact_info: {
    email: '',
    phone: '',
    address: '',
  },
  hourly_booking: {
    hourly_rate: 10000,
    min_hours: 2,
    max_hours: 9,
    enabled: true,
  },
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [gcalConnected, setGcalConnected] = useState(false)
  const [gcalLoading, setGcalLoading] = useState(true)
  const supabase = createClient()
  const searchParams = useSearchParams()

  useEffect(() => {
    loadSettings()
    loadGcalStatus()

    // Handle Google Calendar OAuth callback redirect
    const gcalResult = searchParams.get('gcal')
    if (gcalResult === 'success') {
      setMessage({ type: 'success', text: 'Google Calendar sikeresen csatlakoztatva!' })
      setGcalConnected(true)
    } else if (gcalResult === 'error') {
      const errorMessage = searchParams.get('message') || 'Ismeretlen hiba'
      setMessage({ type: 'error', text: `Google Calendar hiba: ${errorMessage}` })
    }
  }, [])

  const loadSettings = async () => {
    const { data } = await supabase
      .from('settings')
      .select('key, value')

    if (data) {
      const loadedSettings = { ...defaultSettings }
      data.forEach((item) => {
        if (item.key === 'cancellation_policy' && item.value) {
          loadedSettings.cancellation_policy = item.value as unknown as { rules: CancellationRule[] }
        }
        if (item.key === 'booking_settings' && item.value) {
          loadedSettings.booking_settings = item.value as unknown as BookingSettings
        }
        if (item.key === 'contact_info' && item.value) {
          loadedSettings.contact_info = item.value as unknown as ContactSettings
        }
        if (item.key === 'hourly_booking' && item.value) {
          loadedSettings.hourly_booking = item.value as unknown as HourlyBookingSettings
        }
      })
      setSettings(loadedSettings)
    }
    setLoading(false)
  }

  const loadGcalStatus = async () => {
    try {
      const res = await fetch('/api/auth/google-calendar/status')
      const data = await res.json()
      setGcalConnected(data.connected ?? false)
    } catch {
      // Ignore errors
    }
    setGcalLoading(false)
  }

  const connectGcal = async () => {
    try {
      const res = await fetch('/api/auth/google-calendar/authorize')
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setMessage({ type: 'error', text: 'Nem sikerült a Google Calendar csatlakoztatás indítása' })
    }
  }

  const disconnectGcal = async () => {
    if (!confirm('Biztosan leválasztja a Google Calendar-t?')) return
    try {
      const res = await fetch('/api/auth/google-calendar/disconnect', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setGcalConnected(false)
        setMessage({ type: 'success', text: 'Google Calendar leválasztva' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Hiba történt' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Hiba történt a leválasztás során' })
    }
  }

  const saveSetting = async (key: string, value: Settings[keyof Settings]) => {
    setSaving(true)
    setMessage(null)

    // Convert to Json-compatible format
    const jsonValue = JSON.parse(JSON.stringify(value)) as Json

    // Upsert the setting
    const { error } = await supabase
      .from('settings')
      .upsert({ key, value: jsonValue }, { onConflict: 'key' })

    if (error) {
      setMessage({ type: 'error', text: 'Hiba történt a mentés során' })
    } else {
      setMessage({ type: 'success', text: 'Beállítások mentve!' })
    }
    setSaving(false)
  }

  const updateCancellationRule = (index: number, field: keyof CancellationRule, value: number) => {
    const newRules = [...settings.cancellation_policy.rules]
    newRules[index] = { ...newRules[index], [field]: value }
    setSettings({
      ...settings,
      cancellation_policy: { rules: newRules },
    })
  }

  const addCancellationRule = () => {
    setSettings({
      ...settings,
      cancellation_policy: {
        rules: [...settings.cancellation_policy.rules, { days_before: 0, fee_percent: 100 }],
      },
    })
  }

  const removeCancellationRule = (index: number) => {
    const newRules = settings.cancellation_policy.rules.filter((_, i) => i !== index)
    setSettings({
      ...settings,
      cancellation_policy: { rules: newRules },
    })
  }

  const updateBookingSettings = (field: keyof BookingSettings, value: number) => {
    setSettings({
      ...settings,
      booking_settings: { ...settings.booking_settings, [field]: value },
    })
  }

  const updateContactInfo = (field: keyof ContactSettings, value: string) => {
    setSettings({
      ...settings,
      contact_info: { ...settings.contact_info, [field]: value },
    })
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 w-48 bg-gray-200 mb-8" />
        <div className="h-96 bg-gray-100 border-[3px] border-gray-200" />
      </div>
    )
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-bauhaus-heading mb-2">Beállítások</h1>
        <div className="flex items-center gap-2">
          <div className="w-8 h-[3px] bg-black" />
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--bauhaus-yellow)' }} />
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
        {/* Cancellation Policy */}
        <BauhausCard padding="lg" accentColor="red" hasCornerAccent accentPosition="top-left">
          <h2 className="font-bugrino text-lg uppercase tracking-wider mb-2">Lemondási feltételek</h2>
          <p className="text-sm text-gray-500 mb-6">
            Állítsa be, hogy hány nappal a foglalás előtt mekkora lemondási díj alkalmazandó.
          </p>

          <div className="space-y-4 mb-6">
            {settings.cancellation_policy.rules.map((rule, index) => (
              <div key={index} className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block font-bugrino text-xs uppercase tracking-wider mb-2">
                    Nappal előtte
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={rule.days_before}
                    onChange={(e) => updateCancellationRule(index, 'days_before', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
                  />
                </div>
                <div className="flex-1">
                  <label className="block font-bugrino text-xs uppercase tracking-wider mb-2">
                    Díj (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={rule.fee_percent}
                    onChange={(e) => updateCancellationRule(index, 'fee_percent', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
                  />
                </div>
                <button
                  onClick={() => removeCancellationRule(index)}
                  className="px-4 py-3 font-bugrino text-xs uppercase tracking-wider text-[var(--bauhaus-red)] hover:underline"
                >
                  Törlés
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addCancellationRule}
            className="font-bugrino text-sm uppercase tracking-wider text-[var(--bauhaus-blue)] hover:underline"
          >
            + Új szabály hozzáadása
          </button>

          <div className="mt-6 pt-6 border-t-[3px] border-gray-200 flex justify-end">
            <BauhausButton
              onClick={() => saveSetting('cancellation_policy', settings.cancellation_policy)}
              disabled={saving}
              variant="primary"
            >
              {saving ? 'Mentés...' : 'Mentés'}
            </BauhausButton>
          </div>
        </BauhausCard>

        {/* Booking Settings */}
        <BauhausCard padding="lg" accentColor="blue" hasCornerAccent accentPosition="top-right">
          <h2 className="font-bugrino text-lg uppercase tracking-wider mb-6">Foglalási beállítások</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">
                Minimum napok előre
              </label>
              <input
                type="number"
                min="0"
                value={settings.booking_settings.min_days_ahead}
                onChange={(e) => updateBookingSettings('min_days_ahead', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
              />
              <p className="mt-2 text-xs text-gray-500">
                Hány nappal előre lehet legkorábban foglalni
              </p>
            </div>
            <div>
              <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">
                Maximum napok előre
              </label>
              <input
                type="number"
                min="1"
                value={settings.booking_settings.max_days_ahead}
                onChange={(e) => updateBookingSettings('max_days_ahead', parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
              />
              <p className="mt-2 text-xs text-gray-500">
                Hány nappal előre lehet maximum foglalni
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t-[3px] border-gray-200 flex justify-end">
            <BauhausButton
              onClick={() => saveSetting('booking_settings', settings.booking_settings)}
              disabled={saving}
              variant="primary"
            >
              {saving ? 'Mentés...' : 'Mentés'}
            </BauhausButton>
          </div>
        </BauhausCard>

        {/* Contact Info */}
        <BauhausCard padding="lg" accentColor="yellow" hasCornerAccent accentPosition="bottom-left">
          <h2 className="font-bugrino text-lg uppercase tracking-wider mb-2">Kapcsolati adatok</h2>
          <p className="text-sm text-gray-500 mb-6">
            Ezek az adatok jelennek meg a kapcsolat oldalon és az e-mailekben.
          </p>

          <div className="space-y-5">
            <div>
              <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">
                E-mail cím
              </label>
              <input
                type="email"
                value={settings.contact_info.email}
                onChange={(e) => updateContactInfo('email', e.target.value)}
                placeholder="info@studyu.hu"
                className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
              />
            </div>
            <div>
              <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">
                Telefonszám
              </label>
              <input
                type="tel"
                value={settings.contact_info.phone}
                onChange={(e) => updateContactInfo('phone', e.target.value)}
                placeholder="+36 30 123 4567"
                className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
              />
            </div>
            <div>
              <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">
                Cím
              </label>
              <textarea
                value={settings.contact_info.address}
                onChange={(e) => updateContactInfo('address', e.target.value)}
                placeholder="1234 Budapest, Példa utca 1."
                rows={2}
                className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow resize-none"
              />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t-[3px] border-gray-200 flex justify-end">
            <BauhausButton
              onClick={() => saveSetting('contact_info', settings.contact_info)}
              disabled={saving}
              variant="primary"
            >
              {saving ? 'Mentés...' : 'Mentés'}
            </BauhausButton>
          </div>
        </BauhausCard>

        {/* Hourly Booking */}
        <BauhausCard padding="lg" accentColor="yellow" hasCornerAccent accentPosition="bottom-right">
          <h2 className="font-bugrino text-lg uppercase tracking-wider mb-2">Óránkénti foglalás</h2>
          <p className="text-sm text-gray-500 mb-6">
            Állítsa be az egyedi időpontos foglalás paramétereit.
          </p>

          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className={`w-12 h-7 rounded-full border-[2px] border-black relative transition-colors ${
                  settings.hourly_booking.enabled ? 'bg-[var(--bauhaus-blue)]' : 'bg-gray-200'
                }`}
                onClick={() =>
                  setSettings({
                    ...settings,
                    hourly_booking: { ...settings.hourly_booking, enabled: !settings.hourly_booking.enabled },
                  })
                }
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white border-[2px] border-black absolute top-0 transition-transform ${
                    settings.hourly_booking.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
              <span className="font-bugrino text-sm uppercase tracking-wider">
                {settings.hourly_booking.enabled ? 'Engedélyezve' : 'Letiltva'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">
                Óradíj (Ft)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={settings.hourly_booking.hourly_rate}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    hourly_booking: { ...settings.hourly_booking, hourly_rate: parseInt(e.target.value) || 0 },
                  })
                }
                className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
              />
            </div>
            <div>
              <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">
                Minimum óra
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={settings.hourly_booking.min_hours}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    hourly_booking: { ...settings.hourly_booking, min_hours: parseInt(e.target.value) || 1 },
                  })
                }
                className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
              />
            </div>
            <div>
              <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">
                Maximum óra
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={settings.hourly_booking.max_hours}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    hourly_booking: { ...settings.hourly_booking, max_hours: parseInt(e.target.value) || 1 },
                  })
                }
                className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
              />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t-[3px] border-gray-200 flex justify-end">
            <BauhausButton
              onClick={() => saveSetting('hourly_booking', settings.hourly_booking)}
              disabled={saving}
              variant="primary"
            >
              {saving ? 'Mentés...' : 'Mentés'}
            </BauhausButton>
          </div>
        </BauhausCard>

        {/* Google Calendar */}
        <BauhausCard padding="lg" accentColor="blue" hasCornerAccent accentPosition="bottom-right">
          <h2 className="font-bugrino text-lg uppercase tracking-wider mb-2">Google Calendar</h2>
          <p className="text-sm text-gray-500 mb-6">
            Foglalások automatikus szinkronizálása a Google Naptárba. Visszaigazolt foglalások eseményként jelennek meg.
          </p>

          {gcalLoading ? (
            <div className="animate-pulse h-12 bg-gray-100 border-[3px] border-gray-200" />
          ) : gcalConnected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="font-bugrino text-sm uppercase tracking-wider text-green-700">
                  Csatlakoztatva
                </span>
              </div>
              <BauhausButton onClick={disconnectGcal} variant="danger">
                Leválasztás
              </BauhausButton>
            </div>
          ) : (
            <BauhausButton onClick={connectGcal} variant="primary">
              Google Calendar csatlakoztatása
            </BauhausButton>
          )}
        </BauhausCard>
      </div>
    </div>
  )
}
