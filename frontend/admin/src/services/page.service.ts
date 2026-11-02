// SPDX-License-Identifier: AGPL-3.0-or-later
// Each screen is named by its main heading: it becomes the document title (WCAG 2.4.2) and,
// after an in-app navigation, receives focus so screen readers announce the new page (2.4.3).
export function followPage(suffix: string, focus: boolean) {
  let stopped = false;
  function apply() {
    const heading = document.querySelector<HTMLElement>("main h1");
    const name = heading?.textContent?.trim();
    if (!heading || !name) return false;
    // A heading that already names the municipality is not repeated.
    document.title = [name, ...suffix.split(" · ")]
      .filter((part, index, parts) => part && parts.indexOf(part) === index)
      .join(" · ");
    if (focus && !heading.closest("[role=dialog]")) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
    return true;
  }
  if (apply()) return () => undefined;
  // Pages that load their data show the heading a moment later.
  const observer = new MutationObserver(() => {
    if (!stopped && apply()) observer.disconnect();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  const timeout = window.setTimeout(() => observer.disconnect(), 10_000);
  return () => {
    stopped = true;
    observer.disconnect();
    window.clearTimeout(timeout);
  };
}

// A dialog returns focus to the control that opened it. When that control is gone or disabled
// after the dialog closes (signing in, a booked slot), focus would fall to the body; move it to a
// heading instead so keyboard and screen reader users keep their place (WCAG 2.4.3).
export function keepFocus(selector = "main h1") {
  window.requestAnimationFrame(() => {
    const active = document.activeElement;
    if (active && active !== document.body) return;
    const target = document.querySelector<HTMLElement>(selector);
    if (!target) return;
    target.tabIndex = -1;
    target.focus({ preventScroll: true });
  });
}
