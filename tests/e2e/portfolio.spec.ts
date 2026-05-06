import { test, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import os from 'os'

function makeCsv(addresses: string[]): string {
  return `address\n${addresses.join('\n')}\n`
}

function writeTmpCsv(content: string): string {
  const tmp = path.join(os.tmpdir(), `portfolio-${Date.now()}.csv`)
  fs.writeFileSync(tmp, content)
  return tmp
}

const VALID_ADDRESSES = [
  '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
  '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
  'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
]

test.describe('Portfolio scan flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/portfolio')
  })

  test('page renders CSV dropzone', async ({ page }) => {
    await expect(page.getByRole('button', { name: /upload csv/i })).toBeVisible()
    await expect(page.getByText(/up to 1,000 bitcoin addresses/i)).toBeVisible()
  })

  test('shows preview table after uploading valid CSV', async ({ page }) => {
    const csvContent = makeCsv(VALID_ADDRESSES)
    const csvPath = writeTmpCsv(csvContent)

    const input = page.locator('input[type="file"]')
    await input.setInputFiles(csvPath)

    await expect(page.getByText(/portfolio-\d+\.csv/i)).toBeVisible({ timeout: 3_000 })
    await expect(page.getByRole('button', { name: /scan 3 addresses/i })).toBeVisible()

    fs.unlinkSync(csvPath)
  })

  test('shows duplicate badge in preview for repeated addresses', async ({ page }) => {
    const dup = VALID_ADDRESSES[0]
    const csvContent = makeCsv([dup, dup, VALID_ADDRESSES[1]])
    const csvPath = writeTmpCsv(csvContent)

    await page.locator('input[type="file"]').setInputFiles(csvPath)

    await expect(page.getByText('Duplicate')).toBeVisible({ timeout: 3_000 })

    fs.unlinkSync(csvPath)
  })

  test('blocks CSV with more than 1000 rows and shows error', async ({ page }) => {
    const addrs = Array.from({ length: 1002 }, (_, i) => `1${'A'.repeat(24)}${i.toString().padStart(9, '0')}`)
    const csvContent = makeCsv(addrs)
    const csvPath = writeTmpCsv(csvContent)

    await page.locator('input[type="file"]').setInputFiles(csvPath)

    await expect(page.getByText(/exceeded/i)).toBeVisible({ timeout: 3_000 })

    fs.unlinkSync(csvPath)
  })

  test('"Change file" resets to upload phase', async ({ page }) => {
    const csvContent = makeCsv([VALID_ADDRESSES[0]])
    const csvPath = writeTmpCsv(csvContent)

    await page.locator('input[type="file"]').setInputFiles(csvPath)
    await expect(page.getByRole('button', { name: /change file/i })).toBeVisible({ timeout: 3_000 })
    await page.getByRole('button', { name: /change file/i }).click()
    await expect(page.getByRole('button', { name: /upload csv/i })).toBeVisible()

    fs.unlinkSync(csvPath)
  })
})
