export default function SiteHeader({
  isLoggedIn = false,
  isAdminMode = false,
  authLabel,
  onHome,
  onStart,
  onNavigate,
  onLoginLogout,
  onHomeSection,
}) {
  function handleHomeClick() {
    if (typeof onHome === "function") {
      onHome();
      return;
    }
    onNavigate?.("home");
  }

  function handleStartClick() {
    if (typeof onStart === "function") {
      onStart();
      return;
    }
    onNavigate?.("personal");
  }

  function handleSectionClick(sectionId) {
    if (typeof onHomeSection === "function") {
      onHomeSection(sectionId);
      return;
    }

    onNavigate?.("home");
    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function handleMyPageClick() {
    if (isLoggedIn) {
      onNavigate?.("mypage");
      return;
    }

    if (isAdminMode) {
      onNavigate?.("admin-inquiries");
      return;
    }

    onNavigate?.("login");
  }

  return (
    <header className="header homeHeader siteHeader">
      <button type="button" className="brandLogo resetButton" onClick={handleHomeClick}>
        <div className="brandIcon"><span>F</span><i /></div>
        <div className="brandText"><strong>FINPLE</strong><span>Portfolio Lab</span></div>
      </button>

      <nav className="homeSectionNav siteHeaderSectionNav" aria-label="FINPLE 주요 섹션">
        <button type="button" className="navTextButton" onClick={() => handleSectionClick("hero")}>소개</button>
        <button type="button" className="navTextButton" onClick={() => handleSectionClick("index")}>인덱스</button>
        <button type="button" className="navTextButton" onClick={() => handleSectionClick("pricing")}>요금제</button>
      </nav>

      <div className="headerActions siteHeaderActions">
        <button className="secondaryHeaderButton" onClick={handleHomeClick}>홈</button>
        <button className="headerButton" onClick={handleStartClick}>시작하기</button>
        <button className="secondaryHeaderButton supportHeaderButton" onClick={() => onNavigate?.("support")}>문의사항</button>
        <button className="secondaryHeaderButton" onClick={handleMyPageClick}>MY PAGE</button>
        <button className="secondaryHeaderButton" onClick={onLoginLogout}>{authLabel || (isLoggedIn ? "로그오프" : "로그인")}</button>
      </div>
    </header>
  );
}
