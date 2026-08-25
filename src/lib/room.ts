export const ROOM_PATTERN = /^[a-z0-9][a-z0-9_-]{0,47}$/
const ROOM_CLASS_MARKERS = new Set(['p', 'mb', 'd', 'e'])

export type RoomValidationCode = 'ROOM_REQUIRED' | 'INVALID_ROOM' | 'PRIVATE_ROOM_BLOCKED'

export interface RoomValidationResult {
  valid: boolean
  room: string
  code?: RoomValidationCode
}

export function roomClasses(room: string): Set<string> {
  const segments = room.split('-')
  const classes = new Set<string>()

  for (const segment of segments.slice(0, -1)) {
    if (!ROOM_CLASS_MARKERS.has(segment)) break
    classes.add(segment)
  }

  return classes
}

export function isPrivateRoom(room: string): boolean {
  return roomClasses(room).has('p')
}

export function validatePublicRoom(input: string): RoomValidationResult {
  const room = input.trim()
  if (!room) return { valid: false, room, code: 'ROOM_REQUIRED' }
  if (!ROOM_PATTERN.test(room)) return { valid: false, room, code: 'INVALID_ROOM' }
  if (isPrivateRoom(room)) return { valid: false, room, code: 'PRIVATE_ROOM_BLOCKED' }
  return { valid: true, room }
}
