import { roomResponseSchema } from '../src/schemas/technocore'
import type { ApiErrorCode, ApiErrorPayload } from '../src/schemas/technocore'
import { ROOM_PATTERN, isPrivateRoom } from '../src/lib/room'

const TECHNOCORE_ORIGIN = 'https://technocore.chat'
const DEFAULT_LIMIT = 50
const MAX_RESPONSE_BYTES = 4 * 1024 * 1024
const DEFAULT_TIMEOUT_MS = 8_000
const CACHE_SECONDS = 5

type RuntimeCache = Pick<Cache, 'match' | 'put'>

export interface RequestDependencies {
  fetcher?: typeof fetch
  cache?: RuntimeCache
  timeoutMs?: number
}

const responseHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
}

function jsonResponse(body: unknown, status = 200, extraHeaders?: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...responseHeaders, ...Object.fromEntries(new Headers(extraHeaders)) },
  })
}

function errorResponse(
  status: number,
  code: ApiErrorCode,
  options: {
    upstreamStatus?: number
    retryAfterSeconds?: number
    detail?: string
  } = {},
): Response {
  const error: ApiErrorPayload['error'] = { code }
  if (options.upstreamStatus !== undefined) error.upstreamStatus = options.upstreamStatus
  if (options.retryAfterSeconds !== undefined) error.retryAfterSeconds = options.retryAfterSeconds
  if (options.detail) error.detail = options.detail.slice(0, 1024)

  const headers =
    options.retryAfterSeconds !== undefined
      ? { 'Retry-After': String(options.retryAfterSeconds) }
      : undefined
  return jsonResponse({ error }, status, headers)
}

function parseLimit(value: string | null): number | null {
  if (value === null) return DEFAULT_LIMIT
  if (!/^\d{1,3}$/.test(value)) return null
  const limit = Number(value)
  return Number.isInteger(limit) && limit >= 1 && limit <= 200 ? limit : null
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined
  if (/^\d+$/.test(value)) return Number(value)
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp)
    ? undefined
    : Math.max(0, Math.ceil((timestamp - Date.now()) / 1000))
}

async function readBoundedBody(response: Response, maxBytes: number): Promise<Uint8Array | null> {
  const declaredLength = Number(response.headers.get('content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) return null
  if (!response.body) return new Uint8Array()

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > maxBytes) {
        await reader.cancel()
        return null
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  const body = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }
  return body
}

async function readDetail(response: Response): Promise<string | undefined> {
  const body = await readBoundedBody(response, 1024)
  if (!body) return undefined
  const detail = new TextDecoder().decode(body).trim()
  return detail || undefined
}

function runtimeCache(): RuntimeCache | undefined {
  return (
    globalThis as typeof globalThis & {
      caches?: { default?: RuntimeCache }
    }
  ).caches?.default
}

export async function handleRequest(
  request: Request,
  dependencies: RequestDependencies = {},
): Promise<Response> {
  const url = new URL(request.url)

  if (!url.pathname.startsWith('/api/rooms/')) {
    return errorResponse(404, 'NOT_FOUND')
  }
  if (request.method !== 'GET') {
    return errorResponse(405, 'METHOD_NOT_ALLOWED')
  }

  const encodedRoom = url.pathname.slice('/api/rooms/'.length)
  if (!encodedRoom || encodedRoom.includes('/')) return errorResponse(400, 'INVALID_ROOM')

  let room: string
  try {
    room = decodeURIComponent(encodedRoom)
  } catch {
    return errorResponse(400, 'INVALID_ROOM')
  }

  if (!ROOM_PATTERN.test(room)) return errorResponse(400, 'INVALID_ROOM')
  if (isPrivateRoom(room)) return errorResponse(403, 'PRIVATE_ROOM_BLOCKED')

  const limit = parseLimit(url.searchParams.get('limit'))
  if (limit === null) return errorResponse(400, 'INVALID_LIMIT')

  const cache = dependencies.cache ?? runtimeCache()
  const cacheKey = new Request(`${url.origin}/api/rooms/${encodeURIComponent(room)}?limit=${limit}`)
  let cached: Response | undefined
  try {
    cached = await cache?.match(cacheKey)
  } catch {
    cached = undefined
  }
  if (cached) return cached

  const upstreamUrl = new URL(`/r/${encodeURIComponent(room)}`, TECHNOCORE_ORIGIN)
  upstreamUrl.searchParams.set('format', 'json')
  upstreamUrl.searchParams.set('limit', String(limit))

  const controller = new AbortController()
  const timeoutId = setTimeout(
    () => controller.abort(),
    dependencies.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  )

  try {
    const upstream = await (dependencies.fetcher ?? fetch)(upstreamUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })

    if (upstream.status === 429) {
      const retryAfterSeconds = parseRetryAfter(upstream.headers.get('retry-after'))
      return errorResponse(429, 'UPSTREAM_RATE_LIMITED', {
        upstreamStatus: 429,
        retryAfterSeconds,
        detail: await readDetail(upstream),
      })
    }

    if (!upstream.ok) {
      return errorResponse(502, 'UPSTREAM_HTTP_ERROR', {
        upstreamStatus: upstream.status,
        detail: await readDetail(upstream),
      })
    }

    const body = await readBoundedBody(upstream, MAX_RESPONSE_BYTES)
    if (!body) return errorResponse(502, 'RESPONSE_TOO_LARGE')

    let payload: unknown
    try {
      payload = JSON.parse(new TextDecoder().decode(body))
    } catch {
      return errorResponse(502, 'UPSTREAM_SCHEMA_ERROR')
    }

    const parsed = roomResponseSchema.safeParse(payload)
    if (!parsed.success || parsed.data.room !== room) {
      return errorResponse(502, 'UPSTREAM_SCHEMA_ERROR')
    }

    const response = jsonResponse(parsed.data, 200, {
      'Cache-Control': `public, max-age=0, s-maxage=${CACHE_SECONDS}`,
    })
    try {
      await cache?.put(cacheKey, response.clone())
    } catch {
      // Cache failures must not turn a valid public upstream response into an API failure.
    }
    return response
  } catch {
    return controller.signal.aborted
      ? errorResponse(504, 'UPSTREAM_TIMEOUT')
      : errorResponse(502, 'NETWORK_ERROR')
  } finally {
    clearTimeout(timeoutId)
  }
}

export default {
  fetch(request: Request): Promise<Response> {
    return handleRequest(request)
  },
} satisfies ExportedHandler
