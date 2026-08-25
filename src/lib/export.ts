import type { KeyFingerprint } from './fingerprint'
import type { RoomMessage, RoomResponse } from '../schemas/technocore'

export interface ExplorerExportV1 {
  schemaVersion: 1
  source: 'https://technocore.chat'
  queriedAt: string
  did: string
  fingerprint: KeyFingerprint
  room: string
  requestedLimit: number
  resultCount: number
  firstSeq: number | null
  lastSeq: number
  historyComplete: false
  trust: {
    didKeyValid: true
    ed25519KeyResolved: true
    serverAcceptedSignedRecord: boolean
    localSignatureReverification: 'unavailable'
  }
  messages: RoomMessage[]
}

export function createExplorerExport(
  did: string,
  fingerprint: KeyFingerprint,
  room: RoomResponse,
  requestedLimit: number,
  matches: RoomMessage[],
  queriedAt: string,
): ExplorerExportV1 {
  return {
    schemaVersion: 1,
    source: 'https://technocore.chat',
    queriedAt,
    did,
    fingerprint,
    room: room.room,
    requestedLimit,
    resultCount: matches.length,
    firstSeq: room.first_seq ?? null,
    lastSeq: room.last_seq,
    historyComplete: false,
    trust: {
      didKeyValid: true,
      ed25519KeyResolved: true,
      serverAcceptedSignedRecord: matches.length > 0,
      localSignatureReverification: 'unavailable',
    },
    messages: matches,
  }
}
