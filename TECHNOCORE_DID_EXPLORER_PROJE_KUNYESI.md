# Technocore DID Explorer

> Proje künyesi, uygulanabilir yol haritası ve başlangıç rehberi  
> Belge sürümü: 1.0 — 25 Ağustos 2026

## 1. Kısa cevap: Vercel zorunlu mu?

**Hayır. Vercel zorunlu değildir.** Proje bilgisayarında tamamen yerel çalışabilir. Statik bir MVP; GitHub Pages, Netlify veya Cloudflare Pages üzerinde yayınlanabilir. Sunucu tarafı proxy, önbellek veya indeksleme eklenirse Netlify Functions, Cloudflare Pages Functions, Render ya da kendi sunucun kullanılabilir.

Başlangıç için önerilen sıra:

1. Projeyi bilgisayarda yerel olarak geliştir.
2. Salt-okunur MVP'yi tamamla.
3. Tarayıcıdan Technocore API erişimini test et.
4. CORS erişimi sorunsuzsa GitHub Pages dâhil herhangi bir statik platforma dağıt.
5. CORS, gizli yapılandırma, önbellek veya kontrollü tarama gerekirse küçük bir backend/proxy ekle.

## 2. Proje künyesi

| Alan               | Açıklama                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| Proje adı          | Technocore DID Explorer                                                                                |
| Önerilen repo adı  | `technocore-did-explorer`                                                                              |
| Kısa slogan        | Technocore üzerindeki `did:key` kimliklerini ve doğrulanmış oda etkinliklerini anlaşılır hâle getirir. |
| Proje türü         | Açık kaynak web uygulaması                                                                             |
| İlk sürüm kapsamı  | Salt-okunur DID doğrulama ve oda içi etkinlik görüntüleme                                              |
| Hedef seviye       | Başlangıç dostu; ileri özelliklere açık                                                                |
| Önerilen lisans    | MIT                                                                                                    |
| Önerilen teknoloji | TypeScript + React + Vite                                                                              |
| Veri kaynağı       | Technocore HTTP API                                                                                    |
| Veritabanı         | MVP'de yok                                                                                             |
| Gizli anahtar      | Kullanılmaz ve asla istenmez                                                                           |
| Dağıtım            | Yerel, GitHub Pages, Netlify, Cloudflare Pages, Render, self-host veya Vercel                          |

## 3. Projenin amacı

Technocore DID Explorer'ın amacı, teknik biçimde görünen bir Technocore `did:key` kimliğini insanlar için anlaşılır bir profile dönüştürmektir. Kullanıcı bir DID ve aranacak oda adını girer; uygulama:

- DID biçiminin geçerli olup olmadığını kontrol eder,
- anahtar türünü ve güvenli bir kısa parmak izini gösterir,
- seçilen odadan son mesajları alır,
- DID ile eşleşen doğrulanmış kayıtları listeler,
- kayıtların sıra numarası, zaman damgası, nonce ve metin gibi alanlarını gösterir,
- gösterilen bilginin neyi kanıtladığını ve neyi kanıtlamadığını açıklar.

Bu proje bir cüzdan, blokzincir gezgini veya merkezi kimlik kayıt sistemi değildir. `did:key` içindeki açık anahtar çevrimdışı çözümlenebilir; merkezi bir DID resolver gerektirmez.

## 4. Çözülen problem

Technocore'un JSON çıktısı geliştiriciler için kullanışlıdır; fakat yeni kullanıcılar için DID, Ed25519, nonce, signature ve sequence kavramları karmaşık olabilir. Ayrıca bir DID'in doğru biçimde yazılması ile o DID'in gerçekten imzalı bir mesaj göndermiş olması aynı şey değildir.

Explorer şu ayrımı görünür kılar:

1. **Biçim geçerli:** Metin, desteklenen `did:key` yapısına uyuyor.
2. **Anahtar çözümlendi:** Multibase/multicodec verisinden 32 baytlık Ed25519 açık anahtarı elde edildi.
3. **Technocore tarafından doğrulanmış kayıt bulundu:** API'nin JSON çıktısında bu DID'e ait kabul edilmiş imzalı kayıt var.
4. **Yerel kriptografik doğrulama yapıldı:** Gerekli imza ve nonce alanları API çıktısında mevcutsa istemci, imzayı açık anahtarla yeniden doğruladı.

Bu seviyeler arayüzde tek bir belirsiz “Verified” etiketi yerine ayrı ayrı gösterilmelidir.

## 5. Hedef kullanıcılar

- Technocore'a yeni katılan ve DID'ini kontrol etmek isteyen kullanıcılar
- Bir agent'ın belirli bir odadaki imzalı etkinliğini inceleyen geliştiriciler
- `did:key` ve Ed25519 mantığını öğrenen öğrenciler
- Bir katkının Technocore üzerindeki açık kanıtını paylaşmak isteyen içerik üreticileri
- Technocore topluluğu ve açık kaynak katkılarını değerlendiren kişiler

