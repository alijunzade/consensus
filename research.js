// research.js
// Adım 1: Claude → 10 Consensus sorgusu üret
// Adım 2: Consensus API ile ara
// Adım 3: Claude ile analiz et

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const CONSENSUS_KEY = process.env.CONSENSUS_API_KEY;

// ── Adım 1: Claude ile sorgu üret ─────────────────────────
async function generateQueries(topic) {
  console.log(`\n🔍 Sorgu stratejisi oluşturuluyor: "${topic}"`);

  const res = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: `Sen psikiyatri ve tıp literatürü araştırmasında uzman bir akademisyensin.
Verilen konu için Consensus AI'da en verimli sonuçları getirecek İngilizce arama sorguları üretiyorsun.

Sorgu kalitesi kuralları:
- İngilizce yaz (Consensus İngilizce veritabanı)
- Her sorgu farklı bir açıyı kapssın
- Boolean operatörler kullan: OR, AND
- Spesifik metodoloji terimleri ekle: meta-analysis, RCT, systematic review, cohort
- Mekanizma, tedavi, epidemiyoloji, klinik uygulama açılarını dengele
- Sadece JSON listesi döndür, başka hiçbir şey yazma`,
    messages: [
      {
        role: "user",
        content: `Bu psikiyatri konusu için 10 farklı Consensus arama sorgusu üret: "${topic}"

Sadece JSON array döndür:
["sorgu 1", "sorgu 2", "sorgu 3", ...]`,
      },
    ],
  });

  const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("");

  try {
    const match = text.match(/\[[\s\S]*\]/);
    const queries = JSON.parse(match[0]);
    console.log(`  ✓ ${queries.length} sorgu üretildi:`);
    queries.forEach((q, i) => console.log(`    ${i + 1}. ${q}`));
    return queries;
  } catch (e) {
    // Fallback sorgular
    console.log("  ⚠ Sorgu parse hatası, fallback kullanılıyor");
    return [
      `${topic} meta-analysis`,
      `${topic} systematic review`,
      `${topic} RCT randomized controlled trial`,
      `${topic} clinical outcomes psychiatry`,
      `${topic} neurobiology mechanism`,
      `${topic} treatment efficacy`,
      `${topic} epidemiology prevalence`,
      `${topic} diagnosis assessment`,
      `${topic} comorbidity`,
      `${topic} guidelines recommendations`,
    ];
  }
}

