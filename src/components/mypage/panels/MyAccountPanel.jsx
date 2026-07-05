import PanelShell from "./PanelShell";
import { formatPlanLabel } from "../utils";

function getLoginProviderLabel(user) {
  const mode = String(user?.authMode || "").toLowerCase();
  if (mode.includes("google")) return "GOOGLE";
  if (mode.includes("naver")) return "NAVER";
  if (mode.includes("kakao")) return "KAKAO";
  if (mode.includes("education")) return "계정 로그인";
  return user?.provider ? String(user.provider).toUpperCase() : "계정 로그인";
}

export default function MyAccountPanel({ user, effectivePlan, onNavigate }) {
  return (
    <PanelShell
      eyebrow="MY ACCOUNT"
      title="내 계정"
      description="로그인 방식, 사용자명, 현재 이용 중인 플랜/요금제를 확인하는 계정 관리 영역입니다."
      badge={formatPlanLabel(effectivePlan)}
      actions={(
        <>
          <button type="button" className="secondaryButton">닉네임 변경</button>
          <button type="button" className="secondaryButton">비밀번호 변경</button>
        </>
      )}
    >
      <div className="accountStatusGrid">
        <div><span>가입 방식</span><strong>{getLoginProviderLabel(user)}</strong></div>
        <div><span>사용자</span><strong>{user?.name || user?.nickname || "사용자"}</strong></div>
        <div><span>현재 플랜/요금제</span><strong>{formatPlanLabel(effectivePlan)}</strong></div>
      </div>
      <div className="accountStatusGrid myPageReactSingleGrid">
        <div><span>로그인 이메일</span><strong>{user?.email || "확인 필요"}</strong></div>
      </div>
      <p className="serverStorageMessage compact">회원 식별, 로그인 계정 확인, 구독 상태 안내, 결제 내역 안내, 서비스 중요 고지 및 고객 문의 대응에 사용됩니다.</p>
      <div className="myPageDangerBox">
        <div>
          <strong>계정 관리</strong>
          <p>계정 접근 비활성화가 필요한 경우에만 회원탈퇴를 진행해 주세요.</p>
        </div>
        <button type="button" className="secondaryButton dangerButton" onClick={() => onNavigate?.("support")}>회원탈퇴</button>
      </div>
    </PanelShell>
  );
}
