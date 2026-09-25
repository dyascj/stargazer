/** Commit body clicks on release; never treat UI controls as empty space. */
let pendingBody: string | null = null;
let pointer: { id: number; x: number; y: number; canvas: boolean; threshold: number } | null = null;
const clickListeners = new Set<(id: string) => void>();
const missListeners = new Set<() => void>();
let disconnect: (() => void) | undefined;

export function markPendingClick(id: string): void {
  pendingBody = id;
}

function connect(): void {
  if (disconnect || typeof document === 'undefined') return;
  const down = (event: PointerEvent) => {
    pendingBody = null;
    pointer =
      event.isPrimary && event.button === 0
        ? {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            canvas: event.target instanceof HTMLCanvasElement,
            threshold: event.pointerType === 'touch' ? 10 : 6
          }
        : null;
  };
  const cancel = () => {
    pointer = null;
    pendingBody = null;
  };
  const up = (event: PointerEvent) => {
    const start = pointer;
    const body = pendingBody;
    cancel();
    if (
      !start ||
      start.id !== event.pointerId ||
      Math.hypot(event.clientX - start.x, event.clientY - start.y) >= start.threshold
    )
      return;
    if (body) clickListeners.forEach((listener) => listener(body));
    else if (start.canvas && event.target instanceof HTMLCanvasElement)
      missListeners.forEach((listener) => listener());
  };
  document.addEventListener('pointerdown', down, true);
  document.addEventListener('pointerup', up);
  document.addEventListener('pointercancel', cancel);
  disconnect = () => {
    document.removeEventListener('pointerdown', down, true);
    document.removeEventListener('pointerup', up);
    document.removeEventListener('pointercancel', cancel);
    cancel();
    disconnect = undefined;
  };
}
function cleanup(): void {
  if (!clickListeners.size && !missListeners.size) disconnect?.();
}
export function onSceneClick(listener: (id: string) => void): () => void {
  clickListeners.add(listener);
  connect();
  return () => {
    clickListeners.delete(listener);
    cleanup();
  };
}
export function onSceneMiss(listener: () => void): () => void {
  missListeners.add(listener);
  connect();
  return () => {
    missListeners.delete(listener);
    cleanup();
  };
}
