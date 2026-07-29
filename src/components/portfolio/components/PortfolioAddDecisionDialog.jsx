export default function PortfolioAddDecisionDialog({
  dialog,
  onClose,
  onConfirm,
  onViewAsset,
}) {
  if (!dialog) return null;
  const requiresConfirmation = dialog.decision.policy === "confirm";
  const riskProfile = dialog.decision.riskProfile;
  const confirmationLabel = riskProfile?.kind === "pending"
    ? "미검증 상품 위험을 확인하고 추가"
    : riskProfile?.tier === "4"
      ? "장기투자 부적합성을 확인하고 추가"
      : riskProfile?.tier === "3"
        ? "집중위험을 확인하고 추가"
        : "위험을 확인하고 추가";
  return (
    <div className="supportSuccessOverlay" role="presentation">
      <section
        className={[
          "supportSuccessDialog",
          riskProfile?.severity
            ? `leverageRiskNotice--${riskProfile.severity}`
            : "",
        ].filter(Boolean).join(" ")}
        data-warning-severity={riskProfile?.severity || undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby="portfolioAddDecisionTitle"
        aria-describedby="portfolioAddDecisionMessage"
      >
        <h2 id="portfolioAddDecisionTitle">{dialog.decision.title}</h2>
        <p id="portfolioAddDecisionMessage">{dialog.decision.message}</p>
        {riskProfile?.badges?.length ? (
          <div
            className="tickerResultTypeBadge"
            aria-label={`${dialog.decision.title}: ${riskProfile.badges.join(", ")}`}
          >
            {riskProfile.badges.map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
          </div>
        ) : null}
        <div className="supportActionRow">
          {requiresConfirmation ? (
            <button type="button" className="primaryButton" autoFocus onClick={onConfirm}>
              {confirmationLabel}
            </button>
          ) : (
            <button type="button" className="primaryButton" autoFocus onClick={onClose}>
              확인
            </button>
          )}
          <button
            type="button"
            className="secondaryButton"
            onClick={requiresConfirmation ? onClose : onViewAsset}
          >
            {requiresConfirmation ? "취소" : "자산 상세 보기"}
          </button>
        </div>
      </section>
    </div>
  );
}
