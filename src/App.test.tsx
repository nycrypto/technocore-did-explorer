import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { I18nProvider } from './i18n'
import { ROOM_FIXTURE, VALID_DID } from './test/fixtures'

function renderApp() {
  return render(
    <I18nProvider>
      <App />
    </I18nProvider>,
  )
}

function successfulFetch(payload = ROOM_FIXTURE) {
  const fetcher = vi.fn(async () => Response.json(payload))
  vi.stubGlobal('fetch', fetcher)
  return fetcher
}

async function submitValidQuery(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Public DID'), VALID_DID)
  await user.click(screen.getByRole('button', { name: 'Inspect activity' }))
}

describe('App', () => {
  beforeEach(() => {
    localStorage.setItem('technocore-locale', 'en')
    window.history.replaceState({}, '', '/?lang=en')
  })

  it('does not request a room when DID validation fails', async () => {
    const fetcher = successfulFetch()
    const user = userEvent.setup()
    renderApp()

    await user.type(screen.getByLabelText('Public DID'), 'did:web:example.com')
    await user.click(screen.getByRole('button', { name: 'Inspect activity' }))

    expect(screen.getByText('The DID must start with did:key: exactly as shown.')).toBeVisible()
    expect(fetcher).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Public DID')).toHaveFocus()
  })

  it('blocks private capability rooms before a request is sent', async () => {
    const fetcher = successfulFetch()
    const user = userEvent.setup()
    renderApp()

    await user.type(screen.getByLabelText('Public DID'), VALID_DID)
    await user.clear(screen.getByLabelText('Public room'))
    await user.type(screen.getByLabelText('Public room'), 'mb-p-secret')
    await user.click(screen.getByRole('button', { name: 'Inspect activity' }))

    expect(screen.getByText(/Private p- rooms are capability secrets/)).toBeVisible()
    expect(fetcher).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Public room')).toHaveFocus()
  })

  it('renders exact matching signed activity and explicit trust limits', async () => {
    const fetcher = successfulFetch()
    const user = userEvent.setup()
    renderApp()
    await submitValidQuery(user)

    expect(await screen.findByText('Matching activity (2)')).toBeVisible()
    expect(screen.getByText('A synthetic server-accepted record.')).toBeVisible()
    expect(screen.queryByText('An unsigned room message.')).not.toBeInTheDocument()
    expect(screen.getByText('Local signature re-verification unavailable')).toBeVisible()
    expect(screen.getByText(/not a complete history/i)).toBeVisible()
    expect(fetcher).toHaveBeenCalledWith('/api/rooms/lobby?limit=50', expect.any(Object))
    expect(window.location.search).toContain(`did=${encodeURIComponent(VALID_DID)}`)
  })

  it('renders hostile message markup as text, never as an element', async () => {
    const hostileText = '<img src=x onerror="window.hacked=true">'
    successfulFetch({
      ...ROOM_FIXTURE,
      count: 1,
      messages: [{ ...ROOM_FIXTURE.messages[1], text: hostileText }],
    })
    const user = userEvent.setup()
    renderApp()
    await submitValidQuery(user)

    const text = await screen.findByText(hostileText)
    expect(text).toBeVisible()
    expect(within(text.closest('.activity-card') as HTMLElement).queryByRole('img')).toBeNull()
  })

  it('switches language and theme accessibly', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('button', { name: 'TR' }))
    expect(screen.getByRole('button', { name: 'Etkinliği incele' })).toBeVisible()
    expect(document.documentElement.lang).toBe('tr')

    const themeButton = screen.getByRole('button', { name: 'Koyu temayı kullan' })
    await user.click(themeButton)
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(screen.getByRole('button', { name: 'Açık temayı kullan' })).toBeVisible()
  })

  it('copies a share URL and exposes the versioned JSON export', async () => {
    successfulFetch()
    const user = userEvent.setup()
    renderApp()
    await submitValidQuery(user)
    await screen.findByText('Matching activity (2)')

    await user.click(screen.getByRole('button', { name: 'Copy share link' }))
    expect(screen.getByText('Share link copied.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show raw JSON' }))
    expect(screen.getByText(/"schemaVersion": 1/)).toBeVisible()
    expect(screen.getByText(/"historyComplete": false/)).toBeVisible()

    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    await user.click(screen.getByRole('button', { name: /Download JSON/ }))
    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(click).toHaveBeenCalled()
  })

  it('auto-runs a valid shared URL query', async () => {
    const fetcher = successfulFetch()
    window.history.replaceState(
      {},
      '',
      `/?did=${encodeURIComponent(VALID_DID)}&room=lobby&limit=50&lang=en`,
    )
    renderApp()

    expect(await screen.findByText('Matching activity (2)')).toBeVisible()
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
  })
})
