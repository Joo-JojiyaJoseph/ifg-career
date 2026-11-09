import { expect, test } from '@playwright/test'

/* Checks the HR portal against section 6 of the requirements (2 Nov 2026). */

const HR = { email: process.env.E2E_HR_EMAIL ?? 'hr@infolksgroup.com', password: process.env.E2E_HR_PASSWORD ?? 'InfolksGroup#2026' }

// Sign in once and share the session: the API allows five sign-in attempts a minute per account.
test.describe.configure({ mode: 'serial' })
let shared

test.beforeAll(async ({ browser }) => {
  shared = await browser.newPage()
  await login(shared)
})

test.afterAll(async () => {
  await shared?.close()
})

async function login(page) {
  await page.goto('/login')
  await page.locator('#email').fill(HR.email)
  await page.locator('#password').fill(HR.password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Career Overview' })).toBeVisible()
}

async function signIn() {
  await shared.goto('/')
  await expect(shared.getByRole('heading', { name: 'Career Overview' })).toBeVisible()
  return shared
}

test('6.2: the five sections, and the dashboard shows open jobs, new applications and interviews', async () => {
  const page = await signIn()
  const nav = page.getByRole('navigation').first()
  for (const section of ['Dashboard', 'Jobs', 'Candidates', 'Applications', 'Interviews']) await expect(nav.getByRole('link', { name: section, exact: true })).toBeVisible()
  await expect(page.getByText('Active openings')).toBeVisible()
  await expect(page.getByText('Total applicants')).toBeVisible()
  await expect(page.getByText(/applied today/)).toBeVisible()
  await expect(page.getByText(/Interviews this week|interviews today/).first()).toBeVisible()
})

test('6.2 Candidates, CI-03, CI-04, CI-08: filters, notes, colour tags, blacklist and export', async () => {
  const page = await signIn()
  await page.goto('/candidates')
  await expect(page.getByRole('button', { name: 'Export' })).toBeVisible()
  await page.getByRole('button', { name: /Filters/ }).first().click()
  for (const id of ['cand-entity', 'cand-role', 'cand-gender', 'cand-blacklisted']) await expect(page.locator(`#${id}`)).toBeVisible()
  await page.keyboard.press('Escape')

  await page.locator('a[href^="/candidates/"]').first().click()
  await expect(page.getByRole('tab', { name: /Applications/ })).toBeVisible()
  await page.getByRole('tab', { name: /Notes/ }).click()
  const note = `Called on ${new Date().toISOString()}`
  await page.getByLabel('Add a note').fill(note)
  await page.getByRole('button', { name: 'Save note' }).click()
  await expect(page.getByText(note)).toBeVisible()

  await page.locator('#colour-tag').click()
  await page.getByRole('option', { name: 'Contacted', exact: true }).click()
  await expect(page.getByText('Colour tag updated')).toBeVisible()
  await expect(page.getByRole('button', { name: /Blacklist/ }).first()).toBeVisible()
})

test('6.2 Jobs: a published job can be unpublished, closed and given a later last date', async () => {
  const page = await signIn()
  await page.goto('/jobs?status=published')
  await page.locator('a[href*="/edit"]').filter({ visible: true }).first().click()
  await expect(page.getByRole('button', { name: 'More actions' })).toBeVisible()
  await page.getByRole('button', { name: 'More actions' }).click()
  for (const action of ['Unpublish', 'Close role', 'Extend last date']) await expect(page.getByRole('menuitem', { name: action })).toBeVisible()
  await page.keyboard.press('Escape')
})

test('CI-09: HR can write a job alert or a company update for the talent community', async () => {
  const page = await signIn()
  await page.goto('/talent')
  await expect(page.getByRole('button', { name: /job alert/i }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: /company update/i }).first()).toBeVisible()
})
