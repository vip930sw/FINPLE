import { useEffect, useMemo, useState } from "react";
import {
  checkServerDatabaseHealth,
  clearStoredFinpleAuthUser,
  createOrLoadDemoUser,
  fetchCurrentServerUser,
  fetchServerPortfolios,
  fetchSupportInquiries,
  getFinpleAdminToken,
  getLocalPortfolioSnapshot,
  getStoredFinpleAuthUser,
  setStoredFinpleAuthUser,
  importServerPortfoliosToBrowser,
  listServerPortfolios,
  syncLocalPortfoliosToServer,
  submitSupportInquiry,
  updateSupportInquiryStatus,
} from "./portfolio/services/serverPortfolioService";
import {
  FINPLE_PLAN_CONFIGS,
  getStoredFinplePlan,
  setStoredFinplePlan,
  getPlanUsageStatus,
  getFreeApiUsageStatus,
} from "./portfolio/config/planConfig";

function AccountShell({ eyebrow, title, description, children, onNavigate, pageClassName = "" }) {
  const storedUser = getStoredFinpleAuthUser();
  const isLoggedIn = Boolean(storedUser?.id);

  function handleMyPageClick() {
    onNavigate(isLoggedIn ? "mypage" : "login");
  }

  function handleLoginLogoutClick() {
    if (isLoggedIn) {
      clearStoredFinpleAuthUser();
      window.dispatchEvent(new Event("finple-local-storage-updated"));
      onNavigate("home");
      return;
    }

    onNavigate("login");
  }

  return (
    <main className={["accountPage", pageClassName].filter(Boolean).join(" ")}>
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
          <button type="button" onClick={() => onNavigate("personal")}>시뮬레이터</button>
          <button type="button" onClick={() => onNavigate("pricing")}>요금제</button>
          <button type="button" onClick={() => onNavigate("support")}>문의사항</button>
          <button type="button" onClick={handleMyPageClick}>MY PAGE</button>
          <button type="button" className="accountNavAuthButton" onClick={handleLoginLogoutClick}>
            {isLoggedIn ? "로그아웃" : "로그인"}
          </button>
        </nav>
      </header>

      <section className="accountHero">
        <p className="sectionLabel">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </section>

      {children}
    </main>
  );
}

