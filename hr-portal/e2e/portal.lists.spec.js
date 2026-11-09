import { expect, test } from '@playwright/test'
import { unique } from './helpers'

const admin = { email: process.env.E2E_ADMIN_EMAIL ?? 'admin@infolksgroup.com', password: process.env.E2E_ADMIN_PASSWORD ?? 'InfolksGroup#2026' }

test('Admin adds a department under a company, and the job form offers it only for that company', async ({ page }) => {
  await page.goto('/login')
  await page.locator('#email').fill(admin.email)
  await page.locator('#password').fill(admin.password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Career Overview' })).toBeVisible()

  await page.goto('/settings?tab=lists')
  await page.getByRole('button', { name: 'Add department' }).click()
  const name = `Clinical Ops ${unique()}`
  await page.locator('#list-name-departments').fill(name)
  await page.locator('#department-company').click()
  await page.getByRole('option', { name: 'Medrays', exact: true }).click()
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(page.getByText(`${name} added`)).toBeVisible()
  await expect(page.locator('li').filter({ hasText: name }).getByText('Medrays')).toBeVisible()

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
