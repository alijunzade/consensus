# Psikiyatri İçerik Pipeline

Bir konu girişiyle Instagram carousel + Twitter thread otomatik üretir ve paylaşır.

## Mimari

```
Konu (GitHub Actions input)
    ↓
Claude API + Consensus MCP  →  Literatür tarama (200M+ makale)
    ↓
Claude API                  →  14 slayt içeriği + caption + hashtag
    ↓
Puppeteer                   →  14 × 1080x1080 PNG
    ↓
Ayrshare API                →  Instagram carousel + Twitter thread
```

## Kurulum

### 1. Repo'ya ekle

Bu klasörü mevcut GitHub reponuzun içine koyun (veya yeni repo oluşturun).

### 2. GitHub Secrets ekle

Repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Değer |
|--------|-------|
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `AYRSHARE_API_KEY` | Ayrshare API key |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token (bildirimler için) |
| `TELEGRAM_CHAT_ID` | Telegram chat ID |

### 3. Ayrshare hesabı

1. [app.ayrshare.com](https://app.ayrshare.com) üzerinde hesap açın
2. Instagram Business ve Twitter hesaplarınızı bağlayın
3. API key'i kopyalayın

### 4. Consensus hesabı

Consensus MCP OAuth ile çalışıyor — ilk çalıştırmada tarayıcı açılıp izin isteyecek.
Sonraki çalışmalarda otomatik devam eder.

---

## Kullanım

### GitHub Actions üzerinden (önerilen)

1. Repo → Actions → "Psikiyatri İçerik Pipeline"
2. "Run workflow" → konuyu yaz → Çalıştır
3. ~10-15 dakika sonra Telegram'dan bildirim gelir
4. Artifact'ten PNG'leri indir (gerekirse)

### Lokal test

```bash
cd psikiyatri-content
cp .env.example .env
# .env dosyasını doldurun

npm install
node src/pipeline.js "menopozda östrojen patchi ve psikoloji" --dry-run
```

---

## Çıktılar

Her çalışma `output/` altında bir klasör oluşturur:

```
output/2025-06-15T09-30-00_menopozda_ostrojen/
  ├── 01_literature.json      # Consensus tarama sonuçları
  ├── 02_content.json         # Slayt içerikleri
  ├── 03_caption.txt          # Instagram caption (kopyalamaya hazır)
  ├── 03_twitter_thread.txt   # Twitter thread metni
  ├── 04_publish_results.json # Paylaşım sonuçları
  └── slides/
      ├── slide_01.png
      ├── slide_02.png
      └── ... (14 adet)
```

---

## Tasarım Sistemi

- **Arka plan:** Navy `#0A1628`
- **Vurgu:** Teal `#1D9E75`  
- **Öne çıkan:** Amber `#F0A500`
- **Başlık fontu:** Playfair Display
- **Gövde fontu:** Inter
- **Boyut:** 1080×1080px (Instagram kare)
- **Watermark:** `@alisanburak`

Tasarımı değiştirmek için `templates/slide.html` dosyasını düzenleyin.

---

## NotebookLM (Manuel Adım)

NotebookLM'in halka açık API'si bulunmuyor. Podcast üretimi için:

1. `output/.../01_literature.json` dosyasını NotebookLM'e yükleyin
2. "Audio Overview" oluşturun
3. Videoyu aşağıdaki prompt ile caption + hashtag üretin:

```
Bu NotebookLM podcast için TikTok/Reels caption ve hashtag yaz.
Konu: [konu]
Platform tonu: eğitici ama sohbet havasında
```
