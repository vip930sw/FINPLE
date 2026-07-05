import { useEffect, useMemo, useState } from "react";

import {
  FINPLE_LOADING_MESSAGE_INTERVAL_MS,
  FINPLE_LOADING_MESSAGES,
  getRandomLoadingMessageIndex,
} from "../loadingMessages";
import {
  createOrLoadDemoUser,
  getStoredFinpleAuthUser,
} from "./portfolio/services/serverPortfolioService";
import {
  checkEmailAvailability,
  consumeGoogleOAuthRedirectResult,
  loginWithEducationAccount,
  loginWithEmailPassword,
  logoutFinpleAuth,
  requestFinpleLoginMethodGuide,
  requestFinplePasswordResetGuide,
  resendVerificationEmail,
  signupWithEmailPassword,
  startGoogleOAuthLogin,
  startKakaoOAuthLogin,
  startNaverOAuthLogin,
  verifyEmailToken,
} from "./authClientService";

const EMAIL_DOMAIN_OPTIONS = [
  "naver.com",
  "gmail.com",
  "kakao.com",
  "daum.net",
  "hanmail.net",
  "직접입력",
];
const OAUTH_LOADING_MESSAGE = "잠시만 기다려주세요. 불러오는 중입니다.";
const OAUTH_READY_MESSAGE = "곧 이동합니다.";
const POST_LOGIN_REDIRECT_STORAGE_KEY = "finple-post-login-redirect-page";

function GoogleGIcon() {
  return (
    <svg className="loginSocialIcon googleIcon" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.3 0 5.6 1.4 6.9 2.6l5.1-5C32.9 4.2 28.9 2.5 24 2.5 14.9 2.5 7.2 7.7 3.5 15.2l6.2 4.8C11.2 15.4 16.9 9.5 24 9.5Z" />
      <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-2.8-.4-4.1H24v7.8h12.1c-.2 1.9-1.6 4.9-4.6 6.8l6 4.6c3.6-3.3 7.6-8.1 7.6-15.1Z" />
      <path fill="#FBBC05" d="M9.7 28.1c-.4-1.2-.6-2.6-.6-4.1s.2-2.8.6-4.1l-6.2-4.8C2.2 17.9 1.5 20.9 1.5 24s.7 6.1 2 8.8l6.2-4.7Z" />
      <path fill="#34A853" d="M24 45.5c4.9 0 9-1.6 12-4.4l-6-4.6c-1.6 1.1-3.7 1.9-6 1.9-7.1 0-12.8-5.8-14.3-10.3l-6.2 4.8C7.2 40.3 14.9 45.5 24 45.5Z" />
    </svg>
  );
}

function triggerMyPageTransitionLoader() {
  if (typeof window === "undefined") return;
  if (typeof window.__finpleShowMyPageLoader === "function") {
    window.__finpleShowMyPageLoader(2200);
  }
  window.dispatchEvent(new Event("finple-mypage-transition-start"));
}

function triggerRouteTransitionLoader() {
  if (typeof window === "undefined") return;
  if (typeof window.__finpleShowRouteTransitionLoader === "function") {
    window.__finpleShowRouteTransitionLoader(2200);
  } else if (typeof window.__finpleShowMyPageLoader === "function") {
    window.__finpleShowMyPageLoader(2200);
  }
  window.dispatchEvent(new Event("finple-route-transition-start"));
}

function getOAuthProviderParam(authMode = "") {
  const normalizedAuthMode = String(authMode || "").toLowerCase();
  if (normalizedAuthMode.includes("naver")) return "naver";
  if (normalizedAuthMode.includes("kakao")) return "kakao";
  if (normalizedAuthMode.includes("google")) return "google";
  return "social";
}

function consumePostLoginRedirectPage(fallbackPage = "mypage") {
  if (typeof window === "undefined") return fallbackPage;
  const storedPage = window.sessionStorage.getItem(POST_LOGIN_REDIRECT_STORAGE_KEY);
  window.sessionStorage.removeItem(POST_LOGIN_REDIRECT_STORAGE_KEY);
  return storedPage === "personal" ? storedPage : fallbackPage;
}