// ── Adım 2: Consensus API araması ─────────────────────────
async function searchConsensus(query, limit = 10) {
  const url = new URL("https://api.consensus.app/v1/quick_search");
  url.searchParams.set("query", query);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${CONSENSUS_KEY}` },
  });

  if (!res.ok) {
    console.log(`  ⚠ Consensus hatası (${res.status}) → "${query}" atlandı`);
    return [];
  }

  const data = await res.json();
  return data.papers || data.results || [];
}

// ── Adım 3: Claude ile analiz ─────────────────────────────
async function analyzePapers(papers, topic) {
  const papersText = papers
    .map((p, i) =>
      [
        `${i + 1}. ${p.title}`,
        `   Yazarlar: ${p.authors?.map((a) => a.name || a).join(", ") || "?"}`,
        `   Dergi: ${p.journal?.title || p.journal || "?"} (${p.year || "?"})`,
        `   Alıntı: ${p.citation_count || 0}`,
        `   Özet: ${(p.abstract || p.tldr || "").slice(0, 300)}`,
      ].join("\n")
    )
    .join("\n\n");

  const res = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: `Sen psikiyatri alanında uzman bir akademisyensin.
Consensus'tan gelen makaleleri analiz edip klinik içerik üretimi için yapılandırıyorsun.
Sadece verilen makalelerdeki bilgileri kullan. Ekleme yapma.
Emin olmadığın bilgileri "genel literatür" olarak belirt.`,
    messages: [
      {
        role: "user",
        content: `Konu: "${topic}"

Bu Consensus makalelerini analiz et ve yapılandır:
${papersText}

JSON formatında döndür:
{
  "topic": "...",
  "search_summary": "2 cümlelik konu özeti",
  "papers": [
    {
      "title": "...",
      "authors": "İlk Yazar et al.",
      "year": 2023,
      "journal": "...",
      "study_type": "meta-analysis|RCT|cohort|review|case",
      "key_finding": "ana bulgu — 1 somut cümle",
      "clinical_relevance": "high|medium|low",
      "citation_count": 0
    }
  ],
  "key_themes": ["tema1", "tema2", "tema3"],
  "clinical_takeaways": ["öneri1", "öneri2", "öneri3", "öneri4", "öneri5"],
  "controversies": ["tartışmalı nokta"]
}`,
      },
    ],
  });

  const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("");

  try {
    const match = text.match(/\{[\s\S]*\}/);
    const data = JSON.parse(match[0]);
    console.log(`  ✓ Analiz tamamlandı: ${data.papers?.length} makale`);
    return data;
  } catch (e) {
    return {
      topic,
      search_summary: text.slice(0, 300),
      papers: papers.slice(0, 10).map((p) => ({
        title: p.title,
        authors: p.authors?.[0]?.name || "?",
        year: p.year,
        journal: p.journal?.title || "?",
        study_type: "review",
        key_finding: (p.abstract || "").slice(0, 150),
        clinical_relevance: "medium",
        citation_count: p.citation_count || 0,
      })),
      key_themes: [],
      clinical_takeaways: [],
      controversies: [],
    };
  }
}

// ── Claude fallback (Consensus key yoksa) ─────────────────
async function claudeFallback(topic) {
  console.log(`\n📚 Claude fallback literatür analizi: "${topic}"`);

  const res = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 3000,
    system: `Sen psikiyatri ve nörobilim alanında uzman bir akademisyensin.
Verilen konu hakkında güncel literatür bilgine dayanarak kapsamlı bir analiz yap.
KURALLAR:
- Sadece gerçek, var olan çalışmalara atıf yap
- Emin olmadığın spesifik atıfları "genel literatür" olarak belirt
- Uydurma makale adı veya yazar ismi YAZMA
- Klinik pratiğe yansıyan somut bulgulara odaklan`,
    messages: [
      {
        role: "user",
        content: `"${topic}" konusunda JSON formatında literatür analizi yap:
{
  "topic": "...",
  "search_summary": "...",
  "papers": [{ "title": "...", "authors": "...", "year": 0, "journal": "...", "study_type": "...", "key_finding": "...", "clinical_relevance": "high|medium|low", "citation_count": 0 }],
  "key_themes": [],
  "clinical_takeaways": [],
  "controversies": []
}`,
      },
    ],
  });

  const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return JSON.parse(match[0]);
  } catch {
    return { topic, search_summary: text.slice(0, 500), papers: [], key_themes: [], clinical_takeaways: [], controversies: [] };
  }
}

// ── Ana fonksiyon ──────────────────────────────────────────
export async function searchLiterature(topic) {
  // Consensus API key yoksa direkt Claude fallback
  if (!CONSENSUS_KEY) {
    console.log("  ℹ CONSENSUS_API_KEY yok — Claude fallback devreye giriyor");
    return await claudeFallback(topic);
  }

  // Adım 1: Claude ile 10 sorgu üret
  const queries = await generateQueries(topic);

  // Adım 2: Her sorgu için Consensus'ta ara
  console.log(`\n📚 Consensus'ta ${queries.length} sorgu çalıştırılıyor...`);
  const allPapers = [];

  for (const query of queries) {
    const papers = await searchConsensus(query, 10);
    allPapers.push(...papers);
    if (papers.length > 0) {
      console.log(`  ✓ "${query.slice(0, 50)}..." → ${papers.length} makale`);
    }
  }

  // Tekrarları çıkar, alıntıya göre sırala
  const seen = new Set();
  const unique = allPapers
    .filter((p) => {
      const key = p.id || p.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (b.citation_count || 0) - (a.citation_count || 0));
.slice(0, 20);  // ← bu satırı silin;

  console.log(`  ✓ Toplam ${unique.length} benzersiz makale`);

  if (unique.length === 0) {
    console.log("  ⚠ Consensus sonuç vermedi — Claude fallback devreye giriyor");
    return await claudeFallback(topic);
  }

  // Adım 3: Claude ile analiz
  return await analyzePapers(unique, topic);
}
