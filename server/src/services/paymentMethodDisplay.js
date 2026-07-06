const CARD_ISSUER_NAMES = {
  "3K": "IBK기업은행",
  "46": "광주은행",
  "71": "롯데카드",
  "30": "KDB산업은행",
  "31": "BC카드",
  "51": "삼성카드",
  "38": "새마을금고",
  "41": "신한카드",
  "62": "신협",
  "36": "씨티카드",
  "33": "우리카드",
  W1: "우리카드",
  "37": "우체국",
  "39": "저축은행",
  "35": "전북은행",
  "42": "제주은행",
  "15": "카카오뱅크",
  "3A": "케이뱅크",
  "24": "토스뱅크",
  "21": "하나카드",
  "61": "현대카드",
  "11": "KB국민카드",
  "91": "NH농협카드",
  "34": "수협은행",
};

function normalizeCardCode(value) {
  return String(value || "").trim().toUpperCase();
}

function isCodeLike(value) {
  const code = normalizeCardCode(value);
  return /^[0-9A-Z]{2,3}$/.test(code) && Boolean(CARD_ISSUER_NAMES[code] || /^\d{2,3}$/.test(code));
}

export function resolveCardCompany(...values) {
  for (const value of values) {
    const raw = String(value || "").trim();
    if (!raw) continue;

    const code = normalizeCardCode(raw);
    if (CARD_ISSUER_NAMES[code]) return CARD_ISSUER_NAMES[code];
    if (!isCodeLike(raw)) return raw.replace(/\s*은행$/u, "").trim();
  }

  return "카드";
}

export function getMaskedTail(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const compact = raw.replace(/[^0-9*]/g, "");
  if (!compact) return "";

  if (compact.includes("*")) {
    const tail = compact.slice(-4);
    return /[0-9]/.test(tail) ? tail.replace(/\*/g, "") : "";
  }

  const digits = compact.replace(/\D/g, "");
  return digits.length >= 4 ? digits.slice(-4) : "";
}

function getNestedCard(payload = {}) {
  if (payload?.card && typeof payload.card === "object") return payload.card;
  return isCardLikePayload(payload) ? payload : {};
}

