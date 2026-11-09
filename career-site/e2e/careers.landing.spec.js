import { expect, test } from '@playwright/test'
import { expectNoHorizontalScroll } from './helpers'

test.describe('Careers landing page', () => {
  test('shows the seven career page sections in order', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('link', { name: 'Infolks Group Careers home' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: 'Infolks Group' })).toBeVisible()
    await expect(page.getByText('Be part of our heart')).toBeVisible()
    await expect(page.getByText('A company with a heart').first()).toBeVisible()
    // Phones keep the navigation in the slide-out menu.
    const menu = page.getByRole('button', { name: 'Open menu' })
    const mobile = await menu.isVisible()
    if (mobile) await menu.click()
    const nav = mobile ? page.getByRole('dialog') : page.getByRole('banner')
    for (const link of ['Careers', 'Job Search', 'Internship', 'Candidate profile']) {
      await expect(nav.getByRole('link', { name: link, exact: true })).toBeVisible()
    }
    if (mobile) await page.keyboard.press('Escape')

    const titles = [
      'Our story has more than one way in',
      'Why Join Infolks Group',
      'Our Recruitment Process',
      'Your story could begin here',
      'A few things you might want to know',
    ]
    let previous = -1
    for (const title of titles) {
      const heading = page.getByRole('heading', { name: title, exact: true })
      await heading.scrollIntoViewIfNeeded()
      await expect(heading).toBeVisible()
      const top = await heading.evaluate((element) => element.getBoundingClientRect().top + window.scrollY)
      expect(top).toBeGreaterThan(previous)
      previous = top
    }

    await expect(page.locator('footer')).toContainText('Every new person brings a new perspective')
    await expect(page.getByText('We have been saving a place for you')).toHaveCount(0)
    await expect(page.getByText('Round 1: Skill Test')).toBeVisible()
    await expect(page.getByText('Round 2: HR Round')).toBeVisible()
    await expectNoHorizontalScroll(page)
  })

  test('shows all four entities and links to their roles', async ({ page }) => {
    await page.goto('/')
    for (const entity of ['Infolks', 'Webfolks', 'Dataways', 'Medrays']) {
      await expect(page.getByRole('link', { name: `Explore opportunities at ${entity}` })).toBeVisible()
    }
    await page.getByRole('link', { name: 'Explore opportunities at Medrays' }).click()
    await expect(page).toHaveURL(/entity=medrays/)
  })

  test('opens one FAQ at a time', async ({ page }) => {
    await page.goto('/')
    const questions = page.locator('[id^="faq-q-"]')
    await questions.nth(1).scrollIntoViewIfNeeded()
    await questions.nth(1).click()
    await expect(questions.nth(1)).toHaveAttribute('aria-expanded', 'true')
    await expect(questions.nth(0)).toHaveAttribute('aria-expanded', 'false')
  })
})
