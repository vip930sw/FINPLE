import { FINPLE_LOGO_DATA_URL } from "./assets/finpleLogoDataUrl.js";

const MBTI_IMAGE_EXPORT_BUTTON_LABEL = "이미지 저장";
const MBTI_IMAGE_EXPORT_LEGACY_LABEL = "SNS 공유";
let finpleLogoImagePromise = null;

function isMbtiResultPage() {
  return Boolean(document.querySelector(".investmentMbtiResultPage"));
}

function getText(selector, fallback = "-") {
  const node = document.querySelector(selector);
  const value = String(node?.textContent || "").replace(/\s+/g, " ").trim();
  return value || fallback;
}

function getMbtiNickname() {
  const rawTitle = getText(".investmentMbtiResultHero h1", "FINPLE 투자 MBTI");
  return rawTitle
    .replace(/^당신의 투자 MBTI는\s*/, "")
    .replace(/입니다\.?$/, "")
    .trim() || rawTitle;
}

function getPortfolioRows() {
  return Array.from(document.querySelectorAll(".investmentMbtiPortfolioRow")).map((row) => {
    const label = String(row.querySelector("strong")?.textContent || "").trim();
    const weightText = String(row.querySelector("span")?.textContent || "0%").trim();
    const weight = Number(weightText.replace("%", "")) || 0;
    return { label, weightText, weight };
  }).filter((row) => row.label && row.weight > 0);
}

function setExportStatus(message) {
  const shareActions = document.querySelector(".investmentMbtiShareActions");
  if (!shareActions) return;

  let status = document.querySelector(".investmentMbtiExportStatus");
  if (!status) {
    status = document.createElement("p");
    status.className = "investmentMbtiExportStatus";
    shareActions.insertAdjacentElement("afterend", status);
  }
  status.textContent = message;
}

function updateMbtiActionLabels() {
  if (!isMbtiResultPage()) return;

  const shareButtons = Array.from(document.querySelectorAll(".investmentMbtiShareActions button"));
  const legacyShareButton = shareButtons.find((button) => String(button.textContent || "").trim() === MBTI_IMAGE_EXPORT_LEGACY_LABEL);

  if (legacyShareButton) {
    legacyShareButton.textContent = MBTI_IMAGE_EXPORT_BUTTON_LABEL;
    legacyShareButton.setAttribute("aria-label", "투자 MBTI 결과 이미지 저장");
  }
}

function loadFinpleLogoImage() {
  if (typeof Image === "undefined") return Promise.resolve(null);
  if (!finpleLogoImagePromise) {
    finpleLogoImagePromise = new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = FINPLE_LOGO_DATA_URL;
    });
  }
  return finpleLogoImagePromise;
}

function drawRoundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const nextLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(nextLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = nextLine;
    }
  });

  if (line) lines.push(line);
  const visibleLines = lines.slice(0, maxLines);
  visibleLines.forEach((visibleLine, index) => {
    const suffix = index === maxLines - 1 && lines.length > maxLines ? "…" : "";
    ctx.fillText(`${visibleLine}${suffix}`, x, y + index * lineHeight);
  });

  return y + visibleLines.length * lineHeight;
}

function drawPill(ctx, text, x, y, options = {}) {
  const font = options.font || "700 28px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const paddingX = options.paddingX || 24;
  const height = options.height || 58;
  ctx.font = font;
  const width = Math.ceil(ctx.measureText(text).width + paddingX * 2);
  ctx.fillStyle = options.background || "#eff6ff";
  drawRoundRect(ctx, x, y, width, height, height / 2);
  ctx.fill();
  ctx.fillStyle = options.color || "#2563eb";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + paddingX, y + height / 2 + 1);
  ctx.textBaseline = "alphabetic";
  return width;
}

