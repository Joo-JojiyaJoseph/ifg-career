import { expect, test } from '@playwright/test'
import { signInHr } from './helpers'

test.describe('Unsaved changes', () => {
  test.beforeEach(async ({ page }) => {
    await signInHr(page)
  })

  test('asks in a dialog (not a browser alert) before leaving a page with unsaved changes', async ({ page }) => {
    let browserDialog = false
    page.on('dialog', async (dialog) => {
      browserDialog = true
      await dialog.dismiss()
    })
    await page.goto('/account/notifications')
    await page.getByRole('switch').last().click()

    await page.locator('a[href="/jobs"]').first().click()
    const title = page.getByRole('heading', { name: 'Leave this page?' })
    await expect(title).toBeVisible()
    await page.getByRole('button', { name: 'Stay on this page' }).click()
    await expect(title).toHaveCount(0)
    await expect(page).toHaveURL(/\/account\/notifications$/)

    await page.locator('a[href="/jobs"]').first().click()
    await expect(title).toBeVisible()
    await page.getByRole('button', { name: 'Leave page' }).click()
    await expect(page).toHaveURL(/\/jobs/)
    expect(browserDialog).toBe(false)
  })
})
