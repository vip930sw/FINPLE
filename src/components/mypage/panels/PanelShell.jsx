export default function PanelShell({ eyebrow, title, description, badge, children, actions }) {
  return (
    <section className="accountCard myPageReactPanel" data-mypage-react-panel>
      <div className="serverStorageHeader">
        <div>
          <p className="accountMiniLabel">{eyebrow}</p>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {badge ? <span className="serverStatusBadge ready">{badge}</span> : null}
      </div>
      {children}
      {actions ? <div className="serverStorageActions compactActions">{actions}</div> : null}
    </section>
  );
}
