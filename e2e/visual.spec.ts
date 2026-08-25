import { expect, test } from '@playwright/test'
import { ROOM_FIXTURE, VALID_DID } from '../src/test/fixtures'

test.skip(Boolean(process.env.CI), 'Documentation screenshots are generated locally.')

test('captures the verified result interface', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    localStorage.setItem('technocore-locale', 'en')
    localStorage.setItem('technocore-theme', 'light')
  })
  await page.route('**/api/rooms/lobby?limit=50', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(ROOM_FIXTURE),
    })
  })

  await page.goto(`/?did=${encodeURIComponent(VALID_DID)}&room=lobby&limit=50&lang=en`)
  await expect(page.getByRole('heading', { name: 'Matching activity (2)' })).toBeVisible()

  const filename = testInfo.project.name.startsWith('mobile')
    ? 'docs/screenshots/explorer-mobile.png'
    : 'docs/screenshots/explorer-desktop.png'
  await page.screenshot({ path: filename, fullPage: true })
})
