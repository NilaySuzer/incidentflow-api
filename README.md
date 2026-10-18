# IncidentFlow API — SRE & Incident Management System

IncidentFlow, yazılım operasyon ekiplerinin ve Site Reliability Engineering (SRE) birimlerinin üretim (production) ve test ortamlarında karşılaştığı teknik arızaları, servis kesintilerini ve altyapı darboğazlarını merkezi olarak yönetmek üzere geliştirilmiş RESTful bir backend servisidir.

Sistem, geleneksel iş takip mantığını doğrudan canlı sistem olay müdahalesi (incident triage) süreçlerine uyarlar[cite: 1, 3]. Görevler öncelik seviyelerine göre sınıflandırılır, nöbetçi mühendislere atanır ve olay yaşam döngüsü boyunca izlenir.

---

## 📑 İçindekiler
- [Özellikler](#-özellikler)
- [Mimari ve Klasör Yapısı](#-mimari-ve-klasör-yapısı)
- [Teknoloji Yığını](#-teknoloji-yığını)
- [Kurulum ve Çalıştırma](#-kurulum-ve-çalıştırma)
- [Veri Modeli](#-veri-modeli)
- [API Uç Noktaları ve Kullanım Örnekleri](#-api-uç-noktaları-ve-kullanım-örnekleri)
  - [Temel CRUD İşlemleri](#temel-crud-işlemleri)
  - [Gelişmiş Arama ve Filtreleme](#gelişmiş-arama-ve-filtreleme)
  - [Raporlama Servisleri](#raporlama-servisleri)
- [Middleware Yapısı](#-middleware-yapısı)
- [Hata Yönetimi ve Durum Kodları](#-hata-yönetimi-ve-durum-kodları)

---

## ⚡ Özellikler

### Temel Kapsam (Zorunlu)
- **RESTful Mimari:** HTTP standartlarına (`GET`, `POST`, `PUT`, `DELETE`) tam uyumlu CRUD operasyonları[cite: 1, 6].
- **Custom Request Logger:** Gelen tüm HTTP isteklerini zaman damgası, metot, URL, durum kodu ve milisaniye cinsinden yanıt süresiyle konsola basan middleware.
- **Kalıcı Dosya Depolama:** `fs` (File System) modülü aracılığıyla `tasks.json` dosyasına güvenli okuma/yazma.

### İleri Seviye Pratikler (İsteğe Bağlı)
- **Validation Middleware:** `POST` isteklerinde eksik veya geçersiz alanları denetleyerek açıklayıcı `400 Bad Request` yanıtları üretme.
- **Çoklu Filtreleme & Sıralama:** Durum (`status`), öncelik (`priority`) ve tarihe (`createdAt`) göre dinamik sorgulama.
- **Sayfalama (Pagination):** Büyük veri setleri için `page` ve `limit` parametreleri.
- **Tam Metin Arama:** Başlık ve açıklama alanlarında anahtar kelime taraması (`/tasks/search?keyword=...`).
- **Analitik Raporlama Servisleri:** Sistem genelindeki arıza durum ve öncelik dağılımlarını hesaplayan istatistik uçları (`/reports/*`).

---

## 📂 Mimari ve Klasör Yapısı

Proje, **Separation of Concerns (İlgilerin Ayrımı)** prensibine uygun katmanlı bir yapıda geliştirilmiştir[cite: 1, 5]:

```text
incidentflow-api/
├── src/
│   ├── app.js                 # Express yapılandırması, middleware ve route tanımları
│   ├── server.js              # HTTP sunucusu ve port dinleme
│   ├── controllers/
│   │   ├── taskController.js   # Incident CRUD, arama ve filtreleme iş mantığı
│   │   └── reportController.js # Raporlama ve istatistik hesaplama mantığı
│   ├── routes/
│   │   ├── taskRoutes.js       # /tasks endpoint yönlendirmeleri
│   │   └── reportRoutes.js     # /reports endpoint yönlendirmeleri
│   ├── middlewares/
│   │   ├── logger.js           # İstek kayıt middleware'i
│   │   └── validator.js        # İstek gövdesi doğrulama middleware'i
│   └── data/
│       └── tasks.json          # Kalıcı JSON veritabanı
├── .gitignore
├── package.json
└── README.md

🛠 Teknoloji YığınıÇalışma Zamanı (Runtime): Node.js[cite: 1, 2]Web Çatısı: Express.js[cite: 1, 2]Geliştirme Aracı: NodemonTest ve Dokümantasyon: Postman   🚀 Kurulum ve Çalıştırma1. Projeyi Klonlayın veya İndirinBashgit clone <repo-url>
cd incidentflow-api
2. Bağımlılıkları YükleyinBashnpm install
3. Sunucuyu BaşlatınGeliştirme modunda (canlı yeniden başlatma ile) çalıştırmak için:Bashnpm run dev
Üretim modunda çalıştırmak için:Bashnpm start
Sunucu başarıyla ayağa kalktığında terminalde şu bilgileri göreceksiniz:Plaintext========================================
IncidentFlow API Server running on port 3000
Health Check: http://localhost:3000/
Tasks API:    http://localhost:3000/tasks
Reports API:  http://localhost:3000/reports/summary
========================================
---

## 📋 Veri Modeli

Sistemdeki her bir incident/görev kaydı şu JSON şemasına uyar[cite: 5]:

| Alan Adı | Tip | Zorunlu mu? | Açıklama / Kabul Edilen Değerler |
| :--- | :--- | :--- | :--- |
| `id` | `String` | Sistem Tarafından | Benzersiz tanımlayıcı (örn: `inc-1729272000000`) |
| `title` | `String` | Evet | Arıza / görev başlığı |
| `description`| `String` | Evet | Olayın teknik özeti ve etki alanı |
| `priority` | `String` | Evet | `P0`, `P1`, `P2`, `P3`, `high`, `medium`, `low` |
| `status` | `String` | Sistem / Evet | `investigating`, `in_progress`, `resolved`, `completed`, `pending`[cite: 3] |
| `assignee` | `String` | Evet | Görevlendirilen nöbetçi mühendis kullanıcı adı |
| `environment`| `String` | Hayır | `production`, `staging` (Varsayılan: `production`) |
| `createdAt` | `String` | Sistem Tarafından | ISO 8601 formatında oluşturulma tarihi |
| `updatedAt` | `String` | Sistem Tarafından | ISO 8601 formatında son güncellenme tarihi |

---
## 🛠 Teknoloji Yığını

* **Çalışma Zamanı (Runtime):** Node.js[cite: 1, 2]
* **Web Çatısı:** Express.js[cite: 1, 2]
* **Geliştirme Aracı:** Nodemon
* **Test ve Doğrulama:** Postman[cite: 7]

---

## 🚀 Kurulum ve Çalıştırma

### 1. Bağımlılıkları Yükleyin
```bash
npm install
2. Sunucuyu Başlatın
Geliştirme modunda (canlı yeniden başlatma ile) çalıştırmak için:Bashnpm run dev
Üretim modunda çalıştırmak için:Bashnpm start
Sunucu varsayılan olarak http://localhost:3000 portunda çalışacaktır.📋 Veri ModeliSistemdeki her bir kayıt şu JSON şemasına uyar:   Alan AdıTipZorunlu mu?Açıklama / Kabul Edilen DeğerleridStringSistem TarafındanBenzersiz tanımlayıcı (örn: inc-1729272000000)titleStringEvetOlay / görev başlığı   descriptionStringEvetHatanın teknik detayı   priorityStringEvetP0, P1, P2, P3, high, medium, low   statusStringSistem / Evetinvestigating, in_progress, resolved, completed, pending   assigneeStringEvetSorumlu nöbetçi mühendis   environmentStringHayırproduction, staging (Varsayılan: production)createdAtStringSistem TarafındanISO 8601 oluşturulma tarihiupdatedAtStringSistem TarafındanISO 8601 son güncellenme tarihi📡 API Uç Noktaları ve Kullanım Örnekleri1. Temel CRUD İşlemleri (Zorunlu)Yeni Kayıt OluşturmaEndpoint: POST /tasks   Headers: Content-Type: application/jsonBody:JSON{
  "title": "Auth Service 502 Bad Gateway Spike",
  "description": "Redis connection pool exhaustion.",
  "priority": "P0",
  "assignee": "nilay",
  "environment": "production"
}
Yanıt (201 Created):JSON{
  "success": true,
  "message": "Görev başarıyla oluşturuldu.",
  "data": {
    "id": "inc-1729267200000",
    "title": "Auth Service 502 Bad Gateway Spike",
    "priority": "P0",
    "status": "investigating",
    "assignee": "nilay",
    "createdAt": "2026-10-18T17:15:00.000Z"
  }
}
Tüm Kayıtları Listeleme
Endpoint: GET /tasks   Yanıt (200 OK):JSON{
  "success": true,
  "total": 3,
  "page": 1,
  "limit": 10,
  "data": [ ... ]
}
Tekil Kayıt Detayı
Endpoint: GET /tasks/:id   Örnek: GET /tasks/inc-101   Yanıt (200 OK):JSON{
  "success": true,
  "data": {
    "id": "inc-101",
    "title": "Auth Service 502 Bad Gateway Spike",
    "status": "investigating"
  }
}
Kayıt Güncelleme
Endpoint: PUT /tasks/:id   Örnek: PUT /tasks/inc-101   Body:JSON{
  "status": "resolved",
  "priority": "P2"
}
Yanıt (200 OK):JSON{
  "success": true,
  "message": "Görev başarıyla güncellendi."
}
Kayıt Silme
Endpoint: DELETE /tasks/:id   Örnek: DELETE /tasks/inc-102   Yanıt (200 OK):JSON{
  "success": true,
  "message": "Görev başarıyla silindi."
}

2. Gelişmiş Filtreleme ve Arama (İsteğe Bağlı)
Metot  URL  Açıklama GET/tasks?status=resolved Çözülen vakaları listeler
GET/tasks?priority=P0Kritik P0 seviyesindeki vakaları listeler
GET/tasks?page=1&limit=5Sayfalama yapar
GET/tasks?sort=createdAtTarihe göre sıralar
GET/tasks/search?keyword=redis Başlık veya açıklamada metin arar
GET/tasks/assignee/:assigneeMühendise göre listeler

3. Raporlama Servisleri (İsteğe Bağlı)
Genel Özet: GET /reports/summary (Toplam vaka, durum ve öncelik sayıları)
Çözülenler: GET /reports/completed
Bekleyenler: GET /reports/pending

🛡️ Middleware Mimarisi
Request Logger (src/middlewares/logger.js): Gelen her HTTP isteğini zaman damgası, metot, endpoint, HTTP durum kodu ve yanıt süresi (ms) ile konsola kaydeder.
Validator (src/middlewares/validator.js): POST /tasks gövdesindeki zorunlu alanları (title, description, priority, assignee) denetler; eksik veya geçersiz veri durumunda 400 Bad Request yanıtı döner.

🚦 HTTP Durum Kodları
200 OK: İşlem başarılı.
201 Created: Kayıt başarıyla eklendi.
400 Bad Request: Eksik alan veya geçersiz veri.
404 Not Found: İstenen ID veya endpoint bulunamadı.
500 Internal Server Error: Beklenmeyen sunucu hatası.