function moveToPageAfterOAuth({ authMode, onNavigate }) {
  if (typeof window === "undefined") return;
  const nextPage = consumePostLoginRedirectPage();

  if (nextPage === "personal") {
    triggerRouteTransitionLoader();
    window.history.replaceState({ page: "personal" }, "", "/start");

    if (typeof onNavigate === "function") {
      onNavigate("personal");
      return;
    }

    window.location.replace("/start");
    return;
  }

  const provider = getOAuthProviderParam(authMode);
  const nextPath = `/mypage?oauth=${encodeURIComponent(provider)}&t=${Date.now()}`;

  triggerMyPageTransitionLoader();
  window.history.replaceState({ page: "mypage", oauth: provider }, "", nextPath);

  if (typeof onNavigate === "function") {
    onNavigate("mypage");
    return;
  }

  window.location.replace(nextPath);
}

function LoginSocialSpinner() {
  const [messageIndex, setMessageIndex] = useState(() => getRandomLoadingMessageIndex());
  const loadingMessage = FINPLE_LOADING_MESSAGES[messageIndex] || FINPLE_LOADING_MESSAGES[0];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMessageIndex((currentIndex) => getRandomLoadingMessageIndex(currentIndex));
    }, FINPLE_LOADING_MESSAGE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="loginSocialLoadingOverlay" aria-hidden="true">
      <div className="finpleLoadingStack">
        <div className="finpleLoginSpinner">
          <span /><span /><span /><span />
          <span /><span /><span /><span />
          <span /><span /><span /><span />
        </div>
        <p key={loadingMessage} className="finpleLoadingMessage">{loadingMessage}</p>
      </div>
    </div>
  );
}

function AccountShell({ eyebrow, title, description, children, onNavigate, pageClassName = "" }) {
  const storedUser = getStoredFinpleAuthUser();
  const isLoggedIn = Boolean(storedUser?.id);

  function handleMyPageClick() {
    if (isLoggedIn) triggerMyPageTransitionLoader();
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
          <div className="brandIcon"><span>F</span><i /></div>
          <div className="brandText"><strong>FINPLE</strong><span>Portfolio Lab</span></div>
        </button>
        <nav className="accountNav standardTopNav">
          <button type="button" onClick={() => onNavigate("home")}>홈</button>
          <button type="button" onClick={() => onNavigate("personal")}>시작하기</button>
          <button type="button" onClick={() => onNavigate("support")}>문의사항</button>
          <button type="button" onClick={handleMyPageClick}>MY PAGE</button>
          <button type="button" className="accountNavAuthButton" onClick={handleLoginLogoutClick}>{isLoggedIn ? "로그아웃" : "로그인"}</button>
        </nav>
      </header>
      <section className="accountHero"><p className="sectionLabel">{eyebrow}</p><h1>{title}</h1><p>{description}</p></section>
      {children}
    </main>
  );
}

