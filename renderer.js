// src/renderer.js
// HTML slaytları 1080x1080 PNG'ye dönüştürür

import puppeteer from "puppeteer";
import { readFileSync } from "fs";
import { mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = path.join(__dirname, "../templates/slide.html");

// Taktik numaralarına göre renk paleti (örneklerden)
const TACTIC_COLORS = [
  "#1B9E8A", // 1 — teal
  "#F0A500", // 2 — amber
  "#3A9068", // 3 — green
  "#C5687A", // 4 — rose
  "#6E5FA8", // 5 — purple
  "#1B9E8A", // 6 — teal
  "#F0A500", // 7 — amber
  "#3A9068", // 8 — green
];

export async function renderSlides(slides, outputDir) {
  console.log(`\n🖼️  Slaytlar render ediliyor (${slides.length} adet)...`);
  await mkdir(outputDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      "--no-sandbox", "--disable-setuid-sandbox",
      "--disable-dev-shm-usage", "--font-render-hinting=none",
    ],
  });

  const templateHTML = readFileSync(TEMPLATE_PATH, "utf-8");
  const imagePaths = [];

  try {
    for (const slide of slides) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });

      await page.setContent(templateHTML, { waitUntil: "networkidle0" });
      await page.evaluate(() => document.fonts.ready);

      const slideHTML = buildSlideHTML(slide, slides.length);
      await page.evaluate((html) => {
        document.getElementById("slide-container").innerHTML = html;
      }, slideHTML);

      await new Promise((r) => setTimeout(r, 400));

      const filename = `slide_${String(slide.index).padStart(2, "0")}.png`;
      const filepath = path.join(outputDir, filename);

      await page.screenshot({
        path: filepath,
        type: "png",
        clip: { x: 0, y: 0, width: 1080, height: 1080 },
      });

      imagePaths.push(filepath);
      await page.close();
      process.stdout.write(`  ✓ Slayt ${slide.index}/${slides.length}\r`);
    }
  } finally {
    await browser.close();
  }

  console.log(`\n  ✓ ${imagePaths.length} PNG → ${outputDir}`);
  return imagePaths;
}

// ── SHARED FRAGMENTS ──────────────────────────────────

function progressLine(index, total) {
  const pct = Math.round((index / total) * 100);
  return `<div class="progress-line"><div class="progress-fill" style="width:${pct}%"></div></div>`;
}

function slideCounter(index, total) {
  return `<div class="slide-counter">${index} / ${total}</div>`;
}

function footer(slide, darkMode = true) {
  const name = `<span class="footer-name">Doç. Dr. Alişan Burak Yaşar</span>`;
  const cite = slide.source
    ? `<span class="footer-cite">${slide.source}</span>`
    : `<span class="footer-cite"></span>`;
  const url = `<span class="footer-url">alisanburak.com</span>`;
  return `<div class="slide-footer">${name}${cite}${url}</div>`;
}

function dotNav(index, total) {
  const dots = Array.from({ length: total }, (_, i) =>
    `<div class="dot${i + 1 === index ? " active" : ""}"></div>`
  ).join("");
  return `<div class="dot-nav">${dots}</div>`;
}

function decoCirclesDark(variant = "default") {
  // Köşe daireleri — örneklerdeki gibi
  if (variant === "title") {
    return `
      <div class="deco-tr" style="width:260px;height:260px;background:#1B9E8A;opacity:0.18;"></div>
      <div class="deco-bl" style="width:200px;height:200px;background:#333;opacity:0.4;"></div>`;
  }
  return `
    <div class="deco-tr" style="width:220px;height:220px;background:#1B9E8A;opacity:0.15;"></div>
    <div class="deco-bl" style="width:170px;height:170px;background:#1B9E8A;opacity:0.08;border:2px solid rgba(27,158,138,0.3);"></div>`;
}

function decoCirclesLight() {
  return `
    <div class="deco-tr" style="width:230px;height:230px;background:#1B9E8A;opacity:0.12;"></div>
    <div class="deco-br" style="width:180px;height:180px;background:#e8e4dd;opacity:0.7;border:2px solid rgba(0,0,0,0.08);"></div>`;
}

// ── SLIDE BUILDERS ────────────────────────────────────

