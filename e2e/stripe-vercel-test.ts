import { chromium } from 'playwright'

const BASE_URL = 'https://studyu-pixeloids-projects.vercel.app'
const TEST_USER_EMAIL = 'test@studyu.hu'
const TEST_USER_PASSWORD = 'Test1234!'
const BOOKING_ID = '56cee268-2e20-4e6a-ba7a-2a5c939929fe'

async function run() {
  const userDataDir = '/tmp/playwright-vercel-profile'
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    slowMo: 800,
    viewport: { width: 1280, height: 900 },
  })
  const page = context.pages()[0] || await context.newPage()

  // Capture API responses
  page.on('response', async (response) => {
    if (response.url().includes('/api/payments/create-checkout')) {
      const body = await response.text().catch(() => 'could not read')
      console.log(`   [API] ${response.status()} ${response.url()}`)
      console.log(`   [API] Response: ${body}`)
    }
  })

  try {
    // Step 1: Login
    console.log('1. Bejelentkezés...')
    await page.goto(`${BASE_URL}/auth/login`, { timeout: 30000 })

    const url = page.url()
    if (url.includes('vercel.com') || url.includes('sso')) {
      console.log('   Vercel SSO szükséges — várakozás (60s)...')
      await page.waitForURL(`${BASE_URL}/**`, { timeout: 60000 })
    }

    if (!page.url().includes('/dashboard')) {
      await page.waitForSelector('input[type="email"]', { timeout: 15000 })
      await page.fill('input[type="email"]', TEST_USER_EMAIL)
      await page.fill('input[type="password"]', TEST_USER_PASSWORD)
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard**', { timeout: 15000 })
    }
    console.log('   OK')
    await page.waitForTimeout(1500)

    // Step 2: Booking detail
    console.log('2. Foglalás megnyitása...')
    await page.goto(`${BASE_URL}/dashboard/foglalasaim/${BOOKING_ID}`)
    await page.waitForSelector('text=Foglalás részletei', { timeout: 15000 })
    console.log('   OK')
    await page.waitForTimeout(2000)

    // Step 3: Click payment button and monitor what happens
    console.log('3. Fizetés gomb kattintás...')
    const paymentButton = page.locator('button:has-text("Fizetés bankkártyával")').first()
    const paymentLink = page.locator('a:has-text("Fizetés bankkártyával")').first()

    if (await paymentButton.isVisible()) {
      console.log('   PaymentButton (client component) található')
      await paymentButton.click()

      // Wait for either error message or navigation to Stripe
      const result = await Promise.race([
        page.waitForURL('**/checkout.stripe.com/**', { timeout: 15000 }).then(() => 'stripe'),
        page.locator('text=Hiba').first().waitFor({ timeout: 15000 }).then(() => 'error'),
        page.locator('.text-red-600').first().waitFor({ timeout: 15000 }).then(() => 'error'),
      ]).catch(() => 'timeout')

      if (result === 'error') {
        const errorText = await page.locator('.text-red-600, p:has-text("Hiba")').first().textContent()
        console.log('   HIBA az API-ból:', errorText)
        await page.screenshot({ path: '/tmp/stripe-vercel-error.png' })
        return
      } else if (result === 'stripe') {
        console.log('   OK - Stripe Checkout betöltve!')
      } else {
        console.log('   Timeout - sem hiba, sem Stripe redirect')
        await page.screenshot({ path: '/tmp/stripe-vercel-error.png' })
        return
      }
    } else if (await paymentLink.isVisible()) {
      console.log('   Payment link (a href) található')
      await paymentLink.click()
      await page.waitForURL('**/checkout.stripe.com/**', { timeout: 30000 })
      console.log('   OK - Stripe Checkout betöltve!')
    } else {
      console.log('   HIBA: Fizetés gomb nem található!')
      await page.screenshot({ path: '/tmp/stripe-vercel-error.png' })
      return
    }

    await page.waitForTimeout(3000)

    // Step 4: Fill card
    console.log('4. Kártya adatok...')
    const cardInput = page.locator('#cardNumber')
    await cardInput.waitFor({ timeout: 15000 })
    await cardInput.fill('4242424242424242')
    await page.locator('#cardExpiry').fill('12/30')
    await page.locator('#cardCvc').fill('123')
    await page.locator('#billingName').fill('Teszt Felhasználó')
    console.log('   OK')
    await page.waitForTimeout(1500)

    // Step 5: Pay
    console.log('5. Fizetés...')
    await page.locator('.SubmitButton, button:has-text("Fizetés")').first().click()

    // Step 6: Success
    console.log('6. Várakozás...')
    await page.waitForURL('**/fizetes/siker**', { timeout: 60000 })
    console.log('   OK - SIKERES FIZETÉS!')
    await page.waitForTimeout(5000)

    console.log('\n========================================')
    console.log('  VERCEL STRIPE TESZT SIKERES!')
    console.log('========================================')
  } catch (error) {
    console.error('HIBA:', error)
    await page.screenshot({ path: '/tmp/stripe-vercel-error.png' })
  } finally {
    await context.close()
  }
}

run()
