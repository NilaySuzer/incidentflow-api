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
```
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
📋 Veri ModeliSistemdeki her bir incident/görev kaydı şu JSON şemasına uyar:   Alan AdıTipZorunlu mu?Açıklama / Kabul Edilen DeğerleridStringSistem TarafındanBenzersiz tanımlayıcı (örn: inc-1729000000)titleStringEvetArıza / görev başlığı   descriptionStringEvetOlayın teknik özeti ve etki alanı   priorityStringEvetP0, P1, P2, P3, high, medium, low   statusStringSistem / Evetinvestigating, in_progress, resolved, completed, pending[cite: 3]assigneeStringEvetGörevlendirilen nöbetçi mühendis kullanıcı adı   environmentStringHayırproduction, staging (Varsayılan: production)createdAtStringSistem TarafındanISO 8601 formatında oluşturulma tarihiupdatedAtStringSistem TarafındanISO 8601 formatında son güncellenme tarihi📡 API Uç Noktaları ve Kullanım ÖrnekleriTemel CRUD İşlemleri1. Yeni Incident OluşturmaEndpoint: POST /tasks   Headers: Content-Type: application/jsonÖrnek Request Body:JSON{
  "title": "Auth Service 502 Bad Gateway Spike",
  "description": "Redis connection pool exhaustion causing session verification failures.",
  "priority": "P0",
  "assignee": "oncall-lead",
  "environment": "production"
}
Başarılı Yanıt (201 Created):JSON{
  "success": true,
  "message": "Görev başarıyla oluşturuldu.",
  "data": {
    "id": "inc-1729267200000",
    "title": "Auth Service 502 Bad Gateway Spike",
    "description": "Redis connection pool exhaustion causing session verification failures.",
    "priority": "P0",
    "status": "investigating",
    "assignee": "oncall-lead",
    "environment": "production",
    "createdAt": "2026-10-18T17:15:00.000Z",
    "updatedAt": "2026-10-18T17:15:00.000Z"
  }
}
2. Tüm Kayıtları ListelemeEndpoint: GET /tasks   Başarılı Yanıt (200 OK):JSON{
  "success": true,
  "total": 3,
  "page": 1,
  "limit": 10,
  "data": [
    {
      "id": "inc-101",
      "title": "Auth Service 502 Bad Gateway Spike",
      "priority": "P0",
      "status": "investigating",
      "assignee": "oncall-lead"
    }
  ]
}
3. Tekil Kayıt DetayıEndpoint: GET /tasks/:id   Örnek İstek: GET /tasks/inc-101Başarılı Yanıt (200 OK):JSON{
  "success": true,
  "data": {
    "id": "inc-101",
    "title": "Auth Service 502 Bad Gateway Spike",
    "description": "Redis connection pool exhaustion causing session verification failures.",
    "priority": "P0",
    "status": "investigating",
    "assignee": "oncall-lead",
    "environment": "production"
  }
}
4. Kayıt GüncellemeEndpoint: PUT /tasks/:id   Örnek İstek: PUT /tasks/inc-101Request Body:JSON{
  "status": "resolved",
  "priority": "P2"
}
Başarılı Yanıt (200 OK):JSON{
  "success": true,
  "message": "Görev başarıyla güncellendi.",
  "data": {
    "id": "inc-101",
    "title": "Auth Service 502 Bad Gateway Spike",
    "status": "resolved",
    "priority": "P2",
    "updatedAt": "2026-10-18T17:25:00.000Z"
  }
}
5. Kayıt SilmeEndpoint: DELETE /tasks/:id   Örnek İstek: DELETE /tasks/inc-102Başarılı Yanıt (200 OK):JSON{
  "success": true,
  "message": "Görev başarıyla silindi.",
  "data": {
    "id": "inc-102"
  }
}
Gelişmiş Arama ve FiltrelemeMetotURL ÖrneğiAçıklamaGET/tasks?status=resolvedSadece çözülen kayıtları listeler   GET/tasks?priority=P0Kritik P0 öncelikli kayıtları listeler   GET/tasks?page=1&limit=5Sayfalama uygular   GET/tasks?sort=createdAtOluşturulma tarihine göre yeniden eskiye sıralar[cite: 8]GET/tasks/search?keyword=redisBaşlık veya açıklamada metin araması yapar[cite: 8]GET/tasks/assignee/nilayBelirli bir mühendise atanan olayları listeler[cite: 8]Raporlama Servisleri1. Genel Sistem ÖzetiEndpoint: GET /reports/summary   Yanıt (200 OK):JSON{
  "success": true,
  "data": {
    "totalTasks": 12,
    "byStatus": {
      "investigating": 4,
      "in_progress": 3,
      "resolved": 5,
      "pending": 0
    },
    "byPriority": {
      "P0": 2,
      "P1": 4,
      "P2": 5,
      "P3": 1
    },
    "activeAssignees": ["oncall-lead", "nilay", "musa"],
    "generatedAt": "2026-10-18T17:30:00.000Z"
  }
}
2. Çözülen Olaylar RaporuEndpoint: GET /reports/completed   3. Bekleyen Olaylar RaporuEndpoint: GET /reports/pending[cite: 10]🛡 Middleware Yapısı1. Request Logger (src/middlewares/logger.js)Sisteme ulaşan tüm istekleri asenkron olarak izler. İstek tamamlandığında konsola şu standartta çıktı üretir:   Plaintext[2026-10-18T17:20:15.123Z] GET /tasks?status=investigating | Status: 200 | 4ms
2. Validation Guard (src/middlewares/validator.js)POST /tasks endpoint'ine gönderilen isteklerin gövdesini doğrular. Eksik parametre veya geçersiz öncelik durumunda işlemi controller katmanına geçirmeden durdurur:   JSON{
  "success": false,
  "error": "ValidationError",
  "message": "Eksik veya hatalı zorunlu alanlar: title, assignee"
}
🚦 Hata Yönetimi ve Durum KodlarıAPI genelinde standartlaştırılmış HTTP durum kodları kullanılır:   200 OK: İstek başarılı.   201 Created: Yeni kayıt başarıyla üretildi[cite: 6].400 Bad Request: Eksik gövde, geçersiz parametre veya doğrulama hatası[cite: 9].404 Not Found: İstenen ID'ye sahip kaynak veya endpoint bulunamadı.500 Internal Server Error: Sunucu tarafı beklenmeyen bir hata.
