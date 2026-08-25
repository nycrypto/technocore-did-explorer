import { afterEach, describe, expect, it, vi } from 'vitest'
import { ExplorerApiError, fetchRoomActivity } from './api'
import { ROOM_FIXTURE } from '../test/fixtures'

afterEach(() => vi.unstubAllGlobals())

describe('fetchRoomActivity', () => {
  it('requests the same-origin endpoint and validates the response', async () => {
    const fetcher = vi.fn(async () => Response.json({ ...ROOM_FIXTURE, ignored: true }))
    vi.stubGlobal('fetch', fetcher)

    await expect(fetchRoomActivity('lobby', 50)).resolves.toEqual(ROOM_FIXTURE)
    expect(fetcher).toHaveBeenCalledWith('/api/rooms/lobby?limit=50', { signal: undefined })
  })

  it('surfaces a structured proxy error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json(
          {
            error: {
              code: 'UPSTREAM_RATE_LIMITED',
              upstreamStatus: 429,
              retryAfterSeconds: 7,
              detail: 'read bucket exhausted',
            },
          },
          { status: 429 },
        ),
      ),
    )

    const error = await fetchRoomActivity('lobby', 50).catch((reason: unknown) => reason)
    expect(error).toBeInstanceOf(ExplorerApiError)
    expect(error).toMatchObject({
      code: 'UPSTREAM_RATE_LIMITED',
      status: 429,
      retryAfterSeconds: 7,
      detail: 'read bucket exhausted',
    })
  })

  it('rejects an invalid successful payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ room: 'lobby' })),
    )
    await expect(fetchRoomActivity('lobby', 50)).rejects.toMatchObject({
      code: 'UPSTREAM_SCHEMA_ERROR',
      status: 502,
    })
  })

  it('maps malformed errors and network failures safely', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('bad gateway', { status: 502 })),
    )
    await expect(fetchRoomActivity('lobby', 50)).rejects.toMatchObject({
      code: 'UPSTREAM_HTTP_ERROR',
      status: 502,
    })

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('offline')
      }),
    )
    await expect(fetchRoomActivity('lobby', 50)).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      status: 0,
    })
  })

  it('preserves an intentional abort', async () => {
    const abort = new DOMException('Aborted', 'AbortError')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw abort
      }),
    )
    await expect(fetchRoomActivity('lobby', 50)).rejects.toBe(abort)
  })
})