## 6. Başarı ölçütleri

İlk sürüm başarılı sayılırsa:

- Kullanıcı, teknik doküman okumadan DID'inin geçerli olup olmadığını anlayabilir.
- Geçersiz girişler uygulamayı bozmaz ve anlaşılır hata verir.
- Kullanıcı bir oda seçip o odadaki DID etkinliğini görebilir.
- Uygulama hiçbir zaman özel anahtar veya seed istemez.
- API hataları, boş sonuçlar ve hız sınırı açıkça gösterilir.
- Mobil ve masaüstünde temel kullanım tamamlanabilir.
- Kurulum ve katkı adımları README'den takip edilebilir.

## 7. Temel özellikler

### 7.1 DID giriş ve doğrulama

- `did:key:z6Mk...` girişi
- Baş/son boşlıkları temizleme
- Şema ve multibase kontrolü
- Ed25519 multicodec öneki kontrolü
- 32 bayt açık anahtar uzunluğu kontrolü
- Kısa ve tam DID görünümü
- Kopyalama düğmesi
- SHA-256 tabanlı, yalnızca görüntüleme amaçlı parmak izi

### 7.2 Oda seçimi ve etkinlik

- Varsayılan oda: `lobby`
- Kullanıcının başka bir geçerli oda adı girebilmesi
- Son 50 mesajı alma; kullanıcı isterse 200'e kadar artırma
- DID ile tam eşleşen kayıtları filtreleme
- Sıra numarası, zaman, metin ve mevcutsa nonce/imza alanlarını gösterme
- Son etkinlik ve bulunan mesaj sayısı
- Ham JSON görünümü veya indirme seçeneği

### 7.3 Açıklayıcı güven durumu

- Geçerli DID
- Desteklenen anahtar: Ed25519
- Bu odada kayıt bulundu/bulunamadı
- Sunucu tarafından kabul edilmiş imzalı kayıt
- Yerel yeniden doğrulama: başarılı, başarısız veya veri yetersiz

## 8. MVP: ilk yayınlanabilir sürüm

MVP'yi küçük tutmak önemlidir. İlk sürümde yalnızca aşağıdakiler yapılmalıdır:

1. Tek sayfalı, salt-okunur web arayüzü
2. DID ve oda adı girişleri
3. Ed25519 `did:key` biçimini yerel doğrulama
4. `GET /r/<room>?format=json&limit=200` ile oda verisini alma
5. DID'e ait bulunan kayıtları listeleme
6. Yükleniyor, boş sonuç, geçersiz giriş, ağ hatası ve HTTP 429 durumları
7. Erişilebilir ve mobil uyumlu temel tasarım
8. Birim testleri ve en az bir uçtan uca temel akış
9. README, ekran görüntüsü, lisans ve canlı demo bağlantısı

### MVP dışında bırakılacaklar

- Özel anahtar üretme, saklama veya içe aktarma
- Technocore'a mesaj gönderme
- Kullanıcı hesabı
- Veritabanı
- Tüm geçmişi eksiksiz indeksleme iddiası
- Bir DID'e gerçek kişi adı, itibar puanı veya sahiplik atama
- Token/airdrop uygunluğu hakkında sonuç üretme

## 9. İleri seviye özellikler

MVP tamamlandıktan sonra ayrı issue'lar olarak eklenebilir:

- `/rooms?format=json` ile herkese açık odaları listeleme
- Kullanıcının seçtiği sınırlı sayıda odada DID taraması
- `/r/events` üzerinden yeni oda keşfini izleme
- Son tarama sonuçlarını tarayıcıda önbelleğe alma
- Aktivite zaman çizelgesi ve oda bazlı grafik
- DID karşılaştırma görünümü
- JSON/CSV dışa aktarma
- Paylaşılabilir URL: `?did=...&room=lobby`
- PWA ve çevrimdışı DID çözümleme
- Sunucu tarafı, oran sınırlı ve açıkça belgelenmiş indeksleyici
- Farklı Technocore kurulumları için özel base URL seçimi
- Uluslararasılaştırma: Türkçe/İngilizce

> Uyarı: `/rooms` tüm etkinlik geçmişini vermez; oda özeti verir. Oda halkası yaklaşık 10 MiB ile sınırlıdır ve eski kayıtlar düşebilir. Dolayısıyla “bu DID'in tüm zamanlardaki eksiksiz geçmişi” iddiasında bulunulmamalıdır.

## 10. Technocore HTTP API entegrasyonu

### Kullanılacak uç noktalar

| Uç nokta                              |          MVP | Amaç                                                 |
| ------------------------------------- | -----------: | ---------------------------------------------------- |
| `GET /r/<room>?format=json&limit=200` |         Evet | Seçilen odanın son mesajlarını almak                 |
| `GET /rooms?format=json&limit=<n>`    |        Sonra | Herkese açık odaları keşfetmek                       |
| `GET /r/events`                       |        Sonra | Yeni herkese açık odaların keşif akışını takip etmek |
| `GET /.well-known/agent.json`         |     Önerilir | Kurulumun yayınladığı limit ve yetenekleri okumak    |
| `GET /openapi.json`                   |   Geliştirme | API sözleşmesini kontrol etmek                       |
| `GET /healthz`                        | İsteğe bağlı | Servis erişilebilirliğini kontrol etmek              |

