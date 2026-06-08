export default function SiteHeader({
  isLoggedIn = false,
  isAdminMode = false,
  authLabel,
  activePage = "home",
  onHome,
  onStart,
  onNavigate,
  onLoginLogout,
  onHomeSection,
  showHomeSectionNav = false,
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

  const activeKey = activePage === "personal" ? "start" : activePage;
  const stateKey = `${activeKey}|${isLoggedIn ? "in" : "out"}`;
  const navItems = [
    { key: "home", label: "홈", path: "/", className: "", onClick: handleHomeClick },
    { key: "start", label: "시작하기", path: "/start", className: "finpleGlobalStartButton", onClick: handleStartClick },
    { key: "pricing", label: "요금제", path: "/pricing", className: "", onClick: () => onNavigate?.("pricing") },
    { key: "support", label: "문의사항", path: "/support", className: "", onClick: () => onNavigate?.("support") },
    { key: "mypage", label: "MY PAGE", path: "/mypage", className: "", onClick: handleMyPageClick },
  ];

  return (
    <header className="header homeHeader siteHeader finpleUnifiedHeader" data-finple-global-nav-state={stateKey}>
      <button type="button" className="brandLogo resetButton" onClick={handleHomeClick}>
        <div className="brandIcon"><span>F</span><i /></div>
        <div className="brandText"><strong>FINPLE</strong><span>Portfolio Lab</span></div>
      </button>

      {showHomeSectionNav ? (
        <nav className="homeSectionNav siteHeaderSectionNav" aria-label="FINPLE 주요 섹션">
          <button type="button" className="navTextButton" onClick={() => handleSectionClick("hero")}>소개</button>
          <button type="button" className="navTextButton" onClick={() => handleSectionClick("index")}>인덱스</button>
          <button type="button" className="navTextButton" onClick={() => handleSectionClick("pricing")}>요금제</button>
        </nav>
      ) : null}

      <nav className="finpleGlobalNav" aria-label="FINPLE 주요 메뉴" data-finple-global-nav>
        {navItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={[item.className, activeKey === item.key ? "active" : ""].filter(Boolean).join(" ")}
            data-finple-nav-path={item.path}
            onClick={item.onClick}
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          className={["finpleGlobalAuthButton", activeKey === "login" ? "active" : ""].filter(Boolean).join(" ")}
          onClick={onLoginLogout}
        >
          {authLabel || (isLoggedIn ? "로그아웃" : "로그인")}
        </button>
      </nav>
    </header>
  );
}
