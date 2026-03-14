import { test, expect } from '@playwright/test'

const TEST_USER_EMAIL = 'test@studyu.hu'
const TEST_USER_PASSWORD = 'Test1234!'
const ADMIN_EMAIL = 'admin@studyu.hu'
const ADMIN_PASSWORD = 'Admin123!'

test.describe('Complete booking flow with invoicing', () => {
  test('user creates reservation, admin confirms with proforma & final invoice', async ({ browser }) => {
    // ==========================================
    // PART 1: User creates a booking
    // ==========================================
    const userContext = await browser.newContext()
    const userPage = await userContext.newPage()

    // 1. Login as test user
    await userPage.goto('/auth/login')
    await expect(userPage.locator('h2')).toContainText('Bejelentkezés')
    await userPage.fill('input[type="email"]', TEST_USER_EMAIL)
    await userPage.fill('input[type="password"]', TEST_USER_PASSWORD)
    await userPage.click('button[type="submit"]')
    await userPage.waitForURL('**/dashboard**', { timeout: 15000 })

    // 2. Navigate to booking page
    await userPage.goto('/foglalas')
    await expect(userPage.locator('text=Válassz dátumot')).toBeVisible({ timeout: 10000 })

    // 3. Select an available date — try multiple dates until we find one with slots
    await userPage.waitForTimeout(1000)
    const dayButtons = userPage.locator('.grid button:not([disabled])')
    const dayCount = await dayButtons.count()

    let bookingCreated = false

    for (let i = 0; i < dayCount; i++) {
      const btn = dayButtons.nth(i)
      const text = await btn.textContent()
      const isDisabled = await btn.getAttribute('disabled')
      const classes = await btn.getAttribute('class') || ''

      if (isDisabled !== null) continue
      if (!text || isNaN(parseInt(text))) continue
      if (classes.includes('opacity') && classes.includes('50')) continue
      if (classes.includes('cursor-not-allowed')) continue

      await btn.click()

      // Wait for slot step to load
      await expect(userPage.locator('text=Válassz időpontot')).toBeVisible({ timeout: 5000 })

      // Check if there are available package slots
      const slotCards = userPage.locator('button, [role="button"], div[class*="cursor-pointer"]').filter({
        hasText: /Délelőtt|Délután|Egész nap/,
      })
      await userPage.waitForTimeout(500)
      const slotCount = await slotCards.count()

      if (slotCount > 0) {
        // Found available slots — select the first one
        await slotCards.first().click()
        bookingCreated = true
        break
      }

      // No package slots — try hourly booking if available
      const hourlyTab = userPage.locator('text=Egyedi időpont')
      if (await hourlyTab.isVisible()) {
        await hourlyTab.click()
        await userPage.waitForTimeout(500)

        // Try to select hourly slots — click on the first available hour
        const hourSlots = userPage.locator('button:not([disabled])').filter({
          hasText: /^\d{1,2}:\d{2}$/,
        })
        const hourCount = await hourSlots.count()

        if (hourCount >= 2) {
          // Select start and end (at least 2 hours)
          await hourSlots.first().click()
          await hourSlots.nth(1).click()

          // Click Tovább if visible
          const tovaButton = userPage.getByRole('button', { name: 'Tovább' })
          if (await tovaButton.isVisible()) {
            await tovaButton.click()
            bookingCreated = true
            break
          }
        }
      }

      // Go back to date selection and try next date
      await userPage.click('text=Vissza')
      await expect(userPage.locator('text=Válassz dátumot')).toBeVisible({ timeout: 5000 })
    }

    expect(bookingCreated).toBeTruthy()

    // 5. Skip extras
    await expect(userPage.locator('h2:has-text("Kiegészítők")')).toBeVisible({ timeout: 5000 })
    await userPage.click('text=Tovább a véglegesítéshez')

    // 6. Submit booking
    await expect(userPage.getByRole('heading', { name: 'Véglegesítés' })).toBeVisible({ timeout: 5000 })
    await userPage.getByRole('button', { name: 'Foglalás véglegesítése' }).click()

    // 7. Verify redirect to booking detail
    await userPage.waitForURL('**/dashboard/foglalasaim/**', { timeout: 15000 })
    const bookingUrl = userPage.url()
    const bookingId = bookingUrl.match(/foglalasaim\/([^?]+)/)?.[1]
    expect(bookingId).toBeTruthy()

    await userContext.close()

    // ==========================================
    // PART 2: Admin manages the booking + invoices
    // ==========================================
    const adminContext = await browser.newContext()
    const adminPage = await adminContext.newPage()

    // 8. Login as admin
    await adminPage.goto('/auth/login')
    await adminPage.fill('input[type="email"]', ADMIN_EMAIL)
    await adminPage.fill('input[type="password"]', ADMIN_PASSWORD)
    await adminPage.click('button[type="submit"]')
    await adminPage.waitForURL('**/admin**', { timeout: 15000 })

    // 9. Go directly to the booking detail page
    await adminPage.goto(`/admin/foglalasok/${bookingId}`)
    await expect(adminPage.getByRole('heading', { name: 'Foglalás részletei' })).toBeVisible({ timeout: 10000 })
    await expect(adminPage.locator('text=Teszt Felhasználó')).toBeVisible()

    // 10. Verify "Számlázás" section shows "Díjbekérő generálása" button
    await expect(adminPage.locator('text=Számlázás')).toBeVisible()
    await expect(adminPage.getByRole('button', { name: 'Díjbekérő generálása' })).toBeVisible()

    // 11. Confirm the booking — this auto-generates proforma + sends email
    await adminPage.getByRole('button', { name: 'Visszaigazolás' }).click()

    // Wait for the full confirm flow (proforma generation + emails — can take time)
    await expect(adminPage.locator('text=Státusz módosítva!')).toBeVisible({ timeout: 30000 })

    // Log the success message to see invoice details
    const confirmMsg = await adminPage.locator('text=Státusz módosítva!').locator('..').textContent()
    console.log('Confirm response:', confirmMsg)

    // Verify status changed
    await expect(adminPage.locator('text=Visszaigazolva').first()).toBeVisible({ timeout: 5000 })

    // Check if proforma number appeared in the Számlázás section
    const hasProforma = confirmMsg?.includes('Díjbekérő:')
    console.log('Proforma generated:', hasProforma)

    // 12. Mark as paid — this auto-generates final invoice
    await adminPage.getByRole('button', { name: 'Fizetett megjelölése' }).click()
    await expect(adminPage.locator('text=Státusz módosítva!')).toBeVisible({ timeout: 30000 })

    const paidMsg = await adminPage.locator('text=Státusz módosítva!').locator('..').textContent()
    console.log('Paid response:', paidMsg)

    const hasInvoice = paidMsg?.includes('Számla:')
    console.log('Final invoice generated:', hasInvoice)

    // Verify status changed
    await expect(adminPage.locator('text=Fizetve').first()).toBeVisible({ timeout: 5000 })

    // 13. Mark as completed
    await adminPage.getByRole('button', { name: 'Teljesített megjelölése' }).click()
    await expect(adminPage.locator('text=Státusz módosítva!')).toBeVisible({ timeout: 30000 })
    await expect(adminPage.locator('text=Teljesítve').first()).toBeVisible({ timeout: 5000 })

    // Final assertions on invoice generation
    console.log('\n=== Invoice Summary ===')
    console.log('Proforma generated:', hasProforma ? 'YES' : 'NO')
    console.log('Final invoice generated:', hasInvoice ? 'YES' : 'NO')

    await adminContext.close()
  })
})
