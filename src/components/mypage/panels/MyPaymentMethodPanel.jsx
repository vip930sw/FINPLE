import PanelShell from "./PanelShell";

export default function MyPaymentMethodPanel({ paymentMethod, onNavigate }) {
  return (
    <PanelShell
      eyebrow="MY PAYMENT METHOD"
      title="내 결제수단"
      description="정기결제에 사용할 결제수단을 관리하며, 카드번호 원문은 FINPLE 서버에 저장되지 않습니다."
      badge={paymentMethod.registered ? "등록됨" : "미등록"}
      actions={(
        <>
          <button type="button" className="primaryButton" onClick={() => { window.location.href = "/payment-method/setup?mode=card_update&source=mypage"; }}>결제수단 등록/변경</button>
          <button type="button" className="secondaryButton" onClick={() => onNavigate?.("pricing")}>요금제 확인</button>
          <button type="button" className="secondaryButton" onClick={() => paymentMethod.refresh({ force: true })} disabled={paymentMethod.loading || paymentMethod.refreshing}>
            {paymentMethod.refreshing ? "확인 중" : "결제수단 새로고침"}
          </button>
        </>
      )}
    >
      <div className="paymentMethodEntryGrid">
        <div><span>결제 방식</span><strong>월 구독 자동결제</strong></div>
        <div><span>등록 상태</span><strong>{paymentMethod.registered ? "등록 완료" : "미등록"}</strong></div>
        <div><span>결제수단</span><strong>{paymentMethod.loading && !paymentMethod.payload ? "확인 중" : paymentMethod.displayLabel}</strong></div>
      </div>
      <p className="serverStorageMessage compact">
        {paymentMethod.error || (paymentMethod.registered ? "등록된 결제수단으로 다음 정기결제를 진행할 수 있습니다." : "자동결제를 이용하려면 결제수단을 등록해 주세요.")}
      </p>
    </PanelShell>
  );
}
