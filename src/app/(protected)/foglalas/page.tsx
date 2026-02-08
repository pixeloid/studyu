'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format, addDays } from 'date-fns'
import { hu } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { Calendar, TimeSlotSelector, ExtrasSelector, BookingSummary } from '@/components/booking'
import { BauhausCard } from '@/components/ui/bauhaus/BauhausCard'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'
import type { TimeSlot, Extra, OpeningHours, SpecialDate, Booking } from '@/types/database'

interface SelectedExtra {
  extra: Extra
  quantity: number
}

type BookingStep = 'date' | 'slot' | 'extras' | 'confirm'

const steps = [
  { key: 'date', label: 'Dátum' },
  { key: 'slot', label: 'Időpont' },
  { key: 'extras', label: 'Extrák' },
  { key: 'confirm', label: 'Véglegesítés' },
]

export default function BookingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<BookingStep>('date')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Data
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [extras, setExtras] = useState<Extra[]>([])
  const [openingHours, setOpeningHours] = useState<OpeningHours[]>([])
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([])
  const [existingBookings, setExistingBookings] = useState<Booking[]>([])

  // Selection state
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([])
  const [userNotes, setUserNotes] = useState('')

  // Settings
  const minDaysAhead = 1
  const maxDaysAhead = 90

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [slotsRes, extrasRes, hoursRes, specialRes, bookingsRes] = await Promise.all([
        supabase.from('time_slots').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('extras').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('opening_hours').select('*'),
        supabase.from('special_dates').select('*'),
        supabase.from('bookings')
          .select('*')
          .gte('booking_date', format(new Date(), 'yyyy-MM-dd'))
          .not('status', 'in', '("cancelled","no_show")'),
      ])

      if (slotsRes.data) setTimeSlots(slotsRes.data)
      if (extrasRes.data) setExtras(extrasRes.data)
      if (hoursRes.data) setOpeningHours(hoursRes.data)
      if (specialRes.data) setSpecialDates(specialRes.data)
      if (bookingsRes.data) setExistingBookings(bookingsRes.data)
    } catch (err) {
      console.error('Error loading booking data:', err)
      setError('Hiba történt az adatok betöltése közben')
    } finally {
      setLoading(false)
    }
  }

  const getAvailabilityData = () => {
    const data: Record<string, { isOpen: boolean; isHoliday: boolean; holidayName?: string }> = {}
    specialDates.forEach(sd => {
      data[sd.date] = {
        isOpen: sd.type !== 'holiday' && sd.type !== 'closed',
        isHoliday: sd.type === 'holiday',
        holidayName: sd.name || undefined,
      }
    })
    return data
  }

  const getAvailableSlotsForDate = (date: Date): TimeSlot[] => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayOfWeek = date.getDay()
    const hours = openingHours.find(oh => oh.day_of_week === dayOfWeek)
    if (!hours || hours.is_closed) return []
    const special = specialDates.find(sd => sd.date === dateStr)
    if (special && (special.type === 'holiday' || special.type === 'closed')) return []
    const bookedSlotIds = existingBookings
      .filter(b => b.booking_date === dateStr)
      .map(b => b.time_slot_id)
    return timeSlots.filter(slot => !bookedSlotIds.includes(slot.id))
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSelectedSlot(null)
    setStep('slot')
  }

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    setSelectedExtras([])
    setStep('extras')
  }

  const handleSubmit = async () => {
    if (!selectedDate || !selectedSlot) return
    setSubmitting(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login?next=/foglalas')
        return
      }

      const basePrice = selectedSlot.base_price
      const extrasPrice = selectedExtras.reduce((sum, e) => sum + e.extra.price * e.quantity, 0)
      const totalPrice = basePrice + extrasPrice

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          booking_date: format(selectedDate, 'yyyy-MM-dd'),
          time_slot_id: selectedSlot.id,
          base_price: basePrice,
          extras_price: extrasPrice,
          total_price: totalPrice,
          user_notes: userNotes || null,
          status: 'pending',
        })
        .select()
        .single()

      if (bookingError) throw bookingError

      if (selectedExtras.length > 0 && booking) {
        const extrasToInsert = selectedExtras.map(e => ({
          booking_id: booking.id,
          extra_id: e.extra.id,
          quantity: e.quantity,
          unit_price: e.extra.price,
          total_price: e.extra.price * e.quantity,
        }))

        const { error: extrasError } = await supabase.from('booking_extras').insert(extrasToInsert)
        if (extrasError) throw extrasError
      }

      router.push(`/dashboard/foglalasaim/${booking.id}?success=true`)
    } catch (err) {
      console.error('Error creating booking:', err)
      setError('Hiba történt a foglalás létrehozása közben. Kérjük, próbálja újra.')
    } finally {
      setSubmitting(false)
    }
  }

  const getStepIndex = (s: BookingStep): number => {
    const stepKeys: BookingStep[] = ['date', 'slot', 'extras', 'confirm']
    return stepKeys.indexOf(s)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-10 w-48 bg-gray-200 mb-8" />
          <div className="h-96 bg-gray-100 border-[3px] border-gray-200" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-bauhaus-heading mb-2">Új foglalás</h1>
        <div className="flex items-center gap-2">
          <div className="w-8 h-[3px] bg-black" />
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--bauhaus-blue)' }} />
        </div>
      </div>

      {error && (
        <div
          className="mb-6 p-4 border-[3px] border-[var(--bauhaus-red)] bg-red-50"
          style={{ boxShadow: '4px 4px 0 var(--bauhaus-red)' }}
        >
          <p className="text-sm text-[var(--bauhaus-red)] font-medium">{error}</p>
        </div>
      )}

      {/* Progress steps - Bauhaus style */}
      <div className="mb-10">
        <div className="flex items-center">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-12 h-12 rounded-full border-[3px] flex items-center justify-center font-bugrino text-lg
                    ${getStepIndex(step) >= i
                      ? 'border-black bg-[var(--bauhaus-blue)] text-white'
                      : 'border-gray-300 bg-white text-gray-400'
                    }
                  `}
                  style={getStepIndex(step) >= i ? { boxShadow: '3px 3px 0 var(--bauhaus-black)' } : undefined}
                >
                  {i + 1}
                </div>
                <span className={`mt-2 text-xs font-bugrino uppercase tracking-wider ${getStepIndex(step) >= i ? 'text-black' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-[3px] mx-2 ${getStepIndex(step) > i ? 'bg-black' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {step === 'date' && (
            <BauhausCard padding="lg">
              <h2 className="font-bugrino text-xl uppercase tracking-wider mb-6">
                Válasszon dátumot
              </h2>
              <Calendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                availabilityData={getAvailabilityData()}
                minDate={addDays(new Date(), minDaysAhead)}
                maxDate={addDays(new Date(), maxDaysAhead)}
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
              />
            </BauhausCard>
          )}

          {step === 'slot' && selectedDate && (
            <BauhausCard padding="lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-bugrino text-xl uppercase tracking-wider">
                    Válasszon időpontot
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {format(selectedDate, 'yyyy. MMMM d., EEEE', { locale: hu })}
                  </p>
                </div>
                <button
                  onClick={() => setStep('date')}
                  className="font-bugrino text-sm uppercase tracking-wider text-[var(--bauhaus-blue)] hover:underline"
                >
                  Vissza
                </button>
              </div>
              <TimeSlotSelector
                slots={getAvailableSlotsForDate(selectedDate)}
                selectedSlot={selectedSlot}
                onSlotSelect={handleSlotSelect}
              />
            </BauhausCard>
          )}

          {step === 'extras' && selectedDate && selectedSlot && (
            <div className="space-y-6">
              <BauhausCard padding="lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bugrino text-xl uppercase tracking-wider">
                    Kiegészítők
                  </h2>
                  <button
                    onClick={() => setStep('slot')}
                    className="font-bugrino text-sm uppercase tracking-wider text-[var(--bauhaus-blue)] hover:underline"
                  >
                    Vissza
                  </button>
                </div>
                <ExtrasSelector
                  extras={extras}
                  selectedExtras={selectedExtras}
                  onExtrasChange={setSelectedExtras}
                  durationHours={selectedSlot.duration_hours}
                />
              </BauhausCard>

              <BauhausButton variant="primary" fullWidth onClick={() => setStep('confirm')}>
                Tovább a véglegesítéshez
              </BauhausButton>
            </div>
          )}

          {step === 'confirm' && selectedDate && selectedSlot && (
            <div className="space-y-6">
              <BauhausCard padding="lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bugrino text-xl uppercase tracking-wider">
                    Véglegesítés
                  </h2>
                  <button
                    onClick={() => setStep('extras')}
                    className="font-bugrino text-sm uppercase tracking-wider text-[var(--bauhaus-blue)] hover:underline"
                  >
                    Vissza
                  </button>
                </div>

                <div className="mb-6">
                  <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">
                    Megjegyzés (opcionális)
                  </label>
                  <textarea
                    value={userNotes}
                    onChange={e => setUserNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
                    placeholder="Írja le, ha van speciális kérése..."
                  />
                </div>

                <div
                  className="p-4 border-[3px] border-[var(--bauhaus-yellow)]"
                  style={{ backgroundColor: 'rgba(245, 166, 35, 0.1)' }}
                >
                  <p className="font-bugrino text-sm uppercase tracking-wider mb-2">Fontos tudnivalók</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• A foglalás visszaigazolást igényel</li>
                    <li>• A díjbekérőt email-ben küldjük</li>
                    <li>• Lemondási feltételeinket az ÁSZF-ben találja</li>
                  </ul>
                </div>
              </BauhausCard>

              <BauhausButton
                variant="accent"
                fullWidth
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Foglalás küldése...' : 'Foglalás véglegesítése'}
              </BauhausButton>
            </div>
          )}
        </div>

        {/* Sidebar - Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <BookingSummary
              date={selectedDate}
              slot={selectedSlot}
              extras={selectedExtras}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
