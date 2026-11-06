import { expect, test } from '@playwright/test'
import { signInHr } from './helpers'

test.describe('HR interview flow', () => {
  test.beforeEach(async ({ page }) => {
    await signInHr(page)
  })

  test('dashboard shows the reference widgets', async ({ page }) => {
    for (const title of ['Hiring Pipeline', 'Applications Over Time', 'Upcoming Interviews', 'Top Hiring Sources', 'Recent Candidates']) {
      await expect(page.getByRole('heading', { name: title })).toBeVisible()
    }
    await expect(page.getByText('Active openings')).toBeVisible()
  })

  test('shortlists an application, schedules a round, passes it and marks the candidate Selected', async ({ page }) => {
    // Shortlist the first job application that is under review (seed data has some).
    await page.goto('/applications?status=under_review&type=job')
    const row = page.locator('tbody tr').first()
    await row.locator('[id^="status-"]').click()
    await page.getByRole('option', { name: 'Shortlisted' }).click()
    await expect(page.getByText('Status updated')).toBeVisible()

    await page.goto('/applications?status=shortlisted&type=job')
    await page.locator('tbody tr').getByRole('button', { name: 'Schedule', exact: true }).first().click()

    const panel = page.getByRole('dialog')
    await panel.getByLabel('Round name').fill('Technical round')
    const date = new Date(Date.now() + 3 * 86_400_000)
    await panel.getByLabel('Date').fill(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`)
    await panel.getByLabel('Time').fill('11:00')
    await panel.getByLabel('Meeting link').fill('https://meet.example.com/e2e')
    await panel.locator('#interviewer_name').fill('E2E Interviewer')
    await panel.getByRole('button', { name: 'Schedule' }).click()
    await expect(page.getByText(/Interview scheduled/)).toBeVisible()

    await page.goto('/interviews?view=rounds&interviewer=E2E%20Interviewer&when=upcoming')
    await page.getByRole('button', { name: /\d{2}-\d{2}-\d{4}/ }).first().click()
    await page.getByRole('dialog').getByRole('button', { name: 'Mark passed' }).click()
    await expect(page.getByText(/Round marked Passed/)).toBeVisible()

    await page.goto('/interviews?stage=awaiting_decision')
    await page.getByRole('button', { name: 'Mark selected' }).first().click()
    await page.getByRole('dialog').getByRole('button', { name: 'Mark selected' }).click()
    await expect(page.getByText(/marked Selected/)).toBeVisible()
  })

  test('global search finds candidates', async ({ page }) => {
    await page.keyboard.press('Control+k')
    await page.getByRole('combobox', { name: 'Search' }).fill('an')
    await expect(page.getByRole('option').first()).toBeVisible()
  })
})
