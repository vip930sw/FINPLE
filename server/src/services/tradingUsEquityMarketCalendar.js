export const US_EQUITY_MARKET_CALENDAR_VERSION = "nyse-equity-calendar-2026-2028-v1";

export const US_EQUITY_CORE_OPEN_MINUTE = 9 * 60 + 30;
export const US_EQUITY_CORE_CLOSE_MINUTE = 16 * 60;
export const US_EQUITY_EARLY_CLOSE_MINUTE = 13 * 60;

const CALENDAR = Object.freeze({
  2026: Object.freeze({
    holidays: Object.freeze({
      "2026-01-01": "new_years_day",
      "2026-01-19": "martin_luther_king_jr_day",
      "2026-02-16": "washingtons_birthday",
      "2026-04-03": "good_friday",
      "2026-05-25": "memorial_day",
      "2026-06-19": "juneteenth",
      "2026-07-03": "independence_day_observed",
      "2026-09-07": "labor_day",
      "2026-11-26": "thanksgiving_day",
      "2026-12-25": "christmas_day",
    }),
    earlyCloses: Object.freeze({
      "2026-11-27": "day_after_thanksgiving",
      "2026-12-24": "christmas_eve",
    }),
  }),
  2027: Object.freeze({
    holidays: Object.freeze({
      "2027-01-01": "new_years_day",
      "2027-01-18": "martin_luther_king_jr_day",
      "2027-02-15": "washingtons_birthday",
      "2027-03-26": "good_friday",
      "2027-05-31": "memorial_day",
      "2027-06-18": "juneteenth_observed",
      "2027-07-05": "independence_day_observed",
      "2027-09-06": "labor_day",
      "2027-11-25": "thanksgiving_day",
      "2027-12-24": "christmas_day_observed",
    }),
    earlyCloses: Object.freeze({
      "2027-11-26": "day_after_thanksgiving",
    }),
  }),
  2028: Object.freeze({
    holidays: Object.freeze({
      "2028-01-17": "martin_luther_king_jr_day",
      "2028-02-21": "washingtons_birthday",
      "2028-04-14": "good_friday",
      "2028-05-29": "memorial_day",
      "2028-06-19": "juneteenth",
      "2028-07-04": "independence_day",
      "2028-09-04": "labor_day",
      "2028-11-23": "thanksgiving_day",
      "2028-12-25": "christmas_day",
    }),
    earlyCloses: Object.freeze({
      "2028-07-03": "independence_day_eve",
      "2028-11-24": "day_after_thanksgiving",
    }),
  }),
});

function finite(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function newYorkParts(timestampMs) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const values = Object.fromEntries(
    formatter.formatToParts(new Date(timestampMs)).map((part) => [part.type, part.value]),
  );
  return {
    year: Number(values.year),
    date: `${values.year}-${values.month}-${values.day}`,
    weekday: values.weekday,
    hour: Number(values.hour),
    minute: Number(values.minute),
  };
}

export function getSupportedUsEquityCalendarYears() {
  return Object.keys(CALENDAR).map(Number).sort((left, right) => left - right);
}

export function getUsEquityMarketSession(timestampInput, options = {}) {
  const timestampMs = finite(timestampInput);
  if (timestampMs === null) {
    return {
      calendarVersion: US_EQUITY_MARKET_CALENDAR_VERSION,
      calendarSupported: false,
      state: "UNSUPPORTED_CALENDAR",
      open: false,
      reason: "invalid_timestamp",
    };
  }

  const parts = newYorkParts(timestampMs);
  const override = options.overrideByDate?.[parts.date] || null;
  const yearCalendar = CALENDAR[parts.year];
  const minuteOfDay = parts.hour * 60 + parts.minute;
  const weekend = ["Sat", "Sun"].includes(parts.weekday);

  if (!yearCalendar && !override) {
    return {
      calendarVersion: US_EQUITY_MARKET_CALENDAR_VERSION,
      calendarSupported: false,
      state: "UNSUPPORTED_CALENDAR",
      open: false,
      reason: "calendar_year_not_supported",
      sessionDate: parts.date,
      year: parts.year,
      minuteOfDay,
    };
  }

  const holidayName = override?.closed === true
    ? String(override.reason || "calendar_override_closed")
    : yearCalendar?.holidays?.[parts.date] || null;
  const earlyCloseName = override?.earlyCloseMinute
    ? String(override.reason || "calendar_override_early_close")
    : yearCalendar?.earlyCloses?.[parts.date] || null;
  const closeMinute = override?.earlyCloseMinute
    ? Number(override.earlyCloseMinute)
    : earlyCloseName
      ? US_EQUITY_EARLY_CLOSE_MINUTE
      : US_EQUITY_CORE_CLOSE_MINUTE;

  if (weekend || holidayName) {
    return {
      calendarVersion: US_EQUITY_MARKET_CALENDAR_VERSION,
      calendarSupported: true,
      state: "CLOSED",
      open: false,
      reason: weekend ? "weekend" : "exchange_holiday",
      holidayName,
      earlyClose: false,
      sessionDate: parts.date,
      year: parts.year,
      minuteOfDay,
      openMinute: US_EQUITY_CORE_OPEN_MINUTE,
      closeMinute,
      minutesToOpen: null,
      minutesSinceOpen: null,
      minutesToClose: null,
    };
  }

  const beforeOpen = minuteOfDay < US_EQUITY_CORE_OPEN_MINUTE;
  const afterClose = minuteOfDay >= closeMinute;
  const state = beforeOpen ? "PREOPEN" : afterClose ? "POSTCLOSE" : "REGULAR";
  return {
    calendarVersion: US_EQUITY_MARKET_CALENDAR_VERSION,
    calendarSupported: true,
    state,
    open: state === "REGULAR",
    reason: state === "REGULAR" ? null : state === "PREOPEN" ? "before_core_session" : "after_core_session",
    holidayName: null,
    earlyClose: Boolean(earlyCloseName),
    earlyCloseName,
    sessionDate: parts.date,
    year: parts.year,
    minuteOfDay,
    openMinute: US_EQUITY_CORE_OPEN_MINUTE,
    closeMinute,
    minutesToOpen: beforeOpen ? US_EQUITY_CORE_OPEN_MINUTE - minuteOfDay : 0,
    minutesSinceOpen: state === "REGULAR" ? minuteOfDay - US_EQUITY_CORE_OPEN_MINUTE : null,
    minutesToClose: state === "REGULAR" ? closeMinute - minuteOfDay : null,
  };
}
