import { expect, test } from '@playwright/test'
import { unique } from './helpers'

const ACCOUNTS = {
  hr: { email: process.env.E2E_HR_EMAIL ?? 'hr@infolksgroup.com', password: process.env.E2E_HR_PASSWORD ?? 'InfolksGroup#2026' },
  admin: { email: process.env.E2E_ADMIN_EMAIL ?? 'admin@infolksgroup.com', password: process.env.E2E_ADMIN_PASSWORD ?? 'InfolksGroup#2026' },
}

async function signIn(page, who) {
  await page.goto('/login')
  await page.locator('#email').fill(ACCOUNTS[who].email)
  await page.locator('#password').fill(ACCOUNTS[who].password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  // Two-factor is off by default, so the dashboard opens straight away.
  await expect(page.getByRole('heading', { name: 'Career Overview' })).toBeVisible()
}

const isoDate = (daysFromToday) => {
  const date = new Date(Date.now() + daysFromToday * 86_400_000)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/** Opens a Headless UI select by its field id and picks the first real option (after the "Choose…" placeholder). */
async function pickFirst(page, id) {
  await page.locator(`#${id}`).click()
  await page.getByRole('option').nth(1).click()
}

/** The job form opens as a modal over the jobs list, so look inside the dialog. */
const form = (page) => page.getByRole('dialog')

async function fillBasics(page, title) {
  await page.goto('/jobs/new')
  // Headless UI's dialog wrapper has no size of its own, so wait for the modal's heading.
  await expect(page.getByRole('heading', { name: 'New role' })).toBeVisible()
  await form(page).getByLabel('Title').fill(title)
  await pickFirst(page, 'entity')
  await pickFirst(page, 'level')
  await form(page).getByLabel('Location').fill('Mannarkkad, Kerala')
  await form(page).getByLabel('Summary').fill('Build and look after the tools our hiring teams use every day.')
  await form(page).getByLabel('Qualification').fill('A degree in computer science or equivalent experience.')
  await form(page).getByLabel('Experience').fill('1–3 years')
}

test.describe('Jobs: create and publish', () => {
  test('HR picks skills with the keyboard, chooses a date and publishes the role', async ({ page }) => {
    await signIn(page, 'hr')
    await fillBasics(page, `E2E Frontend Developer ${unique()}`)

    const skills = page.getByRole('combobox', { name: 'Skills' })
    await skills.fill('reac')
    await expect(page.getByRole('option', { name: 'React', exact: true })).toBeVisible()
    await skills.press('Enter')
    await expect(page.getByRole('button', { name: 'Remove React' })).toBeVisible()
    // Enter in the skills box adds a skill; it must not submit or leave the form.
    await expect(page).toHaveURL(/\/jobs\/(new|[A-Z0-9]{26})/)

    // Typing a full skill name and moving on still adds it.
    await skills.fill('JavaScript')
    await form(page).getByLabel('Location').click()
    await expect(page.getByRole('button', { name: 'Remove JavaScript' })).toBeVisible()

    // HR cannot add new skills, so the box says who can.
    await skills.fill('Quantum basket weaving')
    await expect(page.getByText('Ask an Admin to add it in Settings → Lists.')).toBeVisible()
    await skills.fill('')

    await form(page).getByLabel('Last date to apply').fill(isoDate(21))
    await page.getByRole('button', { name: 'Publish', exact: true }).click()
    await expect(page.getByText('Role published')).toBeVisible()
    // The modal stays open on the published role; Unpublish now sits under More actions.
    await expect(form(page).getByText('Published', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'More actions' }).click()
    await expect(page.getByRole('menuitem', { name: 'Unpublish' })).toBeVisible()
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Done' }).click()
    await expect(page).toHaveURL(/\/jobs$/)
  })

  test('a past last date is refused with a clear message', async ({ page }) => {
    await signIn(page, 'hr')
    await fillBasics(page, `E2E Past Date ${unique()}`)
    const skills = page.getByRole('combobox', { name: 'Skills' })
    await skills.fill('PHP')
    await skills.press('Enter')

    const date = form(page).getByLabel('Last date to apply')
    await expect(date).toHaveAttribute('min', isoDate(0))
    await date.fill(isoDate(-3))
    await page.getByRole('button', { name: 'Publish', exact: true }).click()
    await expect(page.getByText('Complete the role before publishing.')).toBeVisible()
    await expect(page.getByText('Choose today or a later date.')).toBeVisible()
  })

  test('Admin adds a brand-new skill from the job form', async ({ page }) => {
    await signIn(page, 'admin')
    await fillBasics(page, `E2E Data Analyst ${unique()}`)
    const name = `Skill ${unique()}`

    const skills = page.getByRole('combobox', { name: 'Skills' })
    await skills.fill(name)
    await page.getByRole('option', { name: `Add "${name}" as a new skill` }).click()
    await expect(page.getByText(`Added "${name}" to the skills list.`)).toBeVisible()
    await expect(page.getByRole('button', { name: `Remove ${name}` })).toBeVisible()

    await form(page).getByLabel('Last date to apply').fill(isoDate(10))
    await page.getByRole('button', { name: 'Publish', exact: true }).click()
    await expect(page.getByText('Role published')).toBeVisible()
  })
})
