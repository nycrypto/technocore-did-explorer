import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { abbreviateDid, DidKeyError, parseDidKey } from './lib/did'
import type { DidKeyErrorCode, ParsedDidKey } from './lib/did'
import { ExplorerApiError, fetchRoomActivity } from './lib/api'
import { createExplorerExport } from './lib/export'
import { fingerprintPublicKey } from './lib/fingerprint'
import type { KeyFingerprint } from './lib/fingerprint'
import { validatePublicRoom } from './lib/room'
import type { RoomValidationCode } from './lib/room'
import type { ApiErrorCode, RoomMessage, RoomResponse } from './schemas/technocore'
import { useI18n } from './i18n'
import './styles.css'

const LIMIT_OPTIONS = [50, 100, 200] as const
type LimitOption = (typeof LIMIT_OPTIONS)[number]
type Theme = 'light' | 'dark'

interface FieldErrors {
  did?: DidKeyErrorCode
  room?: RoomValidationCode
}

interface SearchResult {
  parsedDid: ParsedDidKey
  fingerprint: KeyFingerprint
  roomResponse: RoomResponse
  matches: RoomMessage[]
  limit: LimitOption
  queriedAt: string
}

interface QueryError {
  code: ApiErrorCode
  retryAfterSeconds?: number
  detail?: string
}

function initialTheme(): Theme {
  const stored = localStorage.getItem('technocore-theme')
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function initialLimit(params: URLSearchParams): LimitOption {
  const candidate = Number(params.get('limit'))
  return LIMIT_OPTIONS.includes(candidate as LimitOption) ? (candidate as LimitOption) : 50
}

function CheckIcon({ muted = false }: { muted?: boolean }) {
  return (
    <span className={`status-icon ${muted ? 'status-icon--muted' : ''}`} aria-hidden="true">
      {muted ? '—' : '✓'}
    </span>
  )
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  )
}

function ThemeIcon({ theme }: { theme: Theme }) {
  return theme === 'dark' ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 14.2A9 9 0 1 1 9.8 3 7 7 0 0 0 21 14.2Z" />
    </svg>
  )
}

