import { expect, test } from '@playwright/test'

/*
 * Notifications end to end: a candidate sends a Quick Apply on the careers site and the HR bell shows it
 * (the bell entry is written straight away, with no queue worker needed). Then "Mark all as read" clears it.
 */
const careersUrl = process.env.E2E_CAREERS_URL ?? 'http://localhost:5173'
const admin = { email: process.env.E2E_ADMIN_EMAIL ?? 'admin@infolksgroup.com', password: process.env.E2E_ADMIN_PASSWORD ?? 'InfolksGroup#2026' }
const unreadIn = async (bell) => Number(((await bell.getAttribute('aria-label')) ?? '').match(/(\d+) unread/)?.[1] ?? 0)

test('a new application reaches the HR bell, and Mark all as read clears it', async ({ page, browser }) => {
  await page.goto('/login')
  await page.locator('#email').fill(admin.email)
  await page.locator('#password').fill(admin.password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Career Overview' })).toBeVisible()
  const bell = page.getByRole('button', { name: /^Notifications/ })

  // Start from zero so the new one is easy to spot.
  if (await unreadIn(bell)) {
    await bell.click()
    await page.getByRole('button', { name: 'Mark all as read' }).click()
    await page.keyboard.press('Escape')
    await expect(bell).toHaveAttribute('aria-label', 'Notifications')
  }

  // A candidate sends a Quick Apply on the careers site.
  const candidate = await browser.newPage()
  await candidate.goto(`${careersUrl}/#quick-apply`)
  const form = candidate.locator('#quick-apply')
  const stamp = Date.now().toString(36)
  await form.getByLabel('Full name').fill(`Bell Test ${stamp}`)
  await form.getByLabel('Date of birth').fill('1998-05-12')
  await form.getByLabel('Email ID').fill(`bell-${stamp}@example.com`)
  await form.locator('#phone').fill('98470 12345')
  await form.locator('#gender').click()
  await candidate.getByRole('option', { name: 'Female', exact: true }).click()
  await form.getByLabel('Highest qualification').fill('B.Tech')
  await form.getByLabel('Location').fill('Kochi')
  await form.locator('#department_id').click()
  await candidate.getByRole('option').first().click()
  await form.locator('input[type=file]').first().setInputFiles({ name: 'resume.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n') })
  await form.locator('#quick-apply-privacy, input[name=privacy_consent]').first().check()
  await form.getByRole('button', { name: 'Submit application' }).click()
  await expect(candidate.getByRole('heading', { name: /Thank you/ })).toBeVisible()
  await candidate.close()

  // The bell picks it up when the portal checks again (on focus, reload or the 30-second poll).
  await page.reload()
  await expect.poll(() => unreadIn(bell), { timeout: 20_000 }).toBeGreaterThan(0)
  await bell.click()
  await expect(page.getByRole('dialog').or(page.locator('[id^="headlessui-popover-panel"]')).first()).toContainText(/application/i)
  await page.getByRole('button', { name: 'Mark all as read' }).click()
  await expect(page.getByText('All notifications marked as read')).toBeVisible()
  await expect(bell).toHaveAttribute('aria-label', 'Notifications')
})
