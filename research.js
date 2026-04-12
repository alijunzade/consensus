// research.js
// Consensus AI web araması üzerinden literatür taraması

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function searchLiterature(topic) {
  console.log(`\n📚 Literatür analiz ediliyor: "${topic}"`);

  // Claude'a konuyu analiz ettir ve literatür özeti üret
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: `Sen psikiyatri ve nörobilim alanında uzman bir akademisyensin.
Verilen konu hakkında mevcut literatür bilgine dayanarak kapsamlı bir analiz yapacaksın.

Kurallar:
- Sadece gerçek, var olan çalışmalara atıf yap
- Uydurma makale adı veya yazar ismi yazma
- Emin olmadığın spesifik atıfları "genel literatür" olarak belirt
- Klinik pratiğe yansıyan somut bulgulara odaklan
- Sistematik derleme ve meta-analizleri önceliklendir
- Spekülatif bilgiden kaçın`,

    messages: [
      {
        role: "user",
        content: `Şu psikiyatri/sağlık konusunu derinlemesine analiz et: "${topic}"

Şu başlıkları kapsa:
1. Epidemiyoloji ve klinik önemi
2. Patofizyoloji ve mekanizmalar
3. Kanıta dayalı tedavi yaklaşımları
4. Klinisyenlerin gözden kaçırdığı noktalar
5. Yan etkiler ve kontrendikasyonlar
6. Güncel kılavuz önerileri

JSON formatında döndür:
{
  "topic": "...",
  "search_summary": "konunun kısa özeti",
  "papers": [
    {
      "title": "makale başlığı (gerçek veya temsili)",
      "authors": "Yazar et al.",
      "year": 2023,
      "journal": "dergi adı",
      "study_type": "meta-analysis|RCT|cohort|review|case",
      "key_finding": "ana bulgu",
      "clinical_relevance": "high|medium|low"
    }
  ],
  "key_themes": ["tema1", "tema2"],
  "clinical_takeaways": ["öneri1", "öneri2", "öneri3"],
  "controversies": ["tartışmalı konu1"]
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
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      console.log(`  ✓ ${data.papers?.length || 0} referans, ${data.key_themes?.length || 0} tema`);
      return data;
    }
  } catch (e) {
    // JSON parse başarısız
  }

  // Fallback: ham metin döndür
  return {
    topic,
    search_summary: text,
    papers: [],
    key_themes: [],
    clinical_takeaways: [],
    controversies: [],
  };
}
