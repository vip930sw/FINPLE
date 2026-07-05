import MyPageSidebar from "./MyPageSidebar";

export default function MyPageLayout({ activeSection, onSectionChange, children, hiddenPaymentSections = false }) {
  return (
    <main className="accountPage myPage myPageReactRoute" data-finple-mypage-react="true">
      <section className="accountHero myPageReactHero">
        <p className="sectionLabel">MY PAGE</p>
        <h1>MY PAGE</h1>
        <p>계정, 구독, 결제수단과 저장 상태를 한 곳에서 확인합니다.</p>
      </section>

      <section className="myPageDashboardLayout myPageDashboardLayout--singlePanel">
        <MyPageSidebar
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          hiddenPaymentSections={hiddenPaymentSections}
        />
        <section className="accountPanelStack" aria-live="polite">
          {children}
        </section>
      </section>
    </main>
  );
}
