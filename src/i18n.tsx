import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type Locale = 'tr' | 'en'

const en = {
  brandEyebrow: 'PUBLIC KEY ACTIVITY, MADE LEGIBLE',
  brandTitle: 'Technocore DID Explorer',
  brandSubtitle:
    'Resolve an Ed25519 did:key locally, then inspect its latest server-accepted activity in a public Technocore room.',
  readOnlyPill: 'Read-only · no private keys',
  language: 'Language',
  theme: 'Theme',
  lightTheme: 'Use light theme',
  darkTheme: 'Use dark theme',
  formTitle: 'Inspect a public DID',
  didLabel: 'Public DID',
  didPlaceholder: 'did:key:z6Mk…',
  didHelp: 'Only a public Ed25519 did:key. Never paste a seed, private key or passphrase.',
  roomLabel: 'Public room',
  roomHelp: 'Lowercase letters, digits, hyphens and underscores. Private p- rooms are blocked.',
  limitLabel: 'Messages to inspect',
  search: 'Inspect activity',
  searching: 'Inspecting…',
  initialTitle: 'Verification without identity theatre',
  initialBody:
    'A valid key proves structure, not a real-world identity. A Technocore record proves the service accepted a signed write, not that its message is true.',
  didSummaryTitle: 'Resolved key',
  didSummaryDescription: 'Decoded in this browser. The DID is never sent to the Explorer API.',
  shortenedDid: 'Short DID',
  fullDid: 'Full DID',
  keyType: 'Key type',
  fingerprint: 'Short fingerprint',
  fullFingerprint: 'Full SHA-256 fingerprint',
  copy: 'Copy',
  copied: 'Copied to clipboard.',
  copyFailed: 'Could not copy to the clipboard.',
  trustTitle: 'What this result proves',
  trustDid: 'DID structure is valid',
  trustKey: '32-byte Ed25519 public key resolved',
  trustFound: 'Exact DID activity found in this room',
  trustNotFound: 'No exact DID activity found in this room slice',
  trustServer: 'Matching records were accepted through Technocore’s signed lane',
  trustServerMissing: 'No server-accepted matching record is visible in this room slice',
  trustLocalUnavailable: 'Local signature re-verification unavailable',
  trustLocalReason: 'Room reads expose the nonce but not the signature bytes.',
  historyNotice:
    'This is a recent room slice, not a complete history. Older records may have expired or fallen out of Technocore’s bounded ring.',
  activityTitle: 'Matching activity ({count})',
  noActivityTitle: 'No matching activity found',
  noActivityBody:
    'The DID is valid, but it does not appear in the fetched portion of this public room.',
  sequence: 'Sequence',
  timestamp: 'Timestamp',
  nonce: 'Nonce',
  message: 'Message',
  rawJsonTitle: 'Evidence export',
  rawJsonDescription:
    'A versioned JSON snapshot containing only the exact matching records and explicit trust limits.',
  downloadJson: 'Download JSON',
  showRawJson: 'Show raw JSON',
  hideRawJson: 'Hide raw JSON',
  share: 'Copy share link',
  shared: 'Share link copied.',
  sourceLabel: 'Source',
  queriedAt: 'Queried',
  errorTitle: 'The query could not be completed',
  retryAfter: 'Try again in approximately {seconds} seconds.',
  apiDetail: 'Technocore response: {detail}',
  footer:
    'Open-source, read-only and intentionally narrow. It never asks for a private key and never claims complete history.',
  DID_REQUIRED: 'Enter a public DID.',
  INVALID_DID_PREFIX: 'The DID must start with did:key: exactly as shown.',
  INVALID_MULTIBASE: 'The method-specific identifier must use z-prefixed base58btc multibase.',
  INVALID_BASE58: 'The DID contains invalid base58btc data.',
  UNSUPPORTED_CODEC: 'This key codec is not supported. Technocore signed records use Ed25519.',
  INVALID_KEY_LENGTH: 'The decoded Ed25519 public key must be exactly 32 bytes.',
  ROOM_REQUIRED: 'Enter a public room name.',
  INVALID_ROOM:
    'Use 1–48 lowercase letters, digits, hyphens or underscores, starting with a letter or digit.',
  PRIVATE_ROOM_BLOCKED:
    'Private p- rooms are capability secrets and cannot be queried through this hosted Explorer.',
  INVALID_LIMIT: 'Choose a message limit between 1 and 200.',
  METHOD_NOT_ALLOWED: 'The Explorer API is read-only.',
  UPSTREAM_RATE_LIMITED: 'Technocore is rate limiting reads right now.',
  UPSTREAM_HTTP_ERROR: 'Technocore returned an upstream error.',
  UPSTREAM_SCHEMA_ERROR: 'Technocore returned data in an unexpected shape.',
  UPSTREAM_TIMEOUT: 'Technocore did not respond before the request timed out.',
  RESPONSE_TOO_LARGE: 'The room response exceeded the Explorer safety limit.',
  NETWORK_ERROR: 'The Explorer could not reach Technocore.',
  NOT_FOUND: 'The Explorer API route was not found.',
} as const

