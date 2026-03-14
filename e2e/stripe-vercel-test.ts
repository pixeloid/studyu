import { chromium } from 'playwright'

const BASE_URL = 'https://studyu-mn2c32so5-pixeloids-projects.vercel.app'
const TEST_USER_EMAIL = 'test@studyu.hu'
const TEST_USER_PASSWORD = 'Test1234!'
const BOOKING_ID = '56cee268-2e20-4e6a-ba7a-2a5c939929fe'

async function run() {
  // Use persistent context to share browser cookies (Vercel SSO)
  const userDataDir = '/tmp/playwright-vercel-profile'
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    slowMo: 600,
    viewport: { width: 1280, height: 900 },
  })
  const page = context.pages()[0] || await context.newPage()

  try {
    // Step 1: Open Vercel URL — may need SSO auth
    console.log('1. Vercel deployment megnyitása...')
    await page.goto(`${BASE_URL}/auth/login`, { timeout: 30000 })

    // Check if we hit Vercel SSO
    const url = page.url()
    if (url.includes('vercel.com') || url.includes('sso')) {
      console.log('   Vercel SSO szükséges — kérlek jelentkezz be a böngészőben!')
      console.log('   Várakozás a bejelentkezésre (60s)...')
      await page.waitForURL(`${BASE_URL}/**`, { timeout: 60000 })
      console.log('   Vercel SSO OK!')
    }

    // Step 2: Login to app
    console.log('2. Bejelentkezés az appba...')
    if (!page.url().includes('/dashboard')) {
      await page.goto(`${BASE_URL}/auth/login`)
      await page.waitForSelector('input[type="email"]', { timeout: 15000 })
      await page.fill('input[type="email"]', TEST_USER_EMAIL)
      await page.fill('input[type="password"]', TEST_USER_PASSWORD)
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard**', { timeout: 15000 })
    }
    console.log('   OK - Bejelentkezve')
    await page.waitForTimeout(1500)

    // Step 3: Navigate to booking detail
    console.log('3. Foglalás megtekintése...')
    await page.goto(`${BASE_URL}/dashboard/foglalasaim/${BOOKING_ID}`)
    await page.waitForSelector('text=Foglalás részletei', { timeout: 15000 })
    console.log('   OK - Foglalás oldal betöltve')
    await page.waitForTimeout(2000)

    // Step 4: Click payment button
    console.log('4. Fizetés gomb kattintás...')
    const paymentButton = page.locator('text=Fizetés bankkártyával').first()
    await paymentButton.waitFor({ timeout: 10000 })
    await paymentButton.click()
    console.log('   OK - Átirányítás Stripe-ra...')

    // Step 5: Stripe Checkout
    console.log('5. Stripe Checkout oldal...')
    await page.waitForURL('**/checkout.stripe.com/**', { timeout: 30000 })
    await page.waitForTimeout(3000)
    console.log('   OK - Stripe Checkout betöltve')

    // Step 6: Fill card details
    console.log('6. Kártya adatok kitöltése...')
    const cardInput = page.locator('#cardNumber')
    await cardInput.waitFor({ timeout: 15000 })
    await cardInput.fill('4242424242424242')

    const expiryInput = page.locator('#cardExpiry')
    await expiryInput.fill('12/30')

    const cvcInput = page.locator('#cardCvc')
    await cvcInput.fill('123')

    const nameInput = page.locator('#billingName')
    await nameInput.fill('Teszt Felhasználó')
    console.log('   OK - Kártya adatok kitöltve')
    await page.waitForTimeout(1500)

    // Step 7: Pay
    console.log('7. Fizetés...')
    const payButton = page.locator('.SubmitButton, button:has-text("Fizetés")').first()
    await payButton.click()
    console.log('   OK - Fizetés elküldve, várakozás...')

    // Step 8: Success page
    console.log('8. Várakozás a siker oldalra...')
    await page.waitForURL('**/fizetes/siker**', { timeout: 60000 })
    console.log('   OK - SIKERES FIZETÉS!')

    await page.waitForTimeout(5000)

    console.log('\n========================================')
    console.log('  VERCEL STRIPE TESZT SIKERES!')
    console.log('========================================')

  } catch (error) {
    console.error('HIBA:', error)
    await page.screenshot({ path: '/tmp/stripe-vercel-error.png' })
    console.log('Screenshot: /tmp/stripe-vercel-error.png')
  } finally {
    await context.close()
  }
}

run()
