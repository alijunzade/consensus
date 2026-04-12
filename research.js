// src/research.js
// Consensus MCP üzerinden literatür taraması

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function searchLiterature(topic) {
  console.log(`\n📚 Literatür taranıyor: "${topic}"`);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    mcp_servers: [
      {
        type: "url",
        url: "https://mcp.consensus.app/mcp",
        name: "consensus",
      },
    ],
    system: `Sen bir psikiyatri akademisyenisin. Consensus üzerinden literatür taraması yapıyorsun.
Arama yaparken şu kriterleri uygula:
- Öncelik sırası: Sistematik derleme > Meta-analiz > RCT > Kohort çalışması
- Son 10 yıl içindeki çalışmaları önceliklendir
- En az 10-15 makale bul
- Her makale için: başlık, yazar, yıl, dergi, ana bulgu, çalışma tipi notunu çıkar
- Klinik pratiğe yansıyan somut bulgulara odaklan
- Spekülatif veya zayıf metodolojili çalışmaları eleyerek sun`,

    messages: [
      {
        role: "user",
        content: `Bu psikiyatri/sağlık konusunda kapsamlı literatür taraması yap: "${topic}"

Consensus'ta şu açılardan ara:
1. Klinik etkinlik ve tedavi sonuçları
2. Mekanizma ve patofizyoloji
3. Pratik uygulama önerileri
4. Yan etkiler ve kontrendikasyonlar
5. Hasta grupları ve kişiselleştirilmiş yaklaşımlar

Sonuçları JSON formatında ver:
{
  "topic": "...",
  "search_summary": "...",
  "papers": [
    {
      "title": "...",
      "authors": "...",
      "year": 2024,
      "journal": "...",
      "study_type": "meta-analysis|RCT|cohort|review|case",
      "key_finding": "...",
      "clinical_relevance": "high|medium|low",
      "citation_count": 0
    }
  ],
  "key_themes": ["...", "..."],
  "clinical_takeaways": ["...", "..."],
  "controversies": ["..."]
}`,
      },
    ],
  });

  // MCP tool result bloklarından JSON çıkar
  const toolResults = response.content.filter(
    (item) => item.type === "mcp_tool_result"
  );
  const textBlocks = response.content.filter((item) => item.type === "text");

  let literatureData = null;

  // Text bloklarında JSON ara
  for (const block of textBlocks) {
    try {
      const jsonMatch = block.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        literatureData = JSON.parse(jsonMatch[0]);
        break;
      }
    } catch (e) {
      // JSON parse başarısız, devam et
    }
  }

  // JSON bulunamazsa ham metin döndür
  if (!literatureData) {
    const fullText = textBlocks.map((b) => b.text).join("\n");
    literatureData = {
      topic,
      search_summary: fullText,
      papers: [],
      key_themes: [],
      clinical_takeaways: [],
      controversies: [],
    };
  }

  console.log(
    `  ✓ ${literatureData.papers?.length || "?"} makale bulundu`
  );
  return literatureData;
}
