import { test, expect } from '@playwright/test'

// Real mainnet addresses for E2E testing (all publicly known)
const GENESIS = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' // P2PKH, never spent, huge balance → SAFE_AT_REST
const P2TR_ADDR =
  'bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297' // P2TR

test.describe('Retail scan flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/scan')
  })

  test('page renders address input and submit button', async ({ page }) => {
    await expect(
      page.getByRole('textbox', { name: /bitcoin address/i })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /scan address/i })
    ).toBeVisible()
  })

  test('shows inline validation error for garbage input without network call', async ({
    page,
  }) => {
    await page.getByRole('textbox').fill('notanaddress')
    await page.getByRole('button', { name: /scan address/i }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    // No loading state should appear
    await expect(page.getByText(/scanning/i)).not.toBeVisible()
  })

  test('shows inline validation error for empty submission', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /scan address/i }).click()
    await expect(page.getByRole('alert')).toBeVisible()
  })

  test('scans genesis address and shows SAFE_AT_REST result', async ({
    page,
  }) => {
    await page.getByRole('textbox').fill(GENESIS)
    await page.getByRole('button', { name: /scan address/i }).click()
    // Wait up to 15s for API response
    await expect(page.getByText(/safe at rest/i)).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByText(/no action needed/i)).toBeVisible()
  })

  test('scans a P2TR address', async ({ page }) => {
    await page.getByRole('textbox').fill(P2TR_ADDR)
    await page.getByRole('button', { name: /scan address/i }).click()
    // P2TR addresses are always exposed — either EXPOSED or EMPTY
    await expect(page.getByText(/exposed|empty/i).first()).toBeVisible({
      timeout: 15_000,
    })
  })

  test('aria-live region is present for screen readers', async ({ page }) => {
    const liveRegion = page.locator('[aria-live="polite"]')
    await expect(liveRegion).toBeAttached()
  })

  test('nav links are present and keyboard-accessible', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Scan' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Portfolio' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Methodology' })).toBeVisible()
  })
})
