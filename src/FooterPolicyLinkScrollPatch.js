(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  function isModifiedClick(event) {
    return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
  }

  function scrollToPageTop() {
    window.scrollTo({ left: 0, top: 0, behavior: "smooth" });
  }

  function schedulePageTopScroll() {
    window.requestAnimationFrame(scrollToPageTop);
    window.setTimeout(scrollToPageTop, 0);
    window.setTimeout(scrollToPageTop, 80);
  }

  document.addEventListener(
    "click",
    function handleFooterPolicyLinkClick(event) {
      if (isModifiedClick(event)) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const footerLink = target.closest(".siteFooterLinks a");
      if (!footerLink) return;

      schedulePageTopScroll();
    },
    true,
  );
})();