type TranslationKey = keyof typeof en

const tr: Record<TranslationKey, string> = {
  brandEyebrow: 'AÇIK ANAHTAR ETKİNLİĞİ, ANLAŞILIR HÂLDE',
  brandTitle: 'Technocore DID Explorer',
  brandSubtitle:
    'Ed25519 did:key anahtarını yerelde çözümleyin, ardından public bir Technocore odasındaki son sunucu-kabul edilmiş etkinliğini inceleyin.',
  readOnlyPill: 'Salt okunur · özel anahtar yok',
  language: 'Dil',
  theme: 'Tema',
  lightTheme: 'Açık temayı kullan',
  darkTheme: 'Koyu temayı kullan',
  formTitle: 'Public bir DID inceleyin',
  didLabel: 'Public DID',
  didPlaceholder: 'did:key:z6Mk…',
  didHelp: 'Yalnız public Ed25519 did:key. Seed, özel anahtar veya parola asla yapıştırmayın.',
  roomLabel: 'Public oda',
  roomHelp: 'Küçük harf, rakam, tire ve alt çizgi. Özel p- odaları engellenir.',
  limitLabel: 'İncelenecek mesaj',
  search: 'Etkinliği incele',
  searching: 'İnceleniyor…',
  initialTitle: 'Kimlik yanılsaması olmadan doğrulama',
  initialBody:
    'Geçerli anahtar yalnız yapıyı kanıtlar, gerçek dünyadaki kimliği değil. Technocore kaydı, servisin imzalı yazmayı kabul ettiğini kanıtlar; mesajın doğru olduğunu değil.',
  didSummaryTitle: 'Çözümlenen anahtar',
  didSummaryDescription: 'Bu tarayıcıda çözümlendi. DID, Explorer API’sine gönderilmez.',
  shortenedDid: 'Kısa DID',
  fullDid: 'Tam DID',
  keyType: 'Anahtar türü',
  fingerprint: 'Kısa parmak izi',
  fullFingerprint: 'Tam SHA-256 parmak izi',
  copy: 'Kopyala',
  copied: 'Panoya kopyalandı.',
  copyFailed: 'Panoya kopyalanamadı.',
  trustTitle: 'Bu sonuç neyi kanıtlıyor?',
  trustDid: 'DID yapısı geçerli',
  trustKey: '32 baytlık Ed25519 açık anahtarı çözüldü',
  trustFound: 'Bu odada tam DID eşleşmeli etkinlik bulundu',
  trustNotFound: 'Bu oda diliminde tam DID eşleşmeli etkinlik bulunamadı',
  trustServer: 'Eşleşen kayıtlar Technocore’un imzalı kanalı üzerinden kabul edildi',
  trustServerMissing: 'Bu oda diliminde sunucu-kabul edilmiş eşleşen kayıt görünmüyor',
  trustLocalUnavailable: 'Yerel imza yeniden doğrulaması kullanılamıyor',
  trustLocalReason: 'Oda okuma yanıtı nonce alanını verir, imza baytlarını vermez.',
  historyNotice:
    'Bu görünüm eksiksiz geçmiş değil, yakın tarihli bir oda dilimidir. Eski kayıtlar süresi dolduğu veya Technocore’un sınırlı halkasından düştüğü için görünmeyebilir.',
  activityTitle: 'Eşleşen etkinlik ({count})',
  noActivityTitle: 'Eşleşen etkinlik bulunamadı',
  noActivityBody: 'DID geçerli; ancak public odanın getirilen bölümünde bu DID görünmüyor.',
  sequence: 'Sıra',
  timestamp: 'Zaman',
  nonce: 'Nonce',
  message: 'Mesaj',
  rawJsonTitle: 'Kanıt dışa aktarımı',
  rawJsonDescription:
    'Yalnız tam eşleşen kayıtları ve açık güven sınırlarını içeren sürümlü JSON anlık görüntüsü.',
  downloadJson: 'JSON indir',
  showRawJson: 'Ham JSON’u göster',
  hideRawJson: 'Ham JSON’u gizle',
  share: 'Paylaşım bağlantısını kopyala',
  shared: 'Paylaşım bağlantısı kopyalandı.',
  sourceLabel: 'Kaynak',
  queriedAt: 'Sorgu zamanı',
  errorTitle: 'Sorgu tamamlanamadı',
  retryAfter: 'Yaklaşık {seconds} saniye sonra yeniden deneyin.',
  apiDetail: 'Technocore yanıtı: {detail}',
  footer:
    'Açık kaynak, salt okunur ve bilinçli olarak dar kapsamlıdır. Özel anahtar istemez ve eksiksiz geçmiş iddiasında bulunmaz.',
  DID_REQUIRED: 'Public bir DID girin.',
  INVALID_DID_PREFIX: 'DID, gösterildiği gibi did:key: ile başlamalıdır.',
  INVALID_MULTIBASE: 'Yönteme özgü kimlik, z önekli base58btc multibase kullanmalıdır.',
  INVALID_BASE58: 'DID geçersiz base58btc verisi içeriyor.',
  UNSUPPORTED_CODEC: 'Bu anahtar codec’i desteklenmiyor. Technocore Ed25519 kullanır.',
  INVALID_KEY_LENGTH: 'Çözümlenen Ed25519 açık anahtarı tam 32 bayt olmalıdır.',
  ROOM_REQUIRED: 'Public bir oda adı girin.',
  INVALID_ROOM: 'Harf veya rakamla başlayan 1–48 küçük harf, rakam, tire ya da alt çizgi kullanın.',
  PRIVATE_ROOM_BLOCKED:
    'Özel p- odaları capability sırrıdır ve barındırılan Explorer üzerinden sorgulanamaz.',
  INVALID_LIMIT: '1 ile 200 arasında bir mesaj sınırı seçin.',
  METHOD_NOT_ALLOWED: 'Explorer API’si salt okunurdur.',
  UPSTREAM_RATE_LIMITED: 'Technocore şu anda okuma isteklerini hız sınırına alıyor.',
  UPSTREAM_HTTP_ERROR: 'Technocore upstream hatası döndürdü.',
  UPSTREAM_SCHEMA_ERROR: 'Technocore beklenmeyen biçimde veri döndürdü.',
  UPSTREAM_TIMEOUT: 'Technocore zaman aşımı süresi içinde yanıt vermedi.',
  RESPONSE_TOO_LARGE: 'Oda yanıtı Explorer güvenlik sınırını aştı.',
  NETWORK_ERROR: 'Explorer Technocore’a erişemedi.',
  NOT_FOUND: 'Explorer API yolu bulunamadı.',
}

const messages: Record<Locale, Record<TranslationKey, string>> = { en, tr }

interface I18nValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, values?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nValue | null>(null)

function initialLocale(): Locale {
  const query = new URLSearchParams(window.location.search).get('lang')
  if (query === 'tr' || query === 'en') return query
  const stored = localStorage.getItem('technocore-locale')
  if (stored === 'tr' || stored === 'en') return stored
  return navigator.language.toLowerCase().startsWith('tr') ? 'tr' : 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(initialLocale)

  useEffect(() => {
    document.documentElement.lang = locale
    localStorage.setItem('technocore-locale', locale)
    const url = new URL(window.location.href)
    url.searchParams.set('lang', locale)
    window.history.replaceState({}, '', url)
  }, [locale])

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale,
      t: (key, values = {}) =>
        Object.entries(values).reduce(
          (result, [name, replacement]) => result.replaceAll(`{${name}}`, String(replacement)),
          messages[locale][key],
        ),
    }),
    [locale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// Kept beside the provider so consumers cannot accidentally import a second context.
// eslint-disable-next-line react-refresh/only-export-components
export function useI18n(): I18nValue {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used inside I18nProvider')
  return value
}