function drawFinpleLogoFallback(ctx, x, y, size = 58) {
  const radius = size / 2;
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = `900 ${Math.round(size * 0.62)}px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("F", x + Math.round(size * 0.24), y + radius + 1);
  ctx.fillStyle = "#0ea5e9";
  ctx.fillText("n", x + Math.round(size * 0.52), y + radius + 1);
  ctx.textBaseline = "alphabetic";
}

async function drawMbtiCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas_context_unavailable");

  const nickname = getMbtiNickname();
  const finpleType = getText(".investmentMbtiResultGrid .investmentMbtiCard:nth-child(1) strong");
  const riskProfile = getText(".investmentMbtiResultGrid .investmentMbtiCard:nth-child(2) strong");
  const rows = getPortfolioRows();
  const caution = getText(".investmentMbtiPanel.warning p:last-child", "본 결과는 투자 성향 이해를 돕기 위한 참고용입니다.");
  const logoImage = await loadFinpleLogoImage();

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  drawRoundRect(ctx, 58, 58, 964, 1234, 48);
  ctx.fill();
  ctx.strokeStyle = "#dbe5f3";
  ctx.lineWidth = 2;
  ctx.stroke();

  const logoX = 98;
  const logoY = 92;
  const logoSize = 58;
  const brandTextX = 172;
  if (logoImage) {
    ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
  } else {
    drawFinpleLogoFallback(ctx, logoX, logoY, logoSize);
  }

  ctx.fillStyle = "#0f172a";
  ctx.font = "900 34px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("FINPLE", brandTextX, 130);
  ctx.font = "800 20px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.fillText("Portfolio Lab · Investment MBTI", brandTextX, 166);

  ctx.font = "900 28px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#2563eb";
  ctx.fillText("INVESTMENT MBTI RESULT", 98, 232);

  ctx.fillStyle = "#0f172a";
  ctx.font = "900 66px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  drawWrappedText(ctx, nickname, 98, 308, 884, 76, 2);

  let pillX = 98;
  pillX += drawPill(ctx, riskProfile, pillX, 410, { background: "#0f172a", color: "#ffffff" }) + 14;
  drawPill(ctx, finpleType, pillX, 410, { background: "#eff6ff", color: "#2563eb" });

  const compactRows = rows.length >= 7;
  let y = compactRows ? 520 : 540;
  const barX = 98;
  const rowGap = compactRows ? 58 : 82;
  const barHeight = compactRows ? 20 : 24;
  const labelFontSize = compactRows ? 23 : 27;

  rows.forEach((row) => {
    ctx.fillStyle = "#334155";
    ctx.font = `800 ${labelFontSize}px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    ctx.fillText(row.label, barX, y);
    ctx.textAlign = "right";
    ctx.fillText(row.weightText, 982, y);
    ctx.textAlign = "left";

    ctx.fillStyle = "#e2e8f0";
    drawRoundRect(ctx, barX, y + 20, 884, barHeight, 999);
    ctx.fill();

    const filledWidth = Math.max(12, Math.min(884, 884 * row.weight / 100));
    const gradient = ctx.createLinearGradient(barX, y + 20, barX + filledWidth, y + 20);
    gradient.addColorStop(0, "#38bdf8");
    gradient.addColorStop(1, "#2563eb");
    ctx.fillStyle = gradient;
    drawRoundRect(ctx, barX, y + 20, filledWidth, barHeight, 999);
    ctx.fill();
    y += rowGap;
  });

  ctx.fillStyle = "#fff7ed";
  drawRoundRect(ctx, 98, 1015, 884, 140, 28);
  ctx.fill();
  ctx.strokeStyle = "#fed7aa";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#9a3412";
  ctx.font = "900 22px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("투자 유의사항", 128, 1062);
  ctx.fillStyle = "#475569";
  ctx.font = "700 18px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  drawWrappedText(ctx, caution, 128, 1102, 824, 28, 2);

  ctx.fillStyle = "#64748b";
  ctx.font = "700 18px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("본 이미지는 투자 성향 이해를 돕기 위한 참고용이며 특정 금융상품의 매수·매도 권유가 아닙니다.", 98, 1224);
  ctx.fillStyle = "#2563eb";
  ctx.font = "900 24px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("finple.co.kr", 98, 1264);

  return canvas;
}

function downloadCanvasAsPng(canvas) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const link = document.createElement("a");
  link.download = `finple-mbti-result-${today}.png`;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function handleMbtiImageExport() {
  setExportStatus("결과 이미지를 생성 중입니다.");
  try {
    const canvas = await drawMbtiCanvas();
    downloadCanvasAsPng(canvas);
    setExportStatus("결과 이미지를 저장했습니다.");
  } catch (error) {
    console.error("투자 MBTI 이미지 저장 실패", error);
    setExportStatus("이미지 저장에 실패했습니다. PDF 저장을 이용해 주세요.");
  }
}

function bindMbtiImageExport() {
  document.addEventListener("click", (event) => {
    const button = event.target?.closest?.(".investmentMbtiShareActions button");
    if (!button) return;
    if (String(button.textContent || "").trim() !== MBTI_IMAGE_EXPORT_BUTTON_LABEL) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    handleMbtiImageExport();
  }, true);
}

(function initMbtiImageExportPatch() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  window.addEventListener("load", updateMbtiActionLabels);
  window.addEventListener("popstate", () => window.setTimeout(updateMbtiActionLabels, 80));

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(updateMbtiActionLabels);
  });
  window.addEventListener("load", () => {
    observer.observe(document.body, { childList: true, subtree: true });
  });

  bindMbtiImageExport();
})();
