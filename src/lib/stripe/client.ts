import Stripe from 'stripe'
import { getSetting } from '@/lib/settings'

let stripeInstance: Stripe | null = null
let lastKey: string | null = null

export async function getStripe(): Promise<Stripe> {
  const key = await getSetting<string>('stripe_secret_key', 'STRIPE_SECRET_KEY')
  if (!key) {
    throw new Error('Stripe titkos kulcs nincs beállítva (adatbázis vagy STRIPE_SECRET_KEY env)')
  }

  // Re-create instance if key changed (e.g. admin updated it)
  if (!stripeInstance || lastKey !== key) {
    stripeInstance = new Stripe(key, {
      typescript: true,
    })
    lastKey = key
  }
  return stripeInstance
}

export async function getStripeWebhookSecret(): Promise<string> {
  const secret = await getSetting<string>('stripe_webhook_secret', 'STRIPE_WEBHOOK_SECRET')
  if (!secret) {
    throw new Error('Stripe webhook secret nincs beállítva (adatbázis vagy STRIPE_WEBHOOK_SECRET env)')
  }
  return secret
}
