import { expect } from '@playwright/test'

export const HR = { email: process.env.E2E_HR_EMAIL ?? 'hr@infolksgroup.com', password: process.env.E2E_HR_PASSWORD ?? 'InfolksGroup#2026' }

/** Pick an option in a Headless UI Listbox identified by its field label. */
export async function choose(page, label, option) {
  await page.getByLabel(label, { exact: true }).click()
  await page.getByRole('option', { name: option }).first().click()
}

/** Sign in to the HR portal with the seeded HR account (no two-step verification). */
export async function signInHr(page) {
  await page.goto('/login')
  await page.locator('#email').fill(HR.email)
  await page.locator('#password').fill(HR.password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Career Overview' })).toBeVisible()
}

/** A unique suffix so repeated runs never collide. */
export const unique = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`

/** Fails when the page scrolls sideways. */
export async function expectNoHorizontalScroll(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
}
