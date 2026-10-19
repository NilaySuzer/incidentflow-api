# INCIDENTFLOW — PROJE TANITIM VE SİSTEM TASARIM DOKÜMANI

**Proje Adı:** IncidentFlow API  
**Kapsam:** Görev ve Olay Yönetim Sistemi Backend Geliştirme (Bitirme Projesi)
**Teknoloji Yığını:** Node.js, Express.js, RESTful Architecture, JSON / fs
**Geliştirici:** Fatma Nilay Süzer  
**Tarih:** 2026

---

## 1. Projenin Amacı ve Problem Tanımı

Yazılım operasyonlarında (DevOps/SRE), üretim ve test ortamlarında meydana gelen kesintilerin, performans darboğazlarının ve altyapı arızalarının anlık olarak izlenmesi, doğru personele atanması ve yaşam döngüsünün kayıt altına alınması kritik bir gereksinimdir.

**IncidentFlow**, yazılım şirketlerinin operasyonel arıza ve görev takip süreçlerini tek bir merkezden yönetebilmesi için REST mimarisiyle tasarlanmış, yüksek performanslı ve hafif bir backend servisidir.

---

## 2. Sistem Senaryosu ve İş Akışı

Sistem, ekiplerin üretim ortamı vakalarını (incidents) önceliklendirerek çözmesini sağlar:

1. **Olay Kaydı:** Yeni bir sistem arızası veya teknik görev sisteme girildiğinde varsayılan olarak `investigating` durumunda başlatılır ve ilgili nöbetçi mühendise atanır.
2. **Önceliklendirme:** Olaylar etki alanına göre `P0` (Kritik kesinti), `P1` (Yüksek risk), `P2` (Orta risk) ve `P3` (Düşük risk) olarak sınıflandırılır.
3. **Müdahale ve Çözüm:** Atanan mühendis arıza durumunu `in_progress` ve ardından `resolved` olarak günceller.
4. **Analitik Takip:** Raporlama modülü üzerinden çözülen ve müdahale bekleyen vaka sayıları ile genel sistem sağlığı izlenir.

---

## 3. Sistem Mimarisi ve Katman Yapısı

Proje, **Separation of Concerns (İlgilerin Ayrımı)** ilkesine uygun katmanlı mimaride geliştirilmiştir:

- **Application Layer (`app.js` & `server.js`):** Express yapılandırması, global middleware entegrasyonu ve sunucu dinleme mekanizması.
- **Routing Layer (`src/routes/`):** İstekleri uygun iş mantığına yönlendiren modüler rota yöneticileri (`taskRoutes.js`, `reportRoutes.js`).
- **Controller Layer (`src/controllers/`):** CRUD operasyonları, arama, filtreleme, sayfalama ve raporlama hesaplamalarının yürütüldüğü fonksiyonel katman.
- **Middleware Layer (`src/middlewares/`):**
  - `logger.js`: Zorunlu izleme katmanı; istek metodunu, hedef yolu, HTTP yanıt kodunu ve milisaniye cinsinden süreyi ISO zaman damgasıyla kaydeder.
  - `validator.js`: İleri seviye doğrulama katmanı; `POST` gövdesindeki zorunlu alanları ve veri tiplerini denetleyerek hatalı isteklerde `400 Bad Request` üretir.
- **Data Layer (`src/data/tasks.json`):** Node.js `fs` modülü ile disk üzerinde kalıcı olarak okunan ve güncellenen JSON veri deposu.

---

## 4. Veri Modeli Tasarımı (Entity: Task / Incident)

Sistemdeki her bir varlık aşağıdaki alan yapısına sahiptir:

| Alan Adı      | Veri Tipi | Zorunluluk | Açıklama                                                           |
| :------------ | :-------- | :--------- | :----------------------------------------------------------------- |
| `id`          | `String`  | Otomatik   | Benzersiz kayıt anahtarı (`inc-timestamp`)                         |
| `title`       | `String`  | Zorunlu    | Hata veya görev başlığı                                            |
| `description` | `String`  | Zorunlu    | Teknik detay, kök neden ve etki özeti                              |
| `priority`    | `String`  | Zorunlu    | `P0`, `P1`, `P2`, `P3` (veya `high`, `medium`, `low`)              |
| `status`      | `String`  | Zorunlu    | `investigating`, `in_progress`, `resolved`, `completed`, `pending` |
| `assignee`    | `String`  | Zorunlu    | Sorumlu nöbetçi mühendis/kullanıcı adı                             |
| `environment` | `String`  | Opsiyonel  | `production`, `staging` (Varsayılan: `production`)                 |
| `createdAt`   | `String`  | Otomatik   | ISO 8601 oluşturulma zaman damgası                                 |
| `updatedAt`   | `String`  | Otomatik   | ISO 8601 son güncellenme zaman damgası                             |

---

## 5. REST API Uç Noktaları Özeti

### Zorunlu CRUD Modülü

- `POST /tasks`: Yeni görev/arıza kaydı oluşturma (`201 Created`).
- `GET /tasks`: Tüm görevleri listeleme (`200 OK`).
- `GET /tasks/:id`: Belirtilen ID'ye sahip görevin detayını getirme (`200 OK` / `404 Not Found`).
- `PUT /tasks/:id`: Görev durum ve bilgilerini güncelleme (`200 OK`).
- `DELETE /tasks/:id`: Görevi sistemden silme (`200 OK`).

### İsteğe Bağlı İleri Seviye Servisler

- `GET /tasks?status=&priority=&page=&limit=&sort=`: Çoklu filtreleme, sayfalama ve sıralama desteği.
- `GET /tasks/search?keyword=`: Başlık ve açıklamalarda metin araması
- `GET /tasks/assignee/:assignee`: Mühendis bazlı vaka listeleme.
- `GET /reports/summary`: Sistem geneli durum ve öncelik dağılım istatistikleri.
- `GET /reports/completed`: Tamamlanan olaylar raporu.
- `GET /reports/pending`: Bekleyen açık vakalar raporu.

---

## 6. Test ve Doğrulama

Tüm uç noktalar Postman üzerinden fonksiyonel testlere tabi tutulmuştur[cite: 7]. HTTP durum kodlarının standartlara uygunluğu (`200`, `201`, `400`, `404`), `logger` çıktılarının konsol tutarlılığı ve JSON dosya yazma/okuma senkronizasyonu doğrulanmıştır.
