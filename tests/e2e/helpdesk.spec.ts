import { expect, test } from '@playwright/test'

test('guest sees only hostels and account links, then demo sign-in returns to the requested page', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Hostels' }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Sign in' }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Create account' }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Lodge a complaint' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Request an item' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Book a venue' })).toHaveCount(0)

  await page.goto('/complaint')
  await expect(page).toHaveURL(/\/login\?next=/)
  await page.getByRole('button', { name: 'Demo student' }).click()
  await expect(page).toHaveURL(/\/complaint$/)
  await expect(page.getByRole('link', { name: 'Request an item' }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Book a venue' }).first()).toBeVisible()
})

test('student can sign in, create a complaint, and find it on their dashboard', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Demo student' }).click()
  await page.goto('/complaint')
  await page.getByLabel('Short title').fill('Test broken desk')
  await page.getByLabel('Location').fill('Test room 5')
  await page.getByLabel('Complaint details').fill('This is a Playwright demo test.')
  await page.getByLabel('Desired resolution').fill('Please repair it.')
  await page.getByRole('button', { name: 'Submit complaint' }).click()
  await expect(page.getByText('Complaint received')).toBeVisible()
  const reference = await page.locator('p.text-4xl').innerText()
  expect(reference).toMatch(/^CMP-/)

  await page.goto('/student')
  await expect(page.getByText('Hello, Demo Student')).toBeVisible()
  await expect(page.getByText('Test broken desk')).toBeVisible()
  await expect(page.getByText(reference)).toBeVisible()
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/login$/)
})

test('admin sees anonymous case details and can make a demo decision', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Demo admin' }).click()
  await page.goto('/admin/requests/CMP-1001')
  await expect(page.getByText('CMP-1001')).toBeVisible()
  await expect(page.getByText('Sample Student')).toHaveCount(0)
  await expect(page.getByText('sample.student@aust.edu.ng')).toHaveCount(0)
  await expect(page.getByText('AUST/2024/001')).toHaveCount(0)
  await page.getByPlaceholder('Message to include with your decision').fill('Playwright demo review.')
  await page.getByRole('button', { name: 'Accept' }).click()
  await expect(page.getByText('accepted', { exact: true })).toBeVisible()
})

test('signed-out visitors are sent to login before opening protected routes', async ({ page }) => {
  await page.goto('/student')
  await expect(page).toHaveURL(/\/login\?next=/)
})
