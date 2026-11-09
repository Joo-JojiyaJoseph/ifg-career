import { expect, test } from '@playwright/test'
import { unique } from './helpers'

const admin = { email: process.env.E2E_ADMIN_EMAIL ?? 'admin@infolksgroup.com', password: process.env.E2E_ADMIN_PASSWORD ?? 'InfolksGroup#2026' }

test('Admin adds a company in Settings with a photo, then deletes it', async ({ page }) => {
  await page.goto('/login')
  await page.locator('#email').fill(admin.email)
  await page.locator('#password').fill(admin.password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Career Overview' })).toBeVisible()

  // Companies are added and edited in Settings; Website Content only chooses which ones are shown.
  await page.goto('/content?tab=entities')
  await expect(page.getByRole('heading', { name: 'Companies on the careers page' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Add or edit companies in Settings/ })).toBeVisible()
  await page.getByRole('link', { name: /Add or edit companies in Settings/ }).click()
  await expect(page).toHaveURL(/\/settings\?tab=companies/)
  await page.getByRole('button', { name: 'Add company' }).click()
  await expect(page.getByRole('heading', { name: 'Add a company' })).toBeVisible()

  const name = `Brightlane ${unique()}`
  await page.locator('#entity-name').fill(name)
  await page.locator('#entity-motto').fill('Customer Experience Company')
  await page.locator('#entity-photo').setInputFiles({
    name: 'team.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'),
  })
  await page.getByRole('dialog').getByRole('button', { name: 'Add company' }).click()
  await expect(page.getByText(`${name} added`)).toBeVisible()
  await expect(page.getByRole('button', { name: `Delete ${name}` })).toBeVisible()

  await page.getByRole('button', { name: `Delete ${name}` }).click()
  await page.getByRole('button', { name: 'Delete company' }).click()
  await expect(page.getByText(`${name} deleted`)).toBeVisible()
})
