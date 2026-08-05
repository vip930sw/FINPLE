import test from "node:test";
import assert from "node:assert/strict";

import {
  getSupportedUsEquityCalendarYears,
  getUsEquityMarketSession,
  US_EQUITY_EARLY_CLOSE_MINUTE,
} from "./tradingUsEquityMarketCalendar.js";

test("supports the explicit official 2026 through 2028 calendar range", () => {
  assert.deepEqual(getSupportedUsEquityCalendarYears(), [2026, 2027, 2028]);
});

test("blocks an official 2026 exchange holiday", () => {
  const session = getUsEquityMarketSession(Date.parse("2026-07-03T15:00:00Z"));
  assert.equal(session.state, "CLOSED");
  assert.equal(session.reason, "exchange_holiday");
  assert.equal(session.holidayName, "independence_day_observed");
});

test("uses the official 13:00 ET early close on the day after 2026 Thanksgiving", () => {
  const beforeClose = getUsEquityMarketSession(Date.parse("2026-11-27T17:30:00Z"));
  assert.equal(beforeClose.state, "REGULAR");
  assert.equal(beforeClose.earlyClose, true);
  assert.equal(beforeClose.closeMinute, US_EQUITY_EARLY_CLOSE_MINUTE);
  assert.equal(beforeClose.minutesToClose, 30);

  const afterClose = getUsEquityMarketSession(Date.parse("2026-11-27T18:01:00Z"));
  assert.equal(afterClose.state, "POSTCLOSE");
  assert.equal(afterClose.earlyClose, true);
});

test("uses America New York daylight-saving conversion for regular hours", () => {
  const summer = getUsEquityMarketSession(Date.parse("2026-08-05T13:35:00Z"));
  assert.equal(summer.state, "REGULAR");
  assert.equal(summer.minutesSinceOpen, 5);

  const winter = getUsEquityMarketSession(Date.parse("2026-12-01T14:35:00Z"));
  assert.equal(winter.state, "REGULAR");
  assert.equal(winter.minutesSinceOpen, 5);
});

test("fails closed outside the supported calendar years", () => {
  const session = getUsEquityMarketSession(Date.parse("2029-01-03T15:00:00Z"));
  assert.equal(session.calendarSupported, false);
  assert.equal(session.state, "UNSUPPORTED_CALENDAR");
  assert.equal(session.reason, "calendar_year_not_supported");
});

test("allows an explicit reviewed calendar override", () => {
  const session = getUsEquityMarketSession(Date.parse("2029-01-03T15:00:00Z"), {
    overrideByDate: {
      "2029-01-03": { earlyCloseMinute: 13 * 60, reason: "reviewed_test_override" },
    },
  });
  assert.equal(session.calendarSupported, true);
  assert.equal(session.state, "REGULAR");
  assert.equal(session.earlyClose, true);
  assert.equal(session.earlyCloseName, "reviewed_test_override");
});
