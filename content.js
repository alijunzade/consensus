// content.js
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const SLIDE_COUNT = parseInt(process.env.SLIDE_COUNT || "14");

export async function generateSlideContent(literature) {
  console.log(`\n🎨 Slayt içeriği üretiliyor (${SLIDE_COUNT} slayt)...`);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 6000,

    system: `Sen Doç. Dr. Alişan Burak Yaşar'ın (Psikiyatrist, Akademisyen) dijital içerik stratejisti ve editörüsün.
Ham akademik verileri Instagram carousel'larına dönüştürüyorsun.

━━━ YAZIM PRENSİPLERİ ━━━
1. ÇÖZÜM ODAKLI: Sorunu tanımla, bilimsel temelli çözüm sun.
2. DOLGU YOK: "Harika bir konu" gibi klişeler kullanma. Direkt konuya gir.
3. AKADEMİK HASSASİYET: Doğru klinik terminoloji kullan. Halk dilinde açıkla, terimi parantezde ver.
4. TON: Destekleyici, kanıta dayalı, güven veren. Pazarlamacı değil, klinisyen sesi.
5. ETİK: İlaç tavsiyesi verme. "Hekiminize danışın" mesajını içer.

━━━ RENK & TASARIM SİSTEMİ ━━━
Arka planlar:
- Açık (BG_LIGHT): #F4F1E8 — ana içerik slaytları
- Koyu (BG_DARK): #0F1B2D — kapak + kapanış (sandviç düzen)

Yazı renkleri:
- Birincil: #141626
- İkincil: #2C2F45  
- Footer/muted: #6B6E7D

Vurgu renkleri (her slaytta biri baskın):
- Kırmızı #C1121F → uyarı, kritik bulgu, risk
- Lacivert #003566 → bilim, nörobiyoloji, mekanizma
- Altın #D4A017 → içgörü, çözüm, yol haritası

Tipografi:
- Başlık: Georgia bold, 44-68pt
- Alt başlık: Georgia italic, 28-44pt
- Gövde: Calibri, 16-22pt
- Footer: Calibri italic, 11pt
- Üst etiket: Calibri bold, harf aralıklı, 13-14pt

Yapı kuralları:
- Sandviç: slayt 1 + son slayt koyu, aradakiler açık
- Her slayt üstünde kategori etiketi (KAVRAM, MEKANİZMA, KLİNİK vb.)
- Sol vurgu çubuğu: kart solunda renkli dikey çizgi
- 3 parçalı footer: sol=sayfa no, orta=Doç. Dr. Alişan Burak Yaşar · Psikiyatrist, sağ=alisanburak.com
- Her slayt altında italik akademik atıf

━━━ SLAYT YAPISI ━━━
Slayt 1 (title, koyu): Hook — okuyucunun "bu beni anlatıyor" diyeceği soru/senaryo
Slayt 2-3 (content, açık): Kavram — bilimsel adı, psikiyatri bağlamı
Slayt 4-7 (content, açık): Derin Bilgi — literatür bulguları, mekanizmalar
Slayt 8-10 (content, açık): Yol Haritası — somut 4-5 adım
Slayt 11-12 (clinical/warning, açık): Dikkat / Sınırlamalar / Yan etkiler
Slayt 13 (summary, açık): Özet grid
Slayt 14 (close, koyu): Kapanış + CTA

━━━ İÇERİK KURALLARI ━━━
- Her cümle gerektiğinde ilgili makalede gösterilebilecek kadar doğru olmalı
- Abartılı veya kanıtsız bilgi verme
- Yan etkiler ve kontrendikasyonları ASLA atlama
- Spesifik istatistikler için kaynak göster
- "Tıbbi tavsiye değildir" disclaimeri caption'a ekle, slayta değil`,

    messages: [
      {
        role: "user",
        content: `Bu literatür verisinden ${SLIDE_COUNT} slaytlık Instagram carousel üret:

${JSON.stringify(literature, null, 2)}

JSON formatında döndür — başka hiçbir şey yazma:
{
  "slides": [
    {
      "index": 1,
      "type": "title",
      "light": false,
      "category": "PSİKİYATRİ | NÖROB İYOLOJİ",
      "emoji": "🧠",
      "headline": "ana başlık",
      "title_italic": "alt başlık italik",
      "body": ["hook cümlesi", "Kaydır → 14 Slayt"],
      "source": null,
      "accent": "navy"
    },
    {
      "index": 2,
      "type": "content",
      "light": true,
      "category": "KAVRAM",
      "headline": "başlık",
      "subtitle": "alt başlık",
      "card_titles": ["kart 1 başlık", "kart 2 başlık", "kart 3 başlık"],
      "body": ["kart 1 içerik", "kart 2 içerik", "kart 3 içerik"],
      "source": "Yazar et al., Dergi, 2023",
      "accent": "navy",
      "highlight": null
    }
  ],
  "instagram_caption": {
    "hook": "ilk 125 karakter — kaydırmadan görünen kısım",
    "body": "3-4 paragraf tam metin",
    "hashtags": ["#psikiyatri", "#ruhsagligi", "#norobiyoloji"],
    "disclaimer": "Bu içerik bilgilendirme amaçlıdır, tıbbi tavsiye değildir. Belirtileriniz için bir psikiyatrist veya psikologla görüşün."
  },
  "alt_text": "Instagram erişilebilirlik açıklaması"
}

Önemli: type değerleri → title, content, clinical, warning, summary, compare, close, references
accent değerleri → navy, red, gold
light: true = açık arka plan, false = koyu arka plan`,
      },
    ],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON bulunamadı");
    const cleaned = jsonMatch[0]
      .replace(/[\u{1F300}-\u{1FFFF}]/gu, "")
      .replace(/[\u2600-\u27BF]/gu, "");
    const content = JSON.parse(cleaned);
    console.log(`  ✓ ${content.slides.length} slayt içeriği hazırlandı`);
    return content;
  } catch (e) {
    throw new Error(`JSON parse hatası: ${e.message}\n${text.slice(0, 300)}`);
  }
}
