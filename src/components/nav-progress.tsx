"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * شريط تقدم التنقل — يظهر أعلى الشاشة عند الانتقال بين الصفحات
 * ويعيد التمرير للأعلى تلقائياً عند تغيير المسار.
 */
export function NavProgress() {
  const pathname  = usePathname();
  const params    = useSearchParams();
  const [width, setWidth]     = useState(0);
  const [visible, setVisible] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimer   = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const started     = useRef(false);
  const prevKey     = useRef(`${pathname}||${params.toString()}`);

  /* ── بدء شريط التقدم ── */
  function startBar() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (hideTimer.current)   clearTimeout(hideTimer.current);
    started.current = true;
    setVisible(true);
    setWidth(6);

    intervalRef.current = setInterval(() => {
      setWidth(w => {
        const next = w + (84 - w) * 0.13 + 0.4;
        if (next >= 84) { clearInterval(intervalRef.current!); return 84; }
        return next;
      });
    }, 130);
  }

  /* ── إتمام الشريط ── */
  function completeBar() {
    if (!started.current) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setWidth(100);
    hideTimer.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
      started.current = false;
    }, 340);
  }

  /* ── استمع لنقرات الروابط الداخلية لبدء الشريط فوراً ── */
  useEffect(() => {
    const onClickCapture = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      if (
        href.startsWith("http") ||
        href.startsWith("//") ||
        href.startsWith("tel:") ||
        href.startsWith("mailto:") ||
        href.startsWith("#")
      ) return;
      startBar();
    };
    document.addEventListener("click", onClickCapture, true);
    return () => document.removeEventListener("click", onClickCapture, true);
  }, []);

  /* ── اكتشاف انتهاء التنقل + تمرير للأعلى ── */
  useEffect(() => {
    const key = `${pathname}||${params.toString()}`;
    if (key !== prevKey.current) {
      prevKey.current = key;
      completeBar();
      window.scrollTo(0, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, params]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 inset-x-0 z-[9999] h-[2.5px] pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="h-full bg-primary transition-[width] duration-[220ms] ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
