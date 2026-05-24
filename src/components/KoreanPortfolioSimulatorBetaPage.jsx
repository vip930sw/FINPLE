function KoreanPortfolioSimulatorBetaPage({ onBack, onOpenUsSimulator, onOpenSupport }) {
  return (
    <main className="page startHubPage krSimulatorBetaPage">
      <header className="header">
        <button type="button" className="brandLogo resetButton" onClick={onBack}>
          <div className="brandIcon">
            <span>F</span>
            <i />
          </div>
          <div className="brandText">
            <strong>FINPLE</strong>
            <span>Portfolio Lab</span>
          </div>
        </button>
      </header>

      <section className="startHubHero krSimulatorBetaHero">
        <p className="badge">한국주식 포트폴리오 시뮬레이터 Beta</p>
        <h1>한국주식·ETF 분석 도구를 준비 중입니다</h1>
        <p>
          기존 미국주식 포트폴리오 시뮬레이터의 구조는 유지하면서,
          한국주식과 국내 ETF에 맞는 티커·시세·분배금 데이터 구조를 단계적으로 검증합니다.
        </p>
      </section>

      <section className="startHubGrid krSimulatorBetaGrid" aria-label="한국주식 시뮬레이터 준비 항목">
        <article className="startHubCard">
          <div className="startHubIcon" aria-hidden="true">🇰🇷</div>
          <p>Market</p>
          <h2>KRX 티커 구조</h2>
          <span>005930, 069500처럼 6자리 코드와 국내 ETF명을 안정적으로 매칭하는 구조를 준비합니다.</span>
        </article>
        <article className="startHubCard">
          <div className="startHubIcon" aria-hidden="true">💱</div>
          <p>Currency</p>
          <h2>KRW 기준 계산</h2>
          <span>한국주식은 원화 시세를 기본으로 사용하고, 향후 미국자산과의 통합 환산도 고려합니다.</span>
        </article>
        <article className="startHubCard">
          <div className="startHubIcon" aria-hidden="true">📄</div>
          <p>Data</p>
          <h2>CSV / API 검증</h2>
          <span>한국주식·ETF 후보군, 현재가, 장기수익률, 배당·분배금 데이터의 확보 가능성을 검토합니다.</span>
        </article>
      </section>

      <section className="krSimulatorBetaActions" aria-label="한국주식 시뮬레이터 다음 행동">
        <button type="button" className="primaryButton" onClick={onOpenUsSimulator}>미국 시뮬레이터 사용하기</button>
        <button type="button" className="secondaryButton" onClick={onOpenSupport}>의견 남기기</button>
      </section>
    </main>
  );
}

export default KoreanPortfolioSimulatorBetaPage;