function buildSlideHTML(slide, total) {
  const prog = progressLine(slide.index, total);
  const counter = slideCounter(slide.index, total);
  const foot = footer(slide);
  const dots = dotNav(slide.index, total);

  switch (slide.type) {
    case "title":      return titleSlide(slide, total, prog, dots, foot);
    case "tactic":     return tacticSlide(slide, total, prog, counter, dots, foot);
    case "clinical":
    case "warning":    return clinicalSlide(slide, total, prog, counter, dots, foot);
    case "summary":    return summarySlide(slide, total, prog, counter, dots, foot);
    case "references": return refsSlide(slide, total, prog, counter, dots, foot);
    case "compare":    return compareSlide(slide, total, prog, counter, dots, foot);
    case "close":      return closeSlide(slide, total, prog, dots, foot);
    default:           return contentSlide(slide, total, prog, counter, dots, foot);
  }
}

function titleSlide(slide, total, prog, dots, foot) {
  const cta = slide.body?.[1] || `Kaydır → ${total} Slayt`;
  return `
  <div class="slide-dark">
    ${prog}
    ${decoCirclesDark("title")}
    <div class="title-wrap">
      <span class="title-badge">${slide.category || "PSİKİYATRİ"}</span>
      <div class="title-icon">${slide.emoji || "🧠"}</div>
      <h1 class="title-h1">${slide.headline}</h1>
      ${slide.title_italic ? `<p class="title-italic">${slide.title_italic}</p>` : ""}
      <div class="title-line"></div>
      <p class="title-sub">${slide.body?.[0] || ""}</p>
      <div class="title-cta">${cta}</div>
    </div>
    <div class="title-author">Doç. Dr. Alişan Burak Yaşar · Psikiyatrist</div>
    ${dots}
    <div class="slide-footer" style="justify-content:center">
      <span class="footer-url" style="color:var(--muted)">alisanburak.com</span>
    </div>
  </div>`;
}

function contentSlide(slide, total, prog, counter, dots, foot) {
  const isLight = slide.light === true;
  const cls = isLight ? "slide-light" : "slide-dark";
  const deco = isLight ? decoCirclesLight() : decoCirclesDark();

  if (isLight) {
    const cards = (slide.body || []).map((line, i) => {
      const colors = ["var(--teal)", "var(--amber)", "var(--coral)", "var(--green)", "var(--purple)"];
      const color = colors[i % colors.length];
      return `
        <div class="light-card" style="border-left-color:${color}">
          <span class="light-card-icon">${slide.icons?.[i] || "▸"}</span>
          <div>
            <div class="light-card-title">${slide.card_titles?.[i] || ""}</div>
            <div class="light-card-text">${line}</div>
          </div>
        </div>`;
    }).join("");

    return `
    <div class="${cls}">
      ${prog} ${counter} ${deco}
      <div class="content-light-wrap">
        <span class="light-badge">${slide.category || "KLİNİK BULGULAR"}</span>
        <h2 class="light-h2">${slide.headline}</h2>
        ${slide.subtitle ? `<p class="light-italic">${slide.subtitle}</p>` : ""}
        <div class="light-amber"></div>
        <div class="light-cards">${cards}</div>
      </div>
      ${dots} ${foot}
    </div>`;
  }

  // Dark variant
  const bColors = ["var(--teal)", "var(--amber)", "var(--coral)", "var(--green)", "var(--purple)"];
  const cards = (slide.body || []).map((line, i) => {
    const color = bColors[i % bColors.length];
    const borderClass = ["t","a","c","",""][i % 5];
    return `
      <div class="card-row ${borderClass}">
        <div class="card-num-circle" style="background:${color}">${i + 1}</div>
        <div>
          <div class="card-body-title">${slide.card_titles?.[i] || ""}</div>
          <div class="card-body-text">${line}</div>
        </div>
      </div>`;
  }).join("");

  return `
  <div class="${cls}">
    ${prog} ${counter} ${deco}
    <div class="content-wrap">
      <span class="top-label">${slide.category || "PSİKİYATRİ"}</span>
      <h2 class="content-h2">${slide.emoji || ""} ${slide.headline}</h2>
      ${slide.subtitle ? `<p class="content-italic">${slide.subtitle}</p>` : ""}
      <div class="amber-bar"></div>
      <div class="card-stack">${cards}</div>
    </div>
    ${dots} ${foot}
  </div>`;
}

