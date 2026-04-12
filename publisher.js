// src/publisher.js
// Ayrshare API ile platform paylaşımı

import { readFileSync } from "fs";
import fetch from "node-fetch";

const AYRSHARE_API = "https://app.ayrshare.com/api";

export async function publishContent(imagePaths, content) {
  const dryRun = process.env.DRY_RUN === "true";

  if (dryRun) {
    console.log("\n🔍 DRY RUN — gerçek paylaşım yapılmıyor");
    console.log(`  Caption (ilk 125 kar.): ${content.instagram_caption.hook}`);
    console.log(`  Görseller: ${imagePaths.length} adet PNG`);
    return { success: true, dryRun: true };
  }

  console.log("\n📤 Platform paylaşımı başlıyor...");

  // PNG'leri base64'e çevir
  const imageBase64s = imagePaths.map((p) => {
    const buffer = readFileSync(p);
    return `data:image/png;base64,${buffer.toString("base64")}`;
  });

  const results = {};

  // ── Instagram Carousel ──
  try {
    const igCaption = [
      content.instagram_caption.hook,
      "",
      content.instagram_caption.body,
      "",
      content.instagram_caption.hashtags.join(" "),
      "",
      content.instagram_caption.disclaimer,
    ].join("\n");

    const igResponse = await fetch(`${AYRSHARE_API}/post`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AYRSHARE_API_KEY}`,
      },
      body: JSON.stringify({
        post: igCaption,
        platforms: ["instagram"],
        mediaUrls: imageBase64s,
        instagramOptions: {
          type: "carousel",
        },
      }),
    });

    results.instagram = await igResponse.json();
    console.log("  ✓ Instagram carousel paylaşıldı");
  } catch (err) {
    console.error("  ✗ Instagram hatası:", err.message);
    results.instagram = { error: err.message };
  }

  // ── Twitter Thread ──
  try {
    // Thread: ilk tweet görsel + metin, sonrakiler salt metin
    const twitterPosts = content.twitter_thread.map((tweet, i) => ({
      post: tweet,
      ...(i === 0 && { mediaUrls: [imageBase64s[0]] }),
    }));

    const twResponse = await fetch(`${AYRSHARE_API}/post`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AYRSHARE_API_KEY}`,
      },
      body: JSON.stringify({
        post: content.twitter_thread[0],
        platforms: ["twitter"],
        mediaUrls: [imageBase64s[0]],
        twitterOptions: {
          thread: content.twitter_thread.slice(1),
        },
      }),
    });

    results.twitter = await twResponse.json();
    console.log("  ✓ Twitter thread paylaşıldı");
  } catch (err) {
    console.error("  ✗ Twitter hatası:", err.message);
    results.twitter = { error: err.message };
  }

  return results;
}

// Zamanlanmış paylaşım (örn: ertesi gün 09:00)
export async function scheduleContent(imagePaths, content, scheduleDate) {
  const isoDate = scheduleDate.toISOString();
  console.log(`\n⏰ İçerik zamanlandı: ${isoDate}`);

  const imageBase64s = imagePaths.map((p) => {
    const buffer = readFileSync(p);
    return `data:image/png;base64,${buffer.toString("base64")}`;
  });

  const igCaption = [
    content.instagram_caption.hook,
    "",
    content.instagram_caption.body,
    "",
    content.instagram_caption.hashtags.join(" "),
    "",
    content.instagram_caption.disclaimer,
  ].join("\n");

  const response = await fetch(`${AYRSHARE_API}/post`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.AYRSHARE_API_KEY}`,
    },
    body: JSON.stringify({
      post: igCaption,
      platforms: ["instagram", "twitter", "linkedin"],
      mediaUrls: imageBase64s,
      scheduleDate: isoDate,
      instagramOptions: { type: "carousel" },
    }),
  });

  return await response.json();
}
