'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { BauhausCard } from '@/components/ui/bauhaus/BauhausCard'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'
import { BauhausBadge } from '@/components/ui/bauhaus/BauhausBadge'
import { BauhausInput } from '@/components/ui/bauhaus/BauhausInput'
import { BauhausModal } from '@/components/ui/bauhaus/BauhausModal'

interface UserBooking {
  id: string
  booking_date: string
  status: string
  total_price: number
  time_slots: { name: string } | null
}

interface UserDetail {
  id: string
  full_name: string
  email: string
  phone: string | null
  company_name: string | null
  tax_number: string | null
  billing_address: { zip: string; city: string; street: string; country: string } | null
  role: string
  created_at: string | null
  updated_at: string | null
  bookings: UserBooking[]
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Form state
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [taxNumber, setTaxNumber] = useState('')
  const [billingZip, setBillingZip] = useState('')
  const [billingCity, setBillingCity] = useState('')
  const [billingStreet, setBillingStreet] = useState('')

  useEffect(() => {
    let cancelled = false

    async function fetchUser() {
      const { id } = await params
      try {
        const res = await fetch(`/api/admin/users/${id}`)
        if (!res.ok || cancelled) {
          if (!cancelled) setLoading(false)
          return
        }
        const data: UserDetail = await res.json()
        if (!cancelled) {
          setUser(data)
          setFullName(data.full_name || '')
          setPhone(data.phone || '')
          setCompanyName(data.company_name || '')
          setTaxNumber(data.tax_number || '')
          setBillingZip(data.billing_address?.zip || '')
          setBillingCity(data.billing_address?.city || '')
          setBillingStreet(data.billing_address?.street || '')
        }
      } catch {
        // Error loading
      }
      if (!cancelled) setLoading(false)
    }

    fetchUser()
    return () => { cancelled = true }
  }, [params, refreshKey])

  const reloadUser = () => setRefreshKey(k => k + 1)

