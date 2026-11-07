import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { unique } from './helpers'

const here = path.dirname(fileURLToPath(import.meta.url))

test('sends a Quick apply application without signing in', async ({ page }) => {
  await page.goto('/#quick-apply')
  const section = page.locator('#quick-apply')
  await section.scrollIntoViewIfNeeded()

  await section.getByLabel('Full name').fill('Test Candidate')
  await section.getByLabel('Date of birth').fill('1998-05-12')
  await section.getByLabel('Email ID').fill(`e2e-${unique()}@example.com`)
  await section.locator('#phone').fill('98470 12345')
  await section.locator('#gender').click()
  await page.getByRole('option', { name: 'Female' }).click()
  await section.getByLabel('Highest qualification').fill('B.Tech')
  await section.getByLabel('Location').fill('Kochi')
  await section.locator('#department_id').click()
  await page.getByRole('option').first().click()
  await section.locator('input[type=file]').first().setInputFiles(path.join(here, 'fixtures/resume.pdf'))
  await section.getByLabel(/privacy policy/).first().check()
  await section.getByRole('button', { name: 'Submit application' }).click()

  await expect(page.getByRole('heading', { name: 'Thank you for sharing your profile with us!' })).toBeVisible()

  // A first-time candidate is signed in, and Candidate profile lists the general application.
  await expect(section.getByText('You are now signed in.')).toBeVisible()
  await section.getByRole('link', { name: 'Candidate profile' }).click()
  await expect(page).toHaveURL(/\/my-applications/)
  await expect(page.getByText('Sign in to see your applications')).toHaveCount(0)
  await expect(page.locator('main')).toContainText(/General|Quick apply/i)
})

test('explains what is missing when the form is empty', async ({ page }) => {
  await page.goto('/#quick-apply')
  const section = page.locator('#quick-apply')
  await section.getByRole('button', { name: 'Submit application' }).click()
  await expect(section.getByRole('alert').first()).toBeVisible()
  await expect(section.getByLabel('Full name')).toBeFocused()
})

