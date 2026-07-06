import { useMemo, useState } from "react";
import {
  changeFinplePassword,
  deleteFinpleAccount,
  updateFinpleProfile,
} from "../../authClientService";
import PanelShell from "./PanelShell";
import { formatPlanLabel } from "../utils";

const WITHDRAWAL_INITIAL_CHECKS = {
  privacyDeletionConfirmed: false,
  subscriptionAccessConfirmed: false,
  refundPolicyConfirmed: false,
};

function getLoginProviderLabel(user) {
  const mode = String(user?.authMode || "").toLowerCase();
  if (mode.includes("google")) return "GOOGLE";
  if (mode.includes("naver")) return "NAVER";
  if (mode.includes("kakao")) return "KAKAO";
  if (mode.includes("education")) return "교육용 계정";
  return user?.provider ? String(user.provider).toUpperCase() : "계정 로그인";
}

function isEducationAuthUser(user) {
  return Boolean(
    user?.authMode === "education-account" ||
      user?.entitlementSource === "education" ||
      user?.educationAccount
  );
}

function canChangePasswordForUser(user) {
  return Boolean(user?.id && user?.authMode === "email-password" && !isEducationAuthUser(user));
}

function getDisplayName(user) {
  return user?.name || user?.nickname || "사용자";
}

