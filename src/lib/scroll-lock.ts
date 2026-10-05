/** Keep smooth-scroll inertia behind the page's existing native scroll lock. */
export function observeScrollLock(
  controller: { stop(): void; start(): void },
  element: HTMLElement,
): () => void {
  let locked = false;

  function synchronize() {
    const overflow = getComputedStyle(element).overflowY;
    const nextLocked = overflow === "hidden" || overflow === "clip";
    if (nextLocked === locked) return;
    locked = nextLocked;
    if (locked) controller.stop();
    else controller.start();
  }

  const observer = new MutationObserver(synchronize);
  observer.observe(element, {
    attributes: true,
    attributeFilter: ["style", "class"],
  });
  synchronize();

  return () => observer.disconnect();
}
