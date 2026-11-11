import { expect, test } from '@playwright/test'
import { signInHr, unique } from './helpers'

test('list pages keep saved views, columns, pages and bulk actions in tidy controls', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await signInHr(page)
  await page.goto('/applications')

  // Saved views live in a small panel, not under the list.
  const name = `Shortlisted ${unique()}`
  await page.getByRole('button', { name: /Saved views/ }).click()
  await page.getByLabel('Save the current filters as').fill(name)
  await page.getByRole('button', { name: 'Save filter' }).click()
  await expect(page.getByRole('button', { name, exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: `Delete ${name}` })).toBeVisible()
  await page.keyboard.press('Escape')

  // Columns can be hidden from the toolbar.
  await page.getByRole('button', { name: /Columns/ }).click()
  await page.getByRole('checkbox', { name: 'Source' }).uncheck()
  await expect(page.getByRole('columnheader', { name: /Source/ })).toHaveCount(0)
  await page.getByRole('checkbox', { name: 'Source' }).check()
  await page.keyboard.press('Escape')

  // Numbered pages with a total.
  await expect(page.getByText(/^1–25$/)).toBeVisible()
  await page.getByRole('button', { name: /^Page 2 of/ }).click()
  await expect(page.getByRole('button', { name: /^Page 2 of/ })).toHaveAttribute('aria-current', 'page')

  // Selecting rows brings up the bulk action bar; clearing hides it. (Wait for page 2 to load first: new data clears a selection.)
  await page.waitForLoadState('networkidle')
  await expect(page.getByText(/^26–/)).toBeVisible()
  await page.getByRole('checkbox', { name: 'Select row' }).first().check()
  await expect(page.getByRole('checkbox', { name: 'Select row' }).first()).toBeChecked()
  const bar = page.getByRole('region', { name: 'Bulk actions' })
  await expect(bar).toContainText('1 application selected')
  await bar.getByRole('button', { name: 'Clear selection' }).click()
  await expect(bar).toHaveCount(0)
})