export default function MyAccountPanel({ user, effectivePlan, onNavigate, onUserUpdated }) {
  const [isNicknameOpen, setIsNicknameOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState(() => String(user?.nickname || "").trim());
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [withdrawalChecks, setWithdrawalChecks] = useState(WITHDRAWAL_INITIAL_CHECKS);
  const [withdrawalConfirmText, setWithdrawalConfirmText] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const canChangePassword = canChangePasswordForUser(user);

  const nicknameStatus = useMemo(() => {
    const nickname = nicknameDraft.trim();
    if (!nickname) return { ok: false, message: "닉네임을 입력해 주세요." };
    if (nickname.length < 2 || nickname.length > 20) return { ok: false, message: "닉네임은 2자 이상 20자 이하로 입력해 주세요." };
    if (nickname === String(user?.nickname || "").trim()) return { ok: false, message: "변경된 내용이 없습니다." };
    return { ok: true, message: "" };
  }, [nicknameDraft, user?.nickname]);

  const canSubmitPassword =
    canChangePassword &&
    passwordForm.currentPassword.length >= 8 &&
    passwordForm.newPassword.length >= 8 &&
    passwordForm.newPassword === passwordForm.confirmPassword &&
    !isSaving;

  const canSubmitWithdrawal =
    Boolean(user?.id) &&
    withdrawalConfirmText.trim() === "회원탈퇴" &&
    withdrawalChecks.privacyDeletionConfirmed &&
    withdrawalChecks.subscriptionAccessConfirmed &&
    withdrawalChecks.refundPolicyConfirmed &&
    !isSaving;

  function openNicknameModal() {
    setNicknameDraft(String(user?.nickname || "").trim());
    setStatusMessage("");
    setErrorMessage("");
    setIsNicknameOpen(true);
  }

  function updatePasswordField(key, value) {
    setPasswordForm((previous) => ({ ...previous, [key]: value }));
  }

  function updateWithdrawalCheck(key) {
    setWithdrawalChecks((previous) => ({ ...previous, [key]: !previous[key] }));
  }

  function closePasswordModal() {
    setIsPasswordOpen(false);
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setErrorMessage("");
  }

  function closeWithdrawalModal() {
    setIsWithdrawalOpen(false);
    setWithdrawalChecks(WITHDRAWAL_INITIAL_CHECKS);
    setWithdrawalConfirmText("");
    setErrorMessage("");
  }

  async function handleSaveNickname() {
    if (!nicknameStatus.ok) {
      setErrorMessage(nicknameStatus.message);
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    try {
      const payload = await updateFinpleProfile({ nickname: nicknameDraft.trim() });
      onUserUpdated?.(payload?.user);
      setIsNicknameOpen(false);
      setStatusMessage("닉네임이 변경되었습니다.");
    } catch (error) {
      setErrorMessage(error?.message || "닉네임 변경에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!canChangePassword) {
      setErrorMessage("비밀번호 변경은 일반 계정 로그인 사용자만 사용할 수 있습니다.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorMessage("새 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    try {
      await changeFinplePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      closePasswordModal();
      setStatusMessage("비밀번호가 변경되었습니다. 다음 로그인부터 새 비밀번호를 사용해 주세요.");
    } catch (error) {
      setErrorMessage(error?.message || "비밀번호 변경에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleWithdrawal() {
    setIsSaving(true);
    setErrorMessage("");
    try {
      await deleteFinpleAccount({
        confirmText: withdrawalConfirmText,
        ...withdrawalChecks,
      });
      closeWithdrawalModal();
      onNavigate?.("home");
    } catch (error) {
      setErrorMessage(error?.message || "회원탈퇴 신청 처리에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PanelShell
      eyebrow="MY ACCOUNT"
      title="내 계정"
      description="로그인 방식, 사용자명, 현재 이용 중인 플랜/요금제를 확인하는 계정 관리 영역입니다."
      badge={formatPlanLabel(effectivePlan)}
    >
      <div className="accountStatusGrid myPageSummaryGrid myPageSummaryGrid--three">
        <div><span>가입 방식</span><strong>{getLoginProviderLabel(user)}</strong></div>
        <div><span>사용자</span><strong>{getDisplayName(user)}</strong></div>
        <div><span>현재 플랜/요금제</span><strong>{formatPlanLabel(effectivePlan)}</strong></div>
      </div>
      <div className="accountStatusGrid myPageReactSingleGrid">
        <div><span>로그인 이메일</span><strong>{user?.email || "확인 필요"}</strong></div>
      </div>
      <p className="serverStorageMessage compact">회원 식별, 로그인 계정 확인, 구독 상태 안내, 결제 내역 안내, 서비스 중요 공지 및 고객 문의 대응에 사용됩니다.</p>
      {statusMessage ? <p className="serverStorageMessage compact successMessage">{statusMessage}</p> : null}
      <div className="serverStorageActions compactActions myPageInlineActions">
        <button type="button" className="secondaryButton" onClick={openNicknameModal} disabled={!user?.id || isSaving}>닉네임 변경</button>
        {canChangePassword ? (
          <button type="button" className="secondaryButton" onClick={() => { setErrorMessage(""); setIsPasswordOpen(true); }} disabled={isSaving}>비밀번호 변경</button>
        ) : null}
      </div>
      <div className="myPageDangerBox">
        <div>
          <strong>계정 관리</strong>
          <p>계정 접근 비활성화가 필요한 경우에만 회원탈퇴를 진행해 주세요.</p>
        </div>
        <button type="button" className="secondaryButton dangerButton" onClick={() => { setErrorMessage(""); setIsWithdrawalOpen(true); }} disabled={!user?.id || isSaving}>회원탈퇴 신청</button>
      </div>

      {isNicknameOpen ? (
        <div className="accountWithdrawalModalBackdrop" role="presentation">
          <section className="accountWithdrawalModal" role="dialog" aria-modal="true" aria-labelledby="mypageNicknameTitle">
            <p className="accountMiniLabel">Profile</p>
            <h3 id="mypageNicknameTitle">닉네임 변경</h3>
            <p className="accountWithdrawalLead">서비스 화면에 표시할 닉네임을 2자 이상 20자 이하로 입력해 주세요.</p>
            <label className="accountWithdrawalConfirm">
              닉네임
              <input
                type="text"
                value={nicknameDraft}
                onChange={(event) => setNicknameDraft(event.target.value)}
                minLength={2}
                maxLength={20}
                autoComplete="nickname"
              />
            </label>
            {errorMessage ? <p className="serverStorageMessage compact dangerMessage">{errorMessage}</p> : null}
            <div className="accountWithdrawalActions">
              <button type="button" className="secondaryButton" onClick={() => { setIsNicknameOpen(false); setErrorMessage(""); }} disabled={isSaving}>취소</button>
              <button type="button" className="primaryButton" onClick={handleSaveNickname} disabled={!nicknameStatus.ok || isSaving}>
                {isSaving ? "저장 중" : "저장"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {isPasswordOpen ? (
        <div className="accountWithdrawalModalBackdrop" role="presentation">
          <section className="accountWithdrawalModal accountPasswordChangeModal" role="dialog" aria-modal="true" aria-labelledby="mypagePasswordTitle">
            <p className="accountMiniLabel">Password</p>
            <h3 id="mypagePasswordTitle">비밀번호 변경</h3>
            <p className="accountWithdrawalLead">일반 계정 로그인에 사용하는 비밀번호를 변경합니다.</p>
            <label className="accountWithdrawalConfirm">
              <span>현재 비밀번호</span>
              <input type="password" value={passwordForm.currentPassword} onChange={(event) => updatePasswordField("currentPassword", event.target.value)} autoComplete="current-password" />
            </label>
            <label className="accountWithdrawalConfirm">
              <span>새 비밀번호</span>
              <input type="password" value={passwordForm.newPassword} onChange={(event) => updatePasswordField("newPassword", event.target.value)} placeholder="8자 이상" autoComplete="new-password" />
            </label>
            <label className="accountWithdrawalConfirm">
              <span>새 비밀번호 확인</span>
              <input type="password" value={passwordForm.confirmPassword} onChange={(event) => updatePasswordField("confirmPassword", event.target.value)} autoComplete="new-password" />
            </label>
            {errorMessage ? <p className="serverStorageMessage compact dangerMessage">{errorMessage}</p> : null}
            <div className="accountWithdrawalActions">
              <button type="button" className="secondaryButton" onClick={closePasswordModal} disabled={isSaving}>취소</button>
              <button type="button" className="primaryButton accountPasswordChangeSubmit" onClick={handleChangePassword} disabled={!canSubmitPassword}>
                {isSaving ? "변경 중" : "비밀번호 변경"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {isWithdrawalOpen ? (
        <div className="accountWithdrawalModalBackdrop" role="presentation">
          <section className="accountWithdrawalModal" role="dialog" aria-modal="true" aria-labelledby="mypageWithdrawalTitle">
            <p className="accountMiniLabel">Account Withdrawal</p>
            <h3 id="mypageWithdrawalTitle">회원탈퇴 전 확인해 주세요</h3>
            <p className="accountWithdrawalLead">회원탈퇴는 계정 접근 비활성화 절차입니다. 결제 및 운영 이력은 법령, 정산, 고객지원 목적에 따라 보존될 수 있습니다.</p>
            <div className="accountWithdrawalWarning">
              <strong>구독 및 결제 안내</strong>
              <p>구독 중인 경우 먼저 구독 해지 또는 고객지원 확인이 필요할 수 있습니다. 이미 결제된 금액은 탈퇴 사유만으로 환불되지 않습니다.</p>
            </div>
            <label className="accountWithdrawalCheck">
              <input type="checkbox" checked={withdrawalChecks.privacyDeletionConfirmed} onChange={() => updateWithdrawalCheck("privacyDeletionConfirmed")} />
              <span>탈퇴 후 계정 접근이 비활성화되고 운영 이력은 보존될 수 있음을 확인했습니다.</span>
            </label>
            <label className="accountWithdrawalCheck">
              <input type="checkbox" checked={withdrawalChecks.subscriptionAccessConfirmed} onChange={() => updateWithdrawalCheck("subscriptionAccessConfirmed")} />
              <span>구독 및 결제 관련 정보는 정산과 고객지원 목적에 따라 보관될 수 있음을 확인했습니다.</span>
            </label>
            <label className="accountWithdrawalCheck">
              <input type="checkbox" checked={withdrawalChecks.refundPolicyConfirmed} onChange={() => updateWithdrawalCheck("refundPolicyConfirmed")} />
              <span>이미 결제된 금액은 탈퇴만으로 자동 환불되지 않는다는 점을 확인했습니다.</span>
            </label>
            <label className="accountWithdrawalConfirm">
              <span>최종 확인을 위해 <b>회원탈퇴</b>를 입력해 주세요.</span>
              <input type="text" value={withdrawalConfirmText} onChange={(event) => setWithdrawalConfirmText(event.target.value)} placeholder="회원탈퇴" autoComplete="off" />
            </label>
            {errorMessage ? <p className="serverStorageMessage compact dangerMessage">{errorMessage}</p> : null}
            <div className="accountWithdrawalActions">
              <button type="button" className="secondaryButton" onClick={closeWithdrawalModal} disabled={isSaving}>취소</button>
              <button type="button" className="primaryButton accountWithdrawalSubmit" onClick={handleWithdrawal} disabled={!canSubmitWithdrawal}>
                {isSaving ? "처리 중" : "회원탈퇴 진행"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </PanelShell>
  );
}
