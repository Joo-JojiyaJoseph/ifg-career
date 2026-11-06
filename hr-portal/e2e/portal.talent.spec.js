import { expect, test } from '@playwright/test'
import { signInHr, unique } from './helpers'

test('sends a company update to the talent community', async ({ page }) => {
  await signInHr(page)
  const subject = `E2E update ${unique()}`

  await page.goto('/talent/new?type=company_update')
  await page.getByLabel('Subject line').fill(subject)
  await page.locator('[contenteditable=true]').fill('We opened a new office in Kochi.')
  await page.getByRole('button', { name: 'Preview' }).click()
  await expect(page.frameLocator('iframe[title="Email preview"]').getByText('We opened a new office in Kochi.')).toBeVisible()

  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Send now' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Send' }).click()

  await expect(page).toHaveURL(/view=campaigns/)
  await expect(page.getByText(subject).first()).toBeVisible()
})

test('edits an FAQ in Website Content', async ({ page }) => {
  await signInHr(page)
  const question = `E2E question ${unique()}?`

  await page.goto('/content?tab=faqs')
  await page.getByRole('button', { name: 'Add question' }).click()
  const panel = page.getByRole('dialog')
  await panel.getByLabel('Question').fill(question)
  await panel.locator('[contenteditable=true]').fill('Yes, this is an end-to-end test answer.')
  await panel.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(page.getByText(question)).toBeVisible()
})