  const saveProfile = async () => {
    if (!user) return
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          phone: phone || null,
          company_name: companyName || null,
          tax_number: taxNumber || null,
          billing_address: (billingZip || billingCity || billingStreet)
            ? { zip: billingZip, city: billingCity, street: billingStreet, country: 'HU' }
            : null,
        }),
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Profil mentve!' })
        reloadUser()
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Hiba történt' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Hiba történt a mentés során' })
    }
    setSaving(false)
  }

  const changeRole = async () => {
    if (!user) return
    setSaving(true)
    setMessage(null)

    const newRole = user.role === 'admin' ? 'user' : 'admin'

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (res.ok) {
        setMessage({ type: 'success', text: `Szerepkör módosítva: ${newRole === 'admin' ? 'Admin' : 'Felhasználó'}` })
        reloadUser()
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Hiba történt' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Hiba történt a szerepkör módosítása során' })
    }
    setSaving(false)
    setShowRoleModal(false)
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 w-48 bg-gray-200 mb-8" />
        <div className="h-96 bg-gray-100 border-[3px] border-gray-200" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full border-[3px] border-gray-200 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
        </div>
        <p className="font-bugrino text-sm uppercase tracking-wider text-gray-500">Felhasználó nem található</p>
        <Link href="/admin/felhasznalok" className="mt-4 inline-block font-bugrino text-sm uppercase tracking-wider text-[var(--bauhaus-blue)] hover:underline">
          Vissza a felhasználókhoz
        </Link>
      </div>
    )
  }

  const statusVariants: Record<string, 'yellow' | 'blue' | 'red' | 'outline' | 'black'> = {
    pending: 'yellow',
    confirmed: 'blue',
    paid: 'blue',
    completed: 'black',
    cancelled: 'red',
    no_show: 'red',
  }

  const statusLabels: Record<string, string> = {
    pending: 'Függőben',
    confirmed: 'Visszaigazolva',
    paid: 'Fizetve',
    completed: 'Teljesítve',
    cancelled: 'Lemondva',
    no_show: 'Nem jelent meg',
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/felhasznalok"
            className="w-10 h-10 border-[3px] border-black flex items-center justify-center hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"
            style={{ boxShadow: '2px 2px 0 var(--bauhaus-black)' }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <div>
            <h1 className="text-bauhaus-heading">{user.full_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-8 h-[3px] bg-black" />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--bauhaus-blue)' }} />
            </div>
          </div>
          <BauhausBadge variant={user.role === 'admin' ? 'red' : 'outline'}>
            {user.role === 'admin' ? 'Admin' : 'Felhasználó'}
          </BauhausBadge>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal data */}
          <BauhausCard accentColor="yellow" hasCornerAccent accentPosition="top-left">
            <h2 className="font-bugrino text-lg uppercase tracking-wider mb-4">Személyes adatok</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BauhausInput
                label="Teljes név"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                fullWidth
              />
              <BauhausInput
                label="Telefon"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                fullWidth
              />
              <div>
                <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">Email</label>
                <div className="w-full px-4 py-3 border-[3px] border-gray-300 bg-gray-50 text-gray-600 text-base">
                  {user.email}
                </div>
              </div>
              <div>
                <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">Regisztráció</label>
                <div className="w-full px-4 py-3 border-[3px] border-gray-300 bg-gray-50 text-gray-600 text-base">
                  {user.created_at ? format(new Date(user.created_at), 'yyyy.MM.dd HH:mm') : '-'}
                </div>
              </div>
            </div>
          </BauhausCard>

          {/* Company data */}
          <BauhausCard accentColor="blue" hasCornerAccent accentPosition="top-right">
            <h2 className="font-bugrino text-lg uppercase tracking-wider mb-4">Céges adatok</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BauhausInput
                label="Cégnév"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                fullWidth
              />
              <BauhausInput
                label="Adószám"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                fullWidth
              />
            </div>
            <h3 className="font-bugrino text-sm uppercase tracking-wider mt-6 mb-3">Számlázási cím</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <BauhausInput
                label="Irányítószám"
                value={billingZip}
                onChange={(e) => setBillingZip(e.target.value)}
                fullWidth
              />
              <BauhausInput
                label="Város"
                value={billingCity}
                onChange={(e) => setBillingCity(e.target.value)}
                fullWidth
              />
              <BauhausInput
                label="Utca, házszám"
                value={billingStreet}
                onChange={(e) => setBillingStreet(e.target.value)}
                fullWidth
              />
            </div>
          </BauhausCard>

          {/* Save button */}
          <div className="flex justify-end">
            <BauhausButton
              onClick={saveProfile}
              disabled={saving}
              variant="primary"
            >
              {saving ? 'Mentés...' : 'Módosítások mentése'}
            </BauhausButton>
          </div>

          {/* Bookings */}
          <BauhausCard>
            <h2 className="font-bugrino text-lg uppercase tracking-wider mb-4">Foglalások</h2>
            {user.bookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b-[3px] border-black">
                      <th className="px-4 py-3 text-left font-bugrino text-xs uppercase tracking-wider">Dátum</th>
                      <th className="px-4 py-3 text-left font-bugrino text-xs uppercase tracking-wider">Időpont</th>
                      <th className="px-4 py-3 text-left font-bugrino text-xs uppercase tracking-wider">Összeg</th>
                      <th className="px-4 py-3 text-left font-bugrino text-xs uppercase tracking-wider">Státusz</th>
                      <th className="px-4 py-3 text-right font-bugrino text-xs uppercase tracking-wider" />
                    </tr>
                  </thead>
                  <tbody>
                    {user.bookings.map((booking, index) => (
                      <tr
                        key={booking.id}
                        className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      >
                        <td className="px-4 py-3 text-sm">
                          {format(new Date(booking.booking_date), 'yyyy.MM.dd')}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {booking.time_slots?.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm font-bugrino">
                          {booking.total_price.toLocaleString('hu-HU')} Ft
                        </td>
                        <td className="px-4 py-3">
                          <BauhausBadge variant={statusVariants[booking.status] || 'outline'}>
                            {statusLabels[booking.status] || booking.status}
                          </BauhausBadge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/admin/foglalasok/${booking.id}`}
                            className="font-bugrino text-xs uppercase tracking-wider text-[var(--bauhaus-blue)] hover:underline"
                          >
                            Részletek
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-6">Nincs foglalás</p>
            )}
          </BauhausCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Role management */}
          <BauhausCard accentColor="red" hasCornerAccent accentPosition="top-right">
            <h2 className="font-bugrino text-lg uppercase tracking-wider mb-4">Szerepkör</h2>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Jelenlegi szerepkör:{' '}
                <span className="font-bugrino font-medium">
                  {user.role === 'admin' ? 'Admin' : 'Felhasználó'}
                </span>
              </p>
              <BauhausButton
                onClick={() => setShowRoleModal(true)}
                variant={user.role === 'admin' ? 'default' : 'accent'}
                className="w-full"
              >
                {user.role === 'admin' ? 'Visszaminősítés felhasználóvá' : 'Előléptetés adminná'}
              </BauhausButton>
            </div>
          </BauhausCard>
        </div>
      </div>

      {/* Role change confirmation modal */}
      <BauhausModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title="Szerepkör módosítása"
        accentColor="red"
      >
        <p className="text-sm mb-6">
          Biztosan módosítja <strong>{user.full_name}</strong> szerepkörét{' '}
          <strong>{user.role === 'admin' ? 'adminról felhasználóra' : 'felhasználóról adminra'}</strong>?
        </p>
        <div className="flex gap-3 justify-end">
          <BauhausButton
            onClick={() => setShowRoleModal(false)}
            variant="default"
            size="sm"
          >
            Mégse
          </BauhausButton>
          <BauhausButton
            onClick={changeRole}
            disabled={saving}
            variant="danger"
            size="sm"
          >
            {saving ? 'Mentés...' : 'Módosítás'}
          </BauhausButton>
        </div>
      </BauhausModal>
    </div>
  )
}
