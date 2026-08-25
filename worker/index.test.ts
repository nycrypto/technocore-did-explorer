import { describe, expect, it, vi } from 'vitest'
import { handleRequest } from './index'
import { ROOM_FIXTURE } from '../src/test/fixtures'

class MemoryCache {
  private readonly entries = new Map<string, Response>()

  async match(request: Request): Promise<Response | undefined> {
    return this.entries.get(request.url)?.clone()
  }

  async put(request: Request, response: Response): Promise<void> {
    this.entries.set(request.url, response.clone())
  }
}

function request(path: string, init?: RequestInit) {
  return new Request(`https://explorer.example${path}`, init)
}

describe('Technocore Worker proxy', () => {
  it('validates, normalizes and caches a successful room response', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toBe('https://technocore.chat/r/lobby?format=json&limit=50')
      return Response.json({ ...ROOM_FIXTURE, future_field: true })
    }) as typeof fetch
    const cache = new MemoryCache()

    const first = await handleRequest(request('/api/rooms/lobby?limit=50'), { fetcher, cache })
    const second = await handleRequest(request('/api/rooms/lobby?limit=50'), { fetcher, cache })

    expect(first.status).toBe(200)
    expect(await first.json()).toEqual(ROOM_FIXTURE)
    expect(first.headers.get('cache-control')).toContain('s-maxage=5')
    expect(await second.json()).toEqual(ROOM_FIXTURE)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['/api/rooms/BadRoom', 400, 'INVALID_ROOM'],
    ['/api/rooms/p-secret', 403, 'PRIVATE_ROOM_BLOCKED'],
    ['/api/rooms/lobby?limit=0', 400, 'INVALID_LIMIT'],
    ['/api/rooms/lobby?limit=201', 400, 'INVALID_LIMIT'],
  ] as const)('rejects %s without reaching upstream', async (path, status, code) => {
    const fetcher = vi.fn() as unknown as typeof fetch
    const response = await handleRequest(request(path), { fetcher })
    expect(response.status).toBe(status)
    expect(await response.json()).toEqual({ error: { code } })
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('allows GET only', async () => {
    const response = await handleRequest(request('/api/rooms/lobby', { method: 'POST' }))
    expect(response.status).toBe(405)
    expect(await response.json()).toEqual({ error: { code: 'METHOD_NOT_ALLOWED' } })
  })

  it('preserves rate-limit pacing information', async () => {
    const fetcher = vi.fn(
      async () =>
        new Response('read bucket exhausted', {
          status: 429,
          headers: { 'Retry-After': '7' },
        }),
    ) as typeof fetch
    const response = await handleRequest(request('/api/rooms/lobby'), { fetcher })

    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('7')
    expect(await response.json()).toEqual({
      error: {
        code: 'UPSTREAM_RATE_LIMITED',
        upstreamStatus: 429,
        retryAfterSeconds: 7,
        detail: 'read bucket exhausted',
      },
    })
  })

  it('rejects malformed upstream JSON', async () => {
    const fetcher = vi.fn(async () => Response.json({ room: 'lobby' })) as typeof fetch
    const response = await handleRequest(request('/api/rooms/lobby'), { fetcher })
    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ error: { code: 'UPSTREAM_SCHEMA_ERROR' } })
  })

  it('rejects a mismatched upstream room identity', async () => {
    const fetcher = vi.fn(async () =>
      Response.json({ ...ROOM_FIXTURE, room: 'different-room' }),
    ) as typeof fetch
    const response = await handleRequest(request('/api/rooms/lobby'), { fetcher })
    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ error: { code: 'UPSTREAM_SCHEMA_ERROR' } })
  })

  it('serves a valid response when the edge cache is unavailable', async () => {
    const fetcher = vi.fn(async () => Response.json(ROOM_FIXTURE)) as typeof fetch
    const cache = {
      match: vi.fn(async () => {
        throw new Error('cache unavailable')
      }),
      put: vi.fn(async () => {
        throw new Error('cache unavailable')
      }),
    }
    const response = await handleRequest(request('/api/rooms/lobby'), { fetcher, cache })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(ROOM_FIXTURE)
  })

  it('rejects a declared response larger than 4 MiB', async () => {
    const fetcher = vi.fn(
      async () =>
        new Response('{}', {
          headers: { 'Content-Length': String(4 * 1024 * 1024 + 1) },
        }),
    ) as typeof fetch
    const response = await handleRequest(request('/api/rooms/lobby'), { fetcher })
    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ error: { code: 'RESPONSE_TOO_LARGE' } })
  })

  it('returns a timeout without retrying', async () => {
    const fetcher = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          )
        }),
    ) as typeof fetch
    const response = await handleRequest(request('/api/rooms/lobby'), {
      fetcher,
      timeoutMs: 1,
    })
    expect(response.status).toBe(504)
    expect(await response.json()).toEqual({ error: { code: 'UPSTREAM_TIMEOUT' } })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('maps other upstream failures to a bounded 502 error', async () => {
    const fetcher = vi.fn(async () => new Response('not found', { status: 404 })) as typeof fetch
    const response = await handleRequest(request('/api/rooms/lobby'), { fetcher })
    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({
      error: { code: 'UPSTREAM_HTTP_ERROR', upstreamStatus: 404, detail: 'not found' },
    })
  })
})
