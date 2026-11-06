import { expect, test } from '@playwright/test'
import { choose } from './helpers'

test.describe('Job search and detail', () => {
  test('filters internships and keeps the filter in the URL', async ({ page }) => {
    await page.goto('/jobs')
    await expect(page.getByRole('heading', { name: 'Open roles' })).toBeVisible()
    await choose(page, 'Level', 'Internship')
    await expect(page).toHaveURL(/level=internship/)
    const cards = page.locator('main a[href^="/jobs/"]')
    await expect(async () => {
      const texts = await cards.allInnerTexts()
      expect(texts.length).toBeGreaterThan(0)
      for (const text of texts) expect(text).toContain('Internship')
    }).toPass()
  })

  test('shows a job with its interview steps and asks guests to sign in', async ({ page }) => {
    await page.goto('/jobs')
    await page.locator('main a[href^="/jobs/"]').first().click()
    await expect(page.getByRole('heading', { name: 'Interview process' })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in with google/i }).or(page.getByRole('link', { name: /sign in with google/i })).first()).toBeVisible()
  })
})