export default function App() {
  const { locale, setLocale, t } = useI18n()
  const initialParams = useMemo(() => new URLSearchParams(window.location.search), [])
  const [didInput, setDidInput] = useState(initialParams.get('did') ?? '')
  const [roomInput, setRoomInput] = useState(initialParams.get('room') ?? 'lobby')
  const [limit, setLimit] = useState<LimitOption>(() => initialLimit(initialParams))
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [queryError, setQueryError] = useState<QueryError | null>(null)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [rawVisible, setRawVisible] = useState(false)
  const [liveMessage, setLiveMessage] = useState('')
  const didRef = useRef<HTMLInputElement>(null)
  const roomRef = useRef<HTMLInputElement>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const autoQueryStarted = useRef(false)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('technocore-theme', theme)
  }, [theme])

  useEffect(() => () => controllerRef.current?.abort(), [])

  const runQuery = useCallback(
    async (values: { did: string; room: string; limit: LimitOption }, updateUrl: boolean) => {
      const errors: FieldErrors = {}
      let parsedDid: ParsedDidKey | undefined

      try {
        parsedDid = parseDidKey(values.did)
      } catch (error) {
        errors.did = error instanceof DidKeyError ? error.code : 'INVALID_BASE58'
      }

      const roomValidation = validatePublicRoom(values.room)
      if (!roomValidation.valid) errors.room = roomValidation.code

      setFieldErrors(errors)
      setQueryError(null)
      setLiveMessage('')

      if (errors.did || !parsedDid) {
        didRef.current?.focus()
        return
      }
      if (errors.room || !roomValidation.valid) {
        roomRef.current?.focus()
        return
      }

      const normalizedDid = parsedDid.did
      const normalizedRoom = roomValidation.room
      if (updateUrl) {
        const url = new URL(window.location.href)
        url.searchParams.set('did', normalizedDid)
        url.searchParams.set('room', normalizedRoom)
        url.searchParams.set('limit', String(values.limit))
        url.searchParams.set('lang', locale)
        window.history.replaceState({}, '', url)
      }

      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller
      setLoading(true)
      setResult(null)
      setRawVisible(false)

      try {
        const [fingerprint, roomResponse] = await Promise.all([
          fingerprintPublicKey(parsedDid.publicKey),
          fetchRoomActivity(normalizedRoom, values.limit, controller.signal),
        ])
        if (controller.signal.aborted) return

        const matches = roomResponse.messages.filter((message) => message.from === normalizedDid)
        setDidInput(normalizedDid)
        setRoomInput(normalizedRoom)
        setResult({
          parsedDid,
          fingerprint,
          roomResponse,
          matches,
          limit: values.limit,
          queriedAt: new Date().toISOString(),
        })
      } catch (error) {
        if (controller.signal.aborted) return
        if (error instanceof ExplorerApiError) {
          setQueryError({
            code: error.code,
            retryAfterSeconds: error.retryAfterSeconds,
            detail: error.detail,
          })
        } else {
          setQueryError({ code: 'NETWORK_ERROR' })
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    },
    [locale],
  )

  useEffect(() => {
    if (autoQueryStarted.current) return
    autoQueryStarted.current = true
    const did = initialParams.get('did')
    if (!did) return
    // A valid shared URL is intentionally executable on first load.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void runQuery(
      {
        did,
        room: initialParams.get('room') ?? 'lobby',
        limit: initialLimit(initialParams),
      },
      false,
    )
  }, [initialParams, runQuery])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void runQuery({ did: didInput, room: roomInput, limit }, true)
  }

  async function copyText(value: string, message: string) {
    try {
      await navigator.clipboard.writeText(value)
      setLiveMessage(message)
    } catch {
      setLiveMessage(t('copyFailed'))
    }
  }

  const exported = useMemo(
    () =>
      result
        ? createExplorerExport(
            result.parsedDid.did,
            result.fingerprint,
            result.roomResponse,
            result.limit,
            result.matches,
            result.queriedAt,
          )
        : null,
    [result],
  )

  function downloadJson() {
    if (!exported || !result) return
    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' })
    const href = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = href
    link.download = `technocore-${result.roomResponse.room}-${result.fingerprint.short.replaceAll(':', '')}.json`
    link.click()
    URL.revokeObjectURL(href)
  }

  function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp)
    if (Number.isNaN(date.getTime())) return timestamp
    return `${new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'medium',
      timeZone: 'UTC',
    }).format(date)} UTC`
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Technocore DID Explorer">
          <span className="brand-mark" aria-hidden="true">
            T<span>•</span>
          </span>
          <span>Technocore / DID</span>
        </a>
        <div className="header-controls">
          <div className="language-switcher" aria-label={t('language')}>
            <button
              className={locale === 'tr' ? 'is-active' : ''}
              type="button"
              onClick={() => setLocale('tr')}
              aria-pressed={locale === 'tr'}
            >
              TR
            </button>
            <button
              className={locale === 'en' ? 'is-active' : ''}
              type="button"
              onClick={() => setLocale('en')}
              aria-pressed={locale === 'en'}
            >
              EN
            </button>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? t('lightTheme') : t('darkTheme')}
            title={theme === 'dark' ? t('lightTheme') : t('darkTheme')}
          >
            <ThemeIcon theme={theme} />
          </button>
        </div>
      </header>

      <main>
        <section className="hero" aria-labelledby="page-title">
          <div className="hero-copy">
            <p className="eyebrow">{t('brandEyebrow')}</p>
            <h1 id="page-title">{t('brandTitle')}</h1>
            <p className="hero-subtitle">{t('brandSubtitle')}</p>
            <span className="security-pill">
              <span aria-hidden="true">⌁</span> {t('readOnlyPill')}
            </span>
          </div>

          <form className="query-card" onSubmit={handleSubmit} noValidate>
            <div className="card-heading">
              <span className="step-number">01</span>
              <h2>{t('formTitle')}</h2>
            </div>

            <div className="field-group">
              <label htmlFor="did-input">{t('didLabel')}</label>
              <input
                ref={didRef}
                id="did-input"
                name="did"
                value={didInput}
                onChange={(event) => setDidInput(event.target.value)}
                placeholder={t('didPlaceholder')}
                spellCheck="false"
                autoCapitalize="none"
                autoComplete="off"
                aria-invalid={Boolean(fieldErrors.did)}
                aria-describedby={fieldErrors.did ? 'did-error' : 'did-help'}
              />
              <p id="did-help" className="field-help">
                {t('didHelp')}
              </p>
              {fieldErrors.did && (
                <p id="did-error" className="field-error" role="alert">
                  {t(fieldErrors.did)}
                </p>
              )}
            </div>

            <div className="form-row">
              <div className="field-group field-group--grow">
                <label htmlFor="room-input">{t('roomLabel')}</label>
                <input
                  ref={roomRef}
                  id="room-input"
                  name="room"
                  value={roomInput}
                  onChange={(event) => setRoomInput(event.target.value)}
                  spellCheck="false"
                  autoCapitalize="none"
                  autoComplete="off"
                  aria-invalid={Boolean(fieldErrors.room)}
                  aria-describedby={fieldErrors.room ? 'room-error' : 'room-help'}
                />
                <p id="room-help" className="field-help">
                  {t('roomHelp')}
                </p>
                {fieldErrors.room && (
                  <p id="room-error" className="field-error" role="alert">
                    {t(fieldErrors.room)}
                  </p>
                )}
              </div>
              <div className="field-group field-group--limit">
                <label htmlFor="limit-select">{t('limitLabel')}</label>
                <select
                  id="limit-select"
                  value={limit}
                  onChange={(event) => setLimit(Number(event.target.value) as LimitOption)}
                >
                  {LIMIT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button className="primary-button" type="submit" disabled={loading}>
              <span>{loading ? t('searching') : t('search')}</span>
              <span aria-hidden="true">→</span>
            </button>
          </form>
        </section>

        <div className="live-region" aria-live="polite" aria-atomic="true">
          {liveMessage}
        </div>

        {queryError && (
          <section className="error-notice" role="alert">
            <span className="error-mark" aria-hidden="true">
              !
            </span>
            <div>
              <h2>{t('errorTitle')}</h2>
              <p>{t(queryError.code)}</p>
              {queryError.retryAfterSeconds !== undefined && (
                <p>{t('retryAfter', { seconds: queryError.retryAfterSeconds })}</p>
              )}
              {queryError.detail && (
                <p className="api-detail">{t('apiDetail', { detail: queryError.detail })}</p>
              )}
            </div>
          </section>
        )}

        {!result && !loading && !queryError && (
          <section className="empty-state">
            <span className="empty-orbit" aria-hidden="true">
              <i />
            </span>
            <div>
              <h2>{t('initialTitle')}</h2>
              <p>{t('initialBody')}</p>
            </div>
          </section>
        )}

        {loading && (
          <section className="loading-state" aria-live="polite">
            <span className="loader" aria-hidden="true" />
            <p>{t('searching')}</p>
          </section>
        )}

        {result && exported && (
          <section className="results" aria-live="polite">
            <div className="result-grid">
              <article className="panel did-panel">
                <div className="panel-kicker">02 / DID</div>
                <div className="panel-heading">
                  <div>
                    <h2>{t('didSummaryTitle')}</h2>
                    <p>{t('didSummaryDescription')}</p>
                  </div>
                  <span className="verified-stamp" aria-label={t('trustDid')}>
                    ✓
                  </span>
                </div>

                <dl className="definition-list">
                  <div>
                    <dt>{t('shortenedDid')}</dt>
                    <dd>
                      <code>{abbreviateDid(result.parsedDid.did)}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>{t('keyType')}</dt>
                    <dd>{result.parsedDid.codec}</dd>
                  </div>
                  <div>
                    <dt>{t('fingerprint')}</dt>
                    <dd className="value-with-action">
                      <code>{result.fingerprint.short}</code>
                      <button
                        type="button"
                        className="copy-button"
                        onClick={() => void copyText(result.fingerprint.full, t('copied'))}
                        aria-label={`${t('copy')}: ${t('fullFingerprint')}`}
                      >
                        <CopyIcon />
                      </button>
                    </dd>
                  </div>
                  <div className="definition-list__wide">
                    <dt>{t('fullDid')}</dt>
                    <dd className="value-with-action">
                      <code className="breakable">{result.parsedDid.did}</code>
                      <button
                        type="button"
                        className="copy-button"
                        onClick={() => void copyText(result.parsedDid.did, t('copied'))}
                        aria-label={`${t('copy')}: ${t('fullDid')}`}
                      >
                        <CopyIcon />
                      </button>
                    </dd>
                  </div>
                  <div className="definition-list__wide">
                    <dt>{t('fullFingerprint')}</dt>
                    <dd>
                      <code className="breakable fingerprint-full">{result.fingerprint.full}</code>
                    </dd>
                  </div>
                </dl>
              </article>

              <article className="panel trust-panel">
                <div className="panel-kicker">03 / TRUST</div>
                <h2>{t('trustTitle')}</h2>
                <ul className="trust-list">
                  <li>
                    <CheckIcon /> <span>{t('trustDid')}</span>
                  </li>
                  <li>
                    <CheckIcon /> <span>{t('trustKey')}</span>
                  </li>
                  <li>
                    <CheckIcon muted={result.matches.length === 0} />
                    <span>{t(result.matches.length > 0 ? 'trustFound' : 'trustNotFound')}</span>
                  </li>
                  <li>
                    <CheckIcon muted={result.matches.length === 0} />
                    <span>
                      {t(result.matches.length > 0 ? 'trustServer' : 'trustServerMissing')}
                    </span>
                  </li>
                  <li className="trust-list__muted">
                    <CheckIcon muted />
                    <span>
                      {t('trustLocalUnavailable')}
                      <small>{t('trustLocalReason')}</small>
                    </span>
                  </li>
                </ul>
              </article>
            </div>

            <div className="history-notice">
              <span aria-hidden="true">i</span>
              <p>{t('historyNotice')}</p>
            </div>

            <div className="activity-heading">
              <div>
                <p className="panel-kicker">04 / ACTIVITY</p>
                <h2>{t('activityTitle', { count: result.matches.length })}</h2>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => void copyText(window.location.href, t('shared'))}
              >
                <CopyIcon /> {t('share')}
              </button>
            </div>

            {result.matches.length === 0 ? (
              <div className="no-results">
                <h3>{t('noActivityTitle')}</h3>
                <p>{t('noActivityBody')}</p>
              </div>
            ) : (
              <ol className="activity-list">
                {result.matches.map((activity) => (
                  <li key={activity.seq} className="activity-card">
                    <div className="activity-sequence">
                      <span>{t('sequence')}</span>
                      <strong>#{activity.seq}</strong>
                    </div>
                    <div className="activity-content">
                      <div className="activity-meta">
                        <span>
                          {t('timestamp')} · {formatTimestamp(activity.ts)}
                        </span>
                        {activity.nonce !== undefined && (
                          <span>
                            {t('nonce')} · <code>{activity.nonce}</code>
                          </span>
                        )}
                      </div>
                      <p>{activity.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}

            <article className="panel export-panel">
              <div>
                <p className="panel-kicker">05 / JSON</p>
                <h2>{t('rawJsonTitle')}</h2>
                <p>{t('rawJsonDescription')}</p>
              </div>
              <div className="export-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setRawVisible((visible) => !visible)}
                  aria-expanded={rawVisible}
                >
                  {t(rawVisible ? 'hideRawJson' : 'showRawJson')}
                </button>
                <button
                  type="button"
                  className="primary-button primary-button--small"
                  onClick={downloadJson}
                >
                  {t('downloadJson')} ↓
                </button>
              </div>
              {rawVisible && <pre className="raw-json">{JSON.stringify(exported, null, 2)}</pre>}
              <div className="export-meta">
                <span>{t('sourceLabel')}: technocore.chat</span>
                <span>
                  {t('queriedAt')}: {formatTimestamp(result.queriedAt)}
                </span>
              </div>
            </article>
          </section>
        )}
      </main>

      <footer>
        <p>{t('footer')}</p>
        <a href="https://github.com/flop-labs/technocore-chat" target="_blank" rel="noreferrer">
          Technocore source ↗
        </a>
      </footer>
    </div>
  )
}
