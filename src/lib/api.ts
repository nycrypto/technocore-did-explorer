import { parse as parseLosslessJson } from 'lossless-json'
import { apiErrorSchema, roomResponseSchema } from '../schemas/technocore'
import type { ApiErrorCode, RoomResponse } from '../schemas/technocore'

export class ExplorerApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    public readonly status: number,
    public readonly retryAfterSeconds?: number,
    public readonly detail?: string,
  ) {
    super(code)
    this.name = 'ExplorerApiError'
  }
}

function parseClientNumber(value: string): number | string {
  const number = Number(value)
  if (/^-?(0|[1-9]\d*)$/.test(value) && !Number.isSafeInteger(number)) return value
  return number
}

export async function fetchRoomActivity(
  room: string,
  limit: number,
  signal?: AbortSignal,
): Promise<RoomResponse> {
  let response: Response
  try {
    response = await fetch(`/api/rooms/${encodeURIComponent(room)}?limit=${limit}`, { signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ExplorerApiError('NETWORK_ERROR', 0)
  }

  const payload: unknown = await response
    .text()
    .then((text) =>
      parseLosslessJson(text, null, {
        parseNumber: parseClientNumber,
      }),
    )
    .catch(() => null)
  if (!response.ok) {
    const parsedError = apiErrorSchema.safeParse(payload)
    if (parsedError.success) {
      const { code, retryAfterSeconds, detail } = parsedError.data.error
      throw new ExplorerApiError(code, response.status, retryAfterSeconds, detail)
    }
    throw new ExplorerApiError('UPSTREAM_HTTP_ERROR', response.status)
  }

  const parsed = roomResponseSchema.safeParse(payload)
  if (!parsed.success) throw new ExplorerApiError('UPSTREAM_SCHEMA_ERROR', 502)
  return parsed.data
}
