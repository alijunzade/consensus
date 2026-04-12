// src/content.js
// Literatürden slayt içeriği + caption üretimi

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SLIDE_COUNT = parseInt(process.env.SLIDE_COUNT || "14");

export async function generateSlideContent(literature) {
  console.log(`\n🎨 Slayt içeriği üretiliyor (${SLIDE_COUNT} slayt)...`);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 6000,
    system: `Sen psikiyatri alanında hem klinisyen hem de kamuya yönelik içerik üreten bir uzmansın.
İnstagram için psikiyatri carouselleri hazırlıyorsun.

Ton ve içerik kuralları:
- Bilimsel ama sade dil — hekim olmayan biri de anlasın
- Pazarlamacı değil, güvenilir uzman sesi
- Her slaytta TEK ana mesaj — bilgi yoğunluğu değil, anlaşılırlık
- Klinik gerçekleri gizleme: yan etkiler, kontrendikasyonlar, sınırlamalar dahil et
- "Tıbbi tavsiye değil, bilgilendirme amaçlıdır" notunu slaytlara yedirme — sadece caption'a ekle
- Rakamlar ve bulgular kaynaklı olsun, spekülatif ifadelerden kaçın
- Emojiler slayt başlıklarında kullanılabilir ama abartma`,

    messages: [
      {
        role: "user",
        content: `Bu literatür verisiyle ${SLIDE_COUNT} slaytlık Instagram carousel içeriği üret:

${JSON.stringify(literature, null, 2)}

Slayt yapısı:
- Slayt 1: Başlık / hook (dikkat çekici, soru veya güçlü istatistik)
- Slayt 2-3: "Neden önemli?" (epidemiyoloji, görülme sıklığı, klinisyenlerin gözden kaçırdığı nokta)
- Slayt 4-7: Ana klinik bulgular (her slayt = 1 kritik bulgu, kaynaklı)
- Slayt 8-10: Pratik uygulama (klinisyen için yapılabilir adımlar)
- Slayt 11-12: Yan etkiler / dikkat edilmesi gerekenler / sınırlamalar
- Slayt 13: Özet / anahtar mesaj
- Slayt 14: Referanslar (en önemli 4-5 çalışma)

JSON formatında döndür:
{
  "slides": [
    {
      "index": 1,
      "type": "title|content|clinical|warning|summary|references",
      "emoji": "🧠",
      "headline": "...",
      "body": ["satır 1", "satır 2", "satır 3"],
      "source": "Author et al., 2023" veya null,
      "highlight": "öne çıkan istatistik veya alıntı" veya null
    }
  ],
  "instagram_caption": {
    "hook": "ilk 125 karakter (açılmadan görünen kısım)",
    "body": "tam metin (3-4 paragraf)",
    "hashtags": ["#psikiyatri", "#ruhsağlığı", ...],
    "disclaimer": "Bu içerik bilgilendirme amaçlıdır, tıbbi tavsiye değildir."
  },
  "twitter_thread": [
    "1/ tweet metni",
    "2/ tweet metni"
  ],
  "alt_text": "Instagram görsel açıklaması (erişilebilirlik için)"
}`,
      },
    ],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const content = JSON.parse(jsonMatch[0]);
    console.log(`  ✓ ${content.slides.length} slayt içeriği hazırlandı`);
    return content;
  } catch (e) {
    throw new Error(`İçerik JSON parse hatası: ${e.message}\n\nHam metin:\n${text.slice(0, 500)}`);
  }
}
