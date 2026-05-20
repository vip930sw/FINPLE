import { getStoredFinpleAuthUser } from "./portfolio/services/serverPortfolioService";
import { logoutFinpleAuth } from "./authClientService";

const RESULT_COPY = {
  success: {
    eyebrow: "Billing Success",
    title: "결제 요청이 접수되었습니다.",
    description:
      "현재는 Toss Payments 테스트 연동 전 준비 화면입니다. 실제 결제 승인과 Personal 권한 반영은 서버 결제 API 연결 이후 자동 처리됩니다.",
    tone: "success",
    statusLabel: "승인 확인 대기",
    bullets: [
      "결제 승인 API 연결 후 payments와 subscriptions에 기록됩니다.",
      "승인 완료 시 user_entitlements가 Personal 권한으로 전환됩니다.",
      "고객 카드번호는 FINPLE 서버에 직접 저장하지 않습니다.",
    ],
  },
  fail: {
    eyebrow: "Billing Failed",
    title: "결제를 완료하지 못했습니다.",
    description:
      "결제 실패 또는 승인 오류가 발생한 경우입니다. 실제 PG 연동 후에는 실패 사유와 재시도 안내를 더 구체적으로 표시합니다.",
    tone: "danger",
    statusLabel: "결제 실패",
    bullets: [
      "카드 한도, 인증 실패, 사용자가 입력한 결제정보 오류 등이 원인일 수 있습니다.",
      "현재 플랜과 기존 저장 데이터는 변경되지 않습니다.",
      "문제가 반복되면 결제 문의로 접수해 주세요.",
    ],
  },
  cancel: {
    eyebrow: "Billing Canceled",
    title: "결제가 취소되었습니다.",
    description:
      "사용자가 결제창을 닫거나 결제 진행을 중단한 경우입니다. 취소 상태에서는 과금과 권한 변경이 발생하지 않습니다.",
    tone: "neutral",
    statusLabel: "사용자 취소",
    bullets: [
      "결제 취소 시 Personal 권한은 부여되지 않습니다.",
      "필요하면 요금제 페이지에서 다시 결제를 진행할 수 있습니다.",
      "베타 기간에는 무료 체험 흐름을 계속 사용할 수 있습니다.",
    ],
  },
};

function getQueryValue(key) {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(key) || "";
}

function formatAmount(value) {
  const number = Number(String(value || "").replace(/,/g, ""));
  if (!Number.isFinite(number) || number <= 0) return "-";
  return `${number.toLocaleString("ko-KR")}원`;
}

function BillingShell({ children, onNavigate }) {
  const storedUser = getStoredFinpleAuthUser();
  const isLoggedIn = Boolean(storedUser?.id);

  async function handleLoginLogoutClick() {
    if (isLoggedIn) {
      await logoutFinpleAuth();
      onNavigate("home");
      return;
    }

    onNavigate("login");
  }

  return (
    <main className="accountPage billingResultPage">
      <header className="accountHeader">
        <button type="button" className="brandLogo resetButton" onClick={() => onNavigate("home")}>
          <div className="brandIcon">
            <span>F</span>
            <i />
          </div>
          <div className="brandText">
            <strong>FINPLE</strong>
            <span>Portfolio Lab</span>
          </div>
        </button>

        <nav className="accountNav">
          <button type="button" onClick={() => onNavigate("home")}>홈</button>
          <button type="button" onClick={() => onNavigate("personal")}>시작하기</button>
          <button type="button" onClick={() => onNavigate("pricing")}>요금제</button>
          <button type="button" onClick={() => onNavigate("support")}>문의사항</button>
          <button type="button" onClick={() => onNavigate(isLoggedIn ? "mypage" : "login")}>MY PAGE</button>
          <button type="button" className="accountNavAuthButton" onClick={handleLoginLogoutClick}>
            {isLoggedIn ? "로그아웃" : "로그인"}
          </button>
        </nav>
      </header>
      {children}
    </main>
  );
}

export function BillingResultPage({ type = "success", onNavigate }) {
  const copy = RESULT_COPY[type] || RESULT_COPY.success;
  const orderId = getQueryValue("orderId") || getQueryValue("order_id");
  const amount = getQueryValue("amount");
  const code = getQueryValue("code");
  const message = getQueryValue("message");

  return (
    <BillingShell onNavigate={onNavigate}>
      <section className="accountHero billingResultHero">
        <p className="sectionLabel">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
      </section>

      <section className={["accountCard", "billingResultCard", `billingResultCard--${copy.tone}`].join(" ")}>
        <div className="billingResultStatusRow">
          <div>
            <span>상태</span>
            <strong>{copy.statusLabel}</strong>
          </div>
          <em>{type === "success" ? "TEST FLOW" : "BILLING FLOW"}</em>
        </div>

        <div className="billingResultGrid">
          <div>
            <span>상품</span>
            <strong>FINPLE Personal</strong>
          </div>
          <div>
            <span>예상 금액</span>
            <strong>{formatAmount(amount) || "월 9,900원"}</strong>
          </div>
          <div>
            <span>주문번호</span>
            <strong>{orderId || "결제 API 연결 후 표시"}</strong>
          </div>
          <div>
            <span>처리 방식</span>
            <strong>월 구독 / 정기결제</strong>
          </div>
        </div>

        {code || message ? (
          <div className="billingResultMessageBox">
            <strong>{code || "PG 메시지"}</strong>
            <p>{message || "결제 처리 중 메시지가 전달되었습니다."}</p>
          </div>
        ) : null}

        <ul className="billingResultBulletList">
          {copy.bullets.map((item) => <li key={item}>{item}</li>)}
        </ul>

        <div className="billingResultActions">
          <button type="button" className="primaryButton" onClick={() => onNavigate("pricing")}>요금제로 돌아가기</button>
          <button type="button" className="secondaryButton" onClick={() => onNavigate("mypage")}>MY PAGE 확인</button>
          <button type="button" className="secondaryButton" onClick={() => onNavigate("support")}>결제 문의</button>
        </div>
      </section>
    </BillingShell>
  );
}