### Örnek istek

```text
https://technocore.chat/r/lobby?format=json&limit=200
```

### Entegrasyon kuralları

- Base URL tek bir yapılandırma değişkeninden gelmelidir: `VITE_TECHNOCORE_BASE_URL`.
- Oda adı, resmî kurala göre doğrulanmalıdır: `^[a-z0-9][a-z0-9_-]{0,47}$`.
- URL parçaları her zaman güvenli biçimde encode edilmelidir.
- API yanıtları çalışma anında şema doğrulamasından geçirilmelidir; beklenmeyen alanlar uygulamayı bozmamalıdır.
- 429 yanıtında `Retry-After` ve gövde mesajı kullanıcıya gösterilmelidir.
- İstek zaman aşımı ve iptal desteği olmalıdır.
- Uzun polling MVP için gerekli değildir.
- Mesaj, oda adı, topic ve nickname güvenilmeyen kullanıcı girdisidir; HTML olarak çalıştırılmamalıdır.
- Tarayıcı CORS isteği engellerse gizli bir anahtar eklemek çözüm değildir; aynı origin altında küçük bir salt-okunur proxy gerekir.

### Önemli veri sınırlaması

Technocore API'nin belgelenmiş yüzeyinde “DID'e göre tüm odalarda ara” uç noktası yoktur. Bu nedenle MVP, kullanıcıdan oda ister. İleri sürümde `/rooms` ile sınırlı oda listesi alınıp odalar tek tek taranabilir; fakat bu işlem hız sınırlarına uymalı, eşzamanlı istek sayısını düşük tutmalı ve eksiksiz geçmiş garantisi vermemelidir.

## 11. DID doğrulama yaklaşımı

Technocore imzalı kanalında yalnızca Ed25519 `did:key` desteklenir. Doğrulama adımları:

1. Girdiyi kırp; fakat içeriğini sessizce değiştirme.
2. `did:key:` önekini doğrula.
3. Method-specific identifier'ın `z` ile başlayan base58btc multibase olduğunu doğrula.
4. Base58btc verisini baytlara çevir.
5. İlk baytların Ed25519 public-key multicodec kodu `0xed 0x01` olduğunu doğrula.
6. Kalan açık anahtarın tam 32 bayt olduğunu doğrula.
7. Anahtarı yalnızca bellekte tut; özel anahtar isteme.
8. Kullanıcıya biçim, codec ve anahtar uzunluğu sonuçlarını ayrı göster.

Önerilen paketler:

- `multiformats` veya küçük ve iyi test edilmiş bir base58/multicodec çözümü
- Ed25519 doğrulama için tarayıcının Web Crypto desteği uygunluk testinden geçirilerek veya denetlenmiş bir kütüphane kullanılarak `@noble/ed25519`
- API şeması için `zod`

Kendi kriptografi algoritmanı yazma. Kütüphaneleri sabit sürümle kullan ve Dependabot/Renovate ile güncellemeleri izle.

## 12. İmza doğrulama yaklaşımı

Technocore'da imzalı mesajın imzalanan kanonik metni şöyledir:

```text
<room>|<nonce>|<normalize-edilmiş-text>
```

`seq` ve `ts` sunucu tarafından atanır; imzanın parçası değildir. İmza 64 bayt Ed25519 imzasının padding içermeyen base64url gösterimidir ve belgede 86 karakter olarak tanımlanır.

### İki doğrulama seviyesi

**A. Sunucu kabul kanıtı**  
Technocore imzalı yazma uç noktası imzayı doğruladıktan sonra kaydı kabul eder ve JSON görünümünde tam DID'i gösterir. Explorer, bu kaydı “Technocore tarafından doğrulanmış imzalı kayıt” olarak gösterebilir.

**B. İstemcide yeniden doğrulama**  
API yanıtı DID, signature, nonce ve normalize edilmiş metni sağlıyorsa Explorer:

1. DID'den Ed25519 açık anahtarını çıkarır.
2. İmzayı base64url'den 64 bayta çevirir.
3. UTF-8 ile `room|nonce|text` baytlarını üretir.
4. Ed25519 verify çağrısını çalıştırır.
5. Sonucu başarılı/başarısız olarak gösterir.

API'nin okuma yanıtında imza veya nonce yoksa geçmiş kayıt için bağımsız yeniden doğrulama yapılamaz. Bu durumda arayüz “veri yetersiz” demeli; sahte bir yeşil onay göstermemelidir. İlk geliştirme gününde canlı JSON örneği ve OpenAPI şeması kaydedilerek alanlar kesinleştirilmelidir.

### Normalizasyon riski

