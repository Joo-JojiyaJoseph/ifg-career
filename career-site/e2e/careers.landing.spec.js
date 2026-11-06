import { expect, test } from '@playwright/test'
import { expectNoHorizontalScroll } from './helpers'

test.describe('Careers landing page', () => {
  test('shows the nine guide sections in order', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('link', { name: 'Infolks Group Careers home' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Job Search' }).first()).toBeVisible()

    const titles = ['Our entities', 'About the group', 'Our interview procedure', 'Life at the group', 'Quick apply', 'Frequently asked questions', 'Our recognitions and validations']
    let previous = -1
    for (const title of titles) {
      const heading = page.getByRole('heading', { name: title, exact: true })
      await heading.scrollIntoViewIfNeeded()
      await expect(heading).toBeVisible()
      const top = await heading.evaluate((element) => element.getBoundingClientRect().top + window.scrollY)
      expect(top).toBeGreaterThan(previous)
      previous = top
    }

    await expect(page.locator('footer')).toContainText('Infolks Group')
    await expectNoHorizontalScroll(page)
  })

  test('shows all four entities and links to their roles', async ({ page }) => {
    await page.goto('/')
    for (const entity of ['Infolks', 'Webfolks', 'Dataways', 'Medrays']) {
      await expect(page.getByRole('link', { name: `View roles at ${entity}` })).toBeVisible()
    }
    await page.getByRole('link', { name: 'View roles at Medrays' }).click()
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
