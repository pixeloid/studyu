import { chromium } from 'playwright'

const TEST_USER_EMAIL = 'test@studyu.hu'
const TEST_USER_PASSWORD = 'Test1234!'
const BOOKING_ID = '56cee268-2e20-4e6a-ba7a-2a5c939929fe'

async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 800 })
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()

  try {
    // Step 1: Login
    console.log('1. Bejelentkezés...')
    await page.goto('http://localhost:3000/auth/login')
    await page.waitForSelector('input[type="email"]', { timeout: 10000 })
    await page.fill('input[type="email"]', TEST_USER_EMAIL)
    await page.fill('input[type="password"]', TEST_USER_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard**', { timeout: 15000 })
    console.log('   OK - Bejelentkezve')
    await page.waitForTimeout(1500)

    // Step 2: Navigate to booking detail
    console.log('2. Foglalás megtekintése...')
    await page.goto(`http://localhost:3000/dashboard/foglalasaim/${BOOKING_ID}`)
    await page.waitForSelector('text=Foglalás részletei', { timeout: 10000 })
    console.log('   OK - Foglalás oldal betöltve')
    await page.waitForTimeout(2000)

    // Step 3: Click payment button
    console.log('3. Fizetés gomb kattintás...')
    const paymentButton = page.locator('text=Fizetés bankkártyával').first()
    await paymentButton.waitFor({ timeout: 10000 })
    await paymentButton.click()
    console.log('   OK - Átirányítás Stripe-ra...')

    // Step 4: Stripe Checkout
    console.log('4. Stripe Checkout oldal...')
    await page.waitForURL('**/checkout.stripe.com/**', { timeout: 30000 })
    await page.waitForTimeout(3000) // Let Stripe fully load
    console.log('   OK - Stripe Checkout betöltve')

    // Step 5: Fill card details
    console.log('5. Kártya adatok kitöltése...')
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

    // Step 6: Pay
    console.log('6. Fizetés...')
    const payButton = page.locator('.SubmitButton, button:has-text("Fizetés")').first()
    await payButton.click()
    console.log('   OK - Fizetés elküldve, várakozás...')

    // Step 7: Success page
    console.log('7. Várakozás a siker oldalra...')
    await page.waitForURL('**/fizetes/siker**', { timeout: 60000 })
    console.log('   OK - SIKERES FIZETÉS!')

    // Stay on page so user can see it
    await page.waitForTimeout(10000)

    console.log('\n========================================')
    console.log('  STRIPE FIZETÉS TESZT SIKERES!')
    console.log('========================================')

  } catch (error) {
    console.error('HIBA:', error)
    await page.screenshot({ path: '/tmp/stripe-visual-error.png' })
  } finally {
    await browser.close()
  }
}

run()