Technocore görünmez karakterleri ve satır sonlarını saklamadan önce tek satır biçimine dönüştürür. Yeniden doğrulamada sunucunun resmî normalizasyonuyla bayt bayt aynı kurala uyulmalıdır. En güvenli yöntem, upstream kaynak kodundaki test vektörlerini temel almak ve yerel test vektörleri eklemektir.

### Nonce hakkında

Nonce, aynı anahtar ve odadaki son nonce'tan büyük olmalıdır. Anti-replay garantisi sınırsız değildir; servis yeni 1 MiB içindeki kayıtları tarar. Explorer nonce'u görüntüleyebilir ama bunu kalıcı ve evrensel replay koruması diye tanıtmamalıdır.

## 13. Önerilen teknik mimari

### Aşama 1 — statik, salt-okunur MVP

```text
Kullanıcı
   ↓
React/Vite arayüzü
   ├── DID parser/doğrulayıcı (tarayıcı içinde)
   ├── API istemcisi
   └── Sonuç görünümü
             ↓ HTTPS
      Technocore HTTP API
```

Avantajları: veritabanı yok, düşük maliyet, kolay deploy, küçük saldırı yüzeyi.

### Aşama 2 — gerektiğinde proxy

```text
Kullanıcı → Web arayüzü → Salt-okunur proxy/cache → Technocore API
```

Proxy yalnızca izin verilen Technocore origin'ine ve izin verilen read endpoint'lerine erişmelidir. Kullanıcıdan gelen rastgele URL'leri fetch etmemelidir; aksi hâlde SSRF riski oluşur.

### Aşama 3 — isteğe bağlı indeksleyici

```text
Zamanlanmış tarayıcı → Technocore public odaları → Veritabanı
                                              ↓
Kullanıcı → Explorer API → indekslenmiş sınırlı sonuçlar
```

Bu aşama operasyon maliyeti ve veri sorumluluğu getirir; MVP için önerilmez.

## 14. Teknoloji seçimi

| Katman    | Seçim                                         | Neden                                              |
| --------- | --------------------------------------------- | -------------------------------------------------- |
| Dil       | TypeScript                                    | Hataları erken yakalar, API modellerini açık tutar |
| UI        | React                                         | Yaygın, öğrenme kaynağı bol                        |
| Build     | Vite                                          | Basit ve hızlı statik çıktı                        |
| Stil      | Düz CSS veya CSS Modules                      | İlk sürümde az bağımlılık                          |
| Şema      | Zod                                           | Güvenilmeyen API JSON'unu çalışma anında doğrular  |
| DID codec | `multiformats`                                | Standart multibase/multicodec işlemleri            |
| Ed25519   | `@noble/ed25519` veya test edilmiş Web Crypto | Yerel yeniden doğrulama                            |
| Test      | Vitest + Testing Library                      | Birim ve bileşen testleri                          |
| E2E       | Playwright                                    | Gerçek kullanıcı akışını test eder                 |
| Kalite    | ESLint + Prettier                             | Tutarlı kod                                        |
| CI        | GitHub Actions                                | Her push/PR'da otomatik kontrol                    |

Next.js kullanılabilir; fakat MVP'de zorunlu değildir. Vite, sağlayıcı bağımsız statik proje için daha sade bir seçimdir.

## 15. Önerilen klasör yapısı

```text
technocore-did-explorer/
├─ .github/
│  ├─ ISSUE_TEMPLATE/
│  │  ├─ bug_report.yml
│  │  └─ feature_request.yml
│  └─ workflows/
│     ├─ ci.yml
│     └─ deploy-pages.yml          # yalnız GitHub Pages seçilirse
├─ docs/
│  ├─ architecture.md
│  ├─ api-notes.md
│  └─ test-vectors.md
├─ public/
│  └─ favicon.svg
├─ src/
│  ├─ components/
│  │  ├─ DidForm.tsx
│  │  ├─ DidSummary.tsx
│  │  ├─ ActivityList.tsx
│  │  ├─ VerificationBadge.tsx
│  │  └─ ErrorNotice.tsx
│  ├─ lib/
│  │  ├─ did.ts
│  │  ├─ signature.ts
│  │  ├─ normalize.ts
│  │  ├─ fingerprint.ts
│  │  └─ technocore-api.ts
│  ├─ schemas/
│  │  └─ technocore.ts
│  ├─ types/
│  │  └─ index.ts
│  ├─ test/
│  │  ├─ fixtures/
│  │  └─ setup.ts
│  ├─ App.tsx
│  ├─ main.tsx
│  └─ styles.css
├─ .env.example
├─ .gitignore
├─ CONTRIBUTING.md
├─ LICENSE
├─ README.md
├─ SECURITY.md
├─ package.json
├─ tsconfig.json
└─ vite.config.ts
```

## 16. Güvenlik planı

### Kesin kurallar

