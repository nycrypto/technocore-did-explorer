import { z } from 'zod'

export const roomMessageSchema = z.object({
  seq: z.number().int().nonnegative().safe(),
  ts: z.string().max(64),
  from: z.string().max(56),
  text: z.string().max(4096),
  nonce: z.number().int().nonnegative().safe().optional(),
})

export const roomResponseSchema = z.object({
  room: z.string().min(1).max(48),
  count: z.number().int().nonnegative().safe(),
  first_seq: z.number().int().nonnegative().safe().nullable().optional(),
  last_seq: z.number().int().nonnegative().safe(),
  messages: z.array(roomMessageSchema).max(200),
})

export const apiErrorCodeSchema = z.enum([
  'INVALID_ROOM',
  'PRIVATE_ROOM_BLOCKED',
  'INVALID_LIMIT',
  'METHOD_NOT_ALLOWED',
  'UPSTREAM_RATE_LIMITED',
  'UPSTREAM_HTTP_ERROR',
  'UPSTREAM_SCHEMA_ERROR',
  'UPSTREAM_TIMEOUT',
  'RESPONSE_TOO_LARGE',
  'NETWORK_ERROR',
  'NOT_FOUND',
])

export const apiErrorSchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    upstreamStatus: z.number().int().optional(),
    retryAfterSeconds: z.number().int().nonnegative().optional(),
    detail: z.string().max(1024).optional(),
  }),
})

export type RoomMessage = z.infer<typeof roomMessageSchema>
export type RoomResponse = z.infer<typeof roomResponseSchema>
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>
export type ApiErrorPayload = z.infer<typeof apiErrorSchema>
