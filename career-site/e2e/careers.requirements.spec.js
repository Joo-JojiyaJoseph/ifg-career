import { expect, test } from '@playwright/test'
import { expectNoHorizontalScroll, unique } from './helpers'

/*
 * Checks the careers site against the three source documents:
 * the requirements (2 Nov 2026), the career page content file and HR's corrections note (Oct 2026).
 */

test.describe('Career page content and corrections', () => {
  test('top bar, hero and the four companies (content SEC 1–2, corrections 1 and 11)', async ({ page }) => {
    await page.goto('/')
    const menu = page.getByRole('button', { name: 'Open menu' })
    const mobile = await menu.isVisible()
    if (mobile) await menu.click()
    const nav = mobile ? page.getByRole('dialog') : page.getByRole('banner')
    for (const link of ['Careers', 'Job Search', 'Internship', 'Candidate profile']) {
      await expect(nav.getByRole('link', { name: link, exact: true }).first()).toBeVisible()
    }
    if (mobile) await page.keyboard.press('Escape')

    await expect(page.getByText('Be part of our heart')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: 'Infolks Group' })).toBeVisible()
    await expect(page.getByText('A company with a heart').first()).toBeVisible()
    await expect(page.getByText(/Infolks Group today brings together four companies/)).toBeVisible()

    const cards = page.locator('#entities')
    await cards.scrollIntoViewIfNeeded()
    for (const [name, motto] of [['Infolks', 'AI Data Annotation Company'], ['Medrays', 'Medical Data Annotation Services'], ['Webfolks', 'Digital Marketing and IT Solutions'], ['Dataways', 'Data Collection Company']]) {
      await expect(cards.getByRole('heading', { name, exact: true })).toBeVisible()
      await expect(cards.getByText(motto)).toBeVisible()
      await expect(cards.getByRole('link', { name: `Explore opportunities at ${name}` })).toBeVisible()
    }
    await cards.getByRole('link', { name: 'Explore opportunities at Medrays' }).click()
    await expect(page).toHaveURL(/\/jobs\?entity=medrays/)
  })

  test('why join, numbers, interview steps, Quick Apply, FAQs and footer (content SEC 3–7, corrections 2–10)', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Why Join Infolks Group' })).toBeAttached()
    for (const block of ['How We Work', 'What We Provide', 'Our Culture']) await expect(page.getByRole('heading', { name: new RegExp(block) })).toBeAttached()
    await expect(page.getByText('people across the group', { exact: true }).first()).toBeAttached()      // LP-06
    await expect(page.getByText('years since 2016', { exact: true })).toBeAttached()

    await expect(page.getByRole('heading', { name: 'Our Recruitment Process' })).toBeAttached()
    for (const step of ['Apply', 'Screening', 'Round 1: Skill Test', 'Round 2: HR Round', 'Final Result']) {
      await expect(page.getByRole('heading', { name: new RegExp(`\\d+\\. ${step.replace(/[:.]/g, '\\$&')}$`) })).toBeAttached()  // correction 9
    }

    // Quick Apply fields (correction 6 and 10).
    const quick = page.locator('#quick-apply')
    await quick.scrollIntoViewIfNeeded()
    for (const label of ['Full name', 'Date of birth', 'Email ID', 'Phone number', 'Gender']) await expect(quick.locator('label').filter({ hasText: label }).first()).toBeVisible()
    for (const label of ['Highest qualification', 'Location', 'Department', 'Upload resume (PDF or DOCX)']) await expect(quick.locator('label').filter({ hasText: label }).first()).toBeAttached()
    await quick.locator('#gender').click()
    for (const option of ['Male', 'Female', 'Other']) await expect(page.getByRole('option', { name: option, exact: true })).toBeVisible()
    await page.keyboard.press('Escape')

    // FAQs with the corrected answers (corrections 2, 3, 4, 7).
    await expect(page.getByRole('heading', { name: 'A few things you might want to know' })).toBeAttached()
    const faq = page.locator('main')
    await expect(faq.getByText('How can I explore current job openings at Infolks Group?')).toBeAttached()
    await expect(faq.getByText('Can I apply for more than one position?')).toBeAttached()
    await expect(faq.getByText('How will I know the status of my application?')).toBeAttached()
    await expect(faq.getByText('What happens after I submit my application?')).toBeAttached()
    const open = async (question, answer) => {
      await page.getByRole('button', { name: new RegExp(question) }).click()
      await expect(page.locator('main')).toContainText(answer)
    }
    await open('Does Infolks Group offer internship', 'Internship option in the top bar')         // correction 7
    await open('Can I apply for more than one position', 'after 6 months')                        // correction 4
    await open('How will I know the status', 'Candidate profile')                                 // correction 2
    await open('What happens after I submit', 'confirmation email')                               // correction 3

    // Footer (content SEC 7; the headline is removed by correction 8).
    const footer = page.locator('footer')
    await expect(footer).toContainText('Every new person brings a new perspective')
    for (const link of ['Careers', 'Job Search', 'Internship', 'Contact Us']) await expect(footer.getByRole('navigation', { name: 'Footer' }).getByRole('link', { name: link, exact: true })).toBeAttached()
    for (const network of ['Instagram', 'Facebook', 'LinkedIn', 'YouTube']) await expect(footer.getByRole('link', { name: new RegExp(network) })).toBeAttached()
    await expect(footer).toContainText(`© ${new Date().getFullYear()} Infolks Group. All Rights Reserved.`)

    await expectNoHorizontalScroll(page)                                                         // LP-11
  })
})