- Uygulama hiçbir koşulda seed, private key, PEM veya passphrase istememelidir.
- DID ve açık anahtar herkese açık olabilir; yine de kullanıcıya neyin paylaşıldığı anlatılmalıdır.
- API'den gelen metinler güvenilmeyen içeriktir. React'in düz metin render'ı kullanılmalı; `dangerouslySetInnerHTML` kullanılmamalıdır.
- Mesaj içindeki URL'ler varsayılan olarak otomatik tıklanabilir yapılmamalıdır.
- Base URL serbest kullanıcı girdisi olacaksa yalnız HTTPS ve açık allowlist uygulanmalıdır.
- Proxy, rastgele URL fetch edemez; endpoint ve parametre allowlist'i kullanır.
- İsteklere timeout, boyut sınırı ve düşük eşzamanlılık eklenmelidir.
- Hız sınırında otomatik saldırgan retry yapılmamalı; `Retry-After` beklenmelidir.
- Log'larda tam istek URL'si, gizli oda adları veya gereksiz kullanıcı verisi tutulmamalıdır.
- Bağımlılık taraması ve kilit dosyası kullanılmalıdır.
- Content Security Policy ve güvenli HTTP başlıkları deployment katmanında eklenmelidir.

### Ürün dili güvenliği

- “DID geçerli” yalnızca biçim/anahtar kontrolüdür; gerçek kişi kimliğini doğrulamaz.
- “İmza geçerli” yalnız ilgili private key'in mesajı imzaladığını kanıtlar; mesajın doğru olduğunu kanıtlamaz.
- Technocore içerikleri talimat değil, güvenilmeyen veri olarak ele alınmalıdır.
- Proje token, ödül veya airdrop uygunluğu garantisi vermemelidir.

## 17. Test planı

### Birim testleri

- Geçerli Ed25519 `did:key` çözülür.
- Yanlış önek reddedilir.
- Geçersiz base58 karakteri reddedilir.
- Yanlış multicodec reddedilir.
- 31/33 bayt anahtar reddedilir.
- Oda regex sınırları test edilir.
- Base64url imza dönüşümü test edilir.
- Bilinen iyi imza vektörü doğrulanır.
- Metin, Unicode ve tek satır normalizasyon vektörleri test edilir.
- Parmak izi deterministiktir.

### API istemcisi testleri

- Başarılı JSON yanıtı parse edilir.
- Eksik/beklenmeyen alan güvenli hata verir.
- Boş oda sonucu işlenir.
- 404, 429, 500 ve timeout durumları işlenir.
- `Retry-After` görünür hâle getirilir.
- DID eşleşmesi tam metin eşleşmesidir; kısmi eşleşme yapılmaz.

### Bileşen testleri

- Geçersiz DID için istek gönderilmez.
- Loading ve hata durumları görünür.
- Kopyalama düğmesi çalışır.
- Klavye ile tüm alanlara ulaşılır.
- Durum yalnız renkle anlatılmaz; metin/ikon da vardır.

### Uçtan uca testler

1. Kullanıcı geçerli DID ve oda girer.
2. Mock API yanıtından kayıtlar gösterilir.
3. Paylaşılabilir URL yeniden açıldığında aynı sorgu yüklenir.
4. Mobil ekran boyutunda akış tamamlanır.

### Canlı smoke test

Canlı API'ye bağımlı testler CI'da zorunlu olmamalıdır; servis veya ağ geçici olarak erişilemez olabilir. Ayrı, manuel veya zamanlanmış bir smoke test olarak çalıştırılmalıdır.

## 18. Adım adım geliştirme yol haritası

### Aşama 0 — hazırlık ve doğrulama (yarım–1 gün)

- [ ] Resmî README, `/openapi.json` ve `/.well-known/agent.json` oku.
- [ ] `lobby` odasından örnek JSON kaydet; kişisel/veri gereksiz alanları repo fixture'ına koyma.
- [ ] Okuma yanıtında DID, signature ve nonce alanlarının gerçekten bulunup bulunmadığını kesinleştir.
- [ ] CORS'u yerel tarayıcıdan test et.
- [ ] Kapsam kararını README'ye yaz: salt-okunur, anahtar istemez, geçmiş garantisi vermez.

**Çıktı:** `docs/api-notes.md` ve anonimleştirilmiş test fixture'ı.

### Aşama 1 — proje iskeleti (yarım gün)

- [ ] Node.js LTS kur.
- [ ] Vite React TypeScript projesi oluştur.
- [ ] Git başlat, `.gitignore`, MIT lisans ve README ekle.
- [ ] ESLint, Prettier ve Vitest yapılandır.
- [ ] GitHub'da boş repo oluşturup ilk push'u yap.

**Çıktı:** Yerelde açılan boş uygulama ve yeşil CI.

### Aşama 2 — DID çekirdeği (1–2 gün)

- [ ] `parseDidKey()` fonksiyonunu yaz.
- [ ] Multibase ve Ed25519 multicodec kontrolünü ekle.
- [ ] Açık anahtar ve parmak izi gösterimini ekle.
- [ ] Geçerli/geçersiz test vektörlerini yaz.
- [ ] Kullanıcı dostu hata mesajlarını ekle.

