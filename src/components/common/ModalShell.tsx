import { useId, type ReactNode } from "react";
import { X } from "lucide-react";

export function ModalShell({ onClose, title, children }: { onClose: () => void; title: string; children: ReactNode }) {
  const titleId = useId();
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby={titleId}><div className="modal-header"><h3 id={titleId}>{title}</h3><button type="button" className="close-btn" onClick={onClose} aria-label="إغلاق"><X size={19} /></button></div>{children}</div></div>;
}