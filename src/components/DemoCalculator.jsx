import { useMemo, useState } from "react";

function formatWon(value) {
  const safeValue = Number.isFinite(value) ? Math.round(value) : 0;
  return `${safeValue.toLocaleString()}원`;
}

function toNumber(value) {
  return Number(String(value).replace(/[^0-9.-]/g, "")) || 0;
}

export default function DemoCalculator() {
  const [investmentAmount, setInvestmentAmount] = useState(10000000);
  const [expectedReturn, setExpectedReturn] = useState(8.0);
  const [years, setYears] = useState(1);

  const result = useMemo(() => {
    const principal = Number(investmentAmount || 0);
    const annualRate = Number(expectedReturn || 0) / 100;
    const period = Math.max(0, Number(years || 0));
    const finalValue = principal * Math.pow(1 + annualRate, period);
    const expectedProfit = Math.max(0, finalValue - principal);

    return {
      finalValue,
      expectedProfit,
      annualRatePercent: Number(expectedReturn || 0).toFixed(1),
    };
  }, [investmentAmount, expectedReturn, years]);

  return (
    <section id="intro" className="section white demoCalculatorSection">
      <p className="sectionLabel">Demo Calculator</p>
      <h2>간단한 수익 계산을 먼저 체험해보세요.</h2>

      <div className="demoCalculatorGrid">
        <label className="demoInputCard">
          <span>투자금액 (원)</span>
          <input
            type="text"
            value={investmentAmount.toLocaleString()}
            onChange={(event) => setInvestmentAmount(toNumber(event.target.value))}
          />
        </label>

        <label className="demoInputCard">
          <span>기간 (년)</span>
          <input
            type="number"
            min="0"
            value={years}
            onChange={(event) => setYears(Number(event.target.value))}
          />
        </label>

        <label className="demoInputCard">
          <span>예상 수익률 (%)</span>
          <input
            type="number"
            step="0.1"
            value={Number(expectedReturn).toFixed(1)}
            onChange={(event) => setExpectedReturn(Number(event.target.value))}
          />
        </label>

        <div className="demoResultCard">
          <span>예상 수익금</span>
          <strong>{formatWon(result.expectedProfit)}</strong>
          <small>
            {years}년 후 예상 평가금액 {formatWon(result.finalValue)}
          </small>
        </div>
      </div>
    </section>
  );
}
