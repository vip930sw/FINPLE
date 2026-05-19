import { useMemo, useState } from "react";

import {
  createOrLoadDemoUser,
  getStoredFinpleAuthUser,
} from "./portfolio/services/serverPortfolioService";
import {
  checkEmailAvailability,
  loginWithEmailPassword,
  logoutFinpleAuth,
  signupWithEmailPassword,
} from "./authClientService";

const EMAIL_DOMAIN_OPTIONS = [
  "naver.com",
  "gmail.com",
  "kakao.com",
  "daum.net",
  "hanmail.net",
  "직접입력",
];

function AccountShell({ eyebrow, title, description, children, onNavigate, pageClassName = "" }) {
  const storedUser = getStoredFinpleAuthUser();
  const isLoggedIn = Boolean(storedUser?.id);

  function handleMyPageClick() {
    onNavigate(isLoggedIn ? "mypage" : "login");
  }

  async function handleLoginLogoutClick() {
    if (isLoggedIn) {
      await logoutFinpleAuth();
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
          <button type="button" onClick={() => onNavigate("personal")}>시작하기</button>
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("이메일과 비밀번호로 로그인할 수 있습니다. 체험 계정 시작도 계속 사용할 수 있습니다.");
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  async function handleEmailLogin(event) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setStatusMessage("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const user = await loginWithEmailPassword({ email, password });
      setStatusMessage(`${user.email || user.name || "사용자"} 계정으로 로그인되었습니다.`);
      onNavigate("mypage");
    } catch (error) {
      setStatusMessage(error?.message || "로그인에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDemoLogin() {
    setIsDemoLoading(true);
    try {
      const user = await createOrLoadDemoUser();
      setStatusMessage((user.name || "FINPLE 체험 사용자") + " 계정으로 연결되었습니다.");
      onNavigate("mypage");
    } catch (error) {
      setStatusMessage(error?.message || "체험 계정 연결에 실패했습니다.");
    } finally {
      setIsDemoLoading(false);
    }
  }

  return (
    <AccountShell
      eyebrow="Account"
      title="로그인"
      description="FINPLE 계정으로 포트폴리오 저장, MY PAGE, 요금제 상태를 관리할 수 있습니다."
      onNavigate={onNavigate}
      pageClassName="legalPage"
    >
      <section className="accountCard accountFormCard loginRoleCard singleLoginCard">
        <div className="loginRoleHeader">
          <p className="accountMiniLabel">User Login</p>
          <h2>일반 사용자 로그인</h2>
          <span>이메일 계정 또는 체험 계정으로 시작할 수 있습니다.</span>
        </div>

        <form onSubmit={handleEmailLogin}>
          <label>
            이메일
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
          <label>
            비밀번호
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호"
              autoComplete="current-password"
            />
          </label>

          <p className="accountInlineStatus">{statusMessage}</p>

          <button type="submit" className="primaryButton" disabled={isLoading || isDemoLoading}>
            {isLoading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <button type="button" className="secondaryButton" onClick={handleDemoLogin} disabled={isLoading || isDemoLoading}>
          {isDemoLoading ? "연결 중..." : "체험 계정으로 시작"}
        </button>
        <button type="button" className="secondaryButton" onClick={() => onNavigate("signup")}>회원가입으로 이동</button>
      </section>
    </AccountShell>
  );
}

export function SignupPage({ onNavigate }) {
  const [name, setName] = useState("");
  const [emailLocal, setEmailLocal] = useState("");
  const [emailDomain, setEmailDomain] = useState("naver.com");
  const [customDomain, setCustomDomain] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);
  const [statusMessage, setStatusMessage] = useState("이메일과 비밀번호로 FINPLE 계정을 만들 수 있습니다.");
  const [emailCheck, setEmailCheck] = useState({ status: "idle", email: "" });
  const [isEmailChecking, setIsEmailChecking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const signupEmail = useMemo(() => {
    const local = emailLocal.trim().replace(/@/g, "");
    const domain = (emailDomain === "직접입력" ? customDomain : emailDomain).trim().replace(/^@/, "");
    return local && domain ? `${local}@${domain}`.toLowerCase() : "";
  }, [emailLocal, emailDomain, customDomain]);

  const emailStatusText = useMemo(() => {
    if (!emailLocal.trim()) return "이메일 아이디를 입력해 주세요.";
    if (!signupEmail.includes("@")) return "이메일 도메인을 선택해 주세요.";
    if (emailCheck.status === "available" && emailCheck.email === signupEmail) {
      return "사용 가능한 이메일입니다.";
    }
    if (emailCheck.status === "taken" && emailCheck.email === signupEmail) {
      return "이미 가입된 이메일입니다. 로그인해 주세요.";
    }
    return "회원가입 전 이메일 중복확인을 해주세요.";
  }, [emailCheck, emailLocal, signupEmail]);

  function handleEmailFieldChange(setter) {
    return (event) => {
      setter(event.target.value);
      setEmailCheck({ status: "idle", email: "" });
    };
  }

  async function handleEmailCheck() {
    if (!signupEmail || !signupEmail.includes("@")) {
      setStatusMessage("이메일 아이디와 도메인을 입력해 주세요.");
      return;
    }

    setIsEmailChecking(true);
    try {
      const result = await checkEmailAvailability(signupEmail);
      setEmailCheck({
        status: result.available ? "available" : "taken",
        email: result.email || signupEmail,
      });
      setStatusMessage(result.available ? "사용 가능한 이메일입니다." : "이미 가입된 이메일입니다. 로그인해 주세요.");
    } catch (error) {
      setEmailCheck({ status: "error", email: signupEmail });
      setStatusMessage(error?.message || "이메일 중복확인에 실패했습니다.");
    } finally {
      setIsEmailChecking(false);
    }
  }

  async function handleEmailSignup(event) {
    event.preventDefault();

    if (!signupEmail || !password) {
      setStatusMessage("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    if (emailCheck.status !== "available" || emailCheck.email !== signupEmail) {
      setStatusMessage("회원가입 전 이메일 중복확인을 완료해 주세요.");
      return;
    }

    if (password !== passwordConfirm) {
      setStatusMessage("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    if (!termsAccepted || !privacyAccepted) {
      setStatusMessage("이용약관과 개인정보처리방침에 동의해 주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const user = await signupWithEmailPassword({
        email: signupEmail,
        password,
        name,
        privacyAccepted,
        termsAccepted,
        marketingAgreed,
      });
      setStatusMessage(`${user.email || "FINPLE 계정"} 가입이 완료되었습니다.`);
      onNavigate("mypage");
    } catch (error) {
      setStatusMessage(error?.message || "회원가입에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDemoSignup() {
    setIsDemoLoading(true);
    try {
      const user = await createOrLoadDemoUser();
      setStatusMessage(`${user.name || "FINPLE 체험 사용자"} 계정이 준비되었습니다.`);
      onNavigate("mypage");
    } catch (error) {
      setStatusMessage(error?.message || "체험 계정 준비에 실패했습니다.");
    } finally {
      setIsDemoLoading(false);
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
        <form onSubmit={handleEmailSignup}>
          <label>
            이름
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="이름 또는 닉네임"
              autoComplete="name"
            />
          </label>

          <div className="authEmailField">
            <span className="authFieldLabel">이메일</span>
            <div className="authEmailRow">
              <input
                type="text"
                value={emailLocal}
                onChange={handleEmailFieldChange(setEmailLocal)}
                placeholder="이메일 아이디"
                autoComplete="email"
              />
              <span className="authEmailAt">@</span>
              <select value={emailDomain} onChange={handleEmailFieldChange(setEmailDomain)}>
                {EMAIL_DOMAIN_OPTIONS.map((domain) => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </select>
            </div>
            {emailDomain === "직접입력" ? (
              <input
                className="authCustomDomainInput"
                type="text"
                value={customDomain}
                onChange={handleEmailFieldChange(setCustomDomain)}
                placeholder="도메인 직접입력 예: company.com"
                autoComplete="off"
              />
            ) : null}
            <div className="authEmailCheckRow">
              <span className={["authEmailStatus", `authEmailStatus--${emailCheck.status}`].join(" ")}>{emailStatusText}</span>
              <button type="button" className="secondaryButton authEmailCheckButton" onClick={handleEmailCheck} disabled={isEmailChecking || isLoading || isDemoLoading}>
                {isEmailChecking ? "확인 중..." : "중복확인"}
              </button>
            </div>
          </div>

          <label>
            비밀번호
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="8자 이상"
              autoComplete="new-password"
            />
          </label>
          <label>
            비밀번호 확인
            <input
              type="password"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              placeholder="비밀번호 재입력"
              autoComplete="new-password"
            />
          </label>

          <div className="authConsentBox">
            <label>
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) => setTermsAccepted(event.target.checked)}
              />
              <span className="authConsentText">이용약관에 동의합니다.</span>
              <em className="authConsentRequired">필수</em>
            </label>
            <label>
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(event) => setPrivacyAccepted(event.target.checked)}
              />
              <span className="authConsentText">개인정보처리방침에 동의합니다.</span>
              <em className="authConsentRequired">필수</em>
            </label>
            <label>
              <input
                type="checkbox"
                checked={marketingAgreed}
                onChange={(event) => setMarketingAgreed(event.target.checked)}
              />
              <span className="authConsentText">마케팅 안내 수신에 동의합니다.</span>
              <em className="authConsentOptional">선택</em>
            </label>
          </div>

          <p className="accountInlineStatus">{statusMessage}</p>
          <button type="submit" className="primaryButton" disabled={isLoading || isDemoLoading}>
            {isLoading ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <button type="button" className="secondaryButton" onClick={handleDemoSignup} disabled={isLoading || isDemoLoading}>
          {isDemoLoading ? "계정 준비 중..." : "체험 계정으로 가입"}
        </button>
        <button type="button" className="secondaryButton" onClick={() => onNavigate("login")}>이미 계정이 있어요</button>
      </section>
    </AccountShell>
  );
}