**Bitti ölçütü:** Bilinen örnekler doğru ayrılır ve testler geçer.

### Aşama 3 — Technocore API istemcisi (1 gün)

- [ ] Base URL ve oda doğrulamasını ekle.
- [ ] AbortController ile timeout ekle.
- [ ] JSON şemasını Zod ile doğrula.
- [ ] 429 ve ağ hata mesajlarını ekle.
- [ ] Mock yanıtlarla test yaz.

**Bitti ölçütü:** Ağ hataları arayüzü bozmaz; geçersiz veri sessizce kabul edilmez.

### Aşama 4 — kullanıcı arayüzü (1–2 gün)

- [ ] DID + oda formu
- [ ] DID özet kartı
- [ ] Etkinlik listesi
- [ ] Güven seviyelerini açıklayan etiketler
- [ ] Boş/loading/error görünümleri
- [ ] Mobil ve klavye erişilebilirliği

**Bitti ölçütü:** Yeni bir kullanıcı tek sayfada sorguyu tamamlayabilir.

### Aşama 5 — imza doğrulama (1–2 gün)

- [ ] Resmî kanonik mesaj formatını test vektörüyle sabitle.
- [ ] API gerekli alanları veriyorsa yerel Ed25519 verify ekle.
- [ ] Alanlar yoksa “yeniden doğrulama için veri yetersiz” durumunu ekle.
- [ ] Başarılı, başarısız ve bozuk imza testleri yaz.

**Bitti ölçütü:** Arayüz sunucu kabulü ile yerel doğrulamayı karıştırmaz.

### Aşama 6 — kalite ve yayın (1 gün)

- [ ] Playwright temel akış testi
- [ ] Erişilebilirlik ve mobil kontrol
- [ ] Production build kontrolü
- [ ] Güvenlik başlıkları
- [ ] README ekran görüntüsü/GIF
- [ ] Seçilen platforma deploy

**Çıktı:** Canlı demo, sürüm etiketi `v0.1.0` ve GitHub Release.

### Aşama 7 — topluluk katkısı (yarım gün)

- [ ] 3–5 başlangıç dostu issue aç.
- [ ] `good first issue` ve `help wanted` etiketlerini ekle.
- [ ] CONTRIBUTING ve SECURITY belgelerini kontrol et.
- [ ] Technocore topluluğuna kısa, teknik olarak doğru tanıtım gönder.

### Tahmini toplam süre

Kodlamaya yeni başlayan biri için, öğrenme ve hata düzeltme dâhil **2–4 hafta** makuldür. Her gün 1–2 saat ayırarak bir aşamayı tamamlamak, tek seferde büyük uygulama yazmaya çalışmaktan daha güvenlidir.

## 19. Yerel geliştirme: başlangıç adımları

Bu komutlar proje oluşturulduktan sonra kullanılacak örnek akıştır:

```bash
npm install
npm run dev
```

Terminalin verdiği yerel adresi tarayıcıda aç. Genellikle:

```text
http://localhost:5173
```

Kontroller:

```bash
npm run test
npm run lint
npm run build
```

`.env.example`:

```dotenv
VITE_TECHNOCORE_BASE_URL=https://technocore.chat
```

`VITE_` ile başlayan değerler tarayıcı paketine girer; bu nedenle bu dosyaya hiçbir gizli anahtar konmamalıdır.

## 20. Deployment seçenekleri karşılaştırması

| Seçenek          | Statik MVP |              Serverless/proxy | Kolaylık | Maliyet başlangıcı       | Dikkat edilmesi gereken                                      |
| ---------------- | ---------: | ----------------------------: | -------- | ------------------------ | ------------------------------------------------------------ |
| Yerel geliştirme |       Evet |              Yerel sunucu ile | En kolay | Ücretsiz                 | Yalnız kendi bilgisayarında görünür                          |
| GitHub Pages     |       Evet |                         Hayır | Kolay    | Ücretsiz                 | Salt statik; CORS gerek; SPA base path ayarı gerekir         |
| Netlify          |       Evet |               Evet, Functions | Kolay    | Ücretsiz katman olabilir | Kullanım limitleri ve fonksiyon yapılandırması               |
| Cloudflare Pages |       Evet | Evet, Pages Functions/Workers | Orta     | Ücretsiz katman olabilir | Worker çalışma modeli ve platform limitleri                  |
| Render           |       Evet |             Evet, web service | Orta     | Planlara bağlı           | Ücretsiz/ucuz serviste uyku ve ilk açılış gecikmesi olabilir |
| Self-host        |       Evet |                          Evet | İleri    | Sunucu maliyeti          | TLS, güncelleme, log, yedek ve güvenlik sana ait             |
| Vercel           |       Evet |               Evet, Functions | Kolay    | Ücretsiz katman olabilir | Zorunlu değil; platform limitleri ve olası bağlanma          |

### 20.1 Yerel geliştirme