test.describe('Requirements: careers website', () => {
  test('LP-07, TC-02: anyone can join the talent community with name, email and phone', async ({ page }) => {
    await page.goto('/')
    // On the landing page the sign-up sits beside Quick Apply; the footer opens the same form in a dialog elsewhere.
    const card = page.locator('#quick-apply')
    await card.getByRole('heading', { name: 'Join the talent community' }).scrollIntoViewIfNeeded()
    const dialog = card

    await dialog.getByRole('button', { name: 'Get job alerts' }).click()
    await expect(dialog.getByRole('alert').first()).toBeVisible()

    await dialog.locator('#talent-name').fill('Ravi Kumar')
    await dialog.locator('#talent-email').fill(`alerts-${unique()}@example.com`)
    await dialog.locator('#talent-phone').fill('98470 12300')
    await dialog.locator('form').filter({ has: page.locator('#talent-name') }).getByLabel(/privacy policy/).check()
    await dialog.getByRole('button', { name: 'Get job alerts' }).click()
    await expect(dialog.getByRole('status')).toContainText(/in|subscribed/i)
  })

  test('JS-02 to JS-09: search and every filter are on the job search page, with a clear message when nothing matches', async ({ page }) => {
    await page.goto('/jobs')
    await expect(page.getByRole('searchbox').or(page.getByPlaceholder(/role, skill or/i)).first()).toBeVisible()
    await page.getByRole('button', { name: /^More filters/ }).click()
    await expect(page.getByRole('heading', { name: 'Filters' })).toBeVisible()
    for (const id of ['entity', 'department', 'team', 'level', 'location', 'skills']) await expect(page.locator(`#${id}`).first()).toBeAttached()
    await page.keyboard.press('Escape')

    await page.goto('/jobs?q=zzzz-no-such-role')
    await expect(page.getByText('No roles match these filters')).toBeVisible()
    await expect(page.locator('main').getByRole('button', { name: 'Get job alerts' })).toBeVisible()
  })

  test('JD-02 to JD-07: a job page shows every detail and the Apply step leads to Google sign-in', async ({ page }) => {
    await page.goto('/jobs')
    await page.locator('a[href^="/jobs/"]').first().click()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    for (const fact of ['Department', 'Team', 'Location', 'Posted', 'Last date to apply']) await expect(page.getByText(fact, { exact: true }).first()).toBeVisible()
    for (const section of ['Role summary', 'Qualification', 'Experience', 'Skills', 'Interview process']) await expect(page.getByRole('heading', { name: section })).toBeAttached()
    await expect(page.getByRole('button', { name: /Sign in (with Google )?to apply/ }).first()).toBeAttached()
  })
})
