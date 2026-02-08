import { Resend } from 'resend'
import { BookingConfirmationEmail } from './templates/booking-confirmation'
import { BookingReminderEmail } from './templates/booking-reminder'
import { PaymentReceivedEmail } from './templates/payment-received'
import { CancellationConfirmationEmail } from './templates/cancellation-confirmation'

// Lazy-load Resend client to avoid build errors when API key is missing
let resendClient: Resend | null = null

function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }
    resendClient = new Resend(apiKey)
  }
  return resendClient
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'StudyU <noreply@studyu.hu>'

interface BookingEmailData {
  to: string
  customerName: string
  bookingDate: string
  timeSlot: string
  totalPrice: number
  extras?: Array<{ name: string; price: number }>
}

interface ReminderEmailData {
  to: string
  customerName: string
  bookingDate: string
  timeSlot: string
  studioAddress: string
}

interface PaymentEmailData {
  to: string
  customerName: string
  bookingDate: string
  timeSlot: string
  totalPrice: number
  invoiceUrl?: string
}

interface CancellationEmailData {
  to: string
  customerName: string
  bookingDate: string
  timeSlot: string
  cancellationFee: number
  refundAmount: number
  reason?: string
}

export async function sendBookingConfirmation(data: BookingEmailData) {
  try {
    const resend = getResend()
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: 'Foglalása visszaigazolva - StudyU',
      react: BookingConfirmationEmail({
        customerName: data.customerName,
        bookingDate: data.bookingDate,
        timeSlot: data.timeSlot,
        totalPrice: data.totalPrice,
        extras: data.extras,
      }),
    })
    return { success: true, data: result }
  } catch (error) {
    console.error('Failed to send booking confirmation:', error)
    return { success: false, error }
  }
}

export async function sendBookingReminder(data: ReminderEmailData) {
  try {
    const resend = getResend()
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: 'Emlékeztető: holnapi foglalás - StudyU',
      react: BookingReminderEmail({
        customerName: data.customerName,
        bookingDate: data.bookingDate,
        timeSlot: data.timeSlot,
        studioAddress: data.studioAddress,
      }),
    })
    return { success: true, data: result }
  } catch (error) {
    console.error('Failed to send booking reminder:', error)
    return { success: false, error }
  }
}

export async function sendPaymentReceived(data: PaymentEmailData) {
  try {
    const resend = getResend()
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: 'Fizetés megérkezett - StudyU',
      react: PaymentReceivedEmail({
        customerName: data.customerName,
        bookingDate: data.bookingDate,
        timeSlot: data.timeSlot,
        totalPrice: data.totalPrice,
        invoiceUrl: data.invoiceUrl,
      }),
    })
    return { success: true, data: result }
  } catch (error) {
    console.error('Failed to send payment received:', error)
    return { success: false, error }
  }
}

export async function sendCancellationConfirmation(data: CancellationEmailData) {
  try {
    const resend = getResend()
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: 'Foglalás lemondva - StudyU',
      react: CancellationConfirmationEmail({
        customerName: data.customerName,
        bookingDate: data.bookingDate,
        timeSlot: data.timeSlot,
        cancellationFee: data.cancellationFee,
        refundAmount: data.refundAmount,
        reason: data.reason,
      }),
    })
    return { success: true, data: result }
  } catch (error) {
    console.error('Failed to send cancellation confirmation:', error)
    return { success: false, error }
  }
}

// Admin notification
export async function sendAdminNotification(subject: string, text: string) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    console.warn('ADMIN_EMAIL not configured')
    return { success: false, error: 'ADMIN_EMAIL not configured' }
  }

  try {
    const resend = getResend()
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `[StudyU Admin] ${subject}`,
      text,
    })
    return { success: true, data: result }
  } catch (error) {
    console.error('Failed to send admin notification:', error)
    return { success: false, error }
  }
}