export function LoginPage({ onNavigate }) {
  const [loginMode, setLoginMode] = useState("standard");
  const [email, setEmail] = useState("");
  const [educationLoginId, setEducationLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [recoveryMode, setRecoveryMode] = useState("");
  const [isRecoveryLoading, setIsRecoveryLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isKakaoLoading, setIsKakaoLoading] = useState(false);
  const [isNaverLoading, setIsNaverLoading] = useState(false);

  useEffect(() => {
    try {
      const oauthUser = consumeGoogleOAuthRedirectResult();
      if (oauthUser?.id) {
        setStatusMessage(`${oauthUser.email || oauthUser.name || "소셜 로그인 사용자"} 계정으로 로그인되었습니다.`);
        window.setTimeout(() => moveToPageAfterOAuth({ authMode: oauthUser.authMode, onNavigate }), 80);
        return;
      }

      const oauthError = new URLSearchParams(window.location.search).get("oauthError");
      if (oauthError) {
        setStatusMessage(oauthError);
        window.history.replaceState({ page: "login" }, "", "/login");
      }
    } catch (error) {
      setStatusMessage(error?.message || "소셜 로그인 결과를 확인하지 못했습니다.");
    }
  }, [onNavigate]);

  useEffect(() => {
    function handleOAuthWakeupStatus(event) {
      const message = event?.detail?.message;
      if (!message) return;
      if (message === OAUTH_LOADING_MESSAGE || message === OAUTH_READY_MESSAGE) {
        setStatusMessage("");
        return;
      }
      setStatusMessage(message);
    }

    window.addEventListener("finple-oauth-wakeup-status", handleOAuthWakeupStatus);
    return () => window.removeEventListener("finple-oauth-wakeup-status", handleOAuthWakeupStatus);
  }, []);

  async function handleEmailLogin(event) {
    event.preventDefault();
    const isEducationMode = loginMode === "education";
    if ((isEducationMode ? !educationLoginId.trim() : !email.trim()) || !password) {
      setStatusMessage(isEducationMode ? "교육용 ID와 비밀번호를 입력해 주세요." : "이메일과 비밀번호를 입력해 주세요.");
      return;
    }
    setIsLoading(true);
    try {
      const user = isEducationMode
        ? await loginWithEducationAccount({ loginId: educationLoginId, password })
        : await loginWithEmailPassword({ email, password });
      setStatusMessage(`${user.email || user.name || "사용자"} 계정으로 로그인되었습니다.`);
      const nextPage = consumePostLoginRedirectPage();
      if (nextPage === "personal") triggerRouteTransitionLoader();
      if (nextPage === "mypage") triggerMyPageTransitionLoader();
      onNavigate(nextPage);
    } catch (error) {
      setStatusMessage(error?.message || "로그인에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setIsGoogleLoading(true);
    setStatusMessage("");
    try {
      await startGoogleOAuthLogin();
    } finally {
      setIsGoogleLoading(false);
    }
  }

  async function handleKakaoLogin() {
    setIsKakaoLoading(true);
    setStatusMessage("");
    try {
      await startKakaoOAuthLogin();
    } finally {
      setIsKakaoLoading(false);
    }
  }

  async function handleNaverLogin() {
    setIsNaverLoading(true);
    setStatusMessage("");
    try {
      await startNaverOAuthLogin();
    } finally {
      setIsNaverLoading(false);
    }
  }

  async function handleRecoveryRequest(mode) {
    const recoveryEmail = email.trim();
    if (!recoveryEmail) {
      setStatusMessage("계정 확인에 사용할 이메일을 입력해 주세요.");
      setRecoveryMode(mode);
      return;
    }

    setRecoveryMode(mode);
    setIsRecoveryLoading(true);
    setStatusMessage("");
    try {
      const payload = mode === "password"
        ? await requestFinplePasswordResetGuide({ email: recoveryEmail })
        : await requestFinpleLoginMethodGuide({ email: recoveryEmail });
      setStatusMessage(payload?.message || "입력하신 이메일로 계정 확인 또는 비밀번호 재설정 안내를 발송할 수 있는 경우 안내가 발송됩니다.");
    } catch (error) {
      setStatusMessage(error?.message || "계정 확인 안내 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsRecoveryLoading(false);
    }
  }

  const isSocialLoading = isGoogleLoading || isKakaoLoading || isNaverLoading;
  const isEducationMode = loginMode === "education";

  return (
    <AccountShell eyebrow="" title="" description="" onNavigate={onNavigate} pageClassName="legalPage loginSimplePage">
      <section className="accountCard accountFormCard loginRoleCard singleLoginCard loginSimpleCard">
        {isSocialLoading ? <LoginSocialSpinner /> : null}
        <div className="loginSimpleBrand" aria-hidden="true">
          <div className="brandIcon loginSimpleBrandIcon"><span>F</span><i /></div>
          <strong>FINPLE</strong>
        </div>
        <div className="loginRoleHeader loginSimpleHeader">
          <h2>로그인 하고 나만의 자산관리를 <br /> 시작해보세요</h2>
        </div>

        <div className="loginModeSegment" role="tablist" aria-label="로그인 방식">
          <button
            type="button"
            className={!isEducationMode ? "active" : ""}
            onClick={() => {
              setLoginMode("standard");
              setStatusMessage("");
            }}
            role="tab"
            aria-selected={!isEducationMode}
          >
            일반 계정
          </button>
          <button
            type="button"
            className={isEducationMode ? "active" : ""}
            onClick={() => {
              setLoginMode("education");
              setStatusMessage("");
            }}
            role="tab"
            aria-selected={isEducationMode}
          >
            교육용 계정
          </button>
        </div>

        <form onSubmit={handleEmailLogin} className="loginSimpleForm">
          {isEducationMode ? (
            <label>
              교육용 ID
              <input type="text" value={educationLoginId} onChange={(event) => setEducationLoginId(event.target.value)} placeholder="finple-class-001" autoComplete="username" />
            </label>
          ) : (
            <label>
              이메일
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="example@finple.co.kr" autoComplete="email" />
            </label>
          )}
          <label>
            비밀번호
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호" autoComplete="current-password" />
          </label>
          <div className="loginUtilityRow">
            <label className="loginKeepLabel"><input type="checkbox" /> <span>로그인 유지</span></label>
            <span className="loginRecoveryActions">
              <button type="button" className="loginTextButton" onClick={() => handleRecoveryRequest("login-method")} disabled={isRecoveryLoading || isEducationMode}>아이디 찾기</button>
              <button type="button" className="loginTextButton" onClick={() => handleRecoveryRequest("password")} disabled={isRecoveryLoading || isEducationMode}>비밀번호 찾기</button>
            </span>
          </div>
          {recoveryMode ? <p className="loginRecoveryHint">FINPLE ID는 이메일 주소입니다. 입력한 이메일 기준으로 안내가 가능한 경우에만 안내가 발송됩니다.</p> : null}
          {statusMessage ? <p className="accountInlineStatus">{statusMessage}</p> : null}
          <button type="submit" className="primaryButton loginSubmitButton" disabled={isLoading || isSocialLoading}>{isLoading ? "로그인 중..." : "로그인"}</button>
        </form>

        {!isEducationMode ? (
          <>
            <div className="loginDivider"><span>또는</span></div>
            <div className="loginSocialRow" aria-label="소셜 로그인">
              <button type="button" className="loginSocialButton kakao" onClick={handleKakaoLogin} disabled={isKakaoLoading || isLoading || isGoogleLoading || isNaverLoading} aria-label="카카오로 계속하기"><span className="loginSocialIcon kakaoTalkIcon">TALK</span></button>
              <button type="button" className="loginSocialButton naver" onClick={handleNaverLogin} disabled={isNaverLoading || isLoading || isGoogleLoading || isKakaoLoading} aria-label="네이버로 계속하기"><span className="loginSocialIcon naverIcon">N</span></button>
              <button type="button" className="loginSocialButton google" onClick={handleGoogleLogin} disabled={isGoogleLoading || isLoading || isKakaoLoading || isNaverLoading} aria-label="Google로 계속하기"><GoogleGIcon /></button>
            </div>
            <p className="loginSignupPrompt">아직 핀플 회원이 아닌가요? <button type="button" onClick={() => onNavigate("signup")}>회원가입</button></p>
          </>
        ) : (
          <p className="loginSignupPrompt educationLoginHelpText">수업 또는 세미나에서 받은 교육용 ID로 로그인합니다.</p>
        )}
      </section>
    </AccountShell>
  );
}

export function SignupPage({ onNavigate }) {
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [emailLocal, setEmailLocal] = useState("");
  const [emailDomain, setEmailDomain] = useState("naver.com");
  const [customDomain, setCustomDomain] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);
  const [emailCheck, setEmailCheck] = useState({ status: "idle", email: "" });
  const [formNotice, setFormNotice] = useState("");
  const [verificationInfo, setVerificationInfo] = useState(null);
  const [isEmailChecking, setIsEmailChecking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const signupEmail = useMemo(() => {
    const local = emailLocal.trim().replace(/@/g, "");
    const domain = (emailDomain === "직접입력" ? customDomain : emailDomain).trim().replace(/^@/, "");
    return local && domain ? `${local}@${domain}`.toLowerCase() : "";
  }, [emailLocal, emailDomain, customDomain]);

  const emailStatusText = useMemo(() => {
    if (!emailLocal.trim()) return "이메일 아이디를 입력해 주세요.";
    if (!signupEmail.includes("@")) return "이메일 도메인을 선택해 주세요.";
    if (emailCheck.status === "available" && emailCheck.email === signupEmail) return "사용 가능한 이메일입니다.";
    if (emailCheck.status === "taken" && emailCheck.email === signupEmail) return "이미 가입된 이메일입니다. 로그인해 주세요.";
    if (emailCheck.status === "error" && emailCheck.email === signupEmail) return "이메일 확인에 실패했습니다. 잠시 후 다시 시도해 주세요.";
    return "회원가입 전 이메일 중복확인을 해주세요.";
  }, [emailCheck, emailLocal, signupEmail]);

  const passwordStatus = useMemo(() => {
    if (password && password.length < 8) return { status: "error", text: "비밀번호는 8자 이상으로 입력해 주세요." };
    if (passwordConfirm && password !== passwordConfirm) return { status: "error", text: "비밀번호 확인이 일치하지 않습니다." };
    if (password && passwordConfirm && password === passwordConfirm && password.length >= 8) return { status: "available", text: "비밀번호가 일치합니다." };
    return { status: "idle", text: "" };
  }, [password, passwordConfirm]);

  function handleEmailFieldChange(setter) {
    return (event) => {
      setter(event.target.value);
      setEmailCheck({ status: "idle", email: "" });
      setVerificationInfo(null);
    };
  }

  async function handleEmailCheck() {
    setFormNotice("");
    if (!signupEmail || !signupEmail.includes("@")) { setEmailCheck({ status: "error", email: signupEmail }); return; }
    setIsEmailChecking(true);
    try {
      const result = await checkEmailAvailability(signupEmail);
      setEmailCheck({ status: result.available ? "available" : "taken", email: result.email || signupEmail });
    } catch (error) {
      setEmailCheck({ status: "error", email: signupEmail });
    } finally {
      setIsEmailChecking(false);
    }
  }

  async function handleEmailSignup(event) {
    event.preventDefault();
    setFormNotice("");
    setVerificationInfo(null);
    const trimmedName = name.trim();
    const trimmedNickname = nickname.trim();
    if (!trimmedName || !trimmedNickname) { setFormNotice("이름과 닉네임/ID를 각각 입력해 주세요."); return; }
    if (!signupEmail || !password) { setFormNotice("이메일과 비밀번호를 입력해 주세요."); return; }
    if (emailCheck.status !== "available" || emailCheck.email !== signupEmail) { setFormNotice("회원가입 전 이메일 중복확인을 완료해 주세요."); return; }
    if (passwordStatus.status === "error" || password !== passwordConfirm) return;
    if (!termsAccepted || !privacyAccepted) { setFormNotice("이용약관과 개인정보처리방침에 동의해 주세요."); return; }
    setIsLoading(true);
    try {
      const result = await signupWithEmailPassword({ email: signupEmail, password, name: trimmedName, nickname: trimmedNickname, privacyAccepted, termsAccepted, marketingAgreed });
      const verification = result?.verification || {};
      setVerificationInfo({ email: verification.email || signupEmail, ...verification });
      setFormNotice("회원가입 요청이 접수되었습니다. 이메일 인증을 완료한 뒤 로그인해 주세요.");
    } catch (error) {
      setFormNotice(error?.message || "회원가입에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendVerification() {
    const targetEmail = verificationInfo?.email || signupEmail;
    if (!targetEmail) return;
    setIsResending(true);
    try {
      const result = await resendVerificationEmail(targetEmail);
      setVerificationInfo((current) => ({ ...(current || {}), email: targetEmail, expiresAt: result?.expiresAt || current?.expiresAt, deliveryMode: result?.deliveryMode || current?.deliveryMode, verificationUrl: result?.verificationUrl || current?.verificationUrl }));
      setFormNotice("인증 메일을 다시 요청했습니다. 메일함을 확인해 주세요.");
    } catch (error) {
      setFormNotice(error?.message || "인증 메일 재발송에 실패했습니다.");
    } finally {
      setIsResending(false);
    }
  }

  async function handleDemoSignup() {
    setIsDemoLoading(true);
    try { await createOrLoadDemoUser(); triggerMyPageTransitionLoader(); onNavigate("mypage"); }
    catch (error) { setFormNotice(error?.message || "체험 계정 준비에 실패했습니다."); }
    finally { setIsDemoLoading(false); }
  }

  if (verificationInfo) {
    return (
      <AccountShell eyebrow="Email Verification" title="이메일 인증이 필요합니다" description="가입 완료 전 이메일 인증 링크를 확인해 주세요. 인증 완료 후 로그인할 수 있습니다." onNavigate={onNavigate}>
        <section className="accountCard accountFormCard">
          <p className="accountMiniLabel">Verification Pending</p><h2>인증 메일을 확인해 주세요</h2>
          <p className="accountInlineStatus">{verificationInfo.email} 주소로 인증 안내를 보냈습니다. 스팸함도 함께 확인해 주세요.</p>
          {verificationInfo.verificationUrl ? <p className="authFormNotice">개발 확인용 인증 링크: <a href={verificationInfo.verificationUrl}>{verificationInfo.verificationUrl}</a></p> : null}
          <button type="button" className="primaryButton" onClick={() => onNavigate("login")}>로그인 화면으로 이동</button>
          <button type="button" className="secondaryButton" onClick={handleResendVerification} disabled={isResending}>{isResending ? "재발송 중..." : "인증 메일 다시 보내기"}</button>
          <button type="button" className="secondaryButton" onClick={() => setVerificationInfo(null)}>회원가입 정보 수정</button>
          {formNotice ? <p className="authFormNotice">{formNotice}</p> : null}
        </section>
      </AccountShell>
    );
  }

  return (
    <AccountShell eyebrow="Create Account" title="회원가입" description="포트폴리오 저장, PDF 리포트 이력, 요금제 상태 관리를 위한 계정 화면입니다." onNavigate={onNavigate}>
      <section className="accountCard accountFormCard">
        <form onSubmit={handleEmailSignup}>
          <label>이름<input value={name} onChange={(event) => setName(event.target.value)} placeholder="실명 또는 이름" autoComplete="name" /></label>
          <label>닉네임 / ID<input value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="서비스에서 표시할 닉네임 또는 ID" autoComplete="nickname" /></label>
          <div className="authEmailField"><span className="authFieldLabel">이메일</span><div className="authEmailRow"><input type="text" value={emailLocal} onChange={handleEmailFieldChange(setEmailLocal)} placeholder="이메일 아이디" autoComplete="email" /><span className="authEmailAt">@</span><select value={emailDomain} onChange={handleEmailFieldChange(setEmailDomain)}>{EMAIL_DOMAIN_OPTIONS.map((domain) => <option key={domain} value={domain}>{domain}</option>)}</select></div>{emailDomain === "직접입력" ? <input className="authCustomDomainInput" type="text" value={customDomain} onChange={handleEmailFieldChange(setCustomDomain)} placeholder="도메인 직접입력 예: company.com" autoComplete="off" /> : null}<div className="authEmailCheckRow"><span className={["authEmailStatus", `authEmailStatus--${emailCheck.status}`].join(" ")}>{emailStatusText}</span><button type="button" className="secondaryButton authEmailCheckButton" onClick={handleEmailCheck} disabled={isEmailChecking || isLoading || isDemoLoading}>{isEmailChecking ? "확인 중..." : "중복확인"}</button></div></div>
          <label>비밀번호<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8자 이상" autoComplete="new-password" /></label>
          <label>비밀번호 확인<input type="password" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} placeholder="비밀번호 재입력" autoComplete="new-password" /></label>
          {passwordStatus.text ? <p className={["authPasswordStatus", `authPasswordStatus--${passwordStatus.status}`].join(" ")}>{passwordStatus.text}</p> : null}
          <div className="authConsentBox"><label><input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} /><span className="authConsentText">이용약관에 동의합니다.</span><em className="authConsentRequired">필수</em></label><label><input type="checkbox" checked={privacyAccepted} onChange={(event) => setPrivacyAccepted(event.target.checked)} /><span className="authConsentText">개인정보처리방침에 동의합니다.</span><em className="authConsentRequired">필수</em></label><label><input type="checkbox" checked={marketingAgreed} onChange={(event) => setMarketingAgreed(event.target.checked)} /><span className="authConsentText">마케팅 안내 수신에 동의합니다.</span><em className="authConsentOptional">선택</em></label></div>
          {formNotice ? <p className="authFormNotice">{formNotice}</p> : null}
          <button type="submit" className="primaryButton" disabled={isLoading || isDemoLoading}>{isLoading ? "가입 요청 중..." : "회원가입 후 이메일 인증"}</button>
        </form>
        <button type="button" className="secondaryButton" onClick={handleDemoSignup} disabled={isLoading || isDemoLoading}>{isDemoLoading ? "계정 준비 중..." : "체험 계정으로 가입"}</button>
        <button type="button" className="secondaryButton" onClick={() => onNavigate("login")}>이미 계정이 있어요</button>
      </section>
    </AccountShell>
  );
}

export function VerifyEmailPage({ onNavigate }) {
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("이메일 인증 링크를 확인하고 있습니다.");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token") || "";
    if (!token) { setStatus("error"); setMessage("이메일 인증 토큰이 없습니다. 인증 메일의 링크를 다시 확인해 주세요."); return; }
    let isMounted = true;
    verifyEmailToken(token).then((result) => { if (!isMounted) return; setStatus("success"); setMessage(result?.alreadyVerified ? "이미 인증된 이메일입니다. 로그인해 주세요." : "이메일 인증이 완료되었습니다. 이제 로그인할 수 있습니다."); }).catch((error) => { if (!isMounted) return; setStatus("error"); setMessage(error?.message || "이메일 인증에 실패했습니다."); });
    return () => { isMounted = false; };
  }, []);

  return (
    <AccountShell eyebrow="Verify Email" title="이메일 인증" description="회원가입 시 발송된 인증 링크를 확인합니다." onNavigate={onNavigate} pageClassName="legalPage">
      <section className="accountCard accountFormCard singleLoginCard"><p className="accountMiniLabel">{status === "success" ? "Verified" : status === "error" ? "Verification Error" : "Checking"}</p><h2>{status === "success" ? "인증 완료" : status === "error" ? "인증 실패" : "인증 확인 중"}</h2><p className="accountInlineStatus">{message}</p><button type="button" className="primaryButton" onClick={() => onNavigate("login")}>로그인 화면으로 이동</button><button type="button" className="secondaryButton" onClick={() => onNavigate("signup")}>회원가입 화면으로 이동</button></section>
    </AccountShell>
  );
}
