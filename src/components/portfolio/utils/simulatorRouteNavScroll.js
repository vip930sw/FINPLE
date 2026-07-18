const DEFAULT_EDGE_PADDING = 8;

export function scrollActiveSimulatorRouteStep(
  navElement,
  activeButton,
  { behavior = "auto", edgePadding = DEFAULT_EDGE_PADDING } = {}
) {
  if (!navElement || !activeButton || typeof navElement.scrollTo !== "function") return false;
  if (navElement.scrollWidth <= navElement.clientWidth) return false;

  const navRect = navElement.getBoundingClientRect();
  const buttonRect = activeButton.getBoundingClientRect();
  const leftBoundary = navRect.left + edgePadding;
  const rightBoundary = navRect.right - edgePadding;
  let nextScrollLeft = navElement.scrollLeft;

  if (buttonRect.left < leftBoundary) {
    nextScrollLeft += buttonRect.left - leftBoundary;
  } else if (buttonRect.right > rightBoundary) {
    nextScrollLeft += buttonRect.right - rightBoundary;
  } else {
    return false;
  }

  navElement.scrollTo({
    left: Math.max(0, nextScrollLeft),
    behavior: behavior === "smooth" ? "smooth" : "auto",
  });
  return true;
}
