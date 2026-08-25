import { expect, test } from '@playwright/test'
import { ROOM_FIXTURE, VALID_DID } from '../src/test/fixtures'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('technocore-locale', 'en')
    localStorage.setItem('technocore-theme', 'light')
  })
})

test('loads a valid shared query and renders exact matching activity', async ({ page }) => {
  await page.route('**/api/rooms/lobby?limit=50', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(ROOM_FIXTURE),
    })
  })

  await page.goto(`/?did=${encodeURIComponent(VALID_DID)}&room=lobby&limit=50&lang=en`)

  await expect(page.getByRole('heading', { name: 'Matching activity (2)' })).toBeVisible()
  await expect(page.getByText('A synthetic server-accepted record.')).toBeVisible()
  await expect(page.getByText('An unsigned room message.')).toHaveCount(0)
  await expect(page.getByText('Local signature re-verification unavailable')).toBeVisible()
})

test('blocks private capability rooms without calling the API', async ({ page }) => {
  let apiCalls = 0
  await page.route('**/api/**', async (route) => {
    apiCalls += 1
    await route.abort()
  })
  await page.goto('/?lang=en')

  await page.getByLabel('Public DID').fill(VALID_DID)
  await page.getByLabel('Public room').fill('mb-p-secret')
  await page.getByRole('button', { name: 'Inspect activity' }).click()

  await expect(page.getByText(/Private p- rooms are capability secrets/)).toBeVisible()
  expect(apiCalls).toBe(0)
})

test('shows rate-limit pacing from the same-origin proxy', async ({ page }) => {
  await page.route('**/api/rooms/lobby?limit=50', async (route) => {
    await route.fulfill({
      status: 429,
      contentType: 'application/json',
      headers: { 'Retry-After': '7' },
      body: JSON.stringify({
        error: {
          code: 'UPSTREAM_RATE_LIMITED',
          upstreamStatus: 429,
          retryAfterSeconds: 7,
          detail: 'read bucket exhausted',
        },
      }),
    })
  })
  await page.goto('/?lang=en')

  await page.getByLabel('Public DID').fill(VALID_DID)
  await page.getByRole('button', { name: 'Inspect activity' }).click()

  await expect(page.getByText('Technocore is rate limiting reads right now.')).toBeVisible()
  await expect(page.getByText('Try again in approximately 7 seconds.')).toBeVisible()
})

test('supports keyboard navigation and bilingual controls', async ({ page }) => {
  await page.goto('/?lang=en')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Technocore DID Explorer' })).toBeFocused()

  await page.getByRole('button', { name: 'TR' }).click()
  await expect(page.getByRole('button', { name: 'Etkinliği incele' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'tr')
})