export function LoginPage({ onNavigate }) {
  const [statusMessage, setStatusMessage] = useState("체험 계정으로 포트폴리오 저장 기능을 이용할 수 있습니다.");
  const [isLoading, setIsLoading] = useState(false);

  async function handleDemoLogin() {
    setIsLoading(true);
    try {
      const user = await createOrLoadDemoUser();
      setStatusMessage((user.name || "FINPLE 체험 사용자") + " 계정으로 연결되었습니다.");
      onNavigate("mypage");
    } catch (error) {
      setStatusMessage(error?.message || "체험 계정 연결에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AccountShell
      eyebrow="Account"
      title="로그인"
      description="일반 사용자를 위한 로그인 화면입니다. 현재는 체험 계정으로 포트폴리오 저장과 MY PAGE 기능을 이용할 수 있습니다."
      onNavigate={onNavigate}
      pageClassName="legalPage"
    >
      <section className="accountCard accountFormCard loginRoleCard singleLoginCard">
        <div className="loginRoleHeader">
          <p className="accountMiniLabel">User Login</p>
          <h2>일반 사용자 로그인</h2>
          <span>포트폴리오 저장, 요금제 상태, MY PAGE 기능을 이용합니다.</span>
        </div>

        <label>
          이메일
          <input type="email" placeholder="you@example.com" />
        </label>
        <label>
          비밀번호
          <input type="password" placeholder="비밀번호" />
        </label>

        <p className="accountInlineStatus">{statusMessage}</p>

        <button type="button" className="primaryButton" onClick={handleDemoLogin} disabled={isLoading}>
          {isLoading ? "연결 중..." : "체험 계정으로 시작"}
        </button>
        <button type="button" className="secondaryButton" onClick={() => onNavigate("signup")}>회원가입으로 이동</button>
      </section>
    </AccountShell>
  );
}

export function AdminLoginPage({ onNavigate }) {
  const [adminTokenInput, setAdminTokenInput] = useState(() => getFinpleAdminToken());
  const [adminStatusMessage, setAdminStatusMessage] = useState("관리자 토큰이 있는 경우 관리자 콘솔 기능을 사용할 수 있습니다.");

  function handleAdminLogin() {
    const token = adminTokenInput.trim();

    if (!token) {
      setAdminStatusMessage("관리자 토큰을 입력해 주세요.");
      return;
    }

    window.localStorage.setItem("finple-admin-token", token);
    window.dispatchEvent(new Event("finple-admin-token-updated"));
    setAdminStatusMessage("관리자 토큰을 저장했습니다. 관리자 콘솔로 이동합니다.");
    onNavigate("mypage");
  }

  return (
    <AccountShell
      eyebrow="Admin"
      title="관리자 로그인"
      description="관리자 전용 접속 화면입니다. 일반 로그인 화면에는 관리자 영역을 표시하지 않습니다."
      onNavigate={onNavigate}
    >
      <section className="accountCard accountFormCard loginRoleCard singleLoginCard adminRouteLoginCard">
        <div className="loginRoleHeader">
          <p className="accountMiniLabel">Admin Login</p>
          <h2>관리자 로그인</h2>
          <span>문의사항, 회원, 구독 관리는 관리자 토큰이 있는 브라우저에서만 사용할 수 있습니다.</span>
        </div>

        <label>
          관리자 토큰
          <input
            type="password"
            value={adminTokenInput}
            onChange={(event) => setAdminTokenInput(event.target.value)}
            placeholder="FINPLE_ADMIN_TOKEN 입력"
            autoComplete="off"
          />
        </label>

        <p className="accountInlineStatus">{adminStatusMessage}</p>

        <button type="button" className="primaryButton" onClick={handleAdminLogin}>
          관리자 모드로 이동
        </button>
        <p className="adminLoginHint">
          관리자 주소는 직접 공유하지 마세요. 관리자 토큰은 현재 브라우저에만 저장되며, 공용 PC에서는 MY PAGE에서 관리자 모드 해제를 눌러 주세요.
        </p>
      </section>
    </AccountShell>
  );
}

export function SignupPage({ onNavigate }) {
  const [statusMessage, setStatusMessage] = useState("체험 계정으로 회원가입 흐름을 확인할 수 있습니다.");
  const [isLoading, setIsLoading] = useState(false);

  async function handleDemoSignup() {
    setIsLoading(true);
    try {
      const user = await createOrLoadDemoUser();
      setStatusMessage(`${user.name || "FINPLE 체험 사용자"} 계정이 준비되었습니다.`);
      onNavigate("mypage");
    } catch (error) {
      setStatusMessage(error?.message || "체험 계정 준비에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AccountShell
      eyebrow="Create Account"
      title="회원가입"
      description="포트폴리오 저장, PDF 리포트 이력, 요금제 상태 관리를 위한 계정 화면입니다."
      onNavigate={onNavigate}
    >
      <section className="accountCard accountFormCard">
        <label>
          이름
          <input placeholder="이름 또는 닉네임" />
        </label>
        <label>
          이메일
          <input type="email" placeholder="you@example.com" />
        </label>
        <label>
          비밀번호
          <input type="password" placeholder="8자 이상" />
        </label>
        <p className="accountInlineStatus">{statusMessage}</p>
        <button type="button" className="primaryButton" onClick={handleDemoSignup} disabled={isLoading}>
          {isLoading ? "계정 준비 중..." : "체험 계정으로 가입"}
        </button>
        <button type="button" className="secondaryButton" onClick={() => onNavigate("login")}>이미 계정이 있어요</button>
      </section>
    </AccountShell>
  );
}

export function MyPage({ onNavigate }) {
  const [planKey, setPlanKey] = useState(() => getStoredFinplePlan());

  useEffect(() => {
    function handlePlanUpdate() {
      setPlanKey(getStoredFinplePlan());
    }

    window.addEventListener("finple-plan-updated", handlePlanUpdate);
    window.addEventListener("finple-local-storage-updated", handlePlanUpdate);
    return () => {
      window.removeEventListener("finple-plan-updated", handlePlanUpdate);
      window.removeEventListener("finple-local-storage-updated", handlePlanUpdate);
    };
  }, []);

  return (
    <AccountShell
      eyebrow="My Page"
      title="MY PAGE"
      description="저장 데이터, 계정, 포트폴리오, 요금제 상태를 관리하는 사용자 공간입니다."
      onNavigate={onNavigate}
    >
      <section className="accountPanelStack" aria-label="계정 및 서버 관리 패널">
        <AccountStatusPanel onNavigate={onNavigate} />
        <PlanStatusPanel planKey={planKey} onNavigate={onNavigate} />
        <ServerStoragePanel planKey={planKey} />
        <AdminInquiryPanel />
      </section>

      <section className="accountCard myPageBetaCompactNotice">
        <div>
          <p className="accountMiniLabel">Beta My Page</p>
          <h2>MY PAGE 기능은 단계적으로 확장됩니다.</h2>
          <p>
            현재는 계정 연결 상태, 요금제 상태, 서버 저장 동기화 흐름을 먼저 검증합니다.
            포트폴리오 이름 관리, 결제 수단, PDF 이력 등은 정식 계정 기능과 함께 확장할 예정입니다.
          </p>
        </div>
        <div className="accountActionRow compactMyPageActions">
          <button type="button" className="primaryButton" onClick={() => onNavigate("personal")}>시뮬레이터로 이동</button>
          <button type="button" className="secondaryButton" onClick={() => onNavigate("pricing")}>요금제 확인</button>
        </div>
      </section>
    </AccountShell>
  );
}

export function PricingPage({ onNavigate }) {
  const [selectedPlan, setSelectedPlan] = useState(() => getStoredFinplePlan());
  const [statusMessage, setStatusMessage] = useState("요금제를 선택하면 현재 브라우저에 선택 상태가 저장됩니다. 실제 결제 기능은 준비 중입니다.");
  const plans = Object.values(FINPLE_PLAN_CONFIGS);

  function handleSelectPlan(planKey) {
    const plan = setStoredFinplePlan(planKey);
    setSelectedPlan(plan.key);

    const authUser = getStoredFinpleAuthUser();
    if (authUser?.id) {
      setStoredFinpleAuthUser({ ...authUser, plan: plan.key });
    }

    setStatusMessage(
      plan.key === "free"
        ? "Free 플랜이 선택되었습니다. 브라우저 저장과 기본 시뮬레이션 중심으로 제공되며 서버 저장, PDF 저장, 고급 리포트는 제한됩니다."
        : `${plan.label} 플랜이 선택되었습니다. 실제 결제 기능 도입 전까지는 체험 상태로 표시됩니다.`
    );
  }

  return (
    <AccountShell
      eyebrow="Pricing"
      title="요금제"
      description="처음에는 가볍게 체험하고, 필요할 때 서버 저장·리포트·조회량을 확장할 수 있도록 플랜 기준을 정리했습니다."
      onNavigate={onNavigate}
    >
      <section className="pricingStatusPanel">
        <div>
          <span>현재 선택 플랜</span>
          <strong>{FINPLE_PLAN_CONFIGS[selectedPlan]?.label || "Free"}</strong>
        </div>
        <p>{statusMessage}</p>
      </section>

      <section className="accountPlanGrid">
        {plans.map((plan) => (
          <article
            key={plan.key}
            className={[
              "accountPlanCard",
              plan.featured ? "featured" : "",
              selectedPlan === plan.key ? "selected" : "",
            ].filter(Boolean).join(" ")}
          >
            <div className="planCardTopLine">
              <p>{plan.label}</p>
              {plan.key === "personal" ? <span>추천</span> : null}
              {selectedPlan === plan.key ? <span>현재 플랜</span> : null}
            </div>
            <h2>{plan.priceLabel}</h2>
            <ul>{plan.items.map((item) => <li key={item}>{item}</li>)}</ul>
            <div className="planLimitList">
              <span>포트폴리오 {formatLimit(plan.limits.portfolios)}</span>
              <span>서버 저장 {plan.limits.serverStorage ? "지원" : "제한"}</span>
              <span>PDF {plan.limits.pdfLevel}</span>
              {plan.limits.assetsPerPortfolio ? <span>자산 {plan.limits.assetsPerPortfolio}개 기준</span> : null}
              {plan.limits.reportLevel ? <span>{plan.limits.reportLevel}</span> : null}
            </div>
            <button type="button" onClick={() => handleSelectPlan(plan.key)}>
              {selectedPlan === plan.key ? "선택됨" : plan.key === "free" ? "체험판 선택" : `${plan.label} 선택`}
            </button>
          </article>
        ))}
      </section>

      <section className="pricingNoticeBox">
        <strong>결제 기능 안내</strong>
        <p>현재는 플랜 선택과 제한값을 먼저 제공합니다. 카드 결제, 구독 갱신, 영수증 처리는 이후 결제 기능 도입 단계에서 추가합니다.</p>
        <p>본 서비스는 투자 판단을 돕는 분석 도구이며, 특정 금융상품의 매수·매도 추천이나 수익을 보장하지 않습니다.</p>
      </section>
    </AccountShell>
  );
}


function LegalDocumentPage({ eyebrow, title, description, sections, onNavigate }) {
  return (
    <AccountShell
      eyebrow={eyebrow}
      title={title}
      description={description}
      onNavigate={onNavigate}
    >
      <section className="accountCard legalDocumentCard">
        {sections.map((section) => (
          <article key={section.title} className="legalDocumentSection">
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            {section.items ? (
              <ul>
                {section.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : null}
          </article>
        ))}
      </section>
    </AccountShell>
  );
}

export function PrivacyPage({ onNavigate }) {
  return (
    <LegalDocumentPage
      eyebrow="Privacy"
      title="개인정보처리방침"
      description="FINPLE Portfolio Lab이 수집·이용하는 개인정보와 보관 기준을 안내합니다. 실제 서비스 공개 전 법률 검토를 거쳐 확정하는 초안입니다."
      onNavigate={onNavigate}
      sections={[
        {
          title: "1. 수집하는 정보",
          paragraphs: [
            "서비스 이용 과정에서 이메일, 문의 내용, 브라우저에 저장된 사용자 식별 정보, 포트폴리오 저장 데이터, 접속 환경 정보가 수집될 수 있습니다.",
            "현재 로그인과 결제 기능은 체험 운영 단계이며, 실제 소셜 로그인·결제 기능 도입 시 수집 항목은 별도로 고지합니다.",
          ],
          items: ["이메일 및 문의 답변 연락처", "문의 제목·내용·처리 상태", "포트폴리오 구성 및 저장 데이터", "서비스 오류 확인을 위한 접속 환경 정보"],
        },
        {
          title: "2. 이용 목적",
          paragraphs: [
            "수집한 정보는 포트폴리오 저장·불러오기, 문의 응대, 오류 확인, 요금제 상태 표시, 서비스 품질 개선을 위해 사용합니다.",
          ],
        },
        {
          title: "3. 보관 기간",
          paragraphs: [
            "일반 문의와 오류 신고는 처리 및 서비스 개선을 위해 원칙적으로 1년간 보관할 수 있습니다. 결제 관련 정보는 결제 기능 도입 이후 관련 법령과 내부 기준에 따라 별도로 정합니다.",
            "사용자가 삭제를 요청하거나 보관 목적이 사라진 경우 지체 없이 삭제합니다. 단, 법령상 보관 의무가 있는 정보는 해당 기간 동안 보관할 수 있습니다.",
          ],
        },
        {
          title: "4. 제3자 제공 및 위탁",
          paragraphs: [
            "현재 서비스 운영을 위해 데이터베이스, 호스팅, 배포, API 제공 서비스가 사용될 수 있습니다. 실제 상용 운영 전 이용 중인 외부 서비스와 위탁 범위를 명확히 고지합니다.",
          ],
        },
        {
          title: "5. 이용자 권리",
          paragraphs: [
            "이용자는 본인의 개인정보 열람, 정정, 삭제, 처리 정지를 요청할 수 있습니다. 문의사항 메뉴를 통해 요청하면 확인 후 처리합니다.",
          ],
        },
      ]}
    />
  );
}

export function TermsPage({ onNavigate }) {
  return (
    <LegalDocumentPage
      eyebrow="Terms"
      title="이용약관"
      description="FINPLE Portfolio Lab 이용 조건과 서비스 범위를 안내합니다. 실제 서비스 공개 전 법률 검토를 거쳐 확정하는 초안입니다."
      onNavigate={onNavigate}
      sections={[
        {
          title: "1. 서비스 목적",
          paragraphs: [
            "FINPLE Portfolio Lab은 사용자가 입력한 자산 구성과 가정값을 바탕으로 포트폴리오의 장기 예상 흐름, 위험 지표, 리포트를 확인할 수 있도록 돕는 분석 도구입니다.",
          ],
        },
        {
          title: "2. 계정 및 저장 데이터",
          paragraphs: [
            "현재 계정 기능은 체험 운영 단계이며, 브라우저 저장과 서버 저장 기능을 먼저 제공합니다. 실제 회원가입, 소셜 로그인, 결제 기능은 추후 별도 연동됩니다.",
          ],
        },
        {
          title: "3. 이용자 책임",
          paragraphs: [
            "이용자는 본인이 입력한 자산 정보와 가정값의 정확성을 직접 확인해야 합니다. 입력 오류, 데이터 지연, 외부 API 장애로 인한 분석 결과 차이가 발생할 수 있습니다.",
          ],
        },
        {
          title: "4. 서비스 변경 및 제한",
          paragraphs: [
            "서비스 기능, 요금제, API 조회량, 리포트 제공 범위는 운영 상황에 따라 변경될 수 있습니다. 중요한 변경 사항은 서비스 화면을 통해 안내합니다.",
          ],
        },
        {
          title: "5. 면책",
          paragraphs: [
            "본 서비스는 투자 판단을 돕는 참고 도구이며, 특정 금융상품의 매수·매도 추천, 투자 자문, 수익 보장을 제공하지 않습니다. 최종 투자 판단과 결과에 대한 책임은 이용자 본인에게 있습니다.",
          ],
        },
      ]}
    />
  );
}

export function InvestmentDisclaimerPage({ onNavigate }) {
  return (
    <LegalDocumentPage
      eyebrow="Investment Notice"
      title="투자 유의사항"
      description="FINPLE의 분석 결과를 해석할 때 반드시 확인해야 하는 투자 유의사항입니다."
      onNavigate={onNavigate}
      sections={[
        {
          title: "1. 투자 자문이 아닙니다",
          paragraphs: [
            "FINPLE의 시뮬레이션, 차트, 리포트, 위험 지표는 투자 판단을 돕는 참고 자료입니다. 특정 종목, ETF, 금융상품의 매수·매도 추천이나 투자 자문이 아닙니다.",
          ],
        },
        {
          title: "2. 수익을 보장하지 않습니다",
          paragraphs: [
            "CAGR, MDD, 배당률, 물가상승률 등은 사용자가 입력하거나 제한된 데이터에 기반한 가정값입니다. 과거 데이터나 예상값이 미래 수익을 보장하지 않습니다.",
          ],
        },
        {
          title: "3. 데이터 오류 가능성",
          paragraphs: [
            "외부 API, 환율, 가격, 배당, 지표 데이터는 지연되거나 누락될 수 있습니다. 중요한 투자 의사결정 전에는 반드시 공식 자료와 증권사 정보를 별도로 확인해야 합니다.",
          ],
        },
        {
          title: "4. 최종 판단 책임",
          paragraphs: [
            "투자에는 원금 손실 가능성이 있습니다. 최종 투자 판단과 그 결과에 대한 책임은 이용자 본인에게 있습니다.",
          ],
        },
      ]}
    />
  );
}

export function SupportPage({ onNavigate }) {
  const [category, setCategory] = useState("feature");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("문의 내용을 작성하면 관리자 확인을 위해 접수됩니다.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!message.trim()) {
      setStatusMessage("문의 내용을 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitSupportInquiry({
        category,
        email,
        title: title.trim() || getDefaultInquiryTitle(category),
        message: message.trim(),
      });

      setStatusMessage(`문의가 접수되었습니다. 접수번호: ${result?.inquiry?.id?.slice(0, 8) || "저장 완료"}`);
      setTitle("");
      setMessage("");
    } catch (error) {
      setStatusMessage(error?.message || "문의 저장에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AccountShell
      eyebrow="Support"
      title="문의사항 / 고객의 소리"
      description="오류 신고, 기능 제안, 결제 문의를 접수하는 공간입니다."
      onNavigate={onNavigate}
    >
      <section className="accountCard accountFormCard supportFormCard">
        <form onSubmit={handleSubmit}>
          <label>
            문의 유형
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="bug">오류 신고</option>
              <option value="feature">기능 제안</option>
              <option value="payment">결제 문의</option>
              <option value="data">데이터 문의</option>
              <option value="etc">기타 문의</option>
            </select>
          </label>
          <label>
            답변 이메일
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="reply@example.com"
            />
          </label>
          <label>
            제목
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="문의 제목을 입력해 주세요."
            />
          </label>
          <label>
            내용
            <textarea
              rows="8"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="오류 상황, 필요한 기능, 결제 문의 등 내용을 입력해 주세요."
            />
          </label>

          <div className="supportPrivacyNotice">
            <strong>개인정보 수집 안내</strong>
            <p>답변 이메일과 문의 내용은 문의 처리와 서비스 개선을 위해 저장됩니다. 접수된 문의는 처리 완료 후 종료 처리될 수 있습니다.</p>
          </div>

          <p className="accountInlineStatus supportStatusText">{statusMessage}</p>

          <div className="supportActionRow">
            <button type="submit" className="primaryButton" disabled={isSubmitting}>
              {isSubmitting ? "저장 중..." : "문의 보내기"}
            </button>
            <button type="button" className="secondaryButton" onClick={() => onNavigate("home")}>
              홈으로 이동
            </button>
          </div>
        </form>
      </section>
    </AccountShell>
  );
}

function getDefaultInquiryTitle(category) {
  const labels = {
    bug: "오류 신고",
    feature: "기능 제안",
    payment: "결제 문의",
    data: "데이터 문의",
    etc: "기타 문의",
  };

  return labels[category] || "FINPLE 문의사항";
}


const INQUIRY_CATEGORY_LABELS = {
  bug: "오류 신고",
  feature: "기능 제안",
  payment: "결제 문의",
  data: "데이터 문의",
  etc: "기타 문의",
};

const INQUIRY_STATUS_LABELS = {
  open: "접수",
  in_progress: "확인 중",
  resolved: "처리 완료",
  closed: "종료",
};

function AdminInquiryPanel() {
  const [adminTokenInput, setAdminTokenInput] = useState(() => getFinpleAdminToken());
  const [isAdminMode, setIsAdminMode] = useState(() => Boolean(getFinpleAdminToken()));
  const [inquiries, setInquiries] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusMessage, setStatusMessage] = useState(
    "관리자 토큰을 입력하면 문의사항 목록을 조회할 수 있습니다."
  );
  const [isLoading, setIsLoading] = useState(false);

  const filteredInquiries = useMemo(() => {
    if (statusFilter === "all") return inquiries;
    return inquiries.filter((inquiry) => inquiry.status === statusFilter);
  }, [inquiries, statusFilter]);

  const selectedInquiry =
    filteredInquiries.find((inquiry) => inquiry.id === selectedId) ||
    filteredInquiries[0] ||
    null;

  function handleSaveAdminToken() {
    const token = adminTokenInput.trim();

    if (!token) {
      setStatusMessage("관리자 토큰을 입력해 주세요.");
      return;
    }

    window.localStorage.setItem("finple-admin-token", token);
    setIsAdminMode(true);
    setStatusMessage("관리자 토큰을 저장했습니다. 문의 목록을 불러올 수 있습니다.");
  }

  function handleClearAdminToken() {
    window.localStorage.removeItem("finple-admin-token");
    setAdminTokenInput("");
    setIsAdminMode(false);
    setInquiries([]);
    setSelectedId(null);
    setStatusFilter("all");
    setStatusMessage("관리자 모드를 해제했습니다. 문의 목록은 더 이상 표시되지 않습니다.");
  }

  async function handleLoadInquiries() {
    setIsLoading(true);
    try {
      const nextInquiries = await fetchSupportInquiries({ scope: "all" });
      setInquiries(nextInquiries);
      setSelectedId(nextInquiries[0]?.id || null);
      setStatusMessage("문의사항 " + nextInquiries.length + "건을 불러왔습니다.");
    } catch (error) {
      setStatusMessage(error?.message || "문의사항 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleChangeStatus(inquiryId, status) {
    if (!inquiryId) return;

    setIsLoading(true);
    try {
      const result = await updateSupportInquiryStatus(inquiryId, status);
      const updatedInquiry = result?.inquiry;

      setInquiries((current) => current.map((inquiry) => (
        inquiry.id === inquiryId ? { ...inquiry, ...updatedInquiry } : inquiry
      )));
      setStatusMessage("문의 상태를 “" + (INQUIRY_STATUS_LABELS[status] || status) + "”로 변경했습니다.");
    } catch (error) {
      setStatusMessage(error?.message || "문의 상태를 변경하지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!isAdminMode) {
    return null;
  }

  return (
    <section className="accountCard adminInquiryPanel">
      <div className="serverStorageHeader">
        <div>
          <p className="accountMiniLabel">Admin Mode</p>
          <h2>문의사항 관리자 조회</h2>
          <p>접수된 문의를 확인하고 처리 상태를 변경합니다.</p>
        </div>
        <span className="serverStatusBadge ready">관리자 모드</span>
      </div>

      <div className="adminInquiryToolbar">
        <button type="button" className="primaryButton" onClick={handleLoadInquiries} disabled={isLoading}>
          {isLoading ? "불러오는 중..." : "문의 목록 불러오기"}
        </button>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">전체 상태</option>
          <option value="open">접수</option>
          <option value="in_progress">확인 중</option>
          <option value="resolved">처리 완료</option>
          <option value="closed">종료</option>
        </select>
        <span>{filteredInquiries.length}건 표시</span>
        <button type="button" className="secondaryButton" onClick={handleClearAdminToken}>
          관리자 모드 해제
        </button>
      </div>

      <p className="serverStorageMessage compact">{statusMessage}</p>

      <div className="adminInquiryLayout">
        <div className="adminInquiryList">
          {filteredInquiries.length > 0 ? (
            filteredInquiries.slice(0, 30).map((inquiry) => (
              <button
                key={inquiry.id}
                type="button"
                className={inquiry.id === selectedInquiry?.id ? "adminInquiryItem active" : "adminInquiryItem"}
                onClick={() => setSelectedId(inquiry.id)}
              >
                <span className={"inquiryStatusBadge status-" + (inquiry.status || "open")}>
                  {INQUIRY_STATUS_LABELS[inquiry.status] || inquiry.status || "접수"}
                </span>
                <strong>{inquiry.title || "제목 없는 문의"}</strong>
                <em>{INQUIRY_CATEGORY_LABELS[inquiry.category] || "기타 문의"} · {formatServerDate(inquiry.createdAt || inquiry.created_at)}</em>
              </button>
            ))
          ) : (
            <p className="serverPortfolioEmpty">문의 목록을 아직 불러오지 않았습니다.</p>
          )}
        </div>

        <div className="adminInquiryDetail">
          {selectedInquiry ? (
            <>
              <div className="adminInquiryDetailHeader">
                <div>
                  <span>{INQUIRY_CATEGORY_LABELS[selectedInquiry.category] || "기타 문의"}</span>
                  <h3>{selectedInquiry.title || "제목 없는 문의"}</h3>
                  <p>접수일 {formatServerDate(selectedInquiry.createdAt || selectedInquiry.created_at)} · ID {String(selectedInquiry.id || "").slice(0, 8)}</p>
                </div>
                <select
                  value={selectedInquiry.status || "open"}
                  onChange={(event) => handleChangeStatus(selectedInquiry.id, event.target.value)}
                  disabled={isLoading}
                >
                  <option value="open">접수</option>
                  <option value="in_progress">확인 중</option>
                  <option value="resolved">처리 완료</option>
                  <option value="closed">종료</option>
                </select>
              </div>
              <pre className="adminInquiryMessage">{selectedInquiry.message || "문의 내용이 없습니다."}</pre>
            </>
          ) : (
            <p className="serverPortfolioEmpty">왼쪽 목록에서 문의를 선택해 주세요.</p>
          )}
        </div>
      </div>

      <p className="adminInquiryNotice">
        관리자 토큰은 현재 브라우저에만 저장됩니다. 공용 PC에서는 반드시 관리자 모드 해제를 눌러 주세요.
      </p>
    </section>
  );
}

function PlanStatusPanel({ planKey, onNavigate }) {
  const snapshot = getLocalPortfolioSnapshot();
  const currentPlan = FINPLE_PLAN_CONFIGS[planKey] || FINPLE_PLAN_CONFIGS.free;
  const usage = getPlanUsageStatus(currentPlan.key, snapshot);
  const freeApiUsage = getFreeApiUsageStatus();
  const activePortfolio = snapshot.portfolioList.find((portfolio) => portfolio.id === snapshot.activePortfolioId) || snapshot.portfolioList[0];
  const activeAssetCount = Array.isArray(activePortfolio?.assets)
    ? activePortfolio.assets.filter((asset) => asset?.ticker && asset.ticker !== "XXX").length
    : 0;
  const assetLimit = currentPlan.limits.assetsPerPortfolio || Infinity;
  const isFreePlan = currentPlan.key === "free";

  return (
    <section className="accountCard planStatusPanel">
      <div className="serverStorageHeader">
        <div>
          <p className="accountMiniLabel">Plan Status</p>
          <h2>플랜 / 사용량</h2>
          <p>현재 선택된 요금제 기준으로 포트폴리오 저장, 서버 저장, PDF 리포트 사용 범위를 확인합니다.</p>
        </div>
        <span className="serverStatusBadge ready">{currentPlan.label}</span>
      </div>

      <div className="planUsageGrid planUsageGridExpanded">
        <div>
          <span>포트폴리오</span>
          <strong>{usage.portfolios.current} / {formatLimit(usage.portfolios.limit)}</strong>
          <em className={usage.portfolios.isOverLimit ? "dangerText" : "mutedText"}>
            {usage.portfolios.isOverLimit ? "제한 초과" : "사용 가능"}
          </em>
        </div>
        <div>
          <span>현재 자산</span>
          <strong>{activeAssetCount} / {formatLimit(assetLimit)}</strong>
          <em className={assetLimit !== Infinity && activeAssetCount >= assetLimit ? "dangerText" : "mutedText"}>
            {assetLimit !== Infinity && activeAssetCount >= assetLimit ? "추가 제한" : "추가 가능"}
          </em>
        </div>
        <div>
          <span>API 조회</span>
          <strong>{isFreePlan ? `${freeApiUsage.count} / ${freeApiUsage.limit}` : currentPlan.limits.apiLookupsPerDay}</strong>
          <em className={isFreePlan && freeApiUsage.isLimitReached ? "dangerText" : "mutedText"}>
            {isFreePlan ? `오늘 남은 ${freeApiUsage.remaining}회` : "플랜 기준"}
          </em>
        </div>
        <div>
          <span>서버 저장</span>
          <strong>{currentPlan.limits.serverStorage ? "지원" : "제한"}</strong>
          <em className="mutedText">{currentPlan.serverStorageLabel}</em>
        </div>
        <div>
          <span>PDF 리포트</span>
          <strong>{currentPlan.limits.pdfLevel}</strong>
          <em className="mutedText">리포트 범위</em>
        </div>
      </div>

      {isFreePlan ? (
        <div className="upgradePromptBox">
          <div>
            <p>Free 플랜은 체험판입니다. Personal 플랜부터 서버 저장, PDF 리포트, 확장된 API 조회량을 사용할 수 있습니다.</p>
          </div>
        </div>
      ) : usage.portfolios.isOverLimit ? (
        <p className="serverStorageMessage dangerMessage">
          현재 브라우저 포트폴리오가 {currentPlan.label} 플랜 기준을 초과했습니다. 요금제를 조정하거나 포트폴리오를 정리해 주세요.
        </p>
      ) : (
        <p className="serverStorageMessage compact">
          현재 사용량은 {currentPlan.label} 플랜 기준 내에 있습니다. 서버 저장과 리포트 기능을 안정적으로 사용할 수 있습니다.
        </p>
      )}

      <div className="serverStorageActions compactActions">
        <button type="button" className="primaryButton" onClick={() => onNavigate("pricing")}>요금제 변경</button>
        <button type="button" className="secondaryButton" onClick={() => onNavigate("support")}>결제 문의</button>
      </div>
    </section>
  );
}

function formatLimit(value) {
  if (value === Infinity || value === "unlimited") return "무제한";
  return `${value}개`;
}

function AccountStatusPanel({ onNavigate }) {
  const [authUser, setAuthUser] = useState(() => getStoredFinpleAuthUser());
  const [serverUser, setServerUser] = useState(null);
  const [statusMessage, setStatusMessage] = useState(
    authUser ? "체험 사용자 세션이 브라우저에 저장되어 있습니다." : "아직 로그인 데모가 연결되지 않았습니다."
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    function handleAuthUpdate() {
      setAuthUser(getStoredFinpleAuthUser());
    }

    window.addEventListener("finple-auth-updated", handleAuthUpdate);
    return () => window.removeEventListener("finple-auth-updated", handleAuthUpdate);
  }, []);

  async function handleConnectDemoUser() {
    setIsLoading(true);
    try {
      const user = await createOrLoadDemoUser();
      setAuthUser(user);
      setStatusMessage("체험 사용자와 서버 DB가 연결되었습니다.");
    } catch (error) {
      setStatusMessage(error?.message || "체험 사용자 연결에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRefreshServerUser() {
    setIsLoading(true);
    try {
      const user = await fetchCurrentServerUser();
      setServerUser(user);
      setStatusMessage(user ? "서버 사용자 정보를 확인했습니다." : "서버 사용자 정보를 찾지 못했습니다.");
    } catch (error) {
      setStatusMessage(error?.message || "서버 사용자 정보를 확인하지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleLogout() {
    clearStoredFinpleAuthUser();
    setAuthUser(null);
    setServerUser(null);
    setStatusMessage("브라우저의 체험 사용자 세션을 해제했습니다.");
  }

  return (
    <section className="accountCard accountStatusPanel">
      <div>
        <p className="accountMiniLabel">Account Status</p>
        <h2>계정 연결 상태</h2>
        <p>
          현재는 실제 소셜 로그인 전 단계입니다. 체험 사용자로 서버 저장/불러오기 흐름을 먼저 검증합니다.
        </p>
      </div>

      <div className="accountStatusGrid">
        <div>
          <span>로그인 상태</span>
          <strong>{authUser ? "체험 사용자 연결됨" : "미연결"}</strong>
        </div>
        <div>
          <span>사용자</span>
          <strong>{authUser?.name || serverUser?.name || "-"}</strong>
        </div>
        <div>
          <span>플랜</span>
          <strong>{authUser?.plan || serverUser?.plan || "free"}</strong>
        </div>
        <div>
          <span>사용자 ID</span>
          <strong className="monoText">{authUser?.id ? `${authUser.id.slice(0, 8)}...` : "-"}</strong>
        </div>
      </div>

      <p className="serverStorageMessage compact">{statusMessage}</p>

      <div className="serverStorageActions compactActions">
        <button type="button" className="primaryButton" onClick={handleConnectDemoUser} disabled={isLoading}>
          {authUser ? "계정 상태 새로고침" : "체험 사용자 연결"}
        </button>
        <button type="button" className="secondaryButton betaHiddenAction" onClick={handleRefreshServerUser} disabled={isLoading || !authUser}>서버 사용자 확인</button>
        <button type="button" className="secondaryButton betaHiddenAction" onClick={() => onNavigate("login")}>로그인 화면</button>
        <button type="button" className="secondaryButton dangerSubtle betaHiddenAction" onClick={handleLogout} disabled={isLoading || !authUser}>로그아웃 데모</button>
      </div>
    </section>
  );
}

function ServerStoragePanel({ planKey = "free" }) {
  const currentPlan = FINPLE_PLAN_CONFIGS[planKey] || FINPLE_PLAN_CONFIGS.free;
  const canUseServerStorage = Boolean(currentPlan.limits.serverStorage);
  const [snapshotVersion, setSnapshotVersion] = useState(0);
  const [dbHealth, setDbHealth] = useState(null);
  const [serverPortfolioCount, setServerPortfolioCount] = useState(null);
  const [serverPortfolios, setServerPortfolios] = useState([]);
  const [statusMessage, setStatusMessage] = useState(
    canUseServerStorage
      ? "필요한 작업을 선택해 주세요."
      : "Free 체험 플랜은 서버 저장/불러오기와 PDF 저장이 제한됩니다. Personal 이상에서 사용할 수 있습니다."
  );
  const [isLoading, setIsLoading] = useState(false);

  const snapshot = useMemo(() => getLocalPortfolioSnapshot(), [snapshotVersion]);
  const isDatabaseReady = Boolean(dbHealth?.configured && dbHealth?.ok);
  const isServerActionDisabled = isLoading || !isDatabaseReady || !canUseServerStorage;

  useEffect(() => {
    refreshDatabaseStatus({ silent: true });
  }, []);

  async function refreshDatabaseStatus(options = {}) {
    setIsLoading(true);
    try {
      const health = await checkServerDatabaseHealth();
      setDbHealth(health);

      if (health?.configured && health?.ok) {
        if (!options.silent) {
          setStatusMessage(
            canUseServerStorage
              ? "서버 DB 연결이 정상입니다."
              : "DB는 연결되어 있지만 Free 체험 플랜에서는 서버 저장/불러오기와 PDF 저장이 제한됩니다."
          );
        }
      } else {
        setStatusMessage(health?.message || "DATABASE_URL 미설정. 서버 저장은 아직 비활성화 상태입니다.");
      }
    } catch (error) {
      setDbHealth({ ok: false, configured: false, message: error?.message || "서버 DB 상태를 확인하지 못했습니다." });
      setStatusMessage(error?.message || "서버 DB 상태를 확인하지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRefreshLocalSnapshot() {
    setSnapshotVersion((value) => value + 1);
    setStatusMessage("브라우저 저장 데이터를 다시 읽었습니다.");
  }

  async function handleServerListCheck() {
    if (!canUseServerStorage) {
      setStatusMessage("서버 포트폴리오 목록 확인은 Personal 플랜 이상에서 사용할 수 있습니다.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await listServerPortfolios();
      const portfolios = Array.isArray(response?.portfolios) ? response.portfolios : [];
      const count = portfolios.length;
      setServerPortfolios(portfolios);
      setServerPortfolioCount(count);
      setStatusMessage(`서버에 저장된 포트폴리오 ${count}개를 확인했습니다.`);
    } catch (error) {
      setStatusMessage(error?.message || "서버 포트폴리오 목록을 확인하지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSyncToServer() {
    if (!canUseServerStorage) {
      setStatusMessage("서버 동기화는 Personal 플랜 이상에서 사용할 수 있습니다. Free는 임시 포트폴리오 체험만 제공합니다.");
      return;
    }

    if (!snapshot.portfolioCount) {
      setStatusMessage("업로드할 브라우저 포트폴리오가 없습니다.");
      return;
    }

    const confirmed = window.confirm(
      `현재 브라우저에 저장된 포트폴리오 ${snapshot.portfolioCount}개를 서버 DB로 동기화할까요?\n\nDB가 연결된 개발/운영 환경에서만 실행됩니다.`
    );

    if (!confirmed) return;

    setIsLoading(true);
    try {
      const result = await syncLocalPortfoliosToServer(snapshot);
      setServerPortfolioCount(result?.syncedCount ?? result?.portfolios?.length ?? null);
      setStatusMessage(
        `서버 동기화 완료: ${result?.syncedCount ?? 0}개 저장, ${result?.errorCount ?? 0}개 실패`
      );
    } catch (error) {
      setStatusMessage(error?.message || "서버 동기화에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }



  async function handleLoadServerPortfolios(mode) {
    if (!canUseServerStorage) {
      setStatusMessage("서버 데이터 병합/교체는 Personal 플랜 이상에서 사용할 수 있습니다.");
      return;
    }

    setIsLoading(true);
    try {
      const portfolios = serverPortfolios.length > 0 ? serverPortfolios : await fetchServerPortfolios();
      setServerPortfolios(portfolios);
      setServerPortfolioCount(portfolios.length);

      if (portfolios.length === 0) {
        setStatusMessage("서버에 불러올 포트폴리오가 없습니다.");
        return;
      }

      const actionLabel = mode === "replace" ? "교체" : "병합";
      const confirmed = window.confirm(
        mode === "replace"
          ? `서버 포트폴리오 ${portfolios.length}개로 현재 브라우저 데이터를 교체할까요?\n\n현재 브라우저 데이터는 백업 후 진행하는 것을 권장합니다.`
          : `서버 포트폴리오 ${portfolios.length}개를 현재 브라우저 데이터에 병합할까요?\n\n같은 이름은 자동으로 “(서버)”가 붙습니다.`
      );

      if (!confirmed) return;

      const result = importServerPortfoliosToBrowser(portfolios, { mode });
      setSnapshotVersion((value) => value + 1);
      setStatusMessage(
        `서버 데이터 ${actionLabel} 완료: ${result.importedCount}개 불러옴, 브라우저 총 ${result.totalCount}개`
      );
    } catch (error) {
      setStatusMessage(error?.message || "서버 데이터를 브라우저로 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="accountCard serverStoragePanel">
      <div className="serverStorageHeader">
        <div>
          <p className="accountMiniLabel">Server Storage</p>
          <h2>서버 저장</h2>
          <p>
            {canUseServerStorage
              ? "브라우저 포트폴리오를 서버에 저장하거나, 서버에 저장된 포트폴리오를 다시 불러옵니다."
              : "Free 체험 플랜에서는 서버 저장 기능과 PDF 저장 기능이 제한됩니다. Personal 이상에서 서버 동기화를 사용할 수 있습니다."}
          </p>
        </div>

        <span className={!canUseServerStorage ? "serverStatusBadge disabled" : isDatabaseReady ? "serverStatusBadge ready" : "serverStatusBadge disabled"}>
          {!canUseServerStorage ? "플랜 제한" : isDatabaseReady ? "DB 연결됨" : "DB 비활성"}
        </span>
      </div>

      <div className="serverStorageStats">
        <div>
          <span>브라우저 포트폴리오</span>
          <strong>{snapshot.portfolioCount}개</strong>
        </div>
        <div>
          <span>현재 선택</span>
          <strong>{snapshot.activePortfolioName || "-"}</strong>
        </div>
        <div>
          <span>서버 저장 수</span>
          <strong>{serverPortfolioCount === null ? "-" : `${serverPortfolioCount}개`}</strong>
        </div>
        <div>
          <span>DB 상태</span>
          <strong>{dbHealth?.configured ? "Configured" : "Disabled"}</strong>
        </div>
      </div>

      <p className="serverStorageMessage compact">{statusMessage}</p>

      <div className="serverPortfolioListBox">
        <div className="serverPortfolioListHeader">
          <strong>서버 포트폴리오 목록</strong>
          <span>{serverPortfolios.length > 0 ? `${serverPortfolios.length}개 표시 중` : "서버 목록 확인 후 표시됩니다"}</span>
        </div>
        {serverPortfolios.length > 0 ? (
          <div className="serverPortfolioList">
            {serverPortfolios.slice(0, 6).map((portfolio) => (
              <article key={portfolio.id} className="serverPortfolioItem">
                <strong>{portfolio.name || "이름 없는 포트폴리오"}</strong>
                <span>{Array.isArray(portfolio.assets) ? portfolio.assets.length : 0}개 자산</span>
                <em>{formatServerDate(portfolio.updatedAt || portfolio.updated_at)}</em>
              </article>
            ))}
            {serverPortfolios.length > 6 ? (
              <p className="serverPortfolioMore">외 {serverPortfolios.length - 6}개는 서버에 보관 중입니다.</p>
            ) : null}
          </div>
        ) : (
          <p className="serverPortfolioEmpty">서버에서 불러오기 전에는 목록이 표시되지 않습니다.</p>
        )}
      </div>

      <div className="serverStorageActions">
        <button type="button" className="secondaryButton betaHiddenAction" onClick={handleRefreshLocalSnapshot} disabled={isLoading}>브라우저 데이터 다시 읽기</button>
        <button type="button" className="secondaryButton betaHiddenAction" onClick={() => refreshDatabaseStatus()} disabled={isLoading}>
          DB 상태 확인
        </button>
        <button type="button" className="secondaryButton betaHiddenAction" onClick={handleServerListCheck} disabled={isServerActionDisabled}>서버 목록 확인</button>
        <button type="button" className="primaryButton" onClick={handleSyncToServer} disabled={isServerActionDisabled}>
          서버로 저장
        </button>
        <button type="button" className="secondaryButton betaHiddenAction" onClick={() => handleLoadServerPortfolios("merge")} disabled={isServerActionDisabled}>
          서버 데이터 병합
        </button>
        <button type="button" className="secondaryButton dangerSubtle" onClick={() => handleLoadServerPortfolios("replace")} disabled={isServerActionDisabled}>
          서버에서 불러오기
        </button>
      </div>
    </section>
  );
}

function formatServerDate(value) {
  if (!value) return "수정일 없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "수정일 없음";

  return date.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InfoCard({ title, text, items }) {
  return (
    <article className="accountCard">
      <h2>{title}</h2>
      <p>{text}</p>
      <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </article>
  );
}
