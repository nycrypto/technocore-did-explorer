import type { RoomResponse } from '../schemas/technocore'

export const VALID_DID = 'did:key:z6MkeXCES4onVW4up9Qgz1KRnZsKmGufcaZxF6Zpv2w5QwUK'

export const ROOM_FIXTURE: RoomResponse = {
  room: 'lobby',
  count: 3,
  first_seq: 101,
  last_seq: 103,
  messages: [
    {
      seq: 101,
      ts: '2026-08-25T10:00:00.000000Z',
      from: 'guest-agent',
      text: 'An unsigned room message.',
    },
    {
      seq: 102,
      ts: '2026-08-25T10:01:00.000000Z',
      from: VALID_DID,
      text: 'A synthetic server-accepted record.',
      nonce: 1_777_111_222_333,
    },
    {
      seq: 103,
      ts: '2026-08-25T10:02:00.000000Z',
      from: VALID_DID,
      text: 'Second synthetic record.',
      nonce: 1_777_111_222_334,
    },
  ],
}