function tacticSlide(slide, total, prog, counter, dots, foot) {
  const colorIdx = (slide.tactic_num || slide.index) - 1;
  const color = TACTIC_COLORS[colorIdx % TACTIC_COLORS.length];
  const tacticLabel = slide.tactic_label || `TAKTİK ${slide.tactic_num || slide.index}`;
  const category = slide.category || "GÜNLÜK YAŞAM";

  const highlightHtml = slide.highlight
    ? `<div class="highlight-pill" style="background:${color}20;border:1.5px solid ${color}">
         <div class="highlight-pill-title" style="color:${color}">${slide.highlight_icon || "🎯"} ${slide.highlight_title || ""}</div>
         <div class="highlight-pill-sub" style="color:var(--offwhite)">${slide.highlight}</div>
       </div>` : "";

  const steps = (slide.body || []).map((line, i) => {
    const parts = line.split(":");
    const strong = parts[0] || "";
    const normal = parts.slice(1).join(":").trim();
    return `
      <div class="step-row">
        <div class="step-badge" style="background:${color}">${i + 1}</div>
        <div><span class="step-strong">${strong}${parts.length > 1 ? ":" : ""}</span> <span class="step-normal">${normal}</span></div>
      </div>`;
  }).join("");

  return `
  <div class="slide-dark">
    ${prog} ${counter} ${decoCirclesDark()}
    <div class="tactic-wrap">
      <div class="tactic-header">
        <div class="tactic-badge" style="background:${color}">${slide.tactic_num || slide.index}</div>
        <div>
          <div class="tactic-label-text">${tacticLabel} · ${category}</div>
        </div>
      </div>
      <h2 class="tactic-h2">${slide.headline}</h2>
      ${slide.subtitle ? `<p class="tactic-desc">${slide.subtitle}</p>` : ""}
      ${highlightHtml}
      <div class="step-rows">${steps}</div>
    </div>
    ${dots} ${foot}
  </div>`;
}

function clinicalSlide(slide, total, prog, counter, dots, foot) {
  const isLight = slide.light === true;
  if (isLight) return contentSlide(slide, total, prog, counter, dots, foot);

  const badge = slide.warn_badge
    ? `<span style="background:rgba(224,117,96,0.15);border:1.5px solid var(--coral);border-radius:6px;padding:6px 18px;font-size:14px;font-weight:700;color:var(--coral);letter-spacing:0.12em;text-transform:uppercase;">${slide.warn_badge}</span>`
    : `<span class="top-label">${slide.category || "KLİNİK RİSK"}</span>`;

  // Flow boxes (3 col) if present
  let flowHtml = "";
  if (slide.flow) {
    const boxes = slide.flow.map((f, i) => {
      const colors = ["rgba(27,158,138,0.2)", "rgba(224,117,96,0.2)", "rgba(122,154,181,0.15)"];
      const borders = ["var(--teal)", "var(--coral)", "var(--muted)"];
      return `<div class="flow-box" style="background:${colors[i]};border:1.5px solid ${borders[i]}">
        <div class="flow-box-label" style="color:${borders[i]}">${f.label}</div>
        <div class="flow-box-text" style="color:var(--white)">${f.text}</div>
      </div>${i < slide.flow.length - 1 ? '<div class="flow-arrow">→</div>' : ""}`;
    }).join("");
    flowHtml = `<div class="flow-row">${boxes}</div>`;
  }

  const evidences = (slide.body || []).map((line) =>
    `<div class="evidence-row"><span class="evi-icon">👁</span><span>${line}</span></div>`
  ).join("");

  return `
  <div class="slide-dark">
    ${prog} ${counter} ${decoCirclesDark()}
    <div class="clinical-wrap">
      ${badge}
      <h2 class="clinical-h2">${slide.emoji || "⚠️"} ${slide.headline}</h2>
      ${flowHtml}
      <div class="evidence-rows">${evidences}</div>
    </div>
    ${dots} ${foot}
  </div>`;
}

