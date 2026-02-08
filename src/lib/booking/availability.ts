import { format, parseISO, isWithinInterval, addDays, isBefore, startOfDay } from 'date-fns'
import type { OpeningHours, SpecialDate, TimeSlot, InternalBlock, Booking } from '@/types/database'

export interface AvailabilityResult {
  available: boolean
  reason?: string
}

export interface DayAvailability {
  date: string
  isOpen: boolean
  isHoliday: boolean
  holidayName?: string
  availableSlots: TimeSlot[]
}

export class AvailabilityCalculator {
  constructor(
    private openingHours: OpeningHours[],
    private specialDates: SpecialDate[],
    private timeSlots: TimeSlot[],
    private internalBlocks: InternalBlock[],
    private bookings: Booking[],
    private settings: {
      minDaysAhead: number
      maxDaysAhead: number
    }
  ) {}

  getOpeningHoursForDate(date: Date): OpeningHours | null {
    const dayOfWeek = date.getDay()
    return this.openingHours.find(oh => oh.day_of_week === dayOfWeek) || null
  }

  getSpecialDateInfo(date: Date): SpecialDate | null {
    const dateStr = format(date, 'yyyy-MM-dd')
    return this.specialDates.find(sd => sd.date === dateStr) || null
  }

  isDateWithinBookingWindow(date: Date): boolean {
    const today = startOfDay(new Date())
    const minDate = addDays(today, this.settings.minDaysAhead)
    const maxDate = addDays(today, this.settings.maxDaysAhead)

    return !isBefore(date, minDate) && !isBefore(maxDate, date)
  }

  isSlotBookedOnDate(date: Date, slotId: string): boolean {
    const dateStr = format(date, 'yyyy-MM-dd')
    return this.bookings.some(
      b => b.booking_date === dateStr &&
           b.time_slot_id === slotId &&
           !['cancelled', 'no_show'].includes(b.status)
    )
  }

  isSlotBlockedByInternalBlock(date: Date, slot: TimeSlot): boolean {
    const dateStr = format(date, 'yyyy-MM-dd')
    const slotStart = new Date(`${dateStr}T${slot.start_time}`)
    const slotEnd = new Date(`${dateStr}T${slot.end_time}`)

    return this.internalBlocks.some(block => {
      const blockStart = new Date(block.start_datetime)
      const blockEnd = new Date(block.end_datetime)

      return (
        isWithinInterval(slotStart, { start: blockStart, end: blockEnd }) ||
        isWithinInterval(slotEnd, { start: blockStart, end: blockEnd }) ||
        (slotStart <= blockStart && slotEnd >= blockEnd)
      )
    })
  }

  checkSlotAvailability(date: Date, slot: TimeSlot): AvailabilityResult {
    // Check booking window
    if (!this.isDateWithinBookingWindow(date)) {
      return { available: false, reason: 'A dátum kívül esik a foglalható időszakon' }
    }

    // Check if already booked
    if (this.isSlotBookedOnDate(date, slot.id)) {
      return { available: false, reason: 'Ez az időpont már foglalt' }
    }

    // Check internal blocks
    if (this.isSlotBlockedByInternalBlock(date, slot)) {
      return { available: false, reason: 'Ez az időpont nem elérhető' }
    }

    // Check opening hours
    const openingHours = this.getOpeningHoursForDate(date)
    if (!openingHours || openingHours.is_closed) {
      return { available: false, reason: 'Ezen a napon zárva tartunk' }
    }

    // Check special dates (holidays)
    const specialDate = this.getSpecialDateInfo(date)
    if (specialDate && (specialDate.type === 'holiday' || specialDate.type === 'closed')) {
      return { available: false, reason: specialDate.name || 'Zárva' }
    }

    // Check if slot fits within opening hours
    const slotStartTime = slot.start_time
    const slotEndTime = slot.end_time
    const openTime = specialDate?.open_time || openingHours.open_time
    const closeTime = specialDate?.close_time || openingHours.close_time

    if (slotStartTime < openTime || slotEndTime > closeTime) {
      return { available: false, reason: 'Ez az időpont kívül esik a nyitvatartási időn' }
    }

    return { available: true }
  }

  getDayAvailability(date: Date): DayAvailability {
    const dateStr = format(date, 'yyyy-MM-dd')
    const specialDate = this.getSpecialDateInfo(date)
    const openingHours = this.getOpeningHoursForDate(date)

    const isHoliday = specialDate?.type === 'holiday'
    const isClosed = specialDate?.type === 'closed' || openingHours?.is_closed

    if (isHoliday || isClosed) {
      return {
        date: dateStr,
        isOpen: false,
        isHoliday: isHoliday || false,
        holidayName: specialDate?.name || undefined,
        availableSlots: [],
      }
    }

    const availableSlots = this.timeSlots
      .filter(slot => slot.is_active)
      .filter(slot => this.checkSlotAvailability(date, slot).available)

    return {
      date: dateStr,
      isOpen: availableSlots.length > 0,
      isHoliday: false,
      availableSlots,
    }
  }

  getMonthAvailability(year: number, month: number): DayAvailability[] {
    const results: DayAvailability[] = []
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    let currentDate = firstDay
    while (currentDate <= lastDay) {
      results.push(this.getDayAvailability(currentDate))
      currentDate = addDays(currentDate, 1)
    }

    return results
  }
}

export function calculateTotalPrice(
  basePrice: number,
  extras: { price: number; quantity: number }[],
  discountPercent: number = 0
): { basePrice: number; extrasPrice: number; discount: number; total: number } {
  const extrasPrice = extras.reduce((sum, e) => sum + e.price * e.quantity, 0)
  const subtotal = basePrice + extrasPrice
  const discount = Math.round(subtotal * (discountPercent / 100))
  const total = subtotal - discount

  return { basePrice, extrasPrice, discount, total }
}
