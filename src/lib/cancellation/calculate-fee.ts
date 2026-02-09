import { differenceInDays } from 'date-fns'

export interface CancellationRule {
  days_before: number
  fee_percent: number
}

export const defaultCancellationPolicy: CancellationRule[] = [
  { days_before: 7, fee_percent: 0 },
  { days_before: 3, fee_percent: 50 },
  { days_before: 2, fee_percent: 70 },
  { days_before: 1, fee_percent: 100 },
]

export function calculateCancellationFee(
  bookingDate: Date,
  totalPrice: number,
  policy: CancellationRule[]
): { fee: number; feePercent: number; daysUntil: number } {
  const daysUntil = differenceInDays(bookingDate, new Date())

  // Sort rules by days_before descending
  const sortedRules = [...policy].sort((a, b) => b.days_before - a.days_before)

  for (const rule of sortedRules) {
    if (daysUntil >= rule.days_before) {
      return {
        fee: Math.round(totalPrice * (rule.fee_percent / 100)),
        feePercent: rule.fee_percent,
        daysUntil,
      }
    }
  }

  // If less than minimum days, 100% fee
  return { fee: totalPrice, feePercent: 100, daysUntil }
}