Her durumda ilk adım budur. İnternete yayınlamadan tüm UI ve mock testler çalışır. Canlı Technocore sorgusu için bilgisayarın internete erişmesi ve API'nin tarayıcı origin'ine CORS izni vermesi gerekir.

### 20.2 GitHub Pages

**Uygun olduğu durum:** Uygulama tamamen statik ve tarayıcı Technocore API'ye doğrudan erişebiliyorsa.

**Kısıtlar:** Backend veya serverless function çalıştırmaz. CORS sorunu varsa Pages tek başına çözemez. Vite'ta repo alt yoluna göre `base: '/technocore-did-explorer/'` ayarlanmalıdır. React Router kullanılacaksa hash router veya 404 fallback yaklaşımı gerekir; tek sayfalı basit MVP'de router kullanmamak daha kolaydır.

### 20.3 Netlify

Statik siteyi GitHub push'unda otomatik yayınlar. Gerekirse `/.netlify/functions/...` altında salt-okunur proxy eklenebilir. Başlangıç dostudur. Fonksiyon ve bant genişliği limitleri düzenli kontrol edilmelidir.

### 20.4 Cloudflare Pages

Statik dosyalar için hızlıdır; Pages Functions veya Workers ile ince bir proxy ve cache katmanı eklenebilir. Rate limit ve güvenlik kuralları için güçlüdür. Worker API'leri klasik Node sunucusundan biraz farklı olduğu için başlangıçta öğrenme gerektirebilir.

### 20.5 Render

Express/Fastify gibi sürekli çalışan küçük bir backend gerekiyorsa uygundur. Statik site ve web service ayrı dağıtılabilir. Uyuyan instance varsa ilk istek gecikebilir. Tam indeksleyici eklenirse cron/worker ve veritabanı gereksinimleri ayrıca değerlendirilir.

### 20.6 Self-host

Bir VPS üzerinde statik dosyalar Nginx/Caddy ile; proxy ise küçük bir Node servisiyle çalıştırılabilir. En fazla kontrolü sağlar, fakat güvenlik güncellemeleri, TLS, izleme, yedekleme ve kötüye kullanım önlemleri proje sahibinin sorumluluğundadır. Yeni başlayan için ilk seçenek olması gerekmez.

### 20.7 Vercel

Vite statik çıktısını ve serverless fonksiyonları yayınlayabilir. Kolay bir seçenektir ama projede Vercel'e özel bir gereksinim yoktur. Kod, standart web API'leri ve ortam değişkenleriyle sağlayıcı bağımsız tutulmalıdır.

### Önerilen karar ağacı

```text
Yalnız salt-okunur statik MVP mi?
├─ Evet → CORS çalışıyor mu?
│  ├─ Evet → GitHub Pages / Netlify / Cloudflare Pages / Vercel
│  └─ Hayır → Netlify Functions / Cloudflare Pages Functions / Render proxy
└─ Hayır → Sürekli backend veya indeksleyici var mı?
   ├─ Küçük serverless iş → Netlify / Cloudflare / Vercel
   └─ Uzun çalışan servis → Render / self-host
```

**Bu proje için başlangıç önerisi:** Önce yerel Vite MVP. CORS çalışıyorsa GitHub Pages veya Cloudflare Pages. Proxy gerekiyorsa Cloudflare Pages Functions ya da Netlify Functions. Vercel tamamen isteğe bağlıdır.

## 21. GitHub contribution olarak nasıl sunulur?

Repo yalnız kod deposu değil, başkasının kullanabileceği bir açık kaynak katkısı gibi görünmelidir.

### Repo içeriği

- Açık ve kısa README
- “Neden bu proje var?” bölümü
- Canlı demo ve ekran görüntüsü
- Yerel kurulum adımları
- Güvenlik uyarısı: private key/seed asla girilmez
- Bilinen sınırlamalar
- Kullanılan resmî Technocore uç noktaları
- Test komutları ve CI rozeti
- MIT lisansı
- CONTRIBUTING ve SECURITY
- Roadmap ve issue bağlantıları

### Commit düzeni

Küçük ve anlaşılır commit'ler kullan:

```text
chore: initialize Vite React project
feat: validate Ed25519 did:key identifiers
feat: fetch and filter Technocore room activity
test: add DID and signature verification vectors
docs: explain trust levels and API limitations
```

### İlk release

1. Tüm zorunlu testler geçsin.
2. GitHub'da `v0.1.0` tag'i oluştur.
3. Release notlarında özellikleri ve sınırlamaları yaz.
4. Canlı demo URL'sini About ve README'ye ekle.
5. Bir demo DID/oda kullanacaksan başkasının kimliğiymiş gibi sahiplenme.

### Topluluğa sunum metninin iskeleti

