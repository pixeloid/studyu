import { chromium } from 'playwright'

const TEST_USER_EMAIL = 'test@studyu.hu'
const TEST_USER_PASSWORD = 'Test1234!'
const BOOKING_ID = '56cee268-2e20-4e6a-ba7a-2a5c939929fe'

async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 })
  const page = await browser.newPage()

  try {
    // Step 1: Login
    console.log('1. Bejelentkezés...')
    await page.goto('http://localhost:3000/auth/login')
    await page.waitForSelector('input[type="email"]', { timeout: 10000 })
    await page.fill('input[type="email"]', TEST_USER_EMAIL)
    await page.fill('input[type="password"]', TEST_USER_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard**', { timeout: 15000 })
    console.log('   Bejelentkezés OK')

    // Step 2: Navigate to booking detail
    console.log('2. Foglalás megtekintése...')
    await page.goto(`http://localhost:3000/dashboard/foglalasaim/${BOOKING_ID}`)
    await page.waitForSelector('text=Foglalás részletei', { timeout: 10000 })
    console.log('   Foglalás oldal betöltve')

    // Step 3: Click payment button
    console.log('3. Fizetés gomb keresése...')

    // Wait for payment button to appear
    const paymentButton = page.locator('text=Fizetés bankkártyával').first()
    await paymentButton.waitFor({ timeout: 10000 })
    console.log('   Fizetés gomb megtalálva!')

    // Take screenshot before clicking
    await page.screenshot({ path: '/tmp/stripe-test-1-before-pay.png' })

    await paymentButton.click()
    console.log('   Kattintás a fizetés gombra...')

    // Step 4: Wait for Stripe Checkout page
    console.log('4. Várakozás a Stripe Checkout oldalra...')
    await page.waitForURL('**/checkout.stripe.com/**', { timeout: 30000 })
    console.log('   Stripe Checkout oldal betöltve!')
    await page.screenshot({ path: '/tmp/stripe-test-2-stripe-checkout.png' })

    // Step 5: Fill in test card details
    console.log('5. Teszt kártya adatok kitöltése...')

    // Stripe Checkout has iframes, need to wait for the form
    await page.waitForTimeout(3000)

    // Fill card number
    const cardInput = page.locator('#cardNumber')
    await cardInput.waitFor({ timeout: 10000 })
    await cardInput.fill('4242424242424242')

    // Fill expiry
    const expiryInput = page.locator('#cardExpiry')
    await expiryInput.fill('12/30')

    // Fill CVC
    const cvcInput = page.locator('#cardCvc')
    await cvcInput.fill('123')

    // Fill cardholder name
    const nameInput = page.locator('#billingName')
    await nameInput.fill('Test User')

    await page.screenshot({ path: '/tmp/stripe-test-3-filled-card.png' })

    // Step 6: Submit payment
    console.log('6. Fizetés elküldése...')
    const submitButton = page.locator('button[type="submit"],.SubmitButton')
    await submitButton.first().click()

    // Step 7: Wait for redirect back to success page
    console.log('7. Várakozás a visszairányításra...')
    await page.waitForURL('**/fizetes/siker**', { timeout: 60000 })
    console.log('   Siker oldal betöltve!')
    await page.screenshot({ path: '/tmp/stripe-test-4-success.png' })

    console.log('\n=== TESZT SIKERES! ===')
    console.log('Screenshotok: /tmp/stripe-test-*.png')

    // Wait a bit to see the page
    await page.waitForTimeout(3000)

  } catch (error) {
    console.error('HIBA:', error)
    await page.screenshot({ path: '/tmp/stripe-test-error.png' })
  } finally {
    await browser.close()
  }
}

run()
