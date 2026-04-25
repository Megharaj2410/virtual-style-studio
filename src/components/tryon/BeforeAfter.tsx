import { useRef, useState, useCallback, useEffect } from "react";

interface Props {
  before: string;
  after: string;
}

export function BeforeAfter({ before, after }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const dragging = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => dragging.current && updateFromClientX(e.clientX);
    const onTouch = (e: TouchEvent) =>
      dragging.current && e.touches[0] && updateFromClientX(e.touches[0].clientX);
    const onUp = () => (dragging.current = false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouch);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend", onUp);
    };
  }, [updateFromClientX]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl border border-border bg-muted shadow-elegant select-none animate-fade-up"
      style={{ aspectRatio: "3 / 4" }}
    >
      {/* After (full) */}
      <img
        src={after}
        alt="After try-on"
        className="absolute inset-0 h-full w-full object-contain bg-muted"
        draggable={false}
      />
      {/* Before (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${pos}%` }}
      >
        <img
          src={before}
          alt="Before try-on"
          className="absolute inset-0 h-full w-full object-contain bg-muted"
          style={{ width: `${100 / (pos / 100)}%`, maxWidth: "none" }}
          draggable={false}
        />
      </div>

      {/* Labels */}
      <span className="absolute top-3 left-3 rounded-full bg-primary/85 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-primary-foreground backdrop-blur">
        Before
      </span>
      <span className="absolute top-3 right-3 rounded-full bg-accent px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-accent-foreground shadow-glow">
        After
      </span>

      {/* Divider + handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-elegant"
        style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
      >
        <button
          onMouseDown={() => (dragging.current = true)}
          onTouchStart={() => (dragging.current = true)}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary shadow-elegant cursor-grab active:cursor-grabbing"
          aria-label="Drag to compare"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18-6-6 6-6" />
            <path d="m15 6 6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
