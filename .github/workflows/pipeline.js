// src/pipeline.js
// Ana orkestratör — tüm adımları sırayla çalıştırır

import "dotenv/config";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import { searchLiterature } from "./research.js";
import { generateSlideContent } from "./content.js";
import { renderSlides } from "./renderer.js";
import { publishContent, scheduleContent } from "./publisher.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Konu: komut satırı argümanı veya env variable ──
const topic = process.argv[2] || process.env.CONTENT_TOPIC;

if (!topic) {
  console.error(`
❌ Konu belirtilmedi!

Kullanım:
  node src/pipeline.js "menopozda östrojen patchi ve psikoloji"
  
veya .env dosyasında:
  CONTENT_TOPIC="menopozda östrojen patchi ve psikoloji"
`);
  process.exit(1);
}

const isDryRun = process.argv.includes("--dry-run") || process.env.DRY_RUN === "true";

async function run() {
  console.log("═".repeat(60));
  console.log(`🧠 PSİKİYATRİ İÇERİK PİPELINE`);
  console.log(`📌 Konu: ${topic}`);
  console.log(`🔄 Mod: ${isDryRun ? "DRY RUN" : "CANLI"}`);
  console.log("═".repeat(60));

  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
  const slugTopic = topic.slice(0, 40).toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_ğüşıöç]/g, "");
  const sessionDir = path.join(__dirname, `output/${timestamp}_${slug}`);

  await mkdir(sessionDir, { recursive: true });

  try {
    // ── ADIM 1: Literatür Tarama ──
    const literature = await searchLiterature(topic);
    await writeFile(
      path.join(sessionDir, "01_literature.json"),
      JSON.stringify(literature, null, 2)
    );

    // ── ADIM 2: İçerik Üretimi ──
    const content = await generateSlideContent(literature);
    await writeFile(
      path.join(sessionDir, "02_content.json"),
      JSON.stringify(content, null, 2)
    );

    // Caption'ı ayrıca kaydet (kolay erişim için)
    const captionText = [
      content.instagram_caption.hook,
      "",
      content.instagram_caption.body,
      "",
      content.instagram_caption.hashtags.join(" "),
      "",
      content.instagram_caption.disclaimer,
    ].join("\n");

    await writeFile(path.join(sessionDir, "03_caption.txt"), captionText);

    const twitterText = content.twitter_thread.join("\n\n---\n\n");
    await writeFile(path.join(sessionDir, "03_twitter_thread.txt"), twitterText);

    // ── ADIM 3: Görsel Render ──
    const imagesDir = path.join(sessionDir, "slides");
    const imagePaths = await renderSlides(content.slides, imagesDir);

    // ── ADIM 4: Paylaşım ──
    if (isDryRun) {
      console.log("\n✅ DRY RUN tamamlandı");
      console.log(`📁 Çıktılar: ${sessionDir}`);
    } else {
      // Instagram: hemen paylaş
      // Twitter: hemen paylaş
      const publishResults = await publishContent(imagePaths, content);
      await writeFile(
        path.join(sessionDir, "04_publish_results.json"),
        JSON.stringify(publishResults, null, 2)
      );

      // Özet rapor
      console.log("\n" + "═".repeat(60));
      console.log("✅ PİPELINE TAMAMLANDI");
      console.log(`📁 Oturum: ${sessionDir}`);
      console.log(`🖼️  Görseller: ${imagePaths.length} PNG`);
      console.log(`📱 Instagram: ${publishResults.instagram?.status || "?"}`);
      console.log(`🐦 Twitter: ${publishResults.twitter?.status || "?"}`);
      console.log("═".repeat(60));
    }

    return { success: true, sessionDir, imagePaths };

  } catch (err) {
    console.error("\n❌ Pipeline hatası:", err.message);
    console.error(err.stack);

    await writeFile(
      path.join(sessionDir, "error.log"),
      `${new Date().toISOString()}\n${err.message}\n${err.stack}`
    );

    process.exit(1);
  }
}

run();
