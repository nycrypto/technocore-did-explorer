import { z } from 'zod'

const decimalNonceSchema = z
  .string()
  .regex(/^(0|[1-9]\d*)$/)
  .max(128)
const safeNonceSchema = z.number().int().nonnegative().safe()

export const roomMessageSchema = z.object({
  seq: z.number().int().nonnegative().safe(),
  ts: z.string().max(64),
  from: z.string().max(56),
  text: z.string().max(4096),
  nonce: z.union([safeNonceSchema, decimalNonceSchema]).optional(),
})

export const roomResponseSchema = z.object({
  room: z.string().min(1).max(48),
  count: z.number().int().nonnegative().safe(),
  first_seq: z.number().int().nonnegative().safe().nullable().optional(),
  last_seq: z.number().int().nonnegative().safe(),
  messages: z.array(roomMessageSchema).max(200),
})

const upstreamNonceSchema = z.union([
  safeNonceSchema,
  z
    .bigint()
    .nonnegative()
    .refine((value) => value.toString().length <= 128),
])

const upstreamRoomMessageSchema = z.object({
  seq: z.number().int().nonnegative().safe(),
  ts: z.string().max(64),
  from: z.string().max(56),
  text: z.string().max(4096),
  nonce: upstreamNonceSchema.optional(),
})

export const upstreamRoomResponseSchema = z.object({
  room: z.string().min(1).max(48),
  count: z.number().int().nonnegative().safe(),
  first_seq: z.number().int().nonnegative().safe().nullable().optional(),
  last_seq: z.number().int().nonnegative().safe(),
  messages: z.array(upstreamRoomMessageSchema).max(200),
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
