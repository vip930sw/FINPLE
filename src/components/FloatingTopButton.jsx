export default function FloatingTopButton({ ariaLabel = "페이지 상단으로 이동" }) {
  return (
    <button
      type="button"
      className="floatingTopButton"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label={ariaLabel}
    >
      ↑ TOP
    </button>
  );
}