function isCardLikePayload(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return [
    "number",
    "cardNumber",
    "maskedNumber",
    "maskedCardNumber",
    "last4",
    "cardLast4",
    "card_last4",
    "lastFour",
    "lastFourDigits",
    "issuerCode",
    "acquirerCode",
    "company",
    "cardCompany",
    "card_company",
  ].some((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function collectPaymentPayloads(source, depth = 0, seen = new Set()) {
  if (!source || typeof source !== "object" || depth > 5 || seen.has(source)) return [];
  seen.add(source);

  const payloads = [source];
  Object.entries(source).forEach(([key, value]) => {
    if (!value || typeof value !== "object") return;
    const normalizedKey = key.replace(/[_-]/g, "").toLowerCase();
    const shouldInspect =
      isCardLikePayload(value) ||
      [
        "card",
        "payment",
        "paymentpayload",
        "firstpayment",
        "billingissue",
        "issuepayload",
        "providerresponse",
        "providerpayload",
        "tosspayment",
        "metadata",
      ].includes(normalizedKey);

    if (shouldInspect) {
      payloads.push(...collectPaymentPayloads(value, depth + 1, seen));
    }
  });

  return payloads;
}

function getCardNumberCandidates(payload = {}, row = {}) {
  const card = getNestedCard(payload);
  return [
    card.number,
    card.cardNumber,
    card.maskedNumber,
    card.maskedCardNumber,
    card.last4,
    card.cardLast4,
    card.card_last4,
    card.lastFour,
    card.lastFourDigits,
    payload.maskedCardNumber,
    payload.masked_card_number,
    payload.cardNumber,
    payload.card_number,
    payload.cardLast4,
    payload.card_last4,
    payload.last4,
    payload.lastFour,
    payload.lastFourDigits,
    row.masked_card_number,
    row.card_last4,
  ];
}

export function formatCardDisplayLabel(company, tail) {
  const safeCompany = resolveCardCompany(company);
  const safeTail = getMaskedTail(tail);
  return safeTail ? `${safeCompany} · **** ${safeTail}` : (safeCompany === "카드" ? "등록된 카드" : safeCompany);
}

function isGenericPaymentLabel(label) {
  const text = String(label || "").trim().toLowerCase();
  if (!text) return true;
  return [
    "card registered",
    "registered card",
    "payment method registered",
    "등록 완료",
    "카드 등록 완료",
    "등록된 결제수단",
    "등록된 카드",
  ].some((generic) => text === generic.toLowerCase());
}

function normalizeStoredDisplayLabel(value) {
  return String(value || "")
    .trim()
    .replace(/\s*기본\s*$/u, "")
    .replace(/\s*등록\s*완료\s*$/u, "")
    .trim();
}

function getStoredCardCompanyLast4Summary(row = {}, source) {
  const cardLast4 = getMaskedTail(row.card_last4);
  if (!row.card_company || !cardLast4) return null;

  const company = resolveCardCompany(row.card_company);
  return {
    displayLabel: formatCardDisplayLabel(company, cardLast4),
    cardCompany: company,
    cardLast4,
    maskedCardNumber: row.masked_card_number || null,
    cardBrandKey: normalizeCardCode(row.card_company),
    source,
  };
}

function getSafeStoredDisplayLabelSummary(row = {}, storedLabel = "") {
  const label = normalizeStoredDisplayLabel(storedLabel);
  const tail = getMaskedTail(label);
  if (!label || !tail || isGenericPaymentLabel(label)) return null;

  const leadingCode = label.match(/^\s*([0-9A-Z]{2,3})\b/i)?.[1] || "";
  const companyText = label
    .replace(new RegExp(`${tail}\\s*$`), "")
    .replace(/[\s*.\-·ㆍ]+$/u, "")
    .trim();
  const company = resolveCardCompany(row.card_company, leadingCode, companyText);

  return {
    displayLabel: formatCardDisplayLabel(company, tail),
    cardCompany: company,
    cardLast4: tail,
    maskedCardNumber: row.masked_card_number || null,
    cardBrandKey: normalizeCardCode(row.card_company || leadingCode),
    source: "stored_display_label",
  };
}

export function buildStoredPaymentMethodSummary(row = {}, ...metadataSources) {
  if (!row || typeof row !== "object") return null;

  const storedCardSummary = getStoredCardCompanyLast4Summary(row, "stored_card_company_last4");
  if (storedCardSummary) return storedCardSummary;

  const storedLabel = normalizeStoredDisplayLabel(row.display_label);
  const storedDisplaySummary = getSafeStoredDisplayLabelSummary(row, storedLabel);
  if (storedDisplaySummary) return storedDisplaySummary;

  const maskedTail = getMaskedTail(row.masked_card_number);
  if (maskedTail) {
    const company = resolveCardCompany(row.card_company);
    return {
      displayLabel: formatCardDisplayLabel(company, maskedTail),
      cardCompany: company,
      cardLast4: maskedTail,
      maskedCardNumber: row.masked_card_number || null,
      cardBrandKey: normalizeCardCode(row.card_company),
      source: "stored_masked_card_number",
    };
  }

  const metadataSummary = buildPaymentMethodSummary(...metadataSources);
  if (metadataSummary) return { ...metadataSummary, source: metadataSummary.source || "payment_metadata" };

  if (row.card_company) {
    const company = resolveCardCompany(row.card_company);
    return {
      displayLabel: formatCardDisplayLabel(company, ""),
      cardCompany: company,
      cardLast4: null,
      maskedCardNumber: null,
      cardBrandKey: normalizeCardCode(row.card_company),
      source: "stored_card_company_only",
    };
  }

  return {
    displayLabel: "등록된 카드",
    cardCompany: null,
    cardLast4: null,
    maskedCardNumber: null,
    cardBrandKey: null,
    source: "stored_method_safe_fallback",
  };
}

export function buildPaymentMethodSummary(...sources) {
  const payloads = sources
    .filter((source) => source && typeof source === "object")
    .flatMap((source) => collectPaymentPayloads(source));
  if (payloads.length === 0) return null;

  const companyCandidates = [];
  const numberCandidates = [];
  const brandCandidates = [];

  payloads.forEach((payload) => {
    const card = getNestedCard(payload);
    companyCandidates.push(
      card.company,
      card.cardCompany,
      payload.cardCompany,
      payload.card_company,
      card.issuerCode,
      card.acquirerCode,
      payload.issuerCode,
      payload.acquirerCode,
      payload.method,
      payload.card_company
    );
    brandCandidates.push(card.issuerCode, card.acquirerCode, payload.issuerCode, payload.acquirerCode, payload.card_company);
    numberCandidates.push(...getCardNumberCandidates(payload, payload));
  });

  const tail = numberCandidates.map(getMaskedTail).find(Boolean);
  if (!tail) return null;

  const company = resolveCardCompany(...companyCandidates);

  return {
    displayLabel: formatCardDisplayLabel(company, tail),
    cardCompany: company,
    cardLast4: tail,
    maskedCardNumber: null,
    cardBrandKey: normalizeCardCode(brandCandidates.find(Boolean)),
  };
}
