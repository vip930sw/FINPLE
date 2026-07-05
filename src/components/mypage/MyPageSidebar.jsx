export const MY_PAGE_SECTIONS = [
  { key: "account", label: "내 계정", description: "로그인·사용자" },
  { key: "investment", label: "내 투자성향", description: "투자 MBTI" },
  { key: "billing", label: "내 구독/플랜", description: "구독·요금제" },
  { key: "payment-method", label: "내 결제수단", description: "자동결제 등록" },
  { key: "payment-history", label: "내 결제내역", description: "영수증·이력" },
  { key: "inquiries", label: "내 문의내역", description: "접수·처리 현황" },
  { key: "storage", label: "내 저장내역", description: "저장·불러오기" },
];

export default function MyPageSidebar({ activeSection, onSectionChange, hiddenPaymentSections = false }) {
  const sections = hiddenPaymentSections
    ? MY_PAGE_SECTIONS.filter((section) => !["payment-method", "payment-history"].includes(section.key))
    : MY_PAGE_SECTIONS;

  return (
    <aside className="myPageSidebar" data-mypage-react-sidebar>
      <div className="myPageSidebarHeader">
        <strong>MY PAGE</strong>
        <span>내 정보 메뉴</span>
      </div>
      <select
        className="myPageMobileMenuSelect"
        aria-label="MY PAGE 메뉴 선택"
        value={activeSection}
        onChange={(event) => onSectionChange(event.target.value)}
      >
        {sections.map((section) => (
          <option key={section.key} value={section.key}>{section.label}</option>
        ))}
      </select>
      <nav className="myPageSidebarNav" aria-label="MY PAGE 메뉴">
        {sections.map((section) => (
          <button
            key={section.key}
            type="button"
            className={activeSection === section.key ? "active" : ""}
            data-mypage-react-menu-key={section.key}
            onClick={() => onSectionChange(section.key)}
          >
            <span>{section.label}</span>
            <em>{section.description}</em>
          </button>
        ))}
      </nav>
    </aside>
  );
}
