export default function FloatingPortfolioDropdown({
  activePortfolio,
  portfolioList,
  activePortfolioId,
  isPortfolioDropdownOpen,
  setIsPortfolioDropdownOpen,
  selectPortfolioFromFloating,
  contextLabel = "현재 포트폴리오",
}) {
  return (
    <div className="floatingPortfolioDropdown">
      <button
        className="floatingPortfolioWidget"
        onClick={() => setIsPortfolioDropdownOpen(!isPortfolioDropdownOpen)}
        aria-label="포트폴리오 변경 메뉴 열기"
      >
        <span>{contextLabel}</span>
        <strong>{activePortfolio?.name || "포트폴리오"}</strong>
        <em>{isPortfolioDropdownOpen ? "닫기 ▲" : "변경하기 ▾"}</em>
      </button>

      {isPortfolioDropdownOpen && (
        <div className="floatingPortfolioMenu">
          {portfolioList.map((portfolio) => (
            <button
              key={portfolio.id}
              className={
                portfolio.id === activePortfolioId
                  ? "floatingPortfolioMenuItem active"
                  : "floatingPortfolioMenuItem"
              }
              onClick={() => selectPortfolioFromFloating(portfolio.id)}
            >
              {portfolio.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
