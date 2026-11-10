import { expect, test } from '@playwright/test'
import { unique } from './helpers'

const admin = { email: process.env.E2E_ADMIN_EMAIL ?? 'admin@infolksgroup.com', password: process.env.E2E_ADMIN_PASSWORD ?? 'InfolksGroup#2026' }

test('Admin adds a department and a team under a company, and the job form offers it only for that company', async ({ page }) => {
  await page.goto('/login')
  await page.locator('#email').fill(admin.email)
  await page.locator('#password').fill(admin.password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Career Overview' })).toBeVisible()

  // Pick the company, type a department name, press Enter; then add a team inside it the same way.
  await page.goto('/settings?tab=lists')
  await page.getByRole('radio', { name: /Medrays/ }).click()
  const name = `Clinical Ops ${unique()}`
  await page.getByLabel('New department').fill(name)
  await page.getByLabel('New department').press('Enter')
  await expect(page.getByText(`${name} added`)).toBeVisible()
  const card = page.locator('li').filter({ has: page.getByText(name, { exact: true }) })
  await card.getByLabel(`New team in ${name}`).fill('Night shift')
  await card.getByLabel(`New team in ${name}`).press('Enter')
  await expect(card.getByText('Night shift')).toBeVisible()

  // Other companies do not list it.
  await page.getByRole('radio', { name: /Webfolks/ }).click()
  await expect(page.getByText(name, { exact: true })).toHaveCount(0)

  await page.goto('/jobs/new')
  await expect(page.getByRole('heading', { name: 'New role' })).toBeVisible()
  await page.locator('#entity').click()
  await page.getByRole('option', { name: 'Webfolks', exact: true }).click()
  await page.locator('#department_id').click()
  await expect(page.getByRole('option', { name })).toHaveCount(0)
  await page.keyboard.press('Escape')

  await page.locator('#entity').click()
  await page.getByRole('option', { name: 'Medrays', exact: true }).click()
  await page.locator('#department_id').click()
  await expect(page.getByRole('option', { name })).toBeVisible()
})
