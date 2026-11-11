import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

type ModalShellProps = {
  onClose: () => void;
  title: string;
  children: ReactNode;
  panelClassName?: string;
};

export function ModalShell({ onClose, title, children, panelClassName = "" }: ModalShellProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ));
      if (!focusable.length) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!panelRef.current.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const initialFocus = panelRef.current?.querySelector<HTMLElement>("[autofocus]") ?? closeButtonRef.current;
    initialFocus?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="modal-backdrop" onPointerDown={(event) => event.target === event.currentTarget && onCloseRef.current()}>
      <div ref={panelRef} className={`modal-panel ${panelClassName}`.trim()} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <div className="modal-header">
          <h3 id={titleId}>{title}</h3>
          <button ref={closeButtonRef} type="button" className="close-btn" onClick={() => onCloseRef.current()} aria-label="إغلاق النافذة">
            <X size={19} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}