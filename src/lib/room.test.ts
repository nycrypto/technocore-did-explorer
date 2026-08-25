import { describe, expect, it } from 'vitest'
import { isPrivateRoom, roomClasses, validatePublicRoom } from './room'

describe('room policy', () => {
  it.each(['lobby', 'room-1', 'a_b', 'd-owned', 'mb-mailbox'])('accepts public room %s', (room) => {
    expect(validatePublicRoom(room)).toEqual({ valid: true, room })
  })

  it.each(['', 'Uppercase', '-leading', 'with space', 'a'.repeat(49)])(
    'rejects malformed room %j',
    (room) => expect(validatePublicRoom(room).valid).toBe(false),
  )

  it.each(['p-secret', 'mb-p-secret', 'e-p-secret', 'd-mb-p-secret'])(
    'blocks composed private room %s',
    (room) => {
      expect(isPrivateRoom(room)).toBe(true)
      expect(validatePublicRoom(room).code).toBe('PRIVATE_ROOM_BLOCKED')
    },
  )

  it('stops class parsing at the first ordinary segment', () => {
    expect(roomClasses('mb-community-p-topic')).toEqual(new Set(['mb']))
    expect(isPrivateRoom('mb-community-p-topic')).toBe(false)
  })
})
