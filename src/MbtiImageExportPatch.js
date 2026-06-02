import { FINPLE_LOGO_DATA_URL } from "./assets/finpleLogoDataUrl.js";

const MBTI_IMAGE_EXPORT_BUTTON_LABEL = "이미지 저장";
const MBTI_IMAGE_EXPORT_LEGACY_LABEL = "SNS 공유";
const MBTI_TOP_BUTTON_CLASS = "investmentMbtiTopButton";
let finpleLogoImagePromise = null;

function isMbtiResultPage() {
  return Boolean(document.querySelector(".investmentMbtiResultPage"));
}

function getText(selector, fallback = "-") {
  const node = document.querySelector(selector);
  const value = String(node?.textContent || "").replace(/\s+/g, " ").trim();
  return value || fallback;
}

function normalizeQuoteText(value) {
  return String(value || "").replace(/[“”"]/g, "").trim();
}

function getMbtiNickname() {
  const highlightedName = normalizeQuoteText(getText(".investmentMbtiResultName", ""));
  if (highlightedName) return highlightedName;

  const rawTitle = getText(".investmentMbtiResultHero h1", "FINPLE 투자 MBTI");
  return normalizeQuoteText(rawTitle)
    .replace(/^당신의 FINPLE 투자 MBTI는\s*/, "")
    .replace(/^당신의 투자 MBTI는\s*/, "")
    .replace(/입니다\.?$/, "")
    .trim() || rawTitle;
}

function getAxisTypeText() {
  const labels = Array.from(document.querySelectorAll(".investmentMbtiAxisLabels > strong"))
    .map((node) => String(node.textContent || "").trim())
    .filter(Boolean);
  return labels.length ? labels.join(" · ") : getText(".investmentMbtiResultHero p", "-");
}

function getRiskProfile() {
  return getText(".investmentMbtiAxisRiskCard strong", "-");
}

function getTypeOverview() {
  return getText(".investmentMbtiStoryPanel > p", "FINPLE 투자 성향 결과입니다.");
}

function getPortfolioRows() {
  return Array.from(document.querySelectorAll(".investmentMbtiPortfolioRow")).map((row) => {
    const label = String(row.querySelector("strong")?.textContent || "").trim();
    const weightText = String(row.querySelector("span")?.textContent || "0%").trim();
    const weight = Number(weightText.replace("%", "")) || 0;
    return { label, weightText, weight };
  }).filter((row) => row.label && row.weight > 0);
}

function getDisclaimerItems() {
  const items = Array.from(document.querySelectorAll(".investmentMbtiDisclaimerPanel > p"))
    .map((node) => String(node.textContent || "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return items.length ? items : ["본 결과는 투자 성향 이해를 돕기 위한 참고용입니다."];
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

function ensureTopButton() {
  if (!isMbtiResultPage()) {
    document.querySelector(`.${MBTI_TOP_BUTTON_CLASS}`)?.remove();
    return;
  }

  if (document.querySelector(`.${MBTI_TOP_BUTTON_CLASS}`)) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = MBTI_TOP_BUTTON_CLASS;
  button.textContent = "↑ TOP";
  button.setAttribute("aria-label", "상단으로 이동");
  button.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  document.body.appendChild(button);
}

function updateMbtiResultEnhancements() {
  updateMbtiActionLabels();
  ensureTopButton();
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
  const font = options.font || "700 24px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const paddingX = options.paddingX || 22;
  const height = options.height || 52;
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

function drawRightPill(ctx, text, rightX, y, options = {}) {
  const font = options.font || "700 24px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const paddingX = options.paddingX || 22;
  const height = options.height || 52;
  ctx.font = font;
  const width = Math.ceil(ctx.measureText(text).width + paddingX * 2);
  const x = rightX - width;
  ctx.fillStyle = options.background || "#eff6ff";
  drawRoundRect(ctx, x, y, width, height, height / 2);
  ctx.fill();
  ctx.fillStyle = options.color || "#2563eb";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + paddingX, y + height / 2 + 1);
  ctx.textBaseline = "alphabetic";
  return width;
}

function drawLabel(ctx, text, x, y) {
  ctx.fillStyle = "#2563eb";
  ctx.font = "900 20px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText(text, x, y);
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
  canvas.height = 1500;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas_context_unavailable");

  const nickname = getMbtiNickname();
  const finpleType = getAxisTypeText();
  const riskProfile = getRiskProfile();
  const overview = getTypeOverview();
  const rows = getPortfolioRows();
  const disclaimerItems = getDisclaimerItems();
  const logoImage = await loadFinpleLogoImage();

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  drawRoundRect(ctx, 58, 58, 964, 1384, 48);
  ctx.fill();
  ctx.strokeStyle = "#dbe5f3";
  ctx.lineWidth = 2;
  ctx.stroke();

  const logoX = 98;
  const logoY = 106;
  const logoSize = 58;
  const brandTextX = 172;
  if (logoImage) {
    ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
  } else {
    drawFinpleLogoFallback(ctx, logoX, logoY, logoSize);
  }

  ctx.fillStyle = "#0f172a";
  ctx.font = "900 34px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("FINPLE", brandTextX, 126);
  ctx.font = "800 20px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.fillText("Portfolio Lab", brandTextX, 164);

  drawRightPill(ctx, riskProfile, 982, 98, { background: "#0f172a", color: "#ffffff", font: "800 22px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", height: 48, paddingX: 20 });
  drawRightPill(ctx, finpleType, 982, 156, { background: "#eff6ff", color: "#2563eb", font: "700 20px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", height: 48, paddingX: 20 });

  ctx.font = "900 26px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#2563eb";
  ctx.fillText("INVESTMENT MBTI RESULT", 98, 246);

  ctx.fillStyle = "#0f172a";
  ctx.font = "900 60px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  drawWrappedText(ctx, `“${nickname}”`, 98, 320, 884, 70, 2);

  drawLabel(ctx, "유형 개요", 98, 500);
  ctx.fillStyle = "#475569";
  ctx.font = "700 23px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  drawWrappedText(ctx, overview, 98, 542, 884, 34, 4);

  const compactRows = rows.length >= 7;
  let y = compactRows ? 705 : 725;
  const barX = 98;
  const rowGap = compactRows ? 64 : 74;
  const barHeight = compactRows ? 16 : 20;
  const labelFontSize = compactRows ? 21 : 23;

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

  const noticeY = Math.min(1258, Math.max(1188, y + 24));
  ctx.fillStyle = "#f8fbff";
  drawRoundRect(ctx, 98, noticeY, 884, 124, 24);
  ctx.fill();
  ctx.strokeStyle = "#dbeafe";
  ctx.stroke();
  ctx.fillStyle = "#2563eb";
  ctx.font = "900 20px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("투자 유의사항", 122, noticeY + 34);
  ctx.fillStyle = "#475569";
  ctx.font = "700 16px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  drawWrappedText(ctx, `• ${disclaimerItems[0]}`, 122, noticeY + 66, 824, 24, 2);

  ctx.fillStyle = "#64748b";
  ctx.font = "700 17px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  drawWrappedText(ctx, "본 이미지는 투자 성향 이해를 돕기 위한 참고용이며 특정 금융상품의 매수·매도 권유가 아닙니다.", 98, 1358, 884, 24, 2);
  ctx.fillStyle = "#2563eb";
  ctx.font = "900 23px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("finple.co.kr", 98, 1404);

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

  window.addEventListener("load", updateMbtiResultEnhancements);
  window.addEventListener("popstate", () => window.setTimeout(updateMbtiResultEnhancements, 80));

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(updateMbtiResultEnhancements);
  });
  window.addEventListener("load", () => {
    observer.observe(document.body, { childList: true, subtree: true });
  });

  bindMbtiImageExport();
})();