function summarySlide(slide, total, prog, counter, dots, foot) {
  const items = (slide.body || []).map((line, i) => {
    const colors = ["var(--teal)", "var(--amber)", "var(--green)", "var(--coral)", "var(--purple)", "var(--teal)", "var(--amber)", "var(--green)"];
    const color = colors[i % colors.length];
    const label = slide.card_titles?.[i] || `T${i + 1}`;
    return `
      <div class="grid-item" style="border-color:${color}20">
        <div class="grid-item-label" style="color:${color}">${label}</div>
        <div class="grid-item-text">${line}</div>
      </div>`;
  }).join("");

  const ctaHtml = slide.cta
    ? `<div class="cta-strip"><div class="cta-strip-text">${slide.cta}</div><div class="cta-strip-sub">${slide.cta_sub || ""}</div></div>` : "";

  return `
  <div class="slide-dark">
    ${prog} ${counter} ${decoCirclesDark()}
    <div class="summary-wrap">
      <h2 class="summary-h2">${slide.headline}</h2>
      <div class="grid-2x4">${items}</div>
      ${ctaHtml}
    </div>
    ${dots} ${foot}
  </div>`;
}

function compareSlide(slide, total, prog, counter, dots, foot) {
  const left = slide.compare_left || { label: "A", color: "var(--teal)", points: [], foot: "" };
  const right = slide.compare_right || { label: "B", color: "var(--coral)", points: [], foot: "" };

  const makeCol = (col) => {
    const pts = (col.points || []).map(p =>
      `<div class="col-point"><div class="col-dot" style="background:${col.color}"></div><span>${p}</span></div>`
    ).join("");
    return `
      <div class="compare-col">
        <div class="col-head" style="background:${col.color};color:#fff">${col.label}</div>
        <div class="col-body">${pts}</div>
        ${col.foot ? `<div class="col-foot" style="background:${col.color}20;color:${col.color}">${col.foot}</div>` : ""}
      </div>`;
  };

  return `
  <div class="slide-light">
    ${prog} ${counter} ${decoCirclesLight()}
    <div class="compare-wrap">
      <h2 class="compare-h2">${slide.headline}</h2>
      ${slide.subtitle ? `<p class="compare-italic">${slide.subtitle}</p>` : ""}
      <div class="compare-cols">
        ${makeCol(left)}
        ${makeCol(right)}
      </div>
    </div>
    ${dots}
    <div class="slide-footer">
      <span class="footer-name" style="color:#999">Doç. Dr. Alişan Burak Yaşar</span>
      <span class="footer-cite" style="color:#bbb">${slide.source || ""}</span>
      <span class="footer-url" style="color:#999">alisanburak.com</span>
    </div>
  </div>`;
}

function closeSlide(slide, total, prog, dots, foot) {
  return `
  <div class="slide-light">
    ${prog} ${decoCirclesLight()}
    <div class="close-wrap">
      <div class="close-icon">${slide.emoji || "🧠"}</div>
      <h2 class="close-h2">${slide.headline}</h2>
      ${slide.close_teal ? `<p class="close-teal">${slide.close_teal}</p>` : ""}
      <div class="close-line"></div>
      ${slide.body?.[0] ? `<p class="close-desc">${slide.body[0]}</p>` : ""}
      <div class="close-cta">📥 Kaydet &amp; Paylaş</div>
      <div style="margin-top:24px;font-size:18px;color:#999">@alisanburak.yasar · Psikiyatri &amp; Teknoloji</div>
    </div>
    ${dots}
    <div class="slide-footer">
      <span class="footer-name" style="color:#999">Doç. Dr. Alişan Burak Yaşar · Psikiyatrist</span>
      <span></span>
      <span class="footer-url" style="color:#999">alisanburak.com</span>
    </div>
  </div>`;
}

function refsSlide(slide, total, prog, counter, dots, foot) {
  const refs = (slide.body || []).map((ref, i) =>
    `<div class="ref-item"><span class="ref-num">${i + 1}.</span>${ref}</div>`
  ).join("");

  return `
  <div class="slide-dark">
    ${prog} ${counter} ${decoCirclesDark()}
    <div class="refs-wrap">
      <h2 class="refs-h2">Kaynaklar</h2>
      ${refs}
    </div>
    ${dots} ${foot}
  </div>`;
}
