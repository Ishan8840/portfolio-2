// Let the canvas hit-test claim a click before the page effect runs.
export const turtleClicks = new WeakSet<Event>();

export function isPageClick(event: MouseEvent) {
  return (
    event.button === 0 &&
    event.detail > 0 &&
    !event.defaultPrevented &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.altKey &&
    !event.shiftKey &&
    !window.getSelection()?.toString() &&
    !(
      event.target instanceof Element &&
      event.target.closest(
        'a, button, input, select, textarea, video, audio, label, summary, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="link"], [role="dialog"], [role="scrollbar"]',
      )
    )
  );
}
