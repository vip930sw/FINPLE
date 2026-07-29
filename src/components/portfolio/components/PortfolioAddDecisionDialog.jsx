export default function PortfolioAddDecisionDialog({
  dialog,
  onClose,
  onConfirm,
  onViewAsset,
}) {
  if (!dialog) return null;
  const requiresConfirmation = dialog.decision.policy === "confirm";
  return (
    <div className="supportSuccessOverlay" role="presentation">
      <section
        className="supportSuccessDialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="portfolioAddDecisionTitle"
        aria-describedby="portfolioAddDecisionMessage"
      >
        <h2 id="portfolioAddDecisionTitle">{dialog.decision.title}</h2>
        <p id="portfolioAddDecisionMessage">{dialog.decision.message}</p>
        <div className="supportActionRow">
          {requiresConfirmation ? (
            <button type="button" className="primaryButton" autoFocus onClick={onConfirm}>
              위험을 확인하고 추가
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
