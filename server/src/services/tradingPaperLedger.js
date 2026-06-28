function clean(value) {
  return String(value ?? "").trim();
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toPositiveNumber(value) {
  const number = toNumber(value);
  return number !== null && number > 0 ? number : null;
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function roundQuantity(value) {
  return Math.round((Number(value) + Number.EPSILON) * 1_000_000) / 1_000_000;
}

function emptyPosition(symbol) {
  return {
    symbol,
    quantity: 0,
    averageCost: 0,
    realizedPnl: 0,
  };
}

function normalizePosition(position = {}) {
  const symbol = clean(position.symbol).toUpperCase();
  return {
    symbol,
    quantity: roundQuantity(toNumber(position.quantity) ?? 0),
    averageCost: roundMoney(toNumber(position.averageCost) ?? 0),
    realizedPnl: roundMoney(toNumber(position.realizedPnl) ?? 0),
  };
}

export function createPaperLedger(initialCash = 0, positions = []) {
  const cash = toNumber(initialCash);
  const normalizedPositions = new Map();
  for (const position of positions) {
    const normalized = normalizePosition(position);
    if (normalized.symbol) {
      normalizedPositions.set(normalized.symbol, normalized);
    }
  }

  return {
    cash: roundMoney(cash ?? 0),
    positions: Object.fromEntries([...normalizedPositions.entries()].sort(([left], [right]) => left.localeCompare(right))),
    events: [],
  };
}

export function simulatePaperFill(intent = {}, options = {}) {
  const symbol = clean(intent.symbol).toUpperCase();
  const side = clean(intent.side).toLowerCase();
  const quantity = toPositiveNumber(intent.quantity);
  const fillPrice = toPositiveNumber(options.fillPrice ?? intent.estimatedPrice);
  const fxRate = toPositiveNumber(options.fxRate ?? intent.estimatedFxRate ?? 1);
  const fee = toNumber(options.fee ?? 0);
  const tax = toNumber(options.tax ?? 0);
  const reasons = [
    symbol ? null : "missing_symbol",
    ["buy", "sell"].includes(side) ? null : "invalid_side",
    quantity === null ? "invalid_quantity" : null,
    fillPrice === null ? "invalid_fillPrice" : null,
    fxRate === null ? "invalid_fxRate" : null,
    fee === null || fee < 0 ? "invalid_fee" : null,
    tax === null || tax < 0 ? "invalid_tax" : null,
  ].filter(Boolean);
  const grossAmount = quantity !== null && fillPrice !== null && fxRate !== null ? roundMoney(quantity * fillPrice * fxRate) : null;
  const totalCost = grossAmount !== null && fee !== null && tax !== null ? roundMoney(grossAmount + fee + tax) : null;
  const netProceeds = grossAmount !== null && fee !== null && tax !== null ? roundMoney(grossAmount - fee - tax) : null;

  return {
    valid: reasons.length === 0,
    reasons,
    fill: {
      symbol,
      side,
      quantity,
      fillPrice,
      fxRate,
      fee,
      tax,
      grossAmount,
      totalCost,
      netProceeds,
      simulated: true,
      providerOrderId: null,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
    },
  };
}

export function applyPaperFill(ledger = createPaperLedger(), fill = {}) {
  const normalizedLedger = createPaperLedger(ledger.cash, Object.values(ledger.positions ?? {}));
  const symbol = clean(fill.symbol).toUpperCase();
  const side = clean(fill.side).toLowerCase();
  const quantity = toPositiveNumber(fill.quantity);
  const fillPrice = toPositiveNumber(fill.fillPrice);
  const fxRate = toPositiveNumber(fill.fxRate ?? 1);
  const fee = toNumber(fill.fee ?? 0);
  const tax = toNumber(fill.tax ?? 0);
  const reasons = [
    symbol ? null : "missing_symbol",
    ["buy", "sell"].includes(side) ? null : "invalid_side",
    quantity === null ? "invalid_quantity" : null,
    fillPrice === null ? "invalid_fillPrice" : null,
    fxRate === null ? "invalid_fxRate" : null,
    fee === null || fee < 0 ? "invalid_fee" : null,
    tax === null || tax < 0 ? "invalid_tax" : null,
  ].filter(Boolean);

  if (reasons.length > 0) {
    return {
      applied: false,
      reasons,
      ledger: normalizedLedger,
    };
  }

  const grossAmount = roundMoney(quantity * fillPrice * fxRate);
  const totalCost = roundMoney(grossAmount + fee + tax);
  const netProceeds = roundMoney(grossAmount - fee - tax);
  const position = normalizePosition(normalizedLedger.positions[symbol] ?? emptyPosition(symbol));

  if (side === "buy" && normalizedLedger.cash < totalCost) {
    return {
      applied: false,
      reasons: ["insufficient_cash"],
      ledger: normalizedLedger,
    };
  }

  if (side === "sell" && position.quantity < quantity) {
    return {
      applied: false,
      reasons: ["insufficient_position_quantity"],
      ledger: normalizedLedger,
    };
  }

  const nextLedger = createPaperLedger(normalizedLedger.cash, Object.values(normalizedLedger.positions));
  let realizedPnlChange = 0;
  let realizedPnlAfter = position.realizedPnl;
  if (side === "buy") {
    const previousCostBasis = position.quantity * position.averageCost;
    const nextQuantity = roundQuantity(position.quantity + quantity);
    const nextCostBasis = previousCostBasis + totalCost;
    nextLedger.cash = roundMoney(nextLedger.cash - totalCost);
    nextLedger.positions[symbol] = {
      symbol,
      quantity: nextQuantity,
      averageCost: roundMoney(nextCostBasis / nextQuantity),
      realizedPnl: position.realizedPnl,
    };
  } else {
    const costBasisSold = roundMoney(position.averageCost * quantity);
    realizedPnlChange = roundMoney(netProceeds - costBasisSold);
    realizedPnlAfter = roundMoney(position.realizedPnl + realizedPnlChange);
    const nextQuantity = roundQuantity(position.quantity - quantity);
    nextLedger.cash = roundMoney(nextLedger.cash + netProceeds);
    if (nextQuantity === 0) {
      delete nextLedger.positions[symbol];
    } else {
      nextLedger.positions[symbol] = {
        symbol,
        quantity: nextQuantity,
        averageCost: position.averageCost,
        realizedPnl: realizedPnlAfter,
      };
    }
  }

  nextLedger.events = [
    ...(Array.isArray(ledger.events) ? ledger.events : []),
    {
      type: "paper_fill_applied",
      symbol,
      side,
      quantity,
      fillPrice,
      fxRate,
      fee,
      tax,
      grossAmount,
      realizedPnlChange,
      realizedPnlAfter,
      cashAfter: nextLedger.cash,
    },
  ];

  return {
    applied: true,
    reasons: [],
    ledger: nextLedger,
  };
}

export function markToMarketPaperLedger(ledger = createPaperLedger(), prices = {}) {
  const normalizedLedger = createPaperLedger(ledger.cash, Object.values(ledger.positions ?? {}));
  let positionsMarketValue = 0;
  const missingPrices = [];
  const positions = {};

  for (const [symbol, position] of Object.entries(normalizedLedger.positions)) {
    const price = toPositiveNumber(prices[symbol]);
    if (price === null) {
      missingPrices.push(symbol);
      positions[symbol] = {
        ...position,
        marketPrice: null,
        marketValue: null,
        unrealizedPnl: null,
      };
      continue;
    }
    const marketValue = roundMoney(position.quantity * price);
    const costBasis = roundMoney(position.quantity * position.averageCost);
    const unrealizedPnl = roundMoney(marketValue - costBasis);
    positionsMarketValue = roundMoney(positionsMarketValue + marketValue);
    positions[symbol] = {
      ...position,
      marketPrice: price,
      marketValue,
      unrealizedPnl,
    };
  }

  return {
    cash: normalizedLedger.cash,
    positions,
    positionsMarketValue,
    totalEquity: missingPrices.length === 0 ? roundMoney(normalizedLedger.cash + positionsMarketValue) : null,
    missingPrices,
    providerCallsAllowed: false,
  };
}