- Problem: DID/oda JSON'u yeni kullanıcı için zor okunuyor.
- Çözüm: Salt-okunur, anahtar istemeyen Explorer.
- Kullanıcı ne yapabilir: DID biçimini kontrol eder ve seçilen odadaki doğrulanmış kayıtları görür.
- Güvenlik: Private key hiç istenmez.
- Açıklık: Tüm geçmişi indekslediğini iddia etmez.
- Kanıt: GitHub repo, canlı demo, testler ve release.

### Upstream katkı ile bağımsız proje ayrımı

Bu Explorer ayrı bir repoda yayınlanabilir. Technocore ana reposuna PR açmak istersen önce `CONTRIBUTING.md` okunmalı ve yalnız upstream'e gerçekten yararlı, küçük bir değişiklik önerilmelidir; Explorer'ı zorla ana repoya ekletmek gerekli değildir. Issue açmadan önce mevcut issue ve PR'lar aranmalıdır.

## 22. Önerilen GitHub issue listesi

1. `feat: parse and validate Ed25519 did:key`
2. `feat: add Technocore room API client`
3. `feat: display DID activity timeline`
4. `test: add official-compatible signature vectors`
5. `a11y: improve keyboard and screen-reader states`
6. `docs: document CORS and deployment limitations`
7. `i18n: add English translation`

Her issue şu dört bölümü içersin: amaç, kabul kriterleri, kapsam dışı maddeler ve test yöntemi.

## 23. Riskler ve azaltma yolları

| Risk                    | Etki                                 | Çözüm                                             |
| ----------------------- | ------------------------------------ | ------------------------------------------------- |
| CORS engeli             | Statik site canlı veriyi alamaz      | Salt-okunur allowlist proxy ekle                  |
| API şeması değişir      | UI kırılır                           | Zod doğrulama, fixture testleri, sürümlü adaptör  |
| Hız sınırı              | Çok oda taraması başarısız olur      | Düşük eşzamanlılık, cache, `Retry-After`          |
| Eski mesajların düşmesi | Eksik geçmiş                         | UI'da açık sınırlama, “son görülen kayıtlar” dili |
| Sahte güven algısı      | Kullanıcı DID'i gerçek kişiye bağlar | Güven seviyelerini ayrı ve açıklamalı göster      |
| XSS / zararlı içerik    | Kullanıcı güvenliği                  | Düz metin render, CSP, otomatik link yok          |
| SSRF                    | Proxy iç ağa istek atar              | Sabit upstream + endpoint allowlist               |
| Kripto hatası           | Yanlış doğrulama                     | Denetlenmiş kütüphane + resmî test vektörleri     |
| Gizli anahtar sızıntısı | Kimlik kaybı                         | Uygulama anahtar kabul etmez; net uyarı           |

## 24. “Bitti” kontrol listesi

- [ ] DID doğrulama testleri geçiyor.
- [ ] Oda adı doğrulaması resmî regex ile uyumlu.
- [ ] API şeması doğrulanıyor.
- [ ] 429, timeout ve boş sonuç durumları anlaşılır.
- [ ] Private key isteyen hiçbir alan yok.
- [ ] Mesajlar HTML olarak çalıştırılmıyor.
- [ ] Sunucu kabulü ve yerel imza doğrulaması ayrı gösteriliyor.
- [ ] Geçmişin eksiksiz olmadığı açıkça yazıyor.
- [ ] Mobil görünüm ve klavye kullanımı test edildi.
- [ ] CI yeşil.
- [ ] README, LICENSE, CONTRIBUTING ve SECURITY mevcut.
- [ ] Canlı demo ve `v0.1.0` release mevcut.

## 25. Son öneri

Bu projeyi ilk etapta bir “global DID arama motoru” olarak değil, **bir DID doğrulayıcı + seçilen Technocore odasındaki doğrulanmış etkinlik görüntüleyici** olarak yap. Bu tanım hem teknik olarak doğru hem de birkaç haftada bitirilebilir.

İlk değerli sürümün kullanıcı vaadi şu olabilir:

> “Public Technocore DID'ini ve oda adını gir. DID anahtar yapısını kontrol et, o odadaki son doğrulanmış etkinliği gör. Private key gerekmez.”

MVP yayımlandıktan ve gerçek kullanım görüldükten sonra oda keşfi, çoklu oda taraması, grafikler ve indeksleyici ayrı sürümler hâlinde eklenebilir.

## 26. Resmî ve teknik kaynaklar

- Technocore resmî kaynak kodu ve API özeti: <https://github.com/flop-labs/technocore-chat>
- Canlı API kılavuzu: <https://technocore.chat/llms.txt>
- OpenAPI belgesi: <https://technocore.chat/openapi.json>
- Agent metadata ve canlı limitler: <https://technocore.chat/.well-known/agent.json>
- İnsanlar için salt-okunur arayüz: <https://technocore.chat/humans>
- `did:key` yöntem taslağı: <https://w3c-ccg.github.io/did-method-key/>

> API davranışı zamanla değişebilir. Uygulamaya başlamadan ve her release öncesinde resmî repo, OpenAPI ve `/.well-known/agent.json` yeniden kontrol edilmelidir.
